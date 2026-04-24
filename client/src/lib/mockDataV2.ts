// ============================================================
// MOCK DATA V2 — New pages: Data Intake, ETL, AI Extraction, Generation Flow, Demand & Skills
// ============================================================

// ---- DATA INTAKE ----
export interface ExcelFile {
  id: string;
  filename: string;
  size: string;
  uploadedAt: string;
  status: 'success' | 'warning' | 'error' | 'processing';
  sheetsDetected: number;
  completeness: number; // 0-100
  category: string;
}

export const EXCEL_FILES: ExcelFile[] = [
  { id: 'F01', filename: 'TG_Employee_Master_Apr2026.xlsx', size: '2.4 MB', uploadedAt: '2026-04-21 09:15', status: 'success', sheetsDetected: 2, completeness: 100, category: 'Employee Master' },
  { id: 'F02', filename: 'Previous_Roster_Wk16.xlsx', size: '1.8 MB', uploadedAt: '2026-04-21 09:16', status: 'success', sheetsDetected: 1, completeness: 100, category: 'Previous Roster' },
  { id: 'F03', filename: 'AL_UL_Leave_Apr2026.xlsx', size: '890 KB', uploadedAt: '2026-04-21 09:17', status: 'success', sheetsDetected: 1, completeness: 98, category: 'Leave / AL / UL' },
  { id: 'F04', filename: 'RDO_Requests_Wk17.xlsx', size: '420 KB', uploadedAt: '2026-04-21 09:18', status: 'warning', sheetsDetected: 1, completeness: 92, category: 'RDO Requests' },
  { id: 'F05', filename: 'Special_Requests_Apr2026.xlsx', size: '310 KB', uploadedAt: '2026-04-21 09:19', status: 'warning', sheetsDetected: 1, completeness: 88, category: 'Special Requests' },
  { id: 'F06', filename: 'Couple_Shift_List.xlsx', size: '180 KB', uploadedAt: '2026-04-21 09:20', status: 'success', sheetsDetected: 1, completeness: 100, category: 'Couple Shift' },
  { id: 'F07', filename: 'Skills_Report_TG.xlsx', size: '1.1 MB', uploadedAt: '2026-04-21 09:21', status: 'success', sheetsDetected: 2, completeness: 100, category: 'Skills Report' },
  { id: 'F08', filename: 'Demand_OT_PHNW_CPH.xlsx', size: '760 KB', uploadedAt: '2026-04-21 09:22', status: 'warning', sheetsDetected: 1, completeness: 95, category: 'Demand / OT / PHNW / CPH' },
];

export interface DetectedSheet {
  id: string;
  fileId: string;
  sheetName: string;
  category: string;
  rows: number;
  columns: number;
  status: 'mapped' | 'partial' | 'unmapped';
  missingFields: string[];
  confidence: number;
}

