/**
 * ETL & NORMALIZATION PAGE
 * Design: Cyberpunk dark terminal — amber/teal accents on near-black bg
 *
 * Purpose: Shows parsed & normalized records from uploaded Excel files.
 * Focus: RDO dates extracted from leave request files.
 *
 * Key behaviours:
 *  - Data is cached in memory after first load; subsequent visits are instant.
 *  - "Needs Review" shows ONLY records with ambiguous/hand-written RDO notes.
 *  - Each review card shows: employee payroll#, leave period, AI-parsed RDO dates.
 *  - Approving writes to employee_rdo_requests table for scheduling use.
 *  - Saves note→dates mapping to Pattern Library for future auto-resolution.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2, AlertTriangle, Eye, RefreshCw, ChevronDown, ChevronRight,
  Clock, FileText, Sparkles, Database, Calendar, BookOpen, Brain,
  User, Hash, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { getOrCreateSession } from '@/lib/sessionManager';
import {
  ETLRecord, UploadBatch,
  getCache, loadETLData, isCacheValid,
  cacheApproveRecord, cacheUnapproveRecord, clearCache,
} from '@/lib/etlCache';
import { parseRdoDates, formatRdoDates, ParsedRDO } from '@/lib/rdoParser';
import {
  lookupPattern, savePattern, loadPatterns,
  getAllPatterns, RDOPattern,
} from '@/lib/rdoLearning';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'review' | 'approved' | 'ok';
type SidePanel = null | 'learning';

function confColor(c: number) {
  if (c >= 90) return 'text-teal';
  if (c >= 75) return 'text-amber';
  return 'text-coral';
}

function confBar(c: number) {
  if (c >= 90) return 'bg-teal';
  if (c >= 75) return 'bg-amber';
  return 'bg-coral';
}

/** The long column header key used in leave request files */
const LEAVE_NOTE_KEY_PATTERN = /leave requests report/i;

