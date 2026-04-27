/*
 * databaseMockData.ts — Database-aligned mock data for V3 refinement
 * Field names match real SQL Server wynnai database schema
 * All data is mock / demo only — no real backend connection
 */

// ============================================================
// BATCH TASK
// ============================================================
export interface BatchTask {
  batch_id: string;
  batch_name: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  created_at: string;
  completed_at: string | null;
  total_employees: number;
  total_result_rows: number;
  changed_rows: number;
  export_status: 'exported' | 'pending' | 'not_started';
  active_modules: string[];
  inactive_modules: string[];
  customer_validation: 'validated' | 'pending' | 'not_started';
}

export const BATCH_TASKS: BatchTask[] = [
  {
    batch_id: 'BATCH-2026-W17-001',
    batch_name: 'Week 17 — Apr 21–27, 2026 · Table Games',
    status: 'completed',
    created_at: '2026-04-20 08:00',
    completed_at: '2026-04-20 08:12',
    total_employees: 156,
    total_result_rows: 1092,
    changed_rows: 87,
    export_status: 'exported',
    active_modules: ['RDO Scheduler', 'SR Scheduler', 'SR-RDO Scheduler', 'EV/ES Scheduler', 'Cross-batch Boundary', 'Weekly RDO Fallback', 'Excel Export'],
    inactive_modules: ['Training (built, not enabled)', 'Couple Shift (data only)', 'Demand (pending)', 'Skills (pending)', 'Fairness (future)', 'Global Optimization (future)'],
    customer_validation: 'pending',
  },
  {
    batch_id: 'BATCH-2026-W16-001',
    batch_name: 'Week 16 — Apr 14–20, 2026 · Table Games',
    status: 'completed',
    created_at: '2026-04-13 08:00',
    completed_at: '2026-04-13 08:10',
    total_employees: 156,
    total_result_rows: 1092,
    changed_rows: 72,
    export_status: 'exported',
    active_modules: ['RDO Scheduler', 'SR Scheduler', 'SR-RDO Scheduler', 'EV/ES Scheduler', 'Cross-batch Boundary', 'Weekly RDO Fallback', 'Excel Export'],
    inactive_modules: ['Training (built, not enabled)', 'Couple Shift (data only)', 'Demand (pending)', 'Skills (pending)'],
    customer_validation: 'validated',
  },
];

// ============================================================
// ROSTER RESULT ROW (AI_Shift_Scheduling_Result_Table)
// ============================================================
export interface RosterResultRow {
  id: number;
  batch_id: string;
  EmployeeNumber: string;
  EmployeeName: string;
  Cls: string;
  Positions: string;
  ShiftDate: string;
  ShiftValue: string;
  Rotation: string;
  RDO_Display: string;
  ai_result_raw: string;
  IsChanged: number;
  OldShiftValue: string;
  ChangeDetail: string;
  IsEVES: number;
  SpecialRequestAI: string;
  CoupleIDs: string;
  HasTraining: number;
  review_status: 'approved' | 'pending' | 'needs_review' | 'overridden';
}