export const DETECTED_SHEETS: DetectedSheet[] = [
  { id: 'SH01', fileId: 'F01', sheetName: 'Employee List', category: 'Employee Master', rows: 156, columns: 18, status: 'mapped', missingFields: [], confidence: 99 },
  { id: 'SH02', fileId: 'F01', sheetName: 'Grade & Language', category: 'Employee Master', rows: 156, columns: 8, status: 'mapped', missingFields: [], confidence: 98 },
  { id: 'SH03', fileId: 'F02', sheetName: 'Roster Wk16', category: 'Previous Roster', rows: 156, columns: 12, status: 'mapped', missingFields: [], confidence: 100 },
  { id: 'SH04', fileId: 'F03', sheetName: 'Leave Records', category: 'Leave / AL / UL', rows: 42, columns: 9, status: 'mapped', missingFields: ['return_date (3 rows)'], confidence: 96 },
  { id: 'SH05', fileId: 'F04', sheetName: 'RDO Req', category: 'RDO Requests', rows: 38, columns: 7, status: 'partial', missingFields: ['Period end date (2 rows)', 'Notes ambiguous (5 rows)'], confidence: 88 },
  { id: 'SH06', fileId: 'F05', sheetName: 'Special Req', category: 'Special Requests', rows: 24, columns: 6, status: 'partial', missingFields: ['Shift code unclear (3 rows)'], confidence: 85 },
  { id: 'SH07', fileId: 'F06', sheetName: 'Couples', category: 'Couple Shift', rows: 12, columns: 5, status: 'mapped', missingFields: [], confidence: 100 },
  { id: 'SH08', fileId: 'F07', sheetName: 'Skill Matrix', category: 'Skills Report', rows: 156, columns: 14, status: 'mapped', missingFields: [], confidence: 99 },
  { id: 'SH09', fileId: 'F07', sheetName: 'Training Nominees', category: 'Training List', rows: 8, columns: 6, status: 'mapped', missingFields: [], confidence: 100 },
  { id: 'SH10', fileId: 'F08', sheetName: 'Demand & OT & CPH', category: 'Demand / OT / PHNW / CPH', rows: 64, columns: 11, status: 'partial', missingFields: ['CPH date format inconsistent (2 rows)'], confidence: 91 },
];

// ---- ETL & NORMALIZATION ----
export interface ETLRow {
  id: string;
  sourceSheet: string;
  rawText: string;
  normalizedField: string;
  aiRuleOutput: string;
  validationStatus: 'valid' | 'warning' | 'error' | 'review';
  reviewAction: string;
}

export const ETL_ROWS: ETLRow[] = [
  { id: 'E01', sourceSheet: 'RDO Req', rawText: 'Fix RDO SUN', normalizedField: 'rdo_request', aiRuleOutput: 'ai_rdo = ["SUN"]', validationStatus: 'valid', reviewAction: 'Auto-approved' },
  { id: 'E02', sourceSheet: 'Special Req', rawText: 'Avoid EV, ES, S', normalizedField: 'special_request', aiRuleOutput: 'ai_type = refuse, ai_value = ["EV","ES","S"]', validationStatus: 'valid', reviewAction: 'Auto-approved' },
  { id: 'E03', sourceSheet: 'Special Req', rawText: 'M only', normalizedField: 'special_request', aiRuleOutput: 'ai_type = allow, ai_value = ["M"]', validationStatus: 'valid', reviewAction: 'Auto-approved' },
  { id: 'E04', sourceSheet: 'Special Req', rawText: 'No S and seat game', normalizedField: 'special_request', aiRuleOutput: 'ai_type = refuse, ai_value = ["S"], excluded = "seat game"', validationStatus: 'warning', reviewAction: 'Excluded term "seat game" — not a shift code' },
  { id: 'E05', sourceSheet: 'RDO Req', rawText: 'RDO=03/04, Period 31/03–02/04', normalizedField: 'rdo_request', aiRuleOutput: 'ai_result = ["2026-04-03"]', validationStatus: 'valid', reviewAction: 'Adjacent to period end — valid' },
  { id: 'E06', sourceSheet: 'RDO Req', rawText: 'RD0 5', normalizedField: 'rdo_request', aiRuleOutput: 'ai_result = pending, inferred "RDO day 5"', validationStatus: 'review', reviewAction: 'Typo detected (RD0 → RDO). Date "5" ambiguous — needs manager review' },
  { id: 'E07', sourceSheet: 'Employee List', rawText: 'Chan Wai Ming / 015843', normalizedField: 'employee_id, name', aiRuleOutput: 'id = "015843", name = "Chan Wai Ming"', validationStatus: 'valid', reviewAction: 'Auto-mapped' },
  { id: 'E08', sourceSheet: 'Skill Matrix', rawText: 'BAC-P, BJ-S, RLT-T', normalizedField: 'skills[]', aiRuleOutput: 'Baccarat=Primary, Blackjack=Secondary, Roulette=Trainee', validationStatus: 'valid', reviewAction: 'Auto-mapped' },
  { id: 'E09', sourceSheet: 'Leave Records', rawText: 'AL 28/04–30/04', normalizedField: 'leave_type, start, end', aiRuleOutput: 'type=AL, start=2026-04-28, end=2026-04-30', validationStatus: 'valid', reviewAction: 'Auto-approved' },
  { id: 'E10', sourceSheet: 'Roster Wk16', rawText: 'N N N RDO D D D', normalizedField: 'prev_week_schedule', aiRuleOutput: '["N","N","N","RDO","D","D","D"]', validationStatus: 'valid', reviewAction: 'Auto-mapped' },
  { id: 'E11', sourceSheet: 'Demand & OT & CPH', rawText: 'BAC M: 12D 3S 2SP', normalizedField: 'demand_entry', aiRuleOutput: 'game=Baccarat, shift=M, minDealers=12, minSup=3, minSpare=2', validationStatus: 'valid', reviewAction: 'Auto-mapped' },
  { id: 'E12', sourceSheet: 'Special Req', rawText: 'Night Shift long term', normalizedField: 'special_request', aiRuleOutput: 'ai_type = allow, ai_value = ["EV","ES","S"], flag = evesLongTerm', validationStatus: 'valid', reviewAction: 'Mapped to EV/ES/S long-term flag' },
  { id: 'E13', sourceSheet: 'RDO Req', rawText: 'RFO Wed', normalizedField: 'rdo_request', aiRuleOutput: 'ai_rdo = ["WED"], variant detected: RFO → RDO', validationStatus: 'warning', reviewAction: 'Typo "RFO" auto-corrected to RDO' },
  { id: 'E14', sourceSheet: 'Couples', rawText: '017455 ↔ 017890, Grade 10', normalizedField: 'couple_pair', aiRuleOutput: 'coupleId pair, grade=10 → same RDO + same shift', validationStatus: 'valid', reviewAction: 'Auto-mapped' },
  { id: 'E15', sourceSheet: 'Demand & OT & CPH', rawText: 'CPH 01/05/2026', normalizedField: 'cph_date', aiRuleOutput: 'cph_date = 2026-05-01 (Labour Day)', validationStatus: 'valid', reviewAction: 'Auto-mapped' },
];

