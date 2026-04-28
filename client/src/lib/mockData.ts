// ============================================================
// MOCK DATA — Wynn HR Roster AI Scheduling System
// Context: Wynn Macau / Wynn Palace — Table Games Department
// ============================================================

export type ShiftType = 'M' | 'LM' | 'ED' | 'D' | 'EV' | 'ES' | 'S' | 'N' | 'RDO' | 'PHNW' | 'PHCL' | 'TRN' | 'OT';

export interface ShiftInfo {
  code: ShiftType;
  label: string;
  time: string;
  color: string;
  bgColor: string;
}

export const SHIFT_TYPES: Record<string, ShiftInfo> = {
  M:    { code: 'M',    label: 'Morning',       time: '0700–1500', color: '#2dd4bf', bgColor: 'rgba(45,212,191,0.15)' },
  LM:   { code: 'LM',   label: 'Late Morning',  time: '1000–1800', color: '#5eead4', bgColor: 'rgba(94,234,212,0.15)' },
  ED:   { code: 'ED',   label: 'Early Day',     time: '1200–2000', color: '#67e8f9', bgColor: 'rgba(103,232,249,0.15)' },
  D:    { code: 'D',    label: 'Day',           time: '1500–2300', color: '#818cf8', bgColor: 'rgba(129,140,248,0.15)' },
  EV:   { code: 'EV',   label: 'Evening',       time: '1800–0200', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.15)' },
  ES:   { code: 'ES',   label: 'Early Swing',   time: '2000–0400', color: '#c084fc', bgColor: 'rgba(192,132,252,0.15)' },
  S:    { code: 'S',    label: 'Swing',         time: '2100–0500', color: '#e879f9', bgColor: 'rgba(232,121,249,0.15)' },
  N:    { code: 'N',    label: 'Night',         time: '2300–0700', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.15)' },
  RDO:  { code: 'RDO',  label: 'Day Off',       time: '—',        color: '#64748b', bgColor: 'rgba(100,116,139,0.12)' },
  PHNW: { code: 'PHNW', label: 'PH Not Working', time: '—',       color: '#06b6d4', bgColor: 'rgba(6,182,212,0.12)' },
  PHCL: { code: 'PHCL', label: 'PH Casual Leave', time: '—',      color: '#0891b2', bgColor: 'rgba(8,145,178,0.12)' },
  TRN:  { code: 'TRN',  label: 'Training',      time: '1101–1901', color: '#fbbf24', bgColor: 'rgba(251,191,36,0.15)' },
  OT:   { code: 'OT',   label: 'Overtime',      time: '+2–4h',    color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)' },
};

export type SkillLevel = 'Primary' | 'Secondary' | 'Trainee';

export interface Employee {
  id: string;
  name: string;
  role: 'Supervisor' | 'Dealer';
  grade: number;
  skills: { game: string; level: SkillLevel }[];
  languages: string[];
  property: 'WM' | 'WP';
  coupleId?: string;
  specialRequest?: string;
  evesLongTerm?: boolean;
  weeklyHours: number;
  phnwCount: number;
  consecutiveNights: number;
  fatigueScore: number; // 0-100
}