export const ROSTER_RESULTS: RosterResultRow[] = [
  // Employee 015843 — Chan Wai Ming — AI RDO
  { id: 1, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '015843', EmployeeName: 'Chan Wai Ming', Cls: 'DLR', Positions: 'Baccarat', ShiftDate: '2026-04-21', ShiftValue: 'M', Rotation: 'M-M-M-M-M-M-RDO', RDO_Display: 'Sun', ai_result_raw: '["2026-04-27"]', IsChanged: 0, OldShiftValue: 'M', ChangeDetail: '', IsEVES: 0, SpecialRequestAI: '', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },
  { id: 2, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '015843', EmployeeName: 'Chan Wai Ming', Cls: 'DLR', Positions: 'Baccarat', ShiftDate: '2026-04-22', ShiftValue: 'M', Rotation: 'M-M-M-M-M-M-RDO', RDO_Display: 'Sun', ai_result_raw: '["2026-04-27"]', IsChanged: 0, OldShiftValue: 'M', ChangeDetail: '', IsEVES: 0, SpecialRequestAI: '', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },
  { id: 3, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '015843', EmployeeName: 'Chan Wai Ming', Cls: 'DLR', Positions: 'Baccarat', ShiftDate: '2026-04-26', ShiftValue: 'M', Rotation: 'M-M-M-M-M-M-RDO', RDO_Display: 'Sun', ai_result_raw: '["2026-04-27"]', IsChanged: 1, OldShiftValue: 'RDO', ChangeDetail: 'Original RDO Sat vacated; refilled with M shift. AI Req RDO moved to Sun.', IsEVES: 0, SpecialRequestAI: '', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },
  { id: 4, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '015843', EmployeeName: 'Chan Wai Ming', Cls: 'DLR', Positions: 'Baccarat', ShiftDate: '2026-04-27', ShiftValue: 'RDO', Rotation: 'M-M-M-M-M-M-RDO', RDO_Display: 'Sun', ai_result_raw: '["2026-04-27"]', IsChanged: 1, OldShiftValue: 'M', ChangeDetail: 'AI Req RDO applied. Source: req_rdo_leave_table Notes="RDO=27/4"', IsEVES: 0, SpecialRequestAI: '', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },

  // Employee 017201 — Cheung Hoi Lam — Special Request (refuse EV/ES/S)
  { id: 10, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '017201', EmployeeName: 'Cheung Hoi Lam', Cls: 'DLR', Positions: 'Blackjack', ShiftDate: '2026-04-21', ShiftValue: 'N', Rotation: 'N-N-N-N-RDO-N-N', RDO_Display: 'Fri', ai_result_raw: '', IsChanged: 0, OldShiftValue: 'N', ChangeDetail: '', IsEVES: 0, SpecialRequestAI: 'refuse: [EV, ES, S]', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },
  { id: 11, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '017201', EmployeeName: 'Cheung Hoi Lam', Cls: 'DLR', Positions: 'Blackjack', ShiftDate: '2026-04-24', ShiftValue: 'D', Rotation: 'N-N-N-N-RDO-N-N', RDO_Display: 'Fri', ai_result_raw: '', IsChanged: 1, OldShiftValue: 'S', ChangeDetail: 'SR rule applied: refuse [EV,ES,S]. Swing replaced with Day.', IsEVES: 0, SpecialRequestAI: 'refuse: [EV, ES, S]', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },
  { id: 12, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '017201', EmployeeName: 'Cheung Hoi Lam', Cls: 'DLR', Positions: 'Blackjack', ShiftDate: '2026-04-25', ShiftValue: 'RDO', Rotation: 'N-N-N-N-RDO-N-N', RDO_Display: 'Fri', ai_result_raw: '["2026-04-25"]', IsChanged: 1, OldShiftValue: 'N', ChangeDetail: 'AI Req RDO applied via SR-RDO scheduler. Source: ai_rdo=["FRI"]', IsEVES: 0, SpecialRequestAI: 'refuse: [EV, ES, S]', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },

  // Employee 018590 — Fong Yat Long — EV/ES employee
  { id: 20, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '018590', EmployeeName: 'Fong Yat Long', Cls: 'DLR', Positions: 'Roulette', ShiftDate: '2026-04-21', ShiftValue: 'EV', Rotation: 'EV-EV-EV-RDO-EV-EV-EV', RDO_Display: 'Thu', ai_result_raw: '', IsChanged: 1, OldShiftValue: 'D', ChangeDetail: 'EV/ES schedule applied. IsEVES=1 from wm_wp_ev_es_employee.', IsEVES: 1, SpecialRequestAI: '', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },
  { id: 21, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '018590', EmployeeName: 'Fong Yat Long', Cls: 'DLR', Positions: 'Roulette', ShiftDate: '2026-04-22', ShiftValue: 'EV', Rotation: 'EV-EV-EV-RDO-EV-EV-EV', RDO_Display: 'Thu', ai_result_raw: '', IsChanged: 1, OldShiftValue: 'D', ChangeDetail: 'EV/ES schedule applied.', IsEVES: 1, SpecialRequestAI: '', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },
  { id: 22, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '018590', EmployeeName: 'Fong Yat Long', Cls: 'DLR', Positions: 'Roulette', ShiftDate: '2026-04-24', ShiftValue: 'RDO', Rotation: 'EV-EV-EV-RDO-EV-EV-EV', RDO_Display: 'Thu', ai_result_raw: '', IsChanged: 0, OldShiftValue: 'RDO', ChangeDetail: '', IsEVES: 1, SpecialRequestAI: '', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },

  // Employee 018102 — Ng Siu Fung — 7-night hard violation
  { id: 30, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '018102', EmployeeName: 'Ng Siu Fung', Cls: 'DLR', Positions: 'Baccarat', ShiftDate: '2026-04-21', ShiftValue: 'N', Rotation: 'N-N-N-N-N-N-N', RDO_Display: '', ai_result_raw: '', IsChanged: 0, OldShiftValue: 'N', ChangeDetail: '', IsEVES: 0, SpecialRequestAI: '', CoupleIDs: '', HasTraining: 0, review_status: 'needs_review' },
  { id: 31, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '018102', EmployeeName: 'Ng Siu Fung', Cls: 'DLR', Positions: 'Baccarat', ShiftDate: '2026-04-27', ShiftValue: 'N', Rotation: 'N-N-N-N-N-N-N', RDO_Display: '', ai_result_raw: '', IsChanged: 0, OldShiftValue: 'N', ChangeDetail: 'WARNING: 7 consecutive night shifts (hard limit). Weekly RDO fallback did not find valid slot.', IsEVES: 0, SpecialRequestAI: '', CoupleIDs: '', HasTraining: 0, review_status: 'needs_review' },

  // Employee 017890 — Ho Chi Wai — Couple + Training
  { id: 40, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '017890', EmployeeName: 'Ho Chi Wai', Cls: 'DLR', Positions: 'Baccarat', ShiftDate: '2026-04-21', ShiftValue: 'D', Rotation: 'D-D-RDO-M-M-M-M', RDO_Display: 'Wed', ai_result_raw: '', IsChanged: 0, OldShiftValue: 'D', ChangeDetail: '', IsEVES: 0, SpecialRequestAI: '', CoupleIDs: '019012', HasTraining: 1, review_status: 'approved' },
  { id: 41, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '017890', EmployeeName: 'Ho Chi Wai', Cls: 'DLR', Positions: 'Baccarat', ShiftDate: '2026-04-23', ShiftValue: 'RDO', Rotation: 'D-D-RDO-M-M-M-M', RDO_Display: 'Wed', ai_result_raw: '', IsChanged: 0, OldShiftValue: 'RDO', ChangeDetail: '', IsEVES: 0, SpecialRequestAI: '', CoupleIDs: '019012', HasTraining: 1, review_status: 'approved' },

  // Employee 018356 — Tam Wing Kei — SR allow only LM, ED
  { id: 50, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '018356', EmployeeName: 'Tam Wing Kei', Cls: 'DLR', Positions: 'Sic Bo', ShiftDate: '2026-04-21', ShiftValue: 'LM', Rotation: 'LM-LM-LM-LM-RDO-LM-LM', RDO_Display: 'Fri', ai_result_raw: '', IsChanged: 1, OldShiftValue: 'D', ChangeDetail: 'SR rule applied: allow [LM,ED]. Day replaced with Late Morning.', IsEVES: 0, SpecialRequestAI: 'allow: [LM, ED]', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },
  { id: 51, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '018356', EmployeeName: 'Tam Wing Kei', Cls: 'DLR', Positions: 'Sic Bo', ShiftDate: '2026-04-25', ShiftValue: 'RDO', Rotation: 'LM-LM-LM-LM-RDO-LM-LM', RDO_Display: 'Fri', ai_result_raw: '', IsChanged: 0, OldShiftValue: 'RDO', ChangeDetail: '', IsEVES: 0, SpecialRequestAI: 'allow: [LM, ED]', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },

  // Employee 016337 — Wong Ka Yan — Cross-batch boundary issue
  { id: 60, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '016337', EmployeeName: 'Wong Ka Yan', Cls: 'SUP', Positions: 'Baccarat', ShiftDate: '2026-04-21', ShiftValue: 'D', Rotation: 'D-D-D-D-RDO-D-D', RDO_Display: 'Fri', ai_result_raw: '', IsChanged: 1, OldShiftValue: 'N', ChangeDetail: 'Cross-batch boundary: previous week ended with N (Sun). N→D requires 10hr rest. Shifted to D start.', IsEVES: 0, SpecialRequestAI: '', CoupleIDs: '', HasTraining: 0, review_status: 'needs_review' },
  { id: 61, batch_id: 'BATCH-2026-W17-001', EmployeeNumber: '016337', EmployeeName: 'Wong Ka Yan', Cls: 'SUP', Positions: 'Baccarat', ShiftDate: '2026-04-25', ShiftValue: 'RDO', Rotation: 'D-D-D-D-RDO-D-D', RDO_Display: 'Fri', ai_result_raw: '', IsChanged: 0, OldShiftValue: 'RDO', ChangeDetail: '', IsEVES: 0, SpecialRequestAI: '', CoupleIDs: '', HasTraining: 0, review_status: 'approved' },
];

// ============================================================
// RDO REQUEST ROW (req_rdo_leave_table)
// ============================================================
export interface RDORequestRow {
  id: number;
  Payroll: string;
  EmployeeName: string;
  LeaveType: string;
  Period: string;
  Notes: string;
  ai_result: string;
  ai_result_raw: string;
  RDO_Display: string;
  applied_to_roster: boolean;
  review_status: 'confirmed' | 'review' | 'rejected';
}