// ---- AI EXTRACTION: RDO ----
export interface RDOExtraction {
  id: string;
  employeeId: string;
  employeeName: string;
  rawNotes: string;
  period: string;
  days: string;
  extractedRDO: string[];
  adjacencyValid: boolean;
  confidence: number;
  status: 'confirmed' | 'review' | 'corrected' | 'rejected';
  correctionNote?: string;
}

export const RDO_EXTRACTIONS: RDOExtraction[] = [
  { id: 'RX01', employeeId: '015843', employeeName: 'Chan Wai Ming', rawNotes: 'RDO 26/04', period: '21/04–25/04', days: '5', extractedRDO: ['2026-04-26'], adjacencyValid: true, confidence: 97, status: 'confirmed' },
  { id: 'RX02', employeeId: '016120', employeeName: 'Li Xiao Hua', rawNotes: 'RDO=23/04', period: '24/04–28/04', days: '5', extractedRDO: ['2026-04-23'], adjacencyValid: true, confidence: 95, status: 'confirmed' },
  { id: 'RX03', employeeId: '016337', employeeName: 'Wong Ka Yan', rawNotes: 'RD0 SUN', period: '21/04–25/04', days: '5', extractedRDO: ['2026-04-27'], adjacencyValid: true, confidence: 88, status: 'review', correctionNote: 'Typo: RD0 (zero) detected → corrected to RDO. SUN inferred as 2026-04-27.' },
  { id: 'RX04', employeeId: '017201', employeeName: 'Cheung Hoi Lam', rawNotes: 'Fix RDO Thu', period: '21/04–25/04', days: '5', extractedRDO: ['2026-04-24'], adjacencyValid: false, confidence: 92, status: 'confirmed', correctionNote: 'Thu is inside period — allowed as Req RDO override.' },
  { id: 'RX05', employeeId: '017455', employeeName: 'Leung Mei Ling', rawNotes: 'R D O Wed', period: '21/04–25/04', days: '5', extractedRDO: ['2026-04-23'], adjacencyValid: false, confidence: 90, status: 'confirmed', correctionNote: 'Spaced variant "R D O" detected. Wed = 2026-04-23.' },
  { id: 'RX06', employeeId: '018102', employeeName: 'Ng Siu Fung', rawNotes: 'RDO=03/04, Period 31/03–02/04', period: '31/03–02/04', days: '3', extractedRDO: ['2026-04-03'], adjacencyValid: true, confidence: 96, status: 'confirmed', correctionNote: 'Date adjacent to period end boundary — valid.' },
  { id: 'RX07', employeeId: '018356', employeeName: 'Tam Wing Kei', rawNotes: 'RFO 25', period: '21/04–25/04', days: '5', extractedRDO: ['2026-04-25'], adjacencyValid: true, confidence: 82, status: 'review', correctionNote: 'Variant "RFO" → RDO. "25" inferred as 25th of April.' },
  { id: 'RX08', employeeId: '018590', employeeName: 'Fong Yat Long', rawNotes: 'RDD Sat CXL 12345', period: '21/04–25/04', days: '5', extractedRDO: ['2026-04-26'], adjacencyValid: true, confidence: 78, status: 'review', correctionNote: 'Variant "RDD" → RDO. CXL numbers ignored. Sat = 2026-04-26.' },
  { id: 'RX09', employeeId: '019012', employeeName: 'Yip Ka Ho', rawNotes: 'Rod Thu', period: '21/04–25/04', days: '5', extractedRDO: ['2026-04-24'], adjacencyValid: false, confidence: 75, status: 'review', correctionNote: 'Variant "Rod" → RDO (low confidence). Thu inside period.' },
  { id: 'RX10', employeeId: '019234', employeeName: 'Kwok Man Wai', rawNotes: 'RDO Sat, RDO Sun', period: '21/04–25/04', days: '5', extractedRDO: ['2026-04-26', '2026-04-27'], adjacencyValid: true, confidence: 94, status: 'confirmed', correctionNote: 'Two RDO dates extracted (max 2 allowed). Both adjacent to period end.' },
];