export const EMPLOYEES: Employee[] = [
  { id: '015843', name: 'Chan Wai Ming',     role: 'Dealer',     grade: 50, skills: [{ game: 'Baccarat', level: 'Primary' }, { game: 'Blackjack', level: 'Secondary' }], languages: ['Cantonese', 'Mandarin'], property: 'WM', specialRequest: 'No EV, ES, S shifts', weeklyHours: 38, phnwCount: 2, consecutiveNights: 0, fatigueScore: 25 },
  { id: '016120', name: 'Li Xiao Hua',       role: 'Dealer',     grade: 30, skills: [{ game: 'Baccarat', level: 'Primary' }, { game: 'Roulette', level: 'Trainee' }], languages: ['Mandarin', 'English'], property: 'WM', specialRequest: 'Only M, LM, ED shifts', weeklyHours: 40, phnwCount: 1, consecutiveNights: 0, fatigueScore: 35 },
  { id: '016337', name: 'Wong Ka Yan',       role: 'Dealer',     grade: 50, skills: [{ game: 'Baccarat', level: 'Primary' }, { game: 'Sic Bo', level: 'Secondary' }], languages: ['Cantonese', 'Mandarin'], property: 'WM', evesLongTerm: true, weeklyHours: 36, phnwCount: 3, consecutiveNights: 5, fatigueScore: 62 },
  { id: '017201', name: 'Cheung Hoi Lam',    role: 'Supervisor', grade: 90, skills: [{ game: 'Baccarat', level: 'Primary' }, { game: 'Blackjack', level: 'Primary' }, { game: 'Roulette', level: 'Primary' }], languages: ['Cantonese', 'Mandarin', 'English'], property: 'WM', weeklyHours: 42, phnwCount: 0, consecutiveNights: 3, fatigueScore: 55 },
  { id: '017455', name: 'Leung Mei Ling',    role: 'Dealer',     grade: 10, skills: [{ game: 'Blackjack', level: 'Primary' }], languages: ['Cantonese'], property: 'WM', coupleId: '017890', weeklyHours: 35, phnwCount: 4, consecutiveNights: 0, fatigueScore: 18 },
  { id: '017890', name: 'Ho Chi Wai',        role: 'Dealer',     grade: 10, skills: [{ game: 'Blackjack', level: 'Primary' }, { game: 'Baccarat', level: 'Trainee' }], languages: ['Cantonese', 'Mandarin'], property: 'WM', coupleId: '017455', weeklyHours: 37, phnwCount: 3, consecutiveNights: 0, fatigueScore: 22 },
  { id: '018102', name: 'Ng Siu Fung',       role: 'Supervisor', grade: 99, skills: [{ game: 'Baccarat', level: 'Primary' }, { game: 'Sic Bo', level: 'Primary' }], languages: ['Cantonese', 'Mandarin', 'English'], property: 'WP', weeklyHours: 44, phnwCount: 1, consecutiveNights: 6, fatigueScore: 78 },
  { id: '018356', name: 'Tam Wing Kei',      role: 'Dealer',     grade: 60, skills: [{ game: 'Roulette', level: 'Primary' }, { game: 'Baccarat', level: 'Secondary' }], languages: ['Cantonese', 'English'], property: 'WP', weeklyHours: 39, phnwCount: 2, consecutiveNights: 0, fatigueScore: 30 },
  { id: '018590', name: 'Fong Yat Long',     role: 'Dealer',     grade: 50, skills: [{ game: 'Baccarat', level: 'Primary' }, { game: 'Blackjack', level: 'Primary' }], languages: ['Cantonese', 'Mandarin'], property: 'WP', weeklyHours: 41, phnwCount: 0, consecutiveNights: 2, fatigueScore: 45 },
  { id: '018801', name: 'Lau Pui Shan',      role: 'Dealer',     grade: 30, skills: [{ game: 'Sic Bo', level: 'Primary' }], languages: ['Cantonese'], property: 'WP', weeklyHours: 36, phnwCount: 5, consecutiveNights: 0, fatigueScore: 20 },
  { id: '019012', name: 'Yip Ka Ho',         role: 'Supervisor', grade: 90, skills: [{ game: 'Baccarat', level: 'Primary' }, { game: 'Roulette', level: 'Primary' }, { game: 'Blackjack', level: 'Secondary' }], languages: ['Cantonese', 'Mandarin', 'English', 'Japanese'], property: 'WP', weeklyHours: 43, phnwCount: 1, consecutiveNights: 4, fatigueScore: 68 },
  { id: '019234', name: 'Kwok Man Wai',      role: 'Dealer',     grade: 50, skills: [{ game: 'Baccarat', level: 'Primary' }], languages: ['Cantonese', 'Mandarin'], property: 'WM', weeklyHours: 38, phnwCount: 2, consecutiveNights: 0, fatigueScore: 28 },
];