export const RDO_REQUESTS: RDORequestRow[] = [
  { id: 1, Payroll: '015843', EmployeeName: 'Chan Wai Ming', LeaveType: 'RDO', Period: '2026-04-21 to 2026-04-27', Notes: 'RDO=27/4', ai_result: '["2026-04-27"]', ai_result_raw: '["2026-04-27"]', RDO_Display: 'Sun', applied_to_roster: true, review_status: 'confirmed' },
  { id: 2, Payroll: '017201', EmployeeName: 'Cheung Hoi Lam', LeaveType: 'RDO', Period: '2026-04-21 to 2026-04-27', Notes: '25/28 RDO', ai_result: '["2026-04-25","2026-04-28"]', ai_result_raw: '["2026-04-25","2026-04-28"]', RDO_Display: 'Fri', applied_to_roster: true, review_status: 'confirmed' },
  { id: 3, Payroll: '019012', EmployeeName: 'Leung Mei Ling', LeaveType: 'RDO', Period: '2026-04-21 to 2026-04-27', Notes: 'Wed off pls', ai_result: '["2026-04-23"]', ai_result_raw: '["2026-04-23"]', RDO_Display: 'Wed', applied_to_roster: true, review_status: 'confirmed' },
  { id: 4, Payroll: '018901', EmployeeName: 'Yip Ka Ho', LeaveType: 'RDO', Period: '2026-04-21 to 2026-04-27', Notes: 'RDO 22 or 23', ai_result: '["2026-04-22","2026-04-23"]', ai_result_raw: '["2026-04-22","2026-04-23"]', RDO_Display: 'Tue', applied_to_roster: true, review_status: 'review' },
  { id: 5, Payroll: '016501', EmployeeName: 'Lau Wai Kwan', LeaveType: 'RDO', Period: '2026-04-21 to 2026-04-27', Notes: '希望星期六休息', ai_result: '["2026-04-26"]', ai_result_raw: '["2026-04-26"]', RDO_Display: 'Sat', applied_to_roster: true, review_status: 'confirmed' },
  { id: 6, Payroll: '017550', EmployeeName: 'Ma Chi Kin', LeaveType: 'RDO', Period: '2026-04-21 to 2026-04-27', Notes: 'any day ok', ai_result: '[]', ai_result_raw: '[]', RDO_Display: '', applied_to_roster: false, review_status: 'review' },
];

// ============================================================
// SPECIAL REQUEST ROW (couple_special_request)
// ============================================================
export interface SpecialRequestRow {
  id: number;
  EmpNo: string;
  EmployeeName: string;
  Type: string;
  AssignedTo: string;
  ai_type: 'allow' | 'refuse' | 'rdo' | '';
  ai_value: string[];
  ai_rdo: string[];
  SpecialRequestAI: string;
  applied_to_roster: boolean;
  review_status: 'confirmed' | 'review' | 'rejected';
}

export const SPECIAL_REQUESTS: SpecialRequestRow[] = [
  { id: 1, EmpNo: '017201', EmployeeName: 'Cheung Hoi Lam', Type: 'Special Request', AssignedTo: 'No EV ES S', ai_type: 'refuse', ai_value: ['EV', 'ES', 'S'], ai_rdo: [], SpecialRequestAI: 'refuse: [EV, ES, S]', applied_to_roster: true, review_status: 'confirmed' },
  { id: 2, EmpNo: '018356', EmployeeName: 'Tam Wing Kei', Type: 'Special Request', AssignedTo: 'only LM, ED', ai_type: 'allow', ai_value: ['LM', 'ED'], ai_rdo: [], SpecialRequestAI: 'allow: [LM, ED]', applied_to_roster: true, review_status: 'confirmed' },
  { id: 3, EmpNo: '019234', EmployeeName: 'Choi Siu Man', Type: 'Special Request', AssignedTo: 'Fix RDO SUN', ai_type: 'rdo', ai_value: [], ai_rdo: ['SUN'], SpecialRequestAI: 'rdo: [SUN]', applied_to_roster: true, review_status: 'confirmed' },
  { id: 4, EmpNo: '016890', EmployeeName: 'Lo Wing Tat', Type: 'Special Request', AssignedTo: 'no night shift if possible', ai_type: 'refuse', ai_value: ['N'], ai_rdo: [], SpecialRequestAI: 'refuse: [N]', applied_to_roster: true, review_status: 'review' },
  { id: 5, EmpNo: '017890', EmployeeName: 'Ho Chi Wai', Type: 'Couple', AssignedTo: 'Couple with 019012', ai_type: '', ai_value: [], ai_rdo: [], SpecialRequestAI: '', applied_to_roster: false, review_status: 'review' },
];

// ============================================================
// EV/ES ROW (wm_wp_ev_es_employee)
// ============================================================
export interface EVESRow {
  id: number;
  EmployeeID: string;
  EmployeeName: string;
  Venue: string;
  IsEVES: number;
  pattern_example: string;
}

export const EVES_EMPLOYEES: EVESRow[] = [
  { id: 1, EmployeeID: '018590', EmployeeName: 'Fong Yat Long', Venue: 'WM', IsEVES: 1, pattern_example: 'EV-EV-EV-RDO-EV-EV-EV (2000-0400)' },
  { id: 2, EmployeeID: '018745', EmployeeName: 'Kwok Hoi Yan', Venue: 'WM', IsEVES: 1, pattern_example: 'ES-ES-ES-RDO-ES-ES-ES (1800-0200)' },
  { id: 3, EmployeeID: '019101', EmployeeName: 'Sit Wai Man', Venue: 'WP', IsEVES: 1, pattern_example: 'EV-EV-RDO-EV-EV-EV-EV (2000-0400)' },
];

// ============================================================
// RULE MODULE STATUS
// ============================================================
export type RuleModuleStatus = 'active' | 'completed' | 'built_not_enabled' | 'data_only' | 'pending' | 'future';
export type RuleType = 'hard' | 'priority' | 'soft' | 'fallback' | 'post_process' | 'export';

export interface RuleModule {
  id: string;
  name: string;
  status: RuleModuleStatus;
  ruleType: RuleType;
  inputTable: string;
  inputFields: string[];
  outputFields: string[];
  affectedRecords: number;
  changedRecords: number;
  customer_validation: 'validated' | 'pending' | 'not_applicable';
  overridePolicy: string;
  lastUpdated: string;
  owner: string;
  description: string;
  explanation: string;
}