// ---- AI EXTRACTION: SPECIAL REQUESTS ----
export interface SRExtraction {
  id: string;
  employeeId: string;
  employeeName: string;
  rawAssignedTo: string;
  aiType: 'allow' | 'refuse';
  aiValue: string[];
  aiRDO: string;
  excludedTerms: string[];
  confidence: number;
  status: 'confirmed' | 'review' | 'corrected';
  correctionNote?: string;
}

export const SR_EXTRACTIONS: SRExtraction[] = [
  { id: 'SR01', employeeId: '015843', employeeName: 'Chan Wai Ming', rawAssignedTo: 'No EV, ES, S shifts', aiType: 'refuse', aiValue: ['EV', 'ES', 'S'], aiRDO: '', excludedTerms: [], confidence: 98, status: 'confirmed' },
  { id: 'SR02', employeeId: '016120', employeeName: 'Li Xiao Hua', rawAssignedTo: 'Only M, LM, ED shifts', aiType: 'allow', aiValue: ['M', 'LM', 'ED'], aiRDO: '', excludedTerms: [], confidence: 97, status: 'confirmed' },
  { id: 'SR03', employeeId: '016337', employeeName: 'Wong Ka Yan', rawAssignedTo: 'Night Shift long term', aiType: 'allow', aiValue: ['EV', 'ES', 'S'], aiRDO: '', excludedTerms: [], confidence: 95, status: 'confirmed', correctionNote: '"Night Shift" mapped to EV/ES/S. Long-term flag set.' },
  { id: 'SR04', employeeId: '018356', employeeName: 'Tam Wing Kei', rawAssignedTo: 'Avoid S and seat game', aiType: 'refuse', aiValue: ['S'], aiRDO: '', excludedTerms: ['seat game'], confidence: 90, status: 'review', correctionNote: '"seat game" is not a shift code — excluded from ai_value.' },
  { id: 'SR05', employeeId: '018801', employeeName: 'Lau Pui Shan', rawAssignedTo: 'M only, fix RDO SUN', aiType: 'allow', aiValue: ['M'], aiRDO: 'SUN', excludedTerms: ['RDO', 'SUN'], confidence: 93, status: 'confirmed', correctionNote: '"fix RDO SUN" extracted as ai_rdo=SUN. "RDO" and "SUN" excluded from shift codes.' },
  { id: 'SR06', employeeId: '017890', employeeName: 'Ho Chi Wai', rawAssignedTo: 'Not Night shift, prefer M', aiType: 'refuse', aiValue: ['EV', 'ES', 'S'], aiRDO: '', excludedTerms: [], confidence: 91, status: 'confirmed', correctionNote: '"Not Night shift" → refuse EV/ES/S. "prefer M" noted as soft preference.' },
  { id: 'SR07', employeeId: '018590', employeeName: 'Fong Yat Long', rawAssignedTo: 'Fix D, no LT', aiType: 'allow', aiValue: ['D'], aiRDO: '', excludedTerms: ['LT'], confidence: 87, status: 'review', correctionNote: '"LT" is not a shift code — excluded. "Fix D" → allow D only.' },
];