// Weekly schedule: Mon-Sun for each employee
export type WeekSchedule = ShiftType[];

export interface ScheduleRow {
  employeeId: string;
  week: WeekSchedule; // 7 days Mon-Sun
}

export const CURRENT_SCHEDULE: ScheduleRow[] = [
  { employeeId: '015843', week: ['M', 'M', 'M', 'M', 'M', 'RDO', 'M'] },
  { employeeId: '016120', week: ['LM', 'LM', 'RDO', 'M', 'M', 'M', 'M'] },
  { employeeId: '016337', week: ['EV', 'EV', 'EV', 'EV', 'EV', 'RDO', 'EV'] },
  { employeeId: '017201', week: ['N', 'N', 'N', 'RDO', 'D', 'D', 'D'] },
  { employeeId: '017455', week: ['M', 'M', 'RDO', 'M', 'M', 'M', 'M'] },
  { employeeId: '017890', week: ['M', 'M', 'RDO', 'M', 'M', 'M', 'M'] },
  { employeeId: '018102', week: ['N', 'N', 'N', 'N', 'N', 'N', 'RDO'] },
  { employeeId: '018356', week: ['D', 'D', 'D', 'RDO', 'D', 'D', 'D'] },
  { employeeId: '018590', week: ['N', 'N', 'RDO', 'D', 'D', 'D', 'D'] },
  { employeeId: '018801', week: ['RDO', 'M', 'M', 'M', 'M', 'M', 'M'] },
  { employeeId: '019012', week: ['N', 'N', 'N', 'N', 'RDO', 'D', 'D'] },
  { employeeId: '019234', week: ['M', 'M', 'M', 'M', 'RDO', 'M', 'M'] },
];

// Draft schedule (AI-generated, with some conflicts for demo)
export const DRAFT_SCHEDULE: ScheduleRow[] = [
  { employeeId: '015843', week: ['M', 'M', 'M', 'M', 'M', 'M', 'RDO'] },
  { employeeId: '016120', week: ['M', 'M', 'M', 'RDO', 'LM', 'LM', 'LM'] },
  { employeeId: '016337', week: ['EV', 'EV', 'EV', 'RDO', 'ES', 'ES', 'EV'] },
  { employeeId: '017201', week: ['N', 'N', 'N', 'N', 'RDO', 'N', 'N'] },  // Conflict: 6 consecutive nights approaching limit
  { employeeId: '017455', week: ['M', 'M', 'RDO', 'M', 'M', 'M', 'M'] },
  { employeeId: '017890', week: ['D', 'D', 'RDO', 'M', 'M', 'M', 'M'] },  // Couple mismatch with 017455
  { employeeId: '018102', week: ['N', 'N', 'N', 'N', 'N', 'N', 'N'] },     // Conflict: 7 consecutive nights (at limit) + high fatigue
  { employeeId: '018356', week: ['D', 'D', 'D', 'D', 'RDO', 'S', 'S'] },
  { employeeId: '018590', week: ['D', 'D', 'D', 'D', 'D', 'RDO', 'N'] },   // Conflict: D→N transition without 10hr rest
  { employeeId: '018801', week: ['M', 'M', 'M', 'M', 'M', 'M', 'RDO'] },
  { employeeId: '019012', week: ['N', 'N', 'N', 'RDO', 'D', 'D', 'D'] },
  { employeeId: '019234', week: ['M', 'M', 'M', 'M', 'M', 'RDO', 'M'] },
];

export type RuleSeverity = 'hard' | 'soft';
export type RuleCategory = 'Regulations' | 'Business' | 'Gaming Demand' | 'Training' | 'Overtime' | 'Fairness' | 'CPH' | 'Special Request' | 'Couple Shift';

export interface Rule {
  id: string;
  priority: number;
  category: RuleCategory;
  description: string;
  severity: RuleSeverity;
  enabled: boolean;
  sprint: string;
  referenceDoc: string;
  reason: string;
  overridable: boolean;
}