export const RULE_MODULES: RuleModule[] = [
  {
    id: 'MOD-RDO',
    name: 'RDO Scheduler',
    status: 'active',
    ruleType: 'priority',
    inputTable: 'req_rdo_leave_table',
    inputFields: ['Payroll', 'LeaveType', 'Period', 'Notes', 'ai_result'],
    outputFields: ['RDO_Display', 'ShiftValue', 'IsChanged', 'ChangeDetail'],
    affectedRecords: 38,
    changedRecords: 24,
    customer_validation: 'pending',
    overridePolicy: 'Manager can override RDO placement with documented reason',
    lastUpdated: '2026-04-20',
    owner: 'Algorithm Team',
    description: 'Processes AI-extracted requested RDO dates and applies them to the roster.',
    explanation: 'RDO Scheduler uses AI-extracted requested RDO dates from req_rdo_leave_table.ai_result. It prioritizes AI-requested RDO over original RDO, keeps at most one literal RDO per natural week, vacates original RDO dates if needed, and refills vacated dates with valid shifts while checking rest constraints.',
  },
  {
    id: 'MOD-SR',
    name: 'Special Request Scheduler',
    status: 'active',
    ruleType: 'priority',
    inputTable: 'couple_special_request',
    inputFields: ['EmpNo', 'Type', 'AssignedTo', 'ai_type', 'ai_value', 'ai_rdo'],
    outputFields: ['SpecialRequestAI', 'ShiftValue', 'IsChanged', 'ChangeDetail'],
    affectedRecords: 24,
    changedRecords: 18,
    customer_validation: 'pending',
    overridePolicy: 'Manager can override SR constraints if demand requires it',
    lastUpdated: '2026-04-20',
    owner: 'Algorithm Team',
    description: 'Applies allow/refuse shift constraints from AI-parsed special requests.',
    explanation: 'Special Request Scheduler uses ai_type / ai_value / ai_rdo from couple_special_request. It handles allow/refuse shift constraints and applies them to the roster result where possible.',
  },
  {
    id: 'MOD-SRRDO',
    name: 'SR-RDO Scheduler',
    status: 'active',
    ruleType: 'priority',
    inputTable: 'couple_special_request',
    inputFields: ['EmpNo', 'ai_rdo'],
    outputFields: ['RDO_Display', 'ShiftValue', 'IsChanged', 'ChangeDetail'],
    affectedRecords: 8,
    changedRecords: 6,
    customer_validation: 'pending',
    overridePolicy: 'Same as RDO Scheduler',
    lastUpdated: '2026-04-20',
    owner: 'Algorithm Team',
    description: 'Handles RDO requests embedded within special request text.',
    explanation: 'SR-RDO Scheduler processes ai_rdo field from couple_special_request when special request text contains fixed RDO day preferences (e.g., "Fix RDO SUN"). It applies these as RDO constraints similar to the main RDO Scheduler.',
  },
  {
    id: 'MOD-EVES',
    name: 'EV/ES Scheduler',
    status: 'active',
    ruleType: 'hard',
    inputTable: 'wm_wp_ev_es_employee',
    inputFields: ['EmployeeID', 'Name', 'Venue'],
    outputFields: ['IsEVES', 'ShiftValue', 'IsChanged', 'ChangeDetail'],
    affectedRecords: 12,
    changedRecords: 12,
    customer_validation: 'validated',
    overridePolicy: 'EV/ES assignment is list-driven; changes require HR update',
    lastUpdated: '2026-04-20',
    owner: 'Algorithm Team',
    description: 'Generates EV/ES shift patterns for designated employees.',
    explanation: 'EV/ES Scheduler is list-driven. It uses wm_wp_ev_es_employee to mark employees as IsEVES=1 and generates EV/ES patterns (2000-0400 or 1800-0200) in the roster result.',
  },
  {
    id: 'MOD-XBATCH',
    name: 'Cross-batch Boundary Check',
    status: 'active',
    ruleType: 'post_process',
    inputTable: 'leave_shift_class_history_result',
    inputFields: ['EmployeeNumber', 'ShiftDate', 'ShiftValue'],
    outputFields: ['ShiftValue', 'IsChanged', 'ChangeDetail'],
    affectedRecords: 156,
    changedRecords: 8,
    customer_validation: 'pending',
    overridePolicy: 'Auto-corrected; manager notified',
    lastUpdated: '2026-04-20',
    owner: 'Algorithm Team',
    description: 'Validates shift transitions across weekly batch boundaries.',
    explanation: 'Cross-batch Boundary Check loads the last day of the previous week and validates 10-hour rest compliance at the batch boundary. If a Night→Day transition violates rest rules, the first day shift is adjusted.',
  },
  {
    id: 'MOD-WKRDO',
    name: 'Weekly RDO Fallback',
    status: 'active',
    ruleType: 'fallback',
    inputTable: 'AI_Shift_Scheduling_Result_Table',
    inputFields: ['EmployeeNumber', 'ShiftDate', 'ShiftValue', 'RDO_Display'],
    outputFields: ['ShiftValue', 'RDO_Display', 'IsChanged', 'ChangeDetail'],
    affectedRecords: 156,
    changedRecords: 3,
    customer_validation: 'pending',
    overridePolicy: 'Auto-corrected; critical safety net',
    lastUpdated: '2026-04-20',
    owner: 'Algorithm Team',
    description: 'Ensures every employee has at least one RDO per natural week.',
    explanation: 'Weekly RDO Fallback is a post-processing safety net. After all schedulers run, it scans for employees missing a weekly RDO and attempts to insert one in the least disruptive slot.',
  },
  {
    id: 'MOD-EXPORT',
    name: 'Excel Export',
    status: 'active',
    ruleType: 'export',
    inputTable: 'AI_Shift_Scheduling_Result_Table',
    inputFields: ['All result fields'],
    outputFields: ['AI_Shift_Scheduling_Result_Export'],
    affectedRecords: 156,
    changedRecords: 0,
    customer_validation: 'validated',
    overridePolicy: 'N/A',
    lastUpdated: '2026-04-20',
    owner: 'Algorithm Team',
    description: 'Generates the final roster Excel file matching client format.',
    explanation: 'Excel Export reads from AI_Shift_Scheduling_Result_Table and generates a formatted Excel workbook matching the client\'s expected roster layout for validation and distribution.',
  },
  {
    id: 'MOD-TRAIN',
    name: 'Training Scheduler',
    status: 'built_not_enabled',
    ruleType: 'soft',
    inputTable: 'wm_training_shift',
    inputFields: ['EmployeeNumber', 'TrainingDate', 'TrainingShift'],
    outputFields: ['HasTraining', 'ShiftValue', 'ChangeDetail'],
    affectedRecords: 0,
    changedRecords: 0,
    customer_validation: 'not_applicable',
    overridePolicy: 'Training takes priority when enabled',
    lastUpdated: '2026-04-15',
    owner: 'Algorithm Team',
    description: 'Assigns training shifts to designated employees.',
    explanation: 'Training Scheduler is built and tested but not enabled in the current production pipeline. When activated, it will assign training shifts from wm_training_shift and ensure no scheduling conflicts.',
  },
  {
    id: 'MOD-COUPLE',
    name: 'Couple Shift',
    status: 'data_only',
    ruleType: 'soft',
    inputTable: 'couple_shift_request',
    inputFields: ['EmpNo', 'CoupleEmpNo', 'RequestType'],
    outputFields: ['CoupleIDs'],
    affectedRecords: 12,
    changedRecords: 0,
    customer_validation: 'not_applicable',
    overridePolicy: 'N/A — not active as constraint',
    lastUpdated: '2026-04-10',
    owner: 'Algorithm Team',
    description: 'Couple shift data is loaded and tagged but not active as an algorithmic constraint.',
    explanation: 'Couple Shift data from couple_shift_request is loaded and CoupleIDs are tagged in the result table. However, the couple alignment algorithm is not currently active in the production scheduling pipeline.',
  },
  {
    id: 'MOD-DEMAND',
    name: 'Demand Balancing',
    status: 'pending',
    ruleType: 'hard',
    inputTable: 'wm_demand_spread',
    inputFields: ['Game', 'Shift', 'MinDealers', 'MinSupervisors', 'MinSpare'],
    outputFields: ['validation_result (future)'],
    affectedRecords: 0,
    changedRecords: 0,
    customer_validation: 'not_applicable',
    overridePolicy: 'Manager escalation required',
    lastUpdated: '2026-04-01',
    owner: 'Product Team',
    description: 'Validates roster against minimum staffing requirements per game and shift.',
    explanation: 'Demand Balancing will compare generated roster headcounts against wm_demand_spread requirements. Currently available as data but pending integration as an active constraint.',
  },
  {
    id: 'MOD-SKILLS',
    name: 'Skills Optimization',
    status: 'pending',
    ruleType: 'soft',
    inputTable: 'skill_report',
    inputFields: ['EmployeeNumber', 'GameSkills', 'LanguageSkills'],
    outputFields: ['validation_result (future)'],
    affectedRecords: 0,
    changedRecords: 0,
    customer_validation: 'not_applicable',
    overridePolicy: 'Soft constraint; can be overridden',
    lastUpdated: '2026-03-15',
    owner: 'Product Team',
    description: 'Optimizes shift assignments based on employee skill profiles.',
    explanation: 'Skills Optimization will use skill_report data to ensure employees are assigned to games matching their skill certifications. Currently available as data but pending integration.',
  },
  {
    id: 'MOD-FAIR',
    name: 'Fairness Scoring',
    status: 'future',
    ruleType: 'soft',
    inputTable: 'AI_Shift_Scheduling_Result_Table',
    inputFields: ['EmployeeNumber', 'ShiftValue', 'historical data'],
    outputFields: ['fairness_score (future)'],
    affectedRecords: 0,
    changedRecords: 0,
    customer_validation: 'not_applicable',
    overridePolicy: 'Advisory only',
    lastUpdated: '',
    owner: 'Product Team',
    description: 'Measures and balances shift distribution fairness across employees.',
    explanation: 'Fairness Scoring is a future enhancement that will track night shift distribution, PHNW allocation, and overtime balance to ensure equitable treatment across the team.',
  },
  {
    id: 'MOD-GLOBAL',
    name: 'Global Optimization',
    status: 'future',
    ruleType: 'soft',
    inputTable: 'Multiple',
    inputFields: ['All scheduling inputs'],
    outputFields: ['Optimized roster'],
    affectedRecords: 0,
    changedRecords: 0,
    customer_validation: 'not_applicable',
    overridePolicy: 'Full manager review required',
    lastUpdated: '',
    owner: 'Product Team',
    description: 'Full mathematical optimization engine for global roster optimization.',
    explanation: 'Global Optimization is a future enhancement that will replace the current single-employee heuristic approach with a global mathematical optimization engine considering all constraints simultaneously.',
  },
];