// ---- ROSTER GENERATION FLOW ----
export interface GenerationStep {
  id: number;
  title: string;
  description: string;
  inputSource: string;
  ruleApplied: string;
  affectedEmployees: number;
  status: 'completed' | 'in-progress' | 'pending' | 'warning';
  warnings: number;
  conflicts: number;
  details: string;
}

export const GENERATION_STEPS: GenerationStep[] = [
  { id: 1, title: 'Base RDO Check', description: 'Validate all employees have 1 RDO per week (Mon–Sun). Place Req RDO first.', inputSource: 'RDO Requests, Employee Master', ruleApplied: 'R02 (1 RDO/week), R07 (Req RDO priority)', affectedEmployees: 156, status: 'completed', warnings: 0, conflicts: 0, details: '156 employees checked. 38 Req RDO placed. All have at least 1 RDO.' },
  { id: 2, title: 'Couple Shift Handling', description: 'Align couple pairs to same RDO and shift pattern based on grade.', inputSource: 'Couple Shift List, Grade data', ruleApplied: 'S11 (Grade 10/30/50/90: same shift), S12 (Grade 60/99: same RDO only)', affectedEmployees: 12, status: 'completed', warnings: 1, conflicts: 0, details: '6 couples processed. 5 aligned successfully. 1 warning: couple 017455↔017890 has conflicting special requests.' },
  { id: 3, title: 'Special Request Handling', description: 'Apply allow/refuse shift constraints from AI-parsed special requests.', inputSource: 'Special Requests (AI-parsed)', ruleApplied: 'S13 (SR overrides couple), Priority: Req RDO > Couple > SR', affectedEmployees: 24, status: 'completed', warnings: 2, conflicts: 0, details: '24 special requests applied. 2 warnings: ambiguous terms flagged for review.' },
  { id: 4, title: 'Leave with Req RDO', description: 'Handle AL/UL periods and ensure RDO adjacency to leave boundaries.', inputSource: 'Leave Records, RDO Requests', ruleApplied: 'S10 (Unify Leave with RDO), S06 (RDO ±2 days)', affectedEmployees: 42, status: 'completed', warnings: 1, conflicts: 0, details: '42 leave records processed. 15 RDOs aligned adjacent to leave. 1 warning: return date missing for 3 employees.' },
  { id: 5, title: 'Previous Week Connection', description: 'Load last week roster to ensure shift continuity and rest compliance.', inputSource: 'Previous Roster (Wk16)', ruleApplied: 'R01 (10hr rest), R05 (min 2 days on new pattern), S08 (N→D→M order)', affectedEmployees: 156, status: 'completed', warnings: 3, conflicts: 1, details: '156 connections loaded. 3 warnings: employees ending Wk16 on Night may need transition shifts. 1 conflict: 10hr rest violation detected.' },
  { id: 6, title: 'Skills Validation', description: 'Verify each assigned shift has employees with required game skills.', inputSource: 'Skills Report, Demand Table', ruleApplied: 'R09 (min per game/shift), R11 (SUP supplements DLR)', affectedEmployees: 156, status: 'completed', warnings: 2, conflicts: 0, details: '156 skill assignments validated. 2 warnings: Roulette Night shift has only Trainee-level coverage.' },
  { id: 7, title: 'Demand Balancing', description: 'Ensure minimum dealer, supervisor, and spare headcount per game per shift.', inputSource: 'Demand Table, Current Assignments', ruleApplied: 'R09, R10 (spare headcount), R11 (SUP→DLR supplement)', affectedEmployees: 156, status: 'warning', warnings: 3, conflicts: 1, details: 'Baccarat Night: 9/10 dealers (1 short). Roulette Day: spare = 0 (below minimum). 1 SUP supplement applied.' },
  { id: 8, title: 'Conflict Validation', description: 'Run all hard and soft rules against the generated roster.', inputSource: 'Generated Roster, All Rules', ruleApplied: 'All 17 hard rules + 20 soft rules', affectedEmployees: 156, status: 'warning', warnings: 4, conflicts: 2, details: '2 hard violations: 10hr rest (018590), 7-night limit (018102). 4 soft warnings: couple mismatch, 3-week night streak, skip-shift.' },
  { id: 9, title: 'Manager Review', description: 'Present conflicts, AI recommendations, and override options to manager.', inputSource: 'Conflict Report, AI Suggestions', ruleApplied: 'Manager Override policy', affectedEmployees: 6, status: 'in-progress', warnings: 4, conflicts: 2, details: '6 employees flagged for review. 2 require mandatory resolution (hard violations). 4 optional (soft warnings).' },
  { id: 10, title: 'Export Roster Excel', description: 'Generate final roster Excel file matching client format.', inputSource: 'Approved Roster', ruleApplied: 'Export template', affectedEmployees: 156, status: 'pending', warnings: 0, conflicts: 0, details: 'Waiting for manager approval to export.' },
];

