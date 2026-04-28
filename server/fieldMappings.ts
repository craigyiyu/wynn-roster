// Field mappings for Wynn Roster database

export const FIELD_MAPPINGS = {
  req_rdo_leave_table: {
    employee_id: "Payroll",
    ai_result: "ai_result",
    period: "Period",
    notes: "Notes",
    status: "Status",
  },
  couple_special_request: {
    employee_id: "EmpNo",
    assigned_to: "AssignedTo",
    ai_type: "ai_type",
    ai_value: "ai_value",
    start_date: "StartDate",
    until_date: "Until",
    type: "Type",
  },
  wm_wp_ev_es_employee: {
    employee_id: "EmployeeID",
    name: "Name",
    venue: "Venue",
  },
  AI_Shift_Scheduling_Result_Table: {
    employee_id: "EmployeeNumber",
    shift_date: "ShiftDate",
    shift_value: "ShiftValue",
    rdo_display: "RDO_Display",
    is_eves: "IsEVES",
    special_request_ai: "SpecialRequestAI",
    is_changed: "IsChanged",
    change_detail: "ChangeDetail",
  }
};

export function parsePeriodToDates(period: string): string[] {
  if (!period) return [];
  const dates: string[] = [];
  const parts = period.split(" - ");
  if (parts.length === 2) {
    const start = parseDate(parts[0].trim());
    const end = parseDate(parts[1].trim());
    if (start && end) {
      let current = new Date(start);
      while (current <= end) {
        dates.push(formatDate(current));
        current.setDate(current.getDate() + 1);
      }
    }
  }
  return dates;
}

function parseDate(s: string): Date | null {
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"));
  return null;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function parseAiResult(aiResult: string): string[] {
  if (!aiResult) return [];
  try {
    const p = JSON.parse(aiResult);
    if (Array.isArray(p)) return p.map((d: any) => formatDate(new Date(d)));
  } catch {}
  return [];
}