// ============================================================
// RULE CONFLICT PAIRS
// ============================================================
export interface RuleConflictPair {
  id: number;
  ruleA: string;
  ruleB: string;
  conflictType: string;
  winningRule: string;
  managerReview: boolean;
  overrideAllowed: boolean;
  implementationStatus: string;
}

export const RULE_CONFLICTS: RuleConflictPair[] = [
  { id: 1, ruleA: 'Req RDO', ruleB: 'Demand Staffing', conflictType: 'RDO placement may cause understaffing', winningRule: 'Req RDO (priority)', managerReview: true, overrideAllowed: true, implementationStatus: 'Active (RDO) vs Pending (Demand)' },
  { id: 2, ruleA: 'Special Request', ruleB: 'EV/ES Schedule', conflictType: 'SR refuse conflicts with EV/ES assignment', winningRule: 'EV/ES (hard rule)', managerReview: true, overrideAllowed: false, implementationStatus: 'Both active' },
  { id: 3, ruleA: 'Training', ruleB: 'Demand Staffing', conflictType: 'Training slot reduces available headcount', winningRule: 'Training (when enabled)', managerReview: true, overrideAllowed: true, implementationStatus: 'Training not enabled' },
  { id: 4, ruleA: 'Couple Shift', ruleB: 'Special Request', conflictType: 'Couple RDO alignment conflicts with SR shift', winningRule: 'Special Request', managerReview: true, overrideAllowed: true, implementationStatus: 'Couple not active' },
  { id: 5, ruleA: 'Couple Shift', ruleB: 'Training', conflictType: 'Couple alignment conflicts with training date', winningRule: 'Training (when enabled)', managerReview: true, overrideAllowed: true, implementationStatus: 'Neither active as constraint' },
  { id: 6, ruleA: '10hr Rest', ruleB: 'Shift Change', conflictType: 'Shift transition violates minimum rest period', winningRule: '10hr Rest (hard, Macau law)', managerReview: false, overrideAllowed: false, implementationStatus: 'Active (via cross-batch check)' },
  { id: 7, ruleA: 'Weekly RDO', ruleB: 'Leave Period', conflictType: 'AL/UL period may consume RDO slot', winningRule: 'Weekly RDO (fallback)', managerReview: false, overrideAllowed: false, implementationStatus: 'Active' },
  { id: 8, ruleA: 'Fairness', ruleB: 'Staffing Need', conflictType: 'Fair distribution may conflict with demand', winningRule: 'Staffing Need', managerReview: true, overrideAllowed: true, implementationStatus: 'Future' },
  { id: 9, ruleA: 'CPH Rule', ruleB: 'Night Shift', conflictType: 'Night shift before CPH violates rest requirement', winningRule: 'CPH Rule (hard)', managerReview: false, overrideAllowed: false, implementationStatus: 'Active (via standard validation)' },
  { id: 10, ruleA: 'SR-RDO', ruleB: 'Original Rotation', conflictType: 'Fixed RDO day overrides rotation pattern', winningRule: 'SR-RDO (priority)', managerReview: true, overrideAllowed: true, implementationStatus: 'Active' },
];

// ============================================================
// EMPLOYEE TRACE
// ============================================================
export interface EmployeeTrace {
  EmployeeNumber: string;
  name: string;
  Cls: string;
  Positions: string;
  Rotation: string;
  venue: string;
  IsEVES: number;
  CoupleIDs: string;
  HasTraining: number;
  rdoSource: { Notes: string; ai_result: string } | null;
  srSource: { AssignedTo: string; ai_type: string; ai_value: string[]; ai_rdo: string[] } | null;
  evesSource: boolean;
  routeDecision: string;
  appliedModules: string[];
  previousWeek: { day: string; shift: string }[];
  currentWeek: { day: string; shift: string; isChanged: boolean; oldShift: string; changeDetail: string }[];
}