// ---- DEMAND & SKILLS VIEW ----
export interface DemandSkillRow {
  game: string;
  shift: string;
  shiftTime: string;
  reqDLR: number;
  curDLR: number;
  reqSUP: number;
  curSUP: number;
  reqSpare: number;
  curSpare: number;
  variance: number;
  status: 'met' | 'short' | 'surplus';
  specialSkills: string[];
  aiRecommendation?: string;
}

export const DEMAND_SKILLS: DemandSkillRow[] = [
  { game: 'Baccarat', shift: 'M', shiftTime: '07:00–15:00', reqDLR: 12, curDLR: 14, reqSUP: 3, curSUP: 3, reqSpare: 2, curSpare: 2, variance: 2, status: 'surplus', specialSkills: ['BAC 50', 'BAC 70', 'PREM'], aiRecommendation: undefined },
  { game: 'Baccarat', shift: 'D', shiftTime: '15:00–23:00', reqDLR: 15, curDLR: 15, reqSUP: 4, curSUP: 4, reqSpare: 3, curSpare: 2, variance: -1, status: 'short', specialSkills: ['BAC 50', 'BAC 70', 'PREM', 'FP'], aiRecommendation: 'Move 1 spare from Morning Baccarat to cover Day spare gap.' },
  { game: 'Baccarat', shift: 'N', shiftTime: '23:00–07:00', reqDLR: 10, curDLR: 9, reqSUP: 2, curSUP: 2, reqSpare: 2, curSpare: 1, variance: -2, status: 'short', specialSkills: ['BAC 50', 'BAC 70'], aiRecommendation: 'Ng Siu Fung (SUP) can supplement DLR coverage per R11. Consider reassigning Kwok Man Wai from Morning.' },
  { game: 'Blackjack', shift: 'M', shiftTime: '07:00–15:00', reqDLR: 6, curDLR: 6, reqSUP: 1, curSUP: 1, reqSpare: 1, curSpare: 1, variance: 0, status: 'met', specialSkills: ['SR'], aiRecommendation: undefined },
  { game: 'Blackjack', shift: 'D', shiftTime: '15:00–23:00', reqDLR: 8, curDLR: 8, reqSUP: 2, curSUP: 2, reqSpare: 1, curSpare: 1, variance: 0, status: 'met', specialSkills: ['SR', 'TP'], aiRecommendation: undefined },
  { game: 'Blackjack', shift: 'N', shiftTime: '23:00–07:00', reqDLR: 5, curDLR: 5, reqSUP: 1, curSUP: 1, reqSpare: 1, curSpare: 1, variance: 0, status: 'met', specialSkills: [], aiRecommendation: undefined },
  { game: 'Roulette', shift: 'M', shiftTime: '07:00–15:00', reqDLR: 4, curDLR: 4, reqSUP: 1, curSUP: 1, reqSpare: 1, curSpare: 1, variance: 0, status: 'met', specialSkills: ['TP'], aiRecommendation: undefined },
  { game: 'Roulette', shift: 'D', shiftTime: '15:00–23:00', reqDLR: 5, curDLR: 5, reqSUP: 1, curSUP: 1, reqSpare: 1, curSpare: 0, variance: -1, status: 'short', specialSkills: ['TP', 'FP'], aiRecommendation: 'Tam Wing Kei (Roulette Primary) available as spare if shifted from Day to overlap.' },
  { game: 'Sic Bo', shift: 'M', shiftTime: '07:00–15:00', reqDLR: 3, curDLR: 3, reqSUP: 1, curSUP: 1, reqSpare: 1, curSpare: 1, variance: 0, status: 'met', specialSkills: [], aiRecommendation: undefined },
  { game: 'Sic Bo', shift: 'D', shiftTime: '15:00–23:00', reqDLR: 4, curDLR: 4, reqSUP: 1, curSUP: 1, reqSpare: 1, curSpare: 1, variance: 0, status: 'met', specialSkills: [], aiRecommendation: undefined },
  { game: 'Sic Bo', shift: 'N', shiftTime: '23:00–07:00', reqDLR: 2, curDLR: 2, reqSUP: 1, curSUP: 1, reqSpare: 0, curSpare: 0, variance: 0, status: 'met', specialSkills: [], aiRecommendation: undefined },
];