export const RULES: Rule[] = [
  // Hard Rules — Regulations
  { id: 'R01', priority: 1, category: 'Regulations', description: '10-hour break required when changing shifts', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Regulations rules', reason: 'Legal Compliance (Mandatory)', overridable: false },
  { id: 'R02', priority: 2, category: 'Regulations', description: '1 RDO per week (Mon–Sun cycle)', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Regulations rules', reason: 'Legal Compliance (Mandatory)', overridable: false },
  { id: 'R03', priority: 3, category: 'Regulations', description: 'RDO must be at least 24 hours', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Regulations rules', reason: 'Legal Compliance (Mandatory)', overridable: false },
  { id: 'R04', priority: 4, category: 'Regulations', description: '10 consecutive hours rest daily, total not less than 12 hours', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Regulations rules', reason: 'Legal Compliance (Mandatory)', overridable: false },
  // Hard Rules — Business
  { id: 'R05', priority: 8, category: 'Business', description: 'New shift after shift change requires at least 2 days on new pattern', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules', reason: 'Stabilize physiological adjustment, prevent frequent shift transfer injuries', overridable: false },
  { id: 'R06', priority: 9, category: 'Business', description: 'Night shift max 7 consecutive days', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules', reason: 'Fatigue management — 7-day cap is the hard limit', overridable: true },
  { id: 'R07', priority: 10, category: 'Business', description: 'RDO requests are prioritized above other scheduling', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules / RDO with UnifL', reason: 'Employee relations / policy commitments', overridable: false },
  { id: 'R08', priority: 11, category: 'Business', description: 'No Night Shift before CPH if employee has RDO/PHNW on CPH day', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules / CPH List', reason: 'Fatigue and rest risk', overridable: false },
  // Hard Rules — Gaming Demand
  { id: 'R09', priority: 5, category: 'Gaming Demand', description: 'Minimum supervisors & dealers per game per shift', severity: 'hard', enabled: true, sprint: 'Sprint 4', referenceDoc: 'Games demand / Skill report', reason: 'Operational bottom line: 1 less person = 1 less table revenue', overridable: false },
  { id: 'R10', priority: 6, category: 'Gaming Demand', description: 'Minimum backup (spare) headcount per game per shift', severity: 'hard', enabled: true, sprint: 'Sprint 4', referenceDoc: 'Games demand / Spare list', reason: 'Risk control — necessary manpower expenditure', overridable: false },
  { id: 'R11', priority: 7, category: 'Gaming Demand', description: 'Supervisor headcount can supplement Dealer headcount', severity: 'hard', enabled: true, sprint: 'Sprint 4', referenceDoc: 'Business rules / Skill report', reason: 'Operational resource scheduling logic', overridable: false },
  // Hard Rules — Training
  { id: 'R12', priority: 13, category: 'Training', description: 'Only designated colleagues assigned to Training Shift', severity: 'hard', enabled: true, sprint: 'Sprint 2', referenceDoc: 'Training list', reason: 'Skills & Compliance', overridable: false },
  { id: 'R13', priority: 14, category: 'Training', description: 'No shift catch-up before/after Training Shift', severity: 'hard', enabled: true, sprint: 'Sprint 2', referenceDoc: 'Training list', reason: 'Safety and learning quality', overridable: false },
  // Hard Rules — Overtime
  { id: 'R14', priority: 15, category: 'Overtime', description: 'Overtime during New Year, May Day, National Day periods', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: '', reason: 'Operational needs', overridable: false },
  { id: 'R15', priority: 16, category: 'Overtime', description: 'Overtime is 2–4 hours', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: '', reason: 'Cost and man-hour control', overridable: false },
  { id: 'R16', priority: 17, category: 'Overtime', description: 'OT volunteers prioritized; max 3 consecutive OT days', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: '', reason: 'Fatigue and fair control', overridable: false },
  { id: 'R17', priority: 18, category: 'Overtime', description: 'Non-volunteer OT limited to 1 day only when volunteers exhausted', severity: 'hard', enabled: true, sprint: 'Sprint 1', referenceDoc: '', reason: 'Operational bottom line', overridable: false },
  // Soft Rules
  { id: 'S01', priority: 19, category: 'Business', description: 'No Night Shift for 3 consecutive weeks (exceptions: special request, long-term night, holiday leave)', severity: 'soft', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules / EV/ES list', reason: 'Long-term night shift protection with flexibility', overridable: true },
  { id: 'S02', priority: 20, category: 'Business', description: 'After 2 consecutive weeks Night Shift, avoid scheduling Swing Shift', severity: 'soft', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules / EV/ES list', reason: 'Fatigue reduction optimization', overridable: true },
  { id: 'S03', priority: 21, category: 'Business', description: 'No skip-shifts (Night→Day, Day→Morning) unless before/after RDO', severity: 'soft', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules', reason: 'Covered by 10-hour rest regulation; redundant limit', overridable: true },
  { id: 'S04', priority: 22, category: 'Business', description: 'Use transitional shifts (LM, ED, EV, ES) to avoid catch-up situations', severity: 'soft', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules', reason: 'AI suggestion, not forced', overridable: true },
  { id: 'S05', priority: 23, category: 'Business', description: '5–8 working days between RDOs (morning/mid); max 7 for night shift', severity: 'soft', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules', reason: 'Life balance optimization, adjustable in extreme cases', overridable: true },
  { id: 'S06', priority: 24, category: 'Business', description: 'RDO can only be adjusted ±2 days', severity: 'soft', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules', reason: 'Scheduling stability', overridable: true },
  { id: 'S07', priority: 25, category: 'Business', description: 'Max 2 different shift times between RDOs, same pattern (except RDO request)', severity: 'soft', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules', reason: 'Reduces AI tracking complexity', overridable: true },
  { id: 'S08', priority: 26, category: 'Business', description: 'General shift order: Night → Day → Morning', severity: 'soft', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules', reason: 'Rule of thumb; preference not hard limit', overridable: true },
  { id: 'S09', priority: 29, category: 'Special Request', description: 'Working >8 consecutive days (morning/mid) or >7 (night) allowed for RDO request', severity: 'soft', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules / Special Request', reason: 'Clear exception to avoid system deadlock', overridable: true },
  { id: 'S10', priority: 30, category: 'Special Request', description: 'Prioritize scheduling Unify Leave with RDO', severity: 'soft', enabled: true, sprint: 'Sprint 1', referenceDoc: 'Business rules / RDO with UnifL', reason: 'Vacation experience optimization', overridable: true },
  { id: 'S11', priority: 31, category: 'Couple Shift', description: 'Couple: same RDO and same shift (Grade 10, 30, 50, 90)', severity: 'soft', enabled: true, sprint: 'Sprint 3', referenceDoc: 'Business rules / Couple', reason: 'Welfare rule; AI weighs against manpower needs', overridable: true },
  { id: 'S12', priority: 32, category: 'Couple Shift', description: 'Couple: same RDO but different shift (Grade 60, 99)', severity: 'soft', enabled: true, sprint: 'Sprint 3', referenceDoc: 'Business rules / Couple', reason: 'Reasonable preference; should not override operations', overridable: true },
  { id: 'S13', priority: 33, category: 'Couple Shift', description: 'If one partner has Special Request or Training, Couple Request is not scheduled', severity: 'soft', enabled: true, sprint: 'Sprint 3', referenceDoc: 'Business rules / Couple / Training list', reason: 'Business/training priority over welfare', overridable: true },
  { id: 'S14', priority: 34, category: 'Fairness', description: 'Employees with fewest PHNW get priority for PHNW arrangements', severity: 'soft', enabled: true, sprint: 'Sprint 4', referenceDoc: 'Fairness rules / PHNW count list', reason: 'Fairness — use statistical scoring', overridable: true },
  { id: 'S15', priority: 35, category: 'Fairness', description: 'If double day off reduced to 1, must rearrange for double day', severity: 'soft', enabled: true, sprint: 'Sprint 4', referenceDoc: 'Fairness rules', reason: 'Reasonable but not hard limit', overridable: true },
  { id: 'S16', priority: 36, category: 'Fairness', description: 'Do not schedule same employee for 8 consecutive working days every time', severity: 'soft', enabled: true, sprint: 'Sprint 4', referenceDoc: 'Fairness rules', reason: 'Fair workload distribution', overridable: true },
  { id: 'S17', priority: 37, category: 'Fairness', description: 'Do not always assign same employee EV/ES→Swing transition', severity: 'soft', enabled: true, sprint: 'Sprint 4', referenceDoc: 'Fairness rules / EV/ES list', reason: 'Emotional fairness; long-term distribution', overridable: true },
  { id: 'S18', priority: 38, category: 'Fairness', description: 'Do not always assign same employee Morning→Late Morning transition', severity: 'soft', enabled: true, sprint: 'Sprint 4', referenceDoc: 'Fairness rules', reason: 'Emotional fairness; long-term distribution', overridable: true },
  { id: 'S19', priority: 27, category: 'CPH', description: 'Excess manpower can be arranged as PHCL (AI provides candidate list for WF)', severity: 'soft', enabled: true, sprint: 'Sprint 4', referenceDoc: 'Business rules', reason: 'Operational flexibility and cost control', overridable: true },
  { id: 'S20', priority: 28, category: 'CPH', description: 'Excess manpower can be arranged as PHNW (AI provides candidate list for WF)', severity: 'soft', enabled: true, sprint: 'Sprint 4', referenceDoc: 'CPH List', reason: 'Operational flexibility and cost control', overridable: true },
];

export type ConflictSeverity = 'critical' | 'warning' | 'info';

export interface Conflict {
  id: string;
  employeeId: string;
  ruleId: string;
  severity: ConflictSeverity;
  day: number; // 0-6 Mon-Sun
  description: string;
  aiSuggestions: AISuggestion[];
  resolved: boolean;
}

export interface AISuggestion {
  id: string;
  label: string;
  confidence: number; // 0-100
  rationale: string[];
  tradeoffs: string[];
  newShift?: ShiftType;
  swapWith?: string;
}

export const CONFLICTS: Conflict[] = [
  {
    id: 'C001',
    employeeId: '018590',
    ruleId: 'R01',
    severity: 'critical',
    day: 6,
    description: 'Day→Night transition on Sunday violates 10-hour rest requirement. Day shift ends 2300, Night shift starts 2300 — zero rest gap.',
    aiSuggestions: [
      { id: 'S001a', label: 'Swap Sunday to Day shift', confidence: 95, rationale: ['Maintains 10-hour rest compliance', 'Employee already on Day pattern this week', 'No gaming demand impact'], tradeoffs: ['1 fewer Night dealer on Sunday'], newShift: 'D' },
      { id: 'S001b', label: 'Swap with Kwok Man Wai (019234)', confidence: 82, rationale: ['Kwok has Baccarat Primary skill', 'Currently on Morning, can transition to Night', 'Fatigue score is low (28)'], tradeoffs: ['Kwok loses preferred Morning pattern', 'Requires 2-day minimum on new shift'], swapWith: '019234' },
    ],
    resolved: false,
  },
  {
    id: 'C002',
    employeeId: '018102',
    ruleId: 'R06',
    severity: 'critical',
    day: 6,
    description: 'Ng Siu Fung scheduled for 7 consecutive Night shifts (at hard limit). Combined with previous week data: approaching 13+ consecutive nights across 2 weeks.',
    aiSuggestions: [
      { id: 'S002a', label: 'Insert RDO on Thursday, shift Friday to Day', confidence: 91, rationale: ['Breaks consecutive night streak at day 4', 'Satisfies 24-hour RDO requirement', 'Reduces fatigue score from 78 to ~50'], tradeoffs: ['Requires backfill for Thursday Night Supervisor slot', 'Yip Ka Ho (019012) can cover — has Baccarat + Sic Bo skills'], newShift: 'RDO' },
      { id: 'S002b', label: 'Move RDO from next week to Wednesday this week', confidence: 76, rationale: ['Maintains weekly RDO requirement', 'Splits night block into 3+3'], tradeoffs: ['Next week will need RDO rescheduling', 'May cascade into couple shift conflicts'] },
    ],
    resolved: false,
  },
  {
    id: 'C003',
    employeeId: '017890',
    ruleId: 'S11',
    severity: 'warning',
    day: 0,
    description: 'Couple shift mismatch: Ho Chi Wai (017890) on Day shift while partner Leung Mei Ling (017455) on Morning shift. Both have same RDO (Wednesday) but different shifts.',
    aiSuggestions: [
      { id: 'S003a', label: 'Move Ho Chi Wai to Morning shift Mon–Tue', confidence: 88, rationale: ['Aligns couple to same shift pattern', 'Both have Blackjack skill', 'Grade 10 couple — same RDO + same shift policy'], tradeoffs: ['Day shift loses 1 dealer Mon–Tue', 'Tam Wing Kei can cover Day shift gap'], newShift: 'M' },
    ],
    resolved: false,
  },
  {
    id: 'C004',
    employeeId: '017201',
    ruleId: 'S01',
    severity: 'warning',
    day: 3,
    description: 'Cheung Hoi Lam approaching 3rd consecutive week of Night shifts. Current week has N-N-N-N pattern before RDO. Soft rule recommends breaking the night streak.',
    aiSuggestions: [
      { id: 'S004a', label: 'Schedule Evening shift after RDO instead of Night', confidence: 85, rationale: ['EV (1800-0200) provides gradual transition from Night', 'Satisfies 2-day minimum on new shift', 'Reduces consecutive night week count'], tradeoffs: ['EV shift has slightly different coverage profile', 'May need to adjust Friday gaming demand allocation'], newShift: 'EV' },
    ],
    resolved: false,
  },
  {
    id: 'C005',
    employeeId: '019012',
    ruleId: 'S03',
    severity: 'info',
    day: 4,
    description: 'Yip Ka Ho transitions Night→Day after RDO on Thursday. This is permitted (skip-shift allowed around RDO) but flagged for awareness.',
    aiSuggestions: [
      { id: 'S005a', label: 'No action needed — compliant', confidence: 98, rationale: ['Skip-shift rule S03 explicitly allows transitions around RDO', '10-hour rest is satisfied (RDO provides 24+ hours)', 'Employee fatigue score acceptable at 68'], tradeoffs: [] },
    ],
    resolved: true,
  },
];

export interface Alert {
  id: string;
  type: 'absence' | 'overtime' | 'demand' | 'approval' | 'training';
  severity: ConflictSeverity;
  title: string;
  description: string;
  timestamp: string;
  actionRequired: boolean;
}

export const ALERTS: Alert[] = [
  { id: 'A001', type: 'absence', severity: 'critical', title: 'No-Show: Lead Dealer — VIP Baccarat Room', description: 'Wong Ka Yan (016337) did not report for EV shift (1800-0200). VIP room requires immediate coverage with Baccarat Primary + Mandarin.', timestamp: '2026-04-23 18:15', actionRequired: true },
  { id: 'A002', type: 'demand', severity: 'critical', title: 'VIP Event: +5 Baccarat Dealers Required', description: 'High-roller event confirmed for Saturday. Table Games requests 5 additional Baccarat dealers for Evening shift. Current allocation is at minimum.', timestamp: '2026-04-23 14:30', actionRequired: true },
  { id: 'A003', type: 'overtime', severity: 'warning', title: 'Overtime Period: May Day (May 1–3)', description: 'Mandatory overtime scheduling window approaching. 18 employees have registered for voluntary OT. Estimated demand: 24 additional shifts.', timestamp: '2026-04-23 10:00', actionRequired: true },
  { id: 'A004', type: 'approval', severity: 'warning', title: 'Pending Approval: Week 18 Schedule', description: 'Draft schedule for Week 18 (Apr 27 – May 3) ready for Department Approver review. 3 unresolved soft-rule warnings remain.', timestamp: '2026-04-23 09:00', actionRequired: true },
  { id: 'A005', type: 'training', severity: 'info', title: 'Training Schedule: Roulette Certification', description: '4 dealers nominated for Roulette training next week (TRN shift 1101-1901). Roster adjustments auto-applied by AI.', timestamp: '2026-04-22 16:00', actionRequired: false },
];

// Dashboard metrics
export interface DashboardMetrics {
  scheduleHealth: number;
  complianceRate: number;
  headcountVsDemand: { current: number; required: number };
  overtimeRisk: number;
  preferenceSatisfaction: number;
  unresolvedConflicts: number;
  pendingApprovals: number;
  activeEmployees: number;
  costVariance: number; // percentage vs budget
}

export const DASHBOARD_METRICS: DashboardMetrics = {
  scheduleHealth: 87,
  complianceRate: 94.2,
  headcountVsDemand: { current: 148, required: 152 },
  overtimeRisk: 23,
  preferenceSatisfaction: 78,
  unresolvedConflicts: 4,
  pendingApprovals: 1,
  activeEmployees: 156,
  costVariance: -2.3,
};

// Gaming demand data
export interface GameDemand {
  game: string;
  shift: ShiftType;
  minDealers: number;
  minSupervisors: number;
  minSpare: number;
  currentDealers: number;
  currentSupervisors: number;
  currentSpare: number;
}

export const GAME_DEMANDS: GameDemand[] = [
  { game: 'Baccarat', shift: 'M', minDealers: 12, minSupervisors: 3, minSpare: 2, currentDealers: 14, currentSupervisors: 3, currentSpare: 2 },
  { game: 'Baccarat', shift: 'D', minDealers: 15, minSupervisors: 4, minSpare: 3, currentDealers: 15, currentSupervisors: 4, currentSpare: 2 },
  { game: 'Baccarat', shift: 'N', minDealers: 10, minSupervisors: 2, minSpare: 2, currentDealers: 9, currentSupervisors: 2, currentSpare: 1 },
  { game: 'Blackjack', shift: 'M', minDealers: 6, minSupervisors: 1, minSpare: 1, currentDealers: 6, currentSupervisors: 1, currentSpare: 1 },
  { game: 'Blackjack', shift: 'D', minDealers: 8, minSupervisors: 2, minSpare: 1, currentDealers: 8, currentSupervisors: 2, currentSpare: 1 },
  { game: 'Blackjack', shift: 'N', minDealers: 5, minSupervisors: 1, minSpare: 1, currentDealers: 5, currentSupervisors: 1, currentSpare: 1 },
  { game: 'Roulette', shift: 'M', minDealers: 4, minSupervisors: 1, minSpare: 1, currentDealers: 4, currentSupervisors: 1, currentSpare: 1 },
  { game: 'Roulette', shift: 'D', minDealers: 5, minSupervisors: 1, minSpare: 1, currentDealers: 5, currentSupervisors: 1, currentSpare: 0 },
  { game: 'Sic Bo', shift: 'M', minDealers: 3, minSupervisors: 1, minSpare: 1, currentDealers: 3, currentSupervisors: 1, currentSpare: 1 },
  { game: 'Sic Bo', shift: 'D', minDealers: 4, minSupervisors: 1, minSpare: 1, currentDealers: 4, currentSupervisors: 1, currentSpare: 1 },
  { game: 'Sic Bo', shift: 'N', minDealers: 2, minSupervisors: 1, minSpare: 0, currentDealers: 2, currentSupervisors: 1, currentSpare: 0 },
];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const WEEK_LABEL = 'Week 17 — Apr 21–27, 2026';