export const EMPLOYEE_TRACES: EmployeeTrace[] = [
  {
    EmployeeNumber: '015843',
    name: 'Chan Wai Ming',
    Cls: 'DLR',
    Positions: 'Baccarat',
    Rotation: 'M-M-M-M-M-M-RDO',
    venue: 'WM',
    IsEVES: 0,
    CoupleIDs: '',
    HasTraining: 0,
    rdoSource: { Notes: 'RDO=27/4', ai_result: '["2026-04-27"]' },
    srSource: null,
    evesSource: false,
    routeDecision: 'AI RDO found → RDO Scheduler',
    appliedModules: ['RDO Scheduler', 'Cross-batch Boundary', 'Weekly RDO Fallback'],
    previousWeek: [
      { day: 'Mon', shift: 'M' }, { day: 'Tue', shift: 'M' }, { day: 'Wed', shift: 'M' },
      { day: 'Thu', shift: 'M' }, { day: 'Fri', shift: 'M' }, { day: 'Sat', shift: 'RDO' }, { day: 'Sun', shift: 'M' },
    ],
    currentWeek: [
      { day: 'Mon', shift: 'M', isChanged: false, oldShift: 'M', changeDetail: '' },
      { day: 'Tue', shift: 'M', isChanged: false, oldShift: 'M', changeDetail: '' },
      { day: 'Wed', shift: 'M', isChanged: false, oldShift: 'M', changeDetail: '' },
      { day: 'Thu', shift: 'M', isChanged: false, oldShift: 'M', changeDetail: '' },
      { day: 'Fri', shift: 'M', isChanged: false, oldShift: 'M', changeDetail: '' },
      { day: 'Sat', shift: 'M', isChanged: true, oldShift: 'RDO', changeDetail: 'Original RDO vacated; refilled with M shift' },
      { day: 'Sun', shift: 'RDO', isChanged: true, oldShift: 'M', changeDetail: 'AI Req RDO applied. Source: Notes="RDO=27/4"' },
    ],
  },
  {
    EmployeeNumber: '017201',
    name: 'Cheung Hoi Lam',
    Cls: 'DLR',
    Positions: 'Blackjack',
    Rotation: 'N-N-N-N-RDO-N-N',
    venue: 'WM',
    IsEVES: 0,
    CoupleIDs: '',
    HasTraining: 0,
    rdoSource: { Notes: '25/28 RDO', ai_result: '["2026-04-25","2026-04-28"]' },
    srSource: { AssignedTo: 'No EV ES S', ai_type: 'refuse', ai_value: ['EV', 'ES', 'S'], ai_rdo: [] },
    evesSource: false,
    routeDecision: 'AI RDO found → RDO Scheduler; SpecialRequestAI found → SR Scheduler',
    appliedModules: ['RDO Scheduler', 'SR Scheduler', 'SR-RDO Scheduler', 'Cross-batch Boundary', 'Weekly RDO Fallback'],
    previousWeek: [
      { day: 'Mon', shift: 'N' }, { day: 'Tue', shift: 'N' }, { day: 'Wed', shift: 'N' },
      { day: 'Thu', shift: 'RDO' }, { day: 'Fri', shift: 'D' }, { day: 'Sat', shift: 'D' }, { day: 'Sun', shift: 'D' },
    ],
    currentWeek: [
      { day: 'Mon', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: '' },
      { day: 'Tue', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: '' },
      { day: 'Wed', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: '' },
      { day: 'Thu', shift: 'D', isChanged: true, oldShift: 'S', changeDetail: 'SR rule: refuse [EV,ES,S]. Swing replaced with Day.' },
      { day: 'Fri', shift: 'RDO', isChanged: true, oldShift: 'N', changeDetail: 'AI Req RDO applied via SR-RDO. Source: ai_rdo=["FRI"]' },
      { day: 'Sat', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: '' },
      { day: 'Sun', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: '' },
    ],
  },
  {
    EmployeeNumber: '018590',
    name: 'Fong Yat Long',
    Cls: 'DLR',
    Positions: 'Roulette',
    Rotation: 'EV-EV-EV-RDO-EV-EV-EV',
    venue: 'WM',
    IsEVES: 1,
    CoupleIDs: '',
    HasTraining: 0,
    rdoSource: null,
    srSource: null,
    evesSource: true,
    routeDecision: 'IsEVES = 1 → EV/ES Scheduler',
    appliedModules: ['EV/ES Scheduler', 'Cross-batch Boundary', 'Weekly RDO Fallback'],
    previousWeek: [
      { day: 'Mon', shift: 'D' }, { day: 'Tue', shift: 'D' }, { day: 'Wed', shift: 'RDO' },
      { day: 'Thu', shift: 'D' }, { day: 'Fri', shift: 'D' }, { day: 'Sat', shift: 'D' }, { day: 'Sun', shift: 'D' },
    ],
    currentWeek: [
      { day: 'Mon', shift: 'EV', isChanged: true, oldShift: 'D', changeDetail: 'EV/ES schedule applied. IsEVES=1.' },
      { day: 'Tue', shift: 'EV', isChanged: true, oldShift: 'D', changeDetail: 'EV/ES schedule applied.' },
      { day: 'Wed', shift: 'EV', isChanged: true, oldShift: 'D', changeDetail: 'EV/ES schedule applied.' },
      { day: 'Thu', shift: 'RDO', isChanged: false, oldShift: 'RDO', changeDetail: '' },
      { day: 'Fri', shift: 'EV', isChanged: true, oldShift: 'D', changeDetail: 'EV/ES schedule applied.' },
      { day: 'Sat', shift: 'EV', isChanged: true, oldShift: 'D', changeDetail: 'EV/ES schedule applied.' },
      { day: 'Sun', shift: 'EV', isChanged: true, oldShift: 'D', changeDetail: 'EV/ES schedule applied.' },
    ],
  },
  {
    EmployeeNumber: '017890',
    name: 'Ho Chi Wai',
    Cls: 'DLR',
    Positions: 'Baccarat',
    Rotation: 'D-D-RDO-M-M-M-M',
    venue: 'WM',
    IsEVES: 0,
    CoupleIDs: '019012',
    HasTraining: 1,
    rdoSource: null,
    srSource: null,
    evesSource: false,
    routeDecision: 'No AI RDO, no SR → Standard Validation. CoupleIDs tagged (data only). HasTraining tagged (not enabled).',
    appliedModules: ['Standard Validation', 'Cross-batch Boundary', 'Weekly RDO Fallback'],
    previousWeek: [
      { day: 'Mon', shift: 'M' }, { day: 'Tue', shift: 'M' }, { day: 'Wed', shift: 'RDO' },
      { day: 'Thu', shift: 'M' }, { day: 'Fri', shift: 'M' }, { day: 'Sat', shift: 'M' }, { day: 'Sun', shift: 'M' },
    ],
    currentWeek: [
      { day: 'Mon', shift: 'D', isChanged: true, oldShift: 'M', changeDetail: 'Rotation pattern adjusted by standard validation.' },
      { day: 'Tue', shift: 'D', isChanged: true, oldShift: 'M', changeDetail: 'Rotation pattern adjusted.' },
      { day: 'Wed', shift: 'RDO', isChanged: false, oldShift: 'RDO', changeDetail: '' },
      { day: 'Thu', shift: 'M', isChanged: false, oldShift: 'M', changeDetail: '' },
      { day: 'Fri', shift: 'M', isChanged: false, oldShift: 'M', changeDetail: '' },
      { day: 'Sat', shift: 'M', isChanged: false, oldShift: 'M', changeDetail: '' },
      { day: 'Sun', shift: 'M', isChanged: false, oldShift: 'M', changeDetail: '' },
    ],
  },
  {
    EmployeeNumber: '018102',
    name: 'Ng Siu Fung',
    Cls: 'DLR',
    Positions: 'Baccarat',
    Rotation: 'N-N-N-N-N-N-N',
    venue: 'WM',
    IsEVES: 0,
    CoupleIDs: '',
    HasTraining: 0,
    rdoSource: null,
    srSource: null,
    evesSource: false,
    routeDecision: 'No AI RDO, no SR → Standard Validation. WARNING: 7 consecutive nights, no valid RDO slot found.',
    appliedModules: ['Standard Validation', 'Cross-batch Boundary', 'Weekly RDO Fallback (failed)'],
    previousWeek: [
      { day: 'Mon', shift: 'N' }, { day: 'Tue', shift: 'N' }, { day: 'Wed', shift: 'N' },
      { day: 'Thu', shift: 'N' }, { day: 'Fri', shift: 'N' }, { day: 'Sat', shift: 'N' }, { day: 'Sun', shift: 'RDO' },
    ],
    currentWeek: [
      { day: 'Mon', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: '' },
      { day: 'Tue', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: '' },
      { day: 'Wed', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: '' },
      { day: 'Thu', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: '' },
      { day: 'Fri', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: '' },
      { day: 'Sat', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: '' },
      { day: 'Sun', shift: 'N', isChanged: false, oldShift: 'N', changeDetail: 'WARNING: 7 consecutive nights. Weekly RDO fallback could not find valid slot.' },
    ],
  },
];