// ---- ROTATION / PATTERN VIEW ----
export interface RotationPattern {
  employeeId: string;
  employeeName: string;
  originalPattern: string[];
  adjustedPattern: string[];
  rdoMovement: string;
  rotationPreserved: boolean;
  patternBreak: boolean;
  transitionUsed: boolean;
  transitionDetail: string;
  reason: string;
}

export const ROTATION_PATTERNS: RotationPattern[] = [
  { employeeId: '015843', employeeName: 'Chan Wai Ming', originalPattern: ['M','M','M','M','M','RDO','M'], adjustedPattern: ['M','M','M','M','M','M','RDO'], rdoMovement: 'Sat → Sun', rotationPreserved: true, patternBreak: false, transitionUsed: false, transitionDetail: '', reason: 'RDO moved to Sunday per Req RDO. Morning pattern preserved.' },
  { employeeId: '017201', employeeName: 'Cheung Hoi Lam', originalPattern: ['N','N','N','RDO','D','D','D'], adjustedPattern: ['N','N','N','N','RDO','N','N'], rdoMovement: 'Thu → Fri (Req RDO)', rotationPreserved: false, patternBreak: true, transitionUsed: false, transitionDetail: '', reason: 'Req RDO on Friday overrides normal rotation. Night pattern extended. Approaching 3-week night limit (S01 soft warning).' },
  { employeeId: '018590', employeeName: 'Fong Yat Long', originalPattern: ['N','N','RDO','D','D','D','D'], adjustedPattern: ['D','D','D','D','D','RDO','N'], rdoMovement: 'Wed → Sat', rotationPreserved: false, patternBreak: true, transitionUsed: false, transitionDetail: 'D→N transition on Sun violates 10hr rest (R01)', reason: 'HARD VIOLATION: Day shift ends 23:00, Night starts 23:00 — zero rest gap. AI recommends keeping Sunday as Day or inserting EV transition.' },
  { employeeId: '018102', employeeName: 'Ng Siu Fung', originalPattern: ['N','N','N','N','N','N','RDO'], adjustedPattern: ['N','N','N','N','N','N','N'], rdoMovement: 'Sun → None (missing)', rotationPreserved: true, patternBreak: false, transitionUsed: false, transitionDetail: '', reason: 'HARD VIOLATION: 7 consecutive nights at limit (R06). No RDO this week. AI recommends inserting RDO on Thursday.' },
  { employeeId: '017890', employeeName: 'Ho Chi Wai', originalPattern: ['M','M','RDO','M','M','M','M'], adjustedPattern: ['D','D','RDO','M','M','M','M'], rdoMovement: 'Wed (unchanged)', rotationPreserved: false, patternBreak: true, transitionUsed: true, transitionDetail: 'D→M transition after RDO (allowed per S03)', reason: 'Couple mismatch with Leung Mei Ling (017455). D shift Mon-Tue breaks couple same-shift rule (S11). AI recommends moving to Morning.' },
  { employeeId: '018356', employeeName: 'Tam Wing Kei', originalPattern: ['D','D','D','RDO','D','D','D'], adjustedPattern: ['D','D','D','D','RDO','S','S'], rdoMovement: 'Thu → Fri', rotationPreserved: false, patternBreak: true, transitionUsed: true, transitionDetail: 'D→S transition. EV/ES could be used as bridge.', reason: 'RDO moved for demand balancing. D→S direct transition is a large jump. AI suggests D→EV→S over 3 days for smoother transition.' },
];

// ---- APPROVAL / EXPORT ENHANCED ----
export interface ApprovalSummary {
  readinessScore: number;
  hardViolations: number;
  softWarnings: number;
  demandGaps: number;
  manualOverrides: number;
  totalEmployees: number;
  approvedEmployees: number;
  status: 'ready' | 'needs-review' | 'blocked';
}

export const APPROVAL_SUMMARY: ApprovalSummary = {
  readinessScore: 82,
  hardViolations: 2,
  softWarnings: 4,
  demandGaps: 3,
  manualOverrides: 1,
  totalEmployees: 156,
  approvedEmployees: 148,
  status: 'needs-review',
};

export interface OverrideLog {
  id: string;
  timestamp: string;
  manager: string;
  employeeId: string;
  employeeName: string;
  ruleId: string;
  action: string;
  reason: string;
}

export const OVERRIDE_LOGS: OverrideLog[] = [
  { id: 'OV01', timestamp: '2026-04-23 14:30', manager: 'Ops Manager', employeeId: '018102', employeeName: 'Ng Siu Fung', ruleId: 'R06', action: 'Override: Allow 7 consecutive nights', reason: 'Employee volunteered for extended night coverage. Will receive compensatory RDO next week.' },
];