/** Extract the note text from a leave-request row */
function extractNoteText(nd: Record<string, unknown>): string {
  // Find the long header column (contains "Leave Requests Report...")
  for (const [k, v] of Object.entries(nd)) {
    if (LEAVE_NOTE_KEY_PATTERN.test(k) && typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  // Fallback: any non-empty string value
  for (const [, v] of Object.entries(nd)) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/** Extract payroll number from a leave record row (the row after the note row) */
function extractPayrollFromLeaveRow(nd: Record<string, unknown>): string {
  // The payroll # is in the long header column as a number
  for (const [k, v] of Object.entries(nd)) {
    if (LEAVE_NOTE_KEY_PATTERN.test(k) && v !== null && v !== '') {
      return String(v);
    }
  }
  return '';
}

/** Extract leave period string like "19/04/2026 - 22/04/2026" */
function extractLeavePeriod(nd: Record<string, unknown>): string {
  for (const [k, v] of Object.entries(nd)) {
    if (k === '__EMPTY_4' && typeof v === 'string' && v.includes('/')) {
      return v;
    }
  }
  return '';
}

/** Extract leave type like "UnifL - Unified Leave" */
function extractLeaveType(nd: Record<string, unknown>): string {
  const v = nd['__EMPTY_3'];
  return typeof v === 'string' ? v : '';
}

/** Extract leave status like "Approved" */
function extractLeaveStatus(nd: Record<string, unknown>): string {
  const v = nd['__EMPTY_1'];
  return typeof v === 'string' ? v : '';
}

/** True if this record genuinely needs human review */
function isActionableReview(rec: ETLRecord): boolean {
  if (rec.approved_by) return false;
  if (rec.warning_flags && rec.warning_flags.length > 0) return true;

  const isLeaveFile = rec.source_file?.toLowerCase().includes('leave request');
  if (isLeaveFile && rec.needs_review) {
    const nd = rec.normalized_data ?? rec.raw_data ?? {};
    const note = extractNoteText(nd).toLowerCase();
    if (!note) return false;
    if (note === '< no additional notes >') return false;
    if (note.startsWith('contains leave requests')) return false;
    if (note.startsWith('one or more leave requests')) return false;
    return /rdo|\?|\d{1,2}[\/\.\-]\d{1,2}|\d{2}rdo|cxl|change/i.test(note);
  }
  return false;
}

function buildRecordSummary(rec: ETLRecord): { label: string; detail: string } {
  const nd = rec.normalized_data ?? rec.raw_data ?? {};
  if (rec.record_type === 'couple_shift') {
    const emp1 = nd['Employee Name'] ?? nd['__EMPTY'] ?? '';
    const emp2 = nd['__EMPTY_3'] ?? nd['__EMPTY_4'] ?? '';
    return { label: 'Couple Shift', detail: [emp1, emp2].filter(Boolean).join(' ↔ ') };
  }
  if (rec.record_type === 'floor_spread') {
    const role = nd['Role'] ?? nd['__EMPTY'] ?? '';
    const count = nd['Count'] ?? nd['__EMPTY_1'] ?? '';
    return { label: 'Floor Spread', detail: `${role} × ${count}` };
  }
  if (rec.record_type === 'shift') {
    const emp = nd['Employee Name'] ?? nd['__EMPTY'] ?? nd['Name'] ?? '';
    const shift = nd['Shift'] ?? nd['__EMPTY_1'] ?? '';
    return { label: 'Shift Record', detail: [emp, shift].filter(Boolean).join(' — ') };
  }
  const note = extractNoteText(nd);
  if (note) return { label: 'Leave Note', detail: note };
  const vals = Object.values(nd).filter(v => v !== '' && v !== null).slice(0, 3);
  return { label: 'Record', detail: vals.join(' | ') };
}

/** Build a human-readable label for a raw_data field key */
function friendlyKey(k: string): string {
  const map: Record<string, string> = {
    '__EMPTY': 'Class',
    '__EMPTY_1': 'Status',
    '__EMPTY_2': 'Submitted',
    '__EMPTY_3': 'Leave Type',
    '__EMPTY_4': 'Period',
    '__EMPTY_5': 'Days',
  };
  if (map[k]) return map[k];
  if (LEAVE_NOTE_KEY_PATTERN.test(k)) return 'Payroll #';
  return k;
}

function fileIcon(fileType: string) {
  if (fileType === 'floor_spread') return '📊';
  if (fileType === 'shift') return '📅';
  if (fileType === 'couple_shift') return '👫';
  return '📄';
}

// ─── RDO Review Card ──────────────────────────────────────────────────────────

/**
 * Specialised review card for leave-request RDO notes.
 *
 * Shows:
 *  - Employee payroll # (from the NEXT row in the same batch)
 *  - Their existing leave period from the file
 *  - The raw hand-written note
 *  - AI-parsed RDO dates with confidence
 *  - Approve / Edit buttons
 */
function RDOReviewCard({
  record,
  nextRecord,   // the leave-data row immediately after this note row
  onApprove,
}: {
  record: ETLRecord;
  nextRecord: ETLRecord | null;
  onApprove: (id: string, dates: string[], note: string, confidence: 'high' | 'medium' | 'low', payrollNum: string) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [editedDates, setEditedDates] = useState<string[]>([]);
  const [showRaw, setShowRaw] = useState(false);

  const nd = record.normalized_data ?? record.raw_data ?? {};
  const rawNote = extractNoteText(nd);
  const parsed: ParsedRDO | null = rawNote ? parseRdoDates(rawNote) : null;
  const knownPattern = rawNote ? lookupPattern(rawNote) : null;
  const isApproved = !!record.approved_by;

  // Employee info from next row
  const nextNd = nextRecord?.normalized_data ?? nextRecord?.raw_data ?? {};
  const payrollNum = nextRecord ? extractPayrollFromLeaveRow(nextNd) : '';
  const leavePeriod = nextRecord ? extractLeavePeriod(nextNd) : '';
  const leaveType = nextRecord ? extractLeaveType(nextNd) : '';
  const leaveStatus = nextRecord ? extractLeaveStatus(nextNd) : '';

  // Dates to display
  const displayDates = editMode ? editedDates : (knownPattern?.dates ?? parsed?.dates ?? []);
  const displayConf = knownPattern?.confidence ?? parsed?.confidence ?? 'low';
  const isAutoResolved = !!knownPattern && !editMode;

  const confBadgeClass = displayConf === 'high'
    ? 'border-teal/40 text-teal bg-teal/5'
    : displayConf === 'medium'
    ? 'border-amber/40 text-amber bg-amber/5'
    : 'border-coral/40 text-coral bg-coral/5';

  const handleEditToggle = () => {
    if (!editMode) {
      setEditedDates(displayDates);
    }
    setEditMode(!editMode);
  };

  const handleDateToggle = (iso: string) => {
    setEditedDates(prev =>
      prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso].sort()
    );
  };

  // Generate candidate dates for the roster period (Apr 13-26)
  const candidateDates = Array.from({ length: 18 }, (_, i) => {
    const d = i + 13;
    return `2026-04-${String(d).padStart(2, '0')}`;
  });

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      isApproved
        ? 'border-teal/20 bg-teal/3 opacity-50'
        : isAutoResolved
        ? 'border-teal/20 bg-teal/5'
        : 'border-amber/20 bg-amber/3'
    }`}>
      {/* Card header: employee info */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border/50 bg-secondary/10">
        <span className="font-mono text-[10px] text-muted-foreground w-8 flex-shrink-0">
          #{record.row_number}
        </span>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          {payrollNum ? (
            <span className="text-xs font-mono font-medium text-foreground/90">
              Payroll #{payrollNum}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">Employee unknown</span>
          )}
          {leavePeriod && (
            <>
              <span className="text-muted-foreground/40 mx-1">·</span>
              <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate">{leavePeriod}</span>
            </>
          )}
          {leaveType && (
            <>
              <span className="text-muted-foreground/40 mx-1">·</span>
              <span className="text-[10px] text-muted-foreground truncate">{leaveType}</span>
            </>
          )}
          {leaveStatus && (
            <Badge variant="outline" className="text-[9px] px-1 border-teal/30 text-teal ml-1">
              {leaveStatus}
            </Badge>
          )}
        </div>
        {isApproved && (
          <span className="text-[9px] text-teal flex items-center gap-1 flex-shrink-0">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2.5">
        {/* Raw note */}
        <div className="flex items-start gap-2">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5 w-16 flex-shrink-0">
            Note:
          </span>
          <span className="text-xs font-mono text-amber/90 bg-amber/5 px-2 py-0.5 rounded border border-amber/20 flex-1">
            {rawNote || '(empty)'}
          </span>
        </div>

        {/* AI extraction */}
        <div className="flex items-start gap-2">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5 w-16 flex-shrink-0 flex items-center gap-1">
            <Brain className="w-2.5 h-2.5" />
            {isAutoResolved ? 'Known:' : 'AI reads:'}
          </span>

          <div className="flex-1">
            {!editMode ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {displayDates.length > 0 ? (
                  <>
                    {/* Arrow showing the interpretation */}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-medium text-foreground/70">RDO on:</span>
                    </span>
                    {displayDates.map(iso => {
                      const d = new Date(iso + 'T00:00:00');
                      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return (
                        <span
                          key={iso}
                          className="flex items-center gap-1 text-[11px] font-semibold text-teal bg-teal/10 border border-teal/30 px-2 py-0.5 rounded"
                        >
                          <Calendar className="w-2.5 h-2.5" />
                          {label}
                        </span>
                      );
                    })}
                    <Badge variant="outline" className={`text-[9px] px-1.5 ${confBadgeClass}`}>
                      {displayConf}
                    </Badge>
                    {isAutoResolved && (
                      <span className="text-[9px] text-teal/60 flex items-center gap-0.5">
                        <BookOpen className="w-2.5 h-2.5" /> learned
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-coral/80 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Could not parse dates — please edit manually
                  </span>
                )}
              </div>
            ) : (
              /* Edit mode: date picker grid */
              <div className="space-y-1.5">
                <div className="text-[9px] text-amber mb-1">Select the correct RDO dates:</div>
                <div className="flex flex-wrap gap-1">
                  {candidateDates.map(iso => {
                    const d = new Date(iso + 'T00:00:00');
                    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const selected = editedDates.includes(iso);
                    return (
                      <button
                        key={iso}
                        onClick={() => handleDateToggle(iso)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          selected
                            ? 'border-teal text-teal bg-teal/15 font-semibold'
                            : 'border-border text-muted-foreground hover:border-teal/50 hover:text-teal/70'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation question */}
        {!isApproved && displayDates.length > 0 && !editMode && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/30">
            <div className="flex-1 text-[10px] text-muted-foreground">
              Confirm: <span className="font-medium text-foreground/80">
                Payroll #{payrollNum || '?'}
              </span> requests RDO on{' '}
              <span className="text-teal font-medium">{formatRdoDates(displayDates)}</span>?
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                size="sm" variant="outline"
                className="h-6 text-[10px] px-2 border-border text-muted-foreground hover:border-amber/50 hover:text-amber"
                onClick={handleEditToggle}
              >
                Edit
              </Button>
              <Button
                size="sm" variant="outline"
                className="h-6 text-[10px] px-2.5 border-teal/40 text-teal hover:bg-teal/10 gap-1"
                onClick={() => onApprove(record.id, displayDates, rawNote, displayConf as 'high' | 'medium' | 'low', payrollNum)}
              >
                <CheckCircle2 className="w-3 h-3" /> Approve
              </Button>
            </div>
          </div>
        )}

        {/* Edit mode actions */}
        {!isApproved && editMode && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/30">
            <div className="flex-1 text-[10px] text-muted-foreground">
              {editedDates.length === 0
                ? 'Select at least one date'
                : `Selected: ${formatRdoDates(editedDates)}`}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                size="sm" variant="outline"
                className="h-6 text-[10px] px-2 border-border text-muted-foreground"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm" variant="outline"
                className="h-6 text-[10px] px-2.5 border-teal/40 text-teal hover:bg-teal/10 gap-1"
                disabled={editedDates.length === 0}
                onClick={() => {
                  setEditMode(false);
                  onApprove(record.id, editedDates, rawNote, 'high', payrollNum);
                }}
              >
                <CheckCircle2 className="w-3 h-3" /> Approve
              </Button>
            </div>
          </div>
        )}

        {/* No dates, not approved */}
        {!isApproved && displayDates.length === 0 && !editMode && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/30">
            <span className="flex-1 text-[10px] text-muted-foreground">
              AI could not parse dates. Please edit manually.
            </span>
            <Button
              size="sm" variant="outline"
              className="h-6 text-[10px] px-2 border-amber/40 text-amber hover:bg-amber/10"
              onClick={handleEditToggle}
            >
              Edit Dates
            </Button>
          </div>
        )}

        {/* Raw data toggle */}
        <div>
          <button
            className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
            Raw data
          </button>
          {showRaw && (
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" /> Note Row (#{record.row_number})
                </div>
                <div className="font-mono text-[9px] text-foreground/70 space-y-0.5 bg-secondary/20 rounded p-2">
                  {Object.entries(record.raw_data ?? {}).map(([k, v]) => {
                    const val = String(v ?? '');
                    if (!val) return null;
                    return (
                      <div key={k} className="flex gap-2">
                        <span className="text-muted-foreground w-20 truncate flex-shrink-0">{friendlyKey(k)}:</span>
                        <span className="truncate text-foreground/80">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {nextRecord && (
                <div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                    <User className="w-2.5 h-2.5" /> Employee Row (#{nextRecord.row_number})
                  </div>
                  <div className="font-mono text-[9px] text-foreground/70 space-y-0.5 bg-secondary/20 rounded p-2">
                    {Object.entries(nextRecord.raw_data ?? {}).map(([k, v]) => {
                      const val = String(v ?? '');
                      if (!val) return null;
                      return (
                        <div key={k} className="flex gap-2">
                          <span className="text-muted-foreground w-20 truncate flex-shrink-0">{friendlyKey(k)}:</span>
                          <span className="truncate text-foreground/80">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Standard Record Row (non-leave files) ────────────────────────────────────

function RecordRow({
  record,
  onApprove,
}: {
  record: ETLRecord;
  onApprove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { label, detail } = buildRecordSummary(record);
  const conf = record.confidence_level;
  const isApproved = !!record.approved_by;
  const isReview = isActionableReview(record);

  // Build display-friendly data rows, filtering empty values
  const rawEntries = Object.entries(record.raw_data ?? {}).filter(([, v]) => {
    const s = String(v ?? '').trim();
    return s !== '' && s !== 'null' && s !== 'undefined' && s !== 'nan';
  });

  const normEntries = Object.entries(record.normalized_data ?? record.raw_data ?? {}).filter(([, v]) => {
    const s = String(v ?? '').trim();
    return s !== '' && s !== 'null' && s !== 'undefined' && s !== 'nan';
  });

  return (
    <div className={`border-b border-border last:border-0 transition-colors ${isReview ? 'bg-amber/3' : ''} ${isApproved ? 'opacity-50' : ''}`}>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/20 text-xs"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded
          ? <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
        <span className="font-mono text-[10px] text-muted-foreground w-10 flex-shrink-0">#{record.row_number}</span>
        <span className="text-[10px] text-muted-foreground w-20 truncate flex-shrink-0">{record.source_sheet}</span>
        <span className="text-muted-foreground flex-shrink-0 w-24 text-[10px]">{label}</span>
        <span className="flex-1 truncate text-foreground/80 text-[10px]">{detail}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0 w-16">
          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${confBar(conf)}`} style={{ width: `${conf}%` }} />
          </div>
          <span className={`text-[10px] font-mono ${confColor(conf)}`}>{conf.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 w-28 justify-end">
          {isApproved && <span className="flex items-center gap-0.5 text-[9px] text-teal"><CheckCircle2 className="w-3 h-3" /> Approved</span>}
          {isReview && !isApproved && <span className="flex items-center gap-0.5 text-[9px] text-amber"><Eye className="w-3 h-3" /> Review</span>}
          {!isReview && !isApproved && <span className="flex items-center gap-0.5 text-[9px] text-teal"><CheckCircle2 className="w-3 h-3" /> Valid</span>}
        </div>
        {isReview && (
          <Button
            size="sm" variant="outline"
            className="h-5 text-[9px] px-2 border-teal/30 text-teal hover:bg-teal/10 flex-shrink-0"
            onClick={e => { e.stopPropagation(); onApprove(record.id); }}
          >
            Approve
          </Button>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-3 bg-secondary/10">
          {rawEntries.length === 0 && normEntries.length === 0 ? (
            <div className="text-[10px] text-muted-foreground py-2">No data fields available.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" /> Raw Data
                  {rawEntries.length === 0 && <span className="text-coral">(empty)</span>}
                </div>
                {rawEntries.length > 0 ? (
                  <div className="font-mono text-[9px] text-foreground/70 space-y-0.5 max-h-40 overflow-y-auto bg-secondary/20 rounded p-2">
                    {rawEntries.map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-muted-foreground w-28 truncate flex-shrink-0">{friendlyKey(k)}:</span>
                        <span className="truncate text-foreground/80">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[9px] text-muted-foreground italic">All fields empty</div>
                )}
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Normalized
                </div>
                {normEntries.length > 0 ? (
                  <div className="font-mono text-[9px] text-foreground/70 space-y-0.5 max-h-40 overflow-y-auto bg-secondary/20 rounded p-2">
                    {normEntries.map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-muted-foreground w-28 truncate flex-shrink-0">{friendlyKey(k)}:</span>
                        <span className="truncate text-foreground/80">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[9px] text-muted-foreground italic">Same as raw data</div>
                )}
              </div>
            </div>
          )}
          {record.warning_flags && record.warning_flags.length > 0 && (
            <div className="mt-2">
              <div className="text-[9px] text-amber uppercase tracking-wider mb-1">Warnings</div>
              {record.warning_flags.map((w, i) => (
                <div key={i} className="text-[9px] text-amber/80 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" /> {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── File Group Card ──────────────────────────────────────────────────────────

function FileGroupCard({
  batch,
  records,
  filter,
  onApprove,
  onApproveRDO,
}: {
  batch: UploadBatch;
  records: ETLRecord[];
  filter: FilterType;
  onApprove: (id: string) => void;
  onApproveRDO: (id: string, dates: string[], note: string, confidence: 'high' | 'medium' | 'low', payrollNum: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLeaveFile = batch.upload_name?.toLowerCase().includes('leave request');

  const actionableReview = records.filter(r => isActionableReview(r));
  const approvedCount = records.filter(r => !!r.approved_by).length;
  const confAvg = records.length > 0
    ? records.reduce((s, r) => s + r.confidence_level, 0) / records.length
    : 0;

  const filteredRecords = records.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'review') return isActionableReview(r);
    if (filter === 'approved') return !!r.approved_by;
    if (filter === 'ok') return !isActionableReview(r) && !r.approved_by;
    return true;
  });

  // Build a row_number → record map for quick lookup (to find next row)
  const rowMap = new Map(records.map(r => [r.row_number, r]));

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/20 transition-colors border-b border-border"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-base">{fileIcon(batch.file_type)}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{batch.upload_name}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {records.length.toLocaleString()} records · {batch.file_type}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div className={`text-sm font-mono font-bold ${confColor(confAvg)}`}>{confAvg.toFixed(0)}%</div>
            <div className="text-[9px] text-muted-foreground">avg conf</div>
          </div>
          {actionableReview.length > 0 && (
            <Badge variant="outline" className="text-[9px] border-amber/30 text-amber px-1.5">
              {actionableReview.length} review
            </Badge>
          )}
          {approvedCount > 0 && (
            <Badge variant="outline" className="text-[9px] border-teal/30 text-teal px-1.5">
              {approvedCount} approved
            </Badge>
          )}
          <Badge variant="outline" className={`text-[9px] px-1.5 ${batch.status === 'completed' ? 'border-teal/30 text-teal' : 'border-amber/30 text-amber'}`}>
            {batch.status}
          </Badge>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div>
          {/* Leave request files in review mode: show RDO review cards */}
          {isLeaveFile && filter === 'review' ? (
            <div className="p-3 space-y-2">
              {filteredRecords.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">All records reviewed.</div>
              ) : (
                <>
                  <div className="text-[9px] text-muted-foreground mb-2 flex items-center gap-1">
                    <Brain className="w-3 h-3 text-teal" />
                    AI has extracted RDO dates from each note. Review employee info and approve to confirm.
                  </div>
                  {filteredRecords.map(rec => (
                    <RDOReviewCard
                      key={rec.id}
                      record={rec}
                      nextRecord={rowMap.get(rec.row_number + 1) ?? null}
                      onApprove={onApproveRDO}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            /* All other files: standard table view */
            <div>
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-secondary/20 text-[9px] text-muted-foreground uppercase tracking-wider">
                <span className="w-3 flex-shrink-0" />
                <span className="w-10 flex-shrink-0">Row</span>
                <span className="w-20 flex-shrink-0">Sheet</span>
                <span className="w-24 flex-shrink-0">Type</span>
                <span className="flex-1">Content</span>
                <span className="w-16 text-right">Conf</span>
                <span className="w-28 text-right">Status</span>
                <span className="w-16" />
              </div>
              {filteredRecords.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No records match the current filter.</div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {filteredRecords.slice(0, 200).map(rec => (
                    <RecordRow key={rec.id} record={rec} onApprove={onApprove} />
                  ))}
                  {filteredRecords.length > 200 && (
                    <div className="p-2 text-center text-[10px] text-muted-foreground border-t border-border">
                      Showing first 200 of {filteredRecords.length.toLocaleString()} records.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Learning Log Panel ───────────────────────────────────────────────────────

function LearningLogPanel({ patterns }: { patterns: RDOPattern[] }) {
  return (
    <div className="w-72 border-l border-border bg-card flex flex-col flex-shrink-0">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <BookOpen className="w-3.5 h-3.5 text-teal" />
        <span className="text-xs font-medium">Pattern Library</span>
        <Badge variant="outline" className="ml-auto text-[9px] border-teal/30 text-teal px-1.5">
          {patterns.length} patterns
        </Badge>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {patterns.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">No patterns learned yet.</p>
            <p className="text-[10px] text-muted-foreground mt-1">Approve review records to build the library.</p>
          </div>
        ) : (
          patterns.map(p => (
            <div key={p.pattern} className="border border-border rounded p-2 space-y-1">
              <div className="font-mono text-[9px] text-amber/80 truncate" title={p.pattern}>
                "{p.pattern}"
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {p.dates.map(iso => {
                  const d = new Date(iso + 'T00:00:00');
                  return (
                    <span key={iso} className="text-[9px] text-teal bg-teal/10 border border-teal/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Calendar className="w-2 h-2" />
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                <span className={p.confidence === 'high' ? 'text-teal' : p.confidence === 'medium' ? 'text-amber' : 'text-coral'}>
                  {p.confidence}
                </span>
                <span>·</span>
                <span>used {p.use_count}×</span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="px-4 py-2 border-t border-border text-[9px] text-muted-foreground">
        Patterns are saved and reused across sessions. Next time the same note appears, it will be auto-resolved.
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ETLNormalization() {
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [records, setRecords] = useState<ETLRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Initialising...');
  const [filter, setFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [patterns, setPatterns] = useState<RDOPattern[]>([]);
  const loadedRef = useRef(false);

  const refreshPatterns = () => setPatterns(getAllPatterns());

  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      setLoadingMsg('Resolving session...');
      const session = await getOrCreateSession();
      const sid = session.id;

      if (!forceRefresh) {
        setLoadingMsg('Checking cache...');
        const valid = await isCacheValid(sid);
        if (valid) {
          const cached = getCache()!;
          setBatches(cached.batches);
          setRecords(cached.records);
          setLoading(false);
          return;
        }
      } else {
        clearCache();
      }

      setLoadingMsg('Loading batches...');
      const entry = await loadETLData(sid);
      setBatches(entry.batches);
      setRecords(entry.records);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadPatterns().then(refreshPatterns);
      loadData(false);
    }
  }, [loadData]);

  // Standard approve
  const handleApprove = async (recordId: string) => {
    cacheApproveRecord(recordId, 'ops_manager');
    setRecords(prev => prev.map(r =>
      r.id === recordId ? { ...r, approved_by: 'ops_manager', approved_at: new Date().toISOString() } : r
    ));
    const { error } = await supabase
      .from('etl_records')
      .update({ approved_by: 'ops_manager', approved_at: new Date().toISOString() })
      .eq('id', recordId);
    if (error) {
      cacheUnapproveRecord(recordId);
      setRecords(prev => prev.map(r =>
        r.id === recordId ? { ...r, approved_by: null, approved_at: null } : r
      ));
    }
  };

  // RDO approve: saves parsed dates into ai_extracted_data on etl_records
  // (rdo_requests requires employee_id FK — will be populated in AI Extraction
  //  once employee roster is imported and payroll# → employee_id mapping exists)
  const handleApproveRDO = async (
    recordId: string,
    dates: string[],
    note: string,
    confidence: 'high' | 'medium' | 'low',
    payrollNum: string,
  ) => {
    // Optimistic update
    cacheApproveRecord(recordId, 'ops_manager');
    setRecords(prev => prev.map(r =>
      r.id === recordId ? { ...r, approved_by: 'ops_manager', approved_at: new Date().toISOString() } : r
    ));

    // Save to pattern library
    await savePattern(note, dates, confidence, 'ops_manager');
    refreshPatterns();

    // Persist approval + extracted RDO dates to etl_records.ai_extracted_data
    const aiExtracted = {
      type: 'rdo_request',
      payroll_number: payrollNum || null,
      rdo_dates: dates,
      source_note: note,
      confidence,
      extracted_at: new Date().toISOString(),
      // Will be linked to employee_id in AI Extraction step once employee roster is imported
    };

    const { error } = await supabase
      .from('etl_records')
      .update({
        approved_by: 'ops_manager',
        approved_at: new Date().toISOString(),
        ai_extracted_data: aiExtracted,
      })
      .eq('id', recordId);

    if (error) {
      cacheUnapproveRecord(recordId);
      setRecords(prev => prev.map(r =>
        r.id === recordId ? { ...r, approved_by: null, approved_at: null } : r
      ));
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalRecords = records.length;
  const needsReviewCount = records.filter(r => isActionableReview(r)).length;
  const approvedCount = records.filter(r => !!r.approved_by).length;
  const cleanCount = Math.max(0, totalRecords - needsReviewCount - approvedCount);

  const fileGroups = batches.map(batch => ({
    batch,
    records: records.filter(r => r.upload_batch_id === batch.id),
  }));

  const filterTabs: { key: FilterType; label: string; count: number; cls: string }[] = [
    { key: 'all', label: 'All Records', count: totalRecords, cls: 'text-foreground' },
    { key: 'review', label: 'Needs Review', count: needsReviewCount, cls: 'text-amber' },
    { key: 'approved', label: 'Approved', count: approvedCount, cls: 'text-teal' },
    { key: 'ok', label: 'Clean', count: cleanCount, cls: 'text-teal' },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
          <div>
            <h1 className="text-sm font-bold tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-teal" />
              ETL &amp; NORMALIZATION
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Raw Excel data parsed, normalized, and validated. Review ambiguous RDO notes before roster generation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              className={`h-7 text-xs gap-1.5 border-border ${sidePanel === 'learning' ? 'border-teal/40 text-teal bg-teal/5' : ''}`}
              onClick={() => setSidePanel(p => p === 'learning' ? null : 'learning')}
            >
              <BookOpen className="w-3 h-3" />
              Pattern Library
              {patterns.length > 0 && <span className="ml-0.5 text-teal font-mono">{patterns.length}</span>}
            </Button>
            <Button
              variant="outline" size="sm"
              className="h-7 text-xs gap-1.5 border-border"
              onClick={() => loadData(true)}
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Pipeline breadcrumb */}
        <div className="px-6 py-2 border-b border-border bg-secondary/10 flex-shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
            {['Excel Upload', 'Parse & Extract', 'Normalize Fields', 'Confidence Score', 'Review & Approve', 'Roster Generation'].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className={i <= 3 ? 'text-teal' : i === 4 ? 'text-amber font-medium' : ''}>
                  {i <= 3 ? '✓' : i === 4 ? '●' : '○'} {step}
                </span>
                {i < arr.length - 1 && <span className="text-border">→</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-card border-border p-4">
              <div className="text-2xl font-bold font-mono">{loading ? '—' : totalRecords.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Total Records</div>
              <div className="text-[10px] text-muted-foreground">{batches.length} files in session</div>
            </Card>
            <Card className="bg-card border-amber/20 border p-4">
              <div className="text-2xl font-bold font-mono text-amber">{loading ? '—' : needsReviewCount.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Needs Review</div>
              <div className="text-[10px] text-muted-foreground">Ambiguous RDO / leave notes</div>
            </Card>
            <Card className="bg-card border-teal/20 border p-4">
              <div className="text-2xl font-bold font-mono text-teal">{loading ? '—' : approvedCount.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Approved</div>
              <div className="text-[10px] text-muted-foreground">
                {patterns.length > 0 ? `${patterns.length} patterns learned` : 'Ready for roster generation'}
              </div>
            </Card>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground mr-1">Filter:</span>
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1 text-[10px] rounded border transition-colors ${
                  filter === tab.key
                    ? `border-current ${tab.cls} bg-current/10`
                    : 'border-border text-muted-foreground hover:border-current hover:text-foreground'
                }`}
              >
                {tab.label} ({loading ? '…' : tab.count.toLocaleString()})
              </button>
            ))}
            {needsReviewCount > 0 && !loading && (
              <span className="ml-2 text-[10px] text-amber flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {needsReviewCount} record{needsReviewCount !== 1 ? 's' : ''} need review
              </span>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <Card className="bg-card border-border p-12 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 text-teal animate-spin" />
              <div className="text-sm text-muted-foreground">{loadingMsg}</div>
              <div className="text-[10px] text-muted-foreground">Data is cached after first load — subsequent visits will be instant</div>
            </Card>
          ) : error ? (
            <Card className="bg-card border-coral/20 border p-6 text-center">
              <AlertTriangle className="w-5 h-5 text-coral mx-auto mb-2" />
              <div className="text-sm text-coral">{error}</div>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => loadData(true)}>Retry</Button>
            </Card>
          ) : totalRecords === 0 ? (
            <Card className="bg-card border-border p-12 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <div className="text-sm text-muted-foreground">No records found. Upload files in the Data Intake step first.</div>
            </Card>
          ) : (
            <div className="space-y-3">
              {getCache() && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Data loaded {new Date(getCache()!.loadedAt).toLocaleTimeString()} · cached in memory · click Refresh to reload from database
                </div>
              )}
              {fileGroups.map(({ batch, records: batchRecs }) => {
                if (filter === 'review' && !batchRecs.some(r => isActionableReview(r))) return null;
                if (filter === 'approved' && !batchRecs.some(r => !!r.approved_by)) return null;
                return (
                  <FileGroupCard
                    key={batch.id}
                    batch={batch}
                    records={batchRecs}
                    filter={filter}
                    onApprove={handleApprove}
                    onApproveRDO={handleApproveRDO}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Side panel */}
      {sidePanel === 'learning' && <LearningLogPanel patterns={patterns} />}
    </div>
  );
}
