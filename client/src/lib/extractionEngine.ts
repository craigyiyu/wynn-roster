/**
 * Extraction Engine
 * ==================
 * Runs the RDO + Special Request extraction pipeline entirely in the browser.
 * Results are cached in memory so the page doesn't reload on every visit.
 *
 * Pipeline:
 *  1. Load etl_records from 3 source batches (1.3 roster, 2_WM leave, 3_WM couple)
 *  2. Parse RDO dates from leave request notes
 *  3. Parse Special Request tags from couple shift "Assigned To" field
 *  4. Match both back to 1.3 roster employees
 *  5. Return structured ExtractionResult
 */

import { supabase } from './supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

// Known batch IDs (stable after upload)
const BATCH_IDS = {
  roster: '1e0a29b7-0389-41d1-8c5a-69f0bb1e72b0',   // 1.3_WM Leave Shift Class Planning Report 13-26 Apr.xlsx
  leave:  '15484c54-6787-4d7b-8ce8-42cb26163405',   // 2_WM leave request 13-26 Apr.xlsx
  couple: 'c83a9c32-108e-49ce-8b10-7666271335fa',   // 3_WM Couple Shift_Special Requests_Per S(as at 15Apr).xls
};

// All 7 uploaded files with their roles
export const ALL_FILES = [
  { name: '1.1_WM TGF publish roster 30Mar-12Apr.xlsx', used: false, reason: 'Reserved for historical comparison (later stage)' },
  { name: '1.2_WM 30Mar-12Apr leave shift class planner.xlsx', used: false, reason: 'Reserved for historical comparison (later stage)' },
  { name: '1.3_WM Leave Shift Class Planning Report 13-26 Apr.xlsx', used: true, role: 'Current roster population — all employees matched against this' },
  { name: '2_WM leave request 13-26 Apr.xlsx', used: true, role: 'RDO extraction source — approved leave requests with RDO notes' },
  { name: '3_WM Couple Shift_Special Requests_Per S(as at 15Apr).xls', used: true, role: 'Special Request extraction source — shift restrictions & RDO preferences' },
  { name: '4_WM EV&ES shift name list.xlsx', used: false, reason: 'Reserved for EV/ES shift classification (later stage)' },
  { name: '5_WM Floor Spreads ( 13-Apr-2026 ).xlsx', used: false, reason: 'Reserved for demand/headcount planning (later stage)' },
];

// Roster date columns: __EMPTY_2 = Apr-13, ..., __EMPTY_15 = Apr-26
const ROSTER_DATE_COLS: Record<string, string> = {
  '__EMPTY_2': '2026-04-13',
  '__EMPTY_3': '2026-04-14',
  '__EMPTY_4': '2026-04-15',
  '__EMPTY_5': '2026-04-16',
  '__EMPTY_6': '2026-04-17',
  '__EMPTY_7': '2026-04-18',
  '__EMPTY_8': '2026-04-19',
  '__EMPTY_9': '2026-04-20',
  '__EMPTY_10': '2026-04-21',
  '__EMPTY_11': '2026-04-22',
  '__EMPTY_12': '2026-04-23',
  '__EMPTY_13': '2026-04-24',
  '__EMPTY_14': '2026-04-25',
  '__EMPTY_15': '2026-04-26',
};

const LEAVE_KEY = 'Leave Requests Report for Period 11 Apr 2026 - 28 Apr 2026, for WM TGF Tables Games Floor';
const ROSTER_EMP_KEY = 'Leave/Shift Class Planning Report';

const SHIFT_CODES = new Set(['M', 'LM', 'ED', 'D', 'EV', 'ES', 'S']);
const WEEKDAY_MAP: Record<string, string> = {
  SUN: 'SUN', SUNDAY: 'SUN',
  MON: 'MON', MONDAY: 'MON',
  TUE: 'TUE', TUESDAY: 'TUE',
  WED: 'WED', WEDNESDAY: 'WED',
  THU: 'THU', THURSDAY: 'THU',
  FRI: 'FRI', FRIDAY: 'FRI',
  SAT: 'SAT', SATURDAY: 'SAT',
};
const MONTH_MAP: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RDOExtraction {
  payroll: string;
  period: string;
  days: string;
  leave_type: string;
  raw_notes: string;
  extracted_rdo_dates: string[];
  confidence: 'high' | 'medium' | 'low';
  extraction_status: 'extracted' | 'needs_review' | 'no_notes' | 'no_rdo';
  source_etl_record_id: string;
  notes_etl_record_id: string | null;
}