// ============================================================
// OVERRIDE AUDIT LOG
// ============================================================
export interface OverrideAuditLog {
  id: number;
  EmployeeNumber: string;
  EmployeeName: string;
  ShiftDate: string;
  originalShift: string;
  ruleGeneratedShift: string;
  managerOverrideShift: string;
  affectedRule: string;
  overrideReason: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export const OVERRIDE_LOGS: OverrideAuditLog[] = [
  { id: 1, EmployeeNumber: '018102', EmployeeName: 'Ng Siu Fung', ShiftDate: '2026-04-27', originalShift: 'N', ruleGeneratedShift: 'N', managerOverrideShift: 'RDO', affectedRule: 'Weekly RDO Fallback', overrideReason: '7 consecutive nights is at hard limit. Manager inserts RDO on Sunday.', approver: 'Ops Manager', status: 'pending', timestamp: '2026-04-20 14:30' },
  { id: 2, EmployeeNumber: '016337', EmployeeName: 'Wong Ka Yan', ShiftDate: '2026-04-21', originalShift: 'N', ruleGeneratedShift: 'D', managerOverrideShift: 'D', affectedRule: 'Cross-batch Boundary', overrideReason: 'Confirmed D shift start after cross-batch boundary correction.', approver: 'Ops Manager', status: 'approved', timestamp: '2026-04-20 15:00' },
  { id: 3, EmployeeNumber: '017201', EmployeeName: 'Cheung Hoi Lam', ShiftDate: '2026-04-24', originalShift: 'S', ruleGeneratedShift: 'D', managerOverrideShift: 'ED', affectedRule: 'SR Scheduler', overrideReason: 'Manager prefers Early Day over Day for this employee on Thursday.', approver: '', status: 'pending', timestamp: '2026-04-20 16:15' },
];

// ============================================================
// DATA LINEAGE ITEMS
// ============================================================
export interface DataLineageItem {
  id: string;
  type: 'rdo' | 'sr' | 'eves';
  title: string;
  sourceTable: string;
  sourceFields: string[];
  aiProcessing: string;
  resultTable: string;
  resultFields: string[];
  exampleInput: string;
  exampleOutput: string;
  meaning: string;
}

export const DATA_LINEAGE: DataLineageItem[] = [
  {
    id: 'LIN-RDO',
    type: 'rdo',
    title: 'RDO Lineage',
    sourceTable: 'req_rdo_leave_table',
    sourceFields: ['Payroll', 'LeaveType', 'Period', 'Notes', 'ai_result'],
    aiProcessing: 'AI extracts date patterns from Notes field (e.g., "RDO=29/4" → ["2026-04-29"])',
    resultTable: 'AI_Shift_Scheduling_Result_Table',
    resultFields: ['ai_result_raw', 'RDO_Display', 'ShiftValue'],
    exampleInput: 'Notes = "RDO=29/4"',
    exampleOutput: 'ai_result = ["2026-04-29"], RDO_Display = "Tue", ShiftValue = "RDO"',
    meaning: 'AI extracts requested RDO dates from free-text notes and the RDO Scheduler applies them to the roster result.',
  },
  {
    id: 'LIN-SR',
    type: 'sr',
    title: 'Special Request Lineage',
    sourceTable: 'couple_special_request',
    sourceFields: ['EmpNo', 'Type', 'AssignedTo', 'ai_type', 'ai_value', 'ai_rdo'],
    aiProcessing: 'AI parses free-text requests into structured allow/refuse/rdo constraints',
    resultTable: 'AI_Shift_Scheduling_Result_Table',
    resultFields: ['SpecialRequestAI', 'ShiftValue'],
    exampleInput: '"No EV ES S" → ai_type=refuse, ai_value=["EV","ES","S"]',
    exampleOutput: 'SpecialRequestAI = "refuse: [EV, ES, S]", ShiftValue avoids EV/ES/S',
    meaning: 'AI turns employee request text into structured allow/refuse shift constraints that the SR Scheduler enforces.',
  },
  {
    id: 'LIN-EVES',
    type: 'eves',
    title: 'EV/ES Lineage',
    sourceTable: 'wm_wp_ev_es_employee',
    sourceFields: ['EmployeeID', 'Name', 'Venue'],
    aiProcessing: 'No AI extraction — list-driven rule tagging',
    resultTable: 'AI_Shift_Scheduling_Result_Table',
    resultFields: ['IsEVES', 'ShiftValue'],
    exampleInput: 'EmployeeID = 018590, Venue = WM',
    exampleOutput: 'IsEVES = 1, ShiftValue = EV (2000-0400)',
    meaning: 'EV/ES is list-driven rule tagging, not AI extraction. Employees on the EV/ES list receive fixed evening/early swing patterns.',
  },
];

// ============================================================
// IMPLEMENTATION COVERAGE
// ============================================================
export interface ImplementationItem {
  category: 'completed' | 'built_not_enabled' | 'data_only' | 'pending' | 'future';
  label: string;
  items: string[];
}

export const IMPLEMENTATION_COVERAGE: ImplementationItem[] = [
  {
    category: 'completed',
    label: 'Completed / Active',
    items: [
      'RDO Scheduler',
      'Special Request Scheduler',
      'SR-RDO Scheduler',
      'EV/ES Scheduler',
      'Cross-batch Boundary Check',
      'Weekly RDO Fallback',
      'Excel Output Generation',
    ],
  },
  {
    category: 'built_not_enabled',
    label: 'Built but Not Enabled',
    items: ['Training Scheduler'],
  },
  {
    category: 'data_only',
    label: 'Data Loaded Only',
    items: ['Couple Shift'],
  },
  {
    category: 'pending',
    label: 'Pending Integration',
    items: [
      'Demand Comparison View',
      'Skills Optimization',
      'Demand Balancing',
      'Conflict / Warning Fields',
      'validation_result Field',
      'AI Confidence Field',
    ],
  },
  {
    category: 'future',
    label: 'Future',
    items: [
      'Fairness Scoring',
      'Global Optimization',
      'What-if Simulation',
      'Add Rule Draft Workflow',
    ],
  },
];

export const KNOWN_GAPS: string[] = [
  'ChangeDetail should later record exact rule module name for full traceability',
  'Demand comparison view is missing or pending integration',
  'Training module is built but not enabled in current production pipeline',
  'Couple algorithm is currently marked but not active as a scheduling constraint',
  'conflict / warning / validation_result fields are future recommended fields',
  'ai_confidence is a future recommended field for AI extraction quality scoring',
];

// ============================================================
// GENERATION PIPELINE STEPS (real algorithm flow)
// ============================================================
export interface PipelineStep {
  id: number;
  name: string;
  codeRef: string;
  status: 'active' | 'completed' | 'pending' | 'not_enabled';
  inputTable: string;
  outputField: string;
  sampleImpact: string;
  reviewNeeded: boolean;
  description: string;
  isConditional: boolean;
  condition?: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { id: 1, name: 'Batch Selection', codeRef: 'batch_task', status: 'completed', inputTable: 'batch_task', outputField: 'batch_id', sampleImpact: '1 batch selected', reviewNeeded: false, description: 'Select the target batch for processing.', isConditional: false },
  { id: 2, name: 'Load Source Data', codeRef: 'data_provider.get_all_source_data(batch_id)', status: 'completed', inputTable: 'Multiple (WPWM_People, req_rdo_leave_table, couple_special_request, wm_wp_ev_es_employee, etc.)', outputField: 'Employee scheduling context', sampleImpact: '156 employees loaded', reviewNeeded: false, description: 'Load all source data for the batch from database tables.', isConditional: false },
  { id: 3, name: 'Employee Route Decision', codeRef: 'loop each employee → route by conditions', status: 'completed', inputTable: 'Aggregated employee context', outputField: 'Route assignment', sampleImpact: '156 employees routed', reviewNeeded: false, description: 'Route each employee to the appropriate scheduler based on their data conditions.', isConditional: false },
  { id: 4, name: 'Training Check', codeRef: 'rotation ends with Refresh TRN → fill_ga_loa_schedule', status: 'not_enabled', inputTable: 'wm_training_shift', outputField: 'HasTraining, ShiftValue', sampleImpact: '0 (not enabled)', reviewNeeded: false, description: 'If rotation ends with Refresh TRN, fill training schedule. Currently built but not enabled.', isConditional: true, condition: 'rotation ends with Refresh TRN' },
  { id: 5, name: 'RDO Scheduler', codeRef: 'rdo_data.ai_result exists → process_rdo_schedule', status: 'completed', inputTable: 'req_rdo_leave_table', outputField: 'RDO_Display, ShiftValue, IsChanged, ChangeDetail', sampleImpact: '38 employees, 24 changed', reviewNeeded: true, description: 'Process AI-extracted RDO requests and apply to roster.', isConditional: true, condition: 'rdo_data.ai_result exists' },
  { id: 6, name: 'Standard Validation', codeRef: 'otherwise → process_schedule_validate_last_two_weeks', status: 'completed', inputTable: 'leave_shift_class_history_result', outputField: 'ShiftValue, IsChanged', sampleImpact: '118 employees (no AI RDO)', reviewNeeded: false, description: 'For employees without AI RDO, validate against last two weeks history.', isConditional: true, condition: 'no AI RDO data' },
  { id: 7, name: 'EV/ES Scheduler', codeRef: 'IsEVES = 1 → process_generate_ev_es_schedule', status: 'completed', inputTable: 'wm_wp_ev_es_employee', outputField: 'IsEVES, ShiftValue, IsChanged', sampleImpact: '12 employees, 12 changed', reviewNeeded: false, description: 'Generate EV/ES patterns for designated employees.', isConditional: true, condition: 'IsEVES = 1' },
  { id: 8, name: 'SR Scheduler', codeRef: 'SpecialRequestAI exists → process_sr_shift_schedule', status: 'completed', inputTable: 'couple_special_request', outputField: 'SpecialRequestAI, ShiftValue, IsChanged', sampleImpact: '24 employees, 18 changed', reviewNeeded: true, description: 'Apply allow/refuse shift constraints from special requests.', isConditional: true, condition: 'SpecialRequestAI exists' },
  { id: 9, name: 'SR-RDO Scheduler', codeRef: 'ai_rdo exists → sr_rdo_scheduler', status: 'completed', inputTable: 'couple_special_request', outputField: 'RDO_Display, ShiftValue, IsChanged', sampleImpact: '8 employees, 6 changed', reviewNeeded: true, description: 'Handle RDO requests embedded in special request text.', isConditional: true, condition: 'ai_rdo exists in SR' },
  { id: 10, name: 'Cross-batch Boundary', codeRef: 'post_process_cross_batch_boundary_check', status: 'completed', inputTable: 'leave_shift_class_history_result', outputField: 'ShiftValue, IsChanged, ChangeDetail', sampleImpact: '8 boundary corrections', reviewNeeded: true, description: 'Validate shift transitions at weekly batch boundaries for 10hr rest.', isConditional: false },
  { id: 11, name: 'Weekly RDO Fallback', codeRef: 'post_process_ensure_weekly_rdo', status: 'completed', inputTable: 'AI_Shift_Scheduling_Result_Table', outputField: 'ShiftValue, RDO_Display, IsChanged', sampleImpact: '3 RDO insertions', reviewNeeded: true, description: 'Safety net: ensure every employee has at least one RDO per week.', isConditional: false },
  { id: 12, name: 'Result Table Insert', codeRef: 'schedule_result_repo.bulk_insert', status: 'completed', inputTable: 'Computed results', outputField: 'AI_Shift_Scheduling_Result_Table', sampleImpact: '1092 rows inserted', reviewNeeded: false, description: 'Bulk insert all computed roster results into the result table.', isConditional: false },
  { id: 13, name: 'Excel Export', codeRef: 'schedule_excel.generate()', status: 'completed', inputTable: 'AI_Shift_Scheduling_Result_Table', outputField: 'AI_Shift_Scheduling_Result_Export', sampleImpact: '1 Excel file generated', reviewNeeded: false, description: 'Generate final roster Excel file matching client format.', isConditional: false },
];