export interface SRExtraction {
  emp_no: string;
  dept: string;
  position: string;
  assigned_to_raw: string;
  req_type: string;
  is_expired: boolean;
  ai_type: 'allow' | 'refuse' | null;
  ai_value: string[];
  ai_rdo: string[];
  excluded_terms: string[];
  extraction_status: 'extracted' | 'partial' | 'unclassified' | 'empty';
  source_etl_record_id: string;
}

export interface EnrichedEmployee {
  employee_number: string;
  dept_position: string;
  gender: string;
  rotation: string;
  shifts: Record<string, string>;
  extracted_rdo_dates: string[];
  rdo_records: RDOExtraction[];
  sr_records: SRExtraction[];
  active_sr_count: number;
  match_status: 'matched' | 'no_match';
  review_status: 'needs_review' | 'ok';
  source_etl_record_id: string;
}

export interface ExtractionResult {
  extracted_at: string;
  rdo_extractions: RDOExtraction[];
  sr_extractions: SRExtraction[];
  enriched_roster: EnrichedEmployee[];
  unmatched_rdo: RDOExtraction[];
  unmatched_sr: SRExtraction[];
  stats: {
    total_leave_records: number;
    rdo_with_dates: number;
    rdo_needs_review: number;
    total_sr_records: number;
    sr_active: number;
    total_roster: number;
    roster_with_rdo: number;
    roster_with_sr: number;
    unmatched_rdo: number;
    unmatched_sr: number;
  };
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

let _cache: ExtractionResult | null = null;
let _loading = false;
let _loadPromise: Promise<ExtractionResult> | null = null;

export function getExtractionCache(): ExtractionResult | null {
  return _cache;
}

export function clearExtractionCache() {
  _cache = null;
  _loading = false;
  _loadPromise = null;
}

// ─── RDO Date Parser ──────────────────────────────────────────────────────────

function parseRDODates(note: string): { dates: string[]; confidence: 'high' | 'medium' | 'low' } {
  if (!note || note.trim() === '' || note.trim() === '< No Additional Notes >') {
    return { dates: [], confidence: 'high' };
  }

  // Normalize spaced-out RDO: "R D O" → "RDO", "R D 0" → "RDO"
  const normalized = note.replace(/R\s+D\s+[O0]/gi, 'RDO');
  const noteUpper = normalized.toUpperCase().trim();
  if (!noteUpper.includes('RDO')) {
    return { dates: [], confidence: 'medium' };
  }

  const year = 2026;
  const month = 4;
  const dates: string[] = [];

  // Pattern 0: Full date YYYY/MM/DD or YYYY-MM-DD near RDO
  const fullDatePattern = /(?:RDO\s*[=:]?\s*)?(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})(?:\s*[=:]?\s*RDO)?/g;
  let m: RegExpExecArray | null;
  while ((m = fullDatePattern.exec(noteUpper)) !== null) {
    const yr = parseInt(m[1]);
    const mon = parseInt(m[2]);
    const day = parseInt(m[3]);
    if (yr >= 2020 && yr <= 2030 && mon >= 1 && mon <= 12 && day >= 1 && day <= 31) {
      dates.push(`${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
  }

  // Pattern 1: rdo=17/4 & rdo=21/4 or RDO on 17/4 (DD/MM format)
  const slashPattern = /RDO\s*[=:on\s]*(\d{1,2})[/\-](\d{1,2})(?:[/\-](?:20)?(\d{2}))?/g;
  while ((m = slashPattern.exec(noteUpper)) !== null) {
    const day = parseInt(m[1]);
    const mon = parseInt(m[2]);
    const yr = m[3] ? parseInt('20' + m[3]) : year;
    // Skip if this looks like a full year was already captured (day > 31 or mon > 12)
    if (day >= 1 && day <= 31 && mon >= 1 && mon <= 12 && yr >= 2020) {
      dates.push(`${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
  }

  // Pattern 2: RDO=17 or RDO=17,21 or RDO=24,29
  if (dates.length === 0) {
    const eqPattern = /RDO\s*[=:]\s*([\d,\s&/.]+)/g;
    while ((m = eqPattern.exec(noteUpper)) !== null) {
      const nums = m[1].match(/\d+/g) || [];
      for (const n of nums) {
        const d = parseInt(n);
        if (d >= 1 && d <= 31 && d !== year && d !== 26 && n.length <= 2) {
          dates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }
      }
    }
  }

  // Pattern 3: Rdo17/21. or rdo18.23? (days separated by / or .)
  if (dates.length === 0) {
    const dotPattern = /RDO\s*(\d{1,2})[/.](\d{1,2})/g;
    while ((m = dotPattern.exec(noteUpper)) !== null) {
      for (const ds of [m[1], m[2]]) {
        const d = parseInt(ds);
        if (d >= 1 && d <= 31) {
          dates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }
      }
    }
  }

  // Pattern 4: rdo=12??17? - extract numbers ignoring ? marks
  if (dates.length === 0) {
    const qPattern = /RDO\s*[=:]?\s*([\d?;,\s]+)/g;
    while ((m = qPattern.exec(noteUpper)) !== null) {
      const nums = m[1].match(/\d+/g) || [];
      for (const n of nums) {
        const d = parseInt(n);
        // Skip single digit 4 when it's likely a month prefix like "4?22"
        if (d >= 1 && d <= 31 && n.length <= 2 && d !== 4) {
          dates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }
      }
    }
  }

  // Pattern 5: DD,DD=RDO or DDRDO patterns (number before RDO)
  if (dates.length === 0) {
    const numBeforeRdo = /([\d,\s.]+)\s*(?:=\s*)?R\s*D\s*[O0]/gi;
    while ((m = numBeforeRdo.exec(normalized)) !== null) {
      const nums = m[1].match(/\d+/g) || [];
      for (const n of nums) {
        const d = parseInt(n);
        if (d >= 1 && d <= 31 && n.length <= 2) {
          dates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }
      }
    }
  }

  // Deduplicate
  const uniqueDates = Array.from(new Set(dates)).sort();

  // Confidence
  const hasQuestion = note.includes('?');
  const hasAmbiguous = /\d{2}\.\d{2}/.test(note);
  let confidence: 'high' | 'medium' | 'low';
  if (uniqueDates.length === 0) confidence = 'low';
  else if (hasQuestion || hasAmbiguous) confidence = 'medium';
  else confidence = 'high';

  return { dates: uniqueDates, confidence };
}

// ─── Special Request Parser ───────────────────────────────────────────────────

function parseSpecialRequest(assignedTo: string): Pick<SRExtraction, 'ai_type' | 'ai_value' | 'ai_rdo' | 'excluded_terms' | 'extraction_status'> {
  if (!assignedTo || !assignedTo.trim()) {
    return { ai_type: null, ai_value: [], ai_rdo: [], excluded_terms: [], extraction_status: 'empty' };
  }

  const text = assignedTo.trim();
  const textUpper = text.toUpperCase();

  // Determine ai_type
  let ai_type: 'allow' | 'refuse' | null = null;
  if (/\bONLY\b|\bFIX(ED)?\b/.test(textUpper)) {
    ai_type = 'allow';
  } else if (/\bAVOID\b|\bNO\b|\bNOT\b|\bEXCEPT\b/.test(textUpper)) {
    ai_type = 'refuse';
  } else if (textUpper.includes('RDO')) {
    ai_type = 'allow';
  }

  // Extract shift codes
  const ai_value: string[] = [];
  const excluded_terms: string[] = [];
  const tokens = text.toUpperCase().split(/[\s,;/&+]+/);

  for (const token of tokens) {
    const t = token.replace(/\.$/, '').trim();
    if (SHIFT_CODES.has(t)) {
      ai_value.push(t);
    }
  }

  // Time range mapping
  if (text.includes('12:00-20:00') || text.includes('1200-2000')) {
    if (!ai_value.includes('ED')) ai_value.push('ED');
  }
  if (/NIGHT\s*SHIFT/i.test(text)) {
    for (const s of ['EV', 'ES', 'S']) {
      if (!ai_value.includes(s)) ai_value.push(s);
    }
  }

  // Collect excluded terms (non-shift words that look meaningful)
  const SKIP_WORDS = new Set(['AND', 'OR', 'ON', 'AT', 'THE', 'TO', 'FROM', 'WITH', 'FOR', 'A', 'IN', 'OF', 'NO', 'NOT', 'ONLY', 'FIX', 'FIXED', 'AVOID', 'SHIFT', 'RDO']);
  for (const token of tokens) {
    const t = token.replace(/\.$/, '').trim();
    if (t.length > 1 && !SHIFT_CODES.has(t) && !SKIP_WORDS.has(t) && !/^\d+$/.test(t)) {
      if (/SEAT|PCMS|PIT|HL|VIP|NB|ENC|SUP|DLR|GAME|ONLY|NSR|NTD/.test(t)) {
        excluded_terms.push(t);
      }
    }
  }

  // Extract RDO weekdays
  const ai_rdo: string[] = [];

  // Check for weekday RDO: "RDO on Sunday", "RDO SUN", "Fix RDO at Saturday"
  for (const [full, abbr] of Object.entries(WEEKDAY_MAP)) {
    const rdoWeekdayRe = new RegExp(`RDO[\\s\\w]*\\b${full}\\b|\\b${full}\\b[\\s\\w]*RDO`, 'i');
    if (rdoWeekdayRe.test(textUpper)) {
      if (!ai_rdo.includes(abbr)) ai_rdo.push(abbr);
    }
  }

  // Check for specific date RDO: "RDO on 29 Mar 2026" or "REQ RDO on 18 & 25 Mar"
  const dateRdoRe = /(?:RDO|REQ\s+RDO)\s+(?:ON|AT)?\s*(\d{1,2})\s*(?:&\s*(\d{1,2}))?\s*([A-Z]{3})\s*(?:(\d{4}))?/gi;
  let dm: RegExpExecArray | null;
  while ((dm = dateRdoRe.exec(textUpper)) !== null) {
    const day1 = dm[1];
    const day2 = dm[2];
    const monStr = dm[3];
    const yrStr = dm[4];
    const mon = MONTH_MAP[monStr] || 4;
    const yr = yrStr ? parseInt(yrStr) : 2026;
    if (day1) ai_rdo.push(`${yr}-${String(mon).padStart(2, '0')}-${String(parseInt(day1)).padStart(2, '0')}`);
    if (day2) ai_rdo.push(`${yr}-${String(mon).padStart(2, '0')}-${String(parseInt(day2)).padStart(2, '0')}`);
  }

  // Deduplicate
  const uniqueValue = Array.from(new Set(ai_value));
  const uniqueRdo = Array.from(new Set(ai_rdo));
  const uniqueExcluded = Array.from(new Set(excluded_terms));

  let extraction_status: SRExtraction['extraction_status'];
  if (ai_type && (uniqueValue.length > 0 || uniqueRdo.length > 0)) extraction_status = 'extracted';
  else if (ai_type) extraction_status = 'partial';
  else extraction_status = 'unclassified';

  return {
    ai_type,
    ai_value: uniqueValue,
    ai_rdo: uniqueRdo,
    excluded_terms: uniqueExcluded,
    extraction_status,
  };
}

// ─── Normalize employee number ────────────────────────────────────────────────

function normalizeEmpNo(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  const s = String(raw).trim().replace(/[\[\]()]/g, '').trim();
  if (/^\d+$/.test(s)) return String(parseInt(s, 10));
  return s;
}

// ─── Load records with pagination ────────────────────────────────────────────

async function loadAllRecords(batchId: string, extraFilters?: { column: string; value: string }[]): Promise<Record<string, unknown>[]> {
  const PAGE = 1000;
  const all: Record<string, unknown>[] = [];
  for (let start = 0; ; start += PAGE) {
    let q = supabase
      .from('etl_records')
      .select('id,row_number,raw_data,record_type,source_sheet,needs_review')
      .eq('upload_batch_id', batchId)
      .order('row_number')
      .range(start, start + PAGE - 1);

    if (extraFilters) {
      for (const f of extraFilters) {
        q = q.eq(f.column, f.value);
      }
    }

    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Record<string, unknown>[]));
    if (data.length < PAGE) break;
  }
  return all;
}

// ─── Main extraction function ─────────────────────────────────────────────────

export async function runExtraction(): Promise<ExtractionResult> {
  // Return cached result if available
  if (_cache) return _cache;
  // Deduplicate concurrent calls
  if (_loadPromise) return _loadPromise;

  _loading = true;
  _loadPromise = _runExtraction().finally(() => {
    _loading = false;
    _loadPromise = null;
  });
  return _loadPromise;
}

export function isExtractionLoading(): boolean {
  return _loading;
}

async function _runExtraction(): Promise<ExtractionResult> {
  // ── TASK 1: RDO Extraction ────────────────────────────────────────────────
  const leaveRows = await loadAllRecords(BATCH_IDS.leave);

  const rdo_extractions: RDOExtraction[] = [];

  for (let i = 0; i < leaveRows.length; i++) {
    const row = leaveRows[i];
    const rd = (row.raw_data as Record<string, unknown>) || {};
    const payrollVal = rd[LEAVE_KEY];

    // Employee data row: has numeric payroll in LEAVE_KEY, needs_review=false
    if (!row.needs_review && payrollVal && /^\d+$/.test(String(payrollVal).trim())) {
      const payroll = String(parseInt(String(payrollVal)));
      const status = String(rd['__EMPTY_1'] || '');
      const period = String(rd['__EMPTY_4'] || '');
      const days = String(rd['__EMPTY_5'] || '');
      const leave_type = String(rd['__EMPTY_3'] || '');

      // Only approved leaves
      if (!status.toLowerCase().includes('approved')) continue;

      // Look for notes in the previous row
      let raw_notes = '';
      let notes_etl_record_id: string | null = null;
      if (i > 0) {
        const prev = leaveRows[i - 1];
        const prevRd = (prev.raw_data as Record<string, unknown>) || {};
        const prevVal = prevRd[LEAVE_KEY];
        if (prev.needs_review && typeof prevVal === 'string') {
          raw_notes = prevVal.trim();
          notes_etl_record_id = String(prev.id);
        }
      }

      const { dates, confidence } = parseRDODates(raw_notes);

      let extraction_status: RDOExtraction['extraction_status'];
      if (!raw_notes || raw_notes === '< No Additional Notes >') extraction_status = 'no_notes';
      else if (dates.length > 0) extraction_status = 'extracted';
      else if (raw_notes.toUpperCase().includes('RDO')) extraction_status = 'needs_review';
      else extraction_status = 'no_rdo';

      rdo_extractions.push({
        payroll,
        period,
        days,
        leave_type,
        raw_notes,
        extracted_rdo_dates: dates,
        confidence,
        extraction_status,
        source_etl_record_id: String(row.id),
        notes_etl_record_id,
      });
    }
  }

  // ── TASK 2: Special Request Extraction ───────────────────────────────────
  const srRows = await loadAllRecords(BATCH_IDS.couple, [{ column: 'source_sheet', value: 'Special Request' }]);

  const sr_extractions: SRExtraction[] = [];

  for (const row of srRows) {
    const rd = (row.raw_data as Record<string, unknown>) || {};
    const empNoRaw = rd['Special Requests'];
    if (!empNoRaw) continue;

    const emp_no = normalizeEmpNo(empNoRaw);
    if (!emp_no || !/^\d+$/.test(emp_no)) continue;

    const dept = String(rd['__EMPTY'] || '').trim();
    const position = String(rd['__EMPTY_1'] || '').trim();
    const assigned_to_raw = String(rd['__EMPTY_2'] || '').trim();
    const expired_raw = String(rd['__EMPTY_7'] || '').trim().toLowerCase();
    const req_type = String(rd['__EMPTY_8'] || '').trim();

    // Skip header row
    if (emp_no === 'Emp #' || position === 'Name') continue;

    // Skip rows with no assigned_to content
    if (!assigned_to_raw || assigned_to_raw === 'Assigned to') continue;

    // Determine expiry: treat empty expired field as active
    // Expired if field contains 'expired', 'exp', or a past date string
    // Active if field is empty, 'until further notice', or contains a future date
    const is_expired = expired_raw === 'expired' || expired_raw === 'exp' ||
      (expired_raw !== '' &&
       expired_raw !== 'until further notice' &&
       expired_raw !== '0' &&
       expired_raw !== 'false' &&
       !/\d{4}/.test(expired_raw));  // if it has a year, treat as active (date-bound)

    const parsed = parseSpecialRequest(assigned_to_raw);

    sr_extractions.push({
      emp_no,
      dept,
      position,
      assigned_to_raw,
      req_type,
      is_expired,
      ...parsed,
      source_etl_record_id: String(row.id),
    });
  }

  // ── TASK 3: Match to 1.3 Roster ──────────────────────────────────────────
  const rosterRows = await loadAllRecords(BATCH_IDS.roster);

  // Build lookup maps
  const rdoByPayroll = new Map<string, RDOExtraction[]>();
  for (const r of rdo_extractions) {
    if (!rdoByPayroll.has(r.payroll)) rdoByPayroll.set(r.payroll, []);
    rdoByPayroll.get(r.payroll)!.push(r);
  }

  const srByEmpNo = new Map<string, SRExtraction[]>();
  for (const r of sr_extractions) {
    if (!srByEmpNo.has(r.emp_no)) srByEmpNo.set(r.emp_no, []);
    srByEmpNo.get(r.emp_no)!.push(r);
  }

  const enriched_roster: EnrichedEmployee[] = [];
  const rosterEmpNos = new Set<string>();

  for (const row of rosterRows) {
    if (row.record_type !== 'shift') continue;
    const rd = (row.raw_data as Record<string, unknown>) || {};
    const empRaw = rd[ROSTER_EMP_KEY];
    const emp_no = normalizeEmpNo(empRaw);
    if (!emp_no) continue;

    rosterEmpNos.add(emp_no);

    const dept_position = String(rd['__EMPTY_1'] || '').trim();
    const gender = String(rd['__EMPTY'] || '').trim();
    const rotation = String(rd['__EMPTY_16'] || '').trim();

    const shifts: Record<string, string> = {};
    for (const [col, dateLabel] of Object.entries(ROSTER_DATE_COLS)) {
      shifts[dateLabel] = String(rd[col] || '').trim();
    }

    const rdo_records = rdoByPayroll.get(emp_no) || [];
    const sr_records = srByEmpNo.get(emp_no) || [];
    const active_sr = sr_records.filter(s => !s.is_expired);

    const all_rdo_dates = Array.from(new Set(rdo_records.flatMap(r => r.extracted_rdo_dates))).sort();

    const match_status = (rdo_records.length > 0 || sr_records.length > 0) ? 'matched' : 'no_match';
    const review_status = (
      rdo_records.some(r => r.extraction_status === 'needs_review') ||
      sr_records.some(s => s.extraction_status === 'unclassified')
    ) ? 'needs_review' : 'ok';

    enriched_roster.push({
      employee_number: emp_no,
      dept_position,
      gender,
      rotation,
      shifts,
      extracted_rdo_dates: all_rdo_dates,
      rdo_records,
      sr_records,
      active_sr_count: active_sr.length,
      match_status,
      review_status,
      source_etl_record_id: String(row.id),
    });
  }

  // Unmatched
  const unmatched_rdo = rdo_extractions.filter(r => !rosterEmpNos.has(r.payroll) && r.extracted_rdo_dates.length > 0);
  const unmatched_sr = sr_extractions.filter(r => !rosterEmpNos.has(r.emp_no) && !r.is_expired);

  const result: ExtractionResult = {
    extracted_at: new Date().toISOString(),
    rdo_extractions,
    sr_extractions,
    enriched_roster,
    unmatched_rdo,
    unmatched_sr,
    stats: {
      total_leave_records: rdo_extractions.length,
      rdo_with_dates: rdo_extractions.filter(r => r.extracted_rdo_dates.length > 0).length,
      rdo_needs_review: rdo_extractions.filter(r => r.extraction_status === 'needs_review').length,
      total_sr_records: sr_extractions.length,
      sr_active: sr_extractions.filter(r => !r.is_expired).length,
      total_roster: enriched_roster.length,
      roster_with_rdo: enriched_roster.filter(r => r.rdo_records.length > 0).length,
      roster_with_sr: enriched_roster.filter(r => r.sr_records.length > 0).length,
      unmatched_rdo: unmatched_rdo.length,
      unmatched_sr: unmatched_sr.length,
    },
  };

  _cache = result;
  return result;
}
