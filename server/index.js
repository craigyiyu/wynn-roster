const express = require("express");
const http = require("http");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const XLSX = require("xlsx");
const sql = require("mssql");

// ============ DB CONFIG ============
const dbConfig = {
  user: "SA",
  password: "AT65gcfdjp",
  database: "wynnai",
  server: "8.130.98.152",
  port: 2433,
  options: { encrypt: false, trustServerCertificate: true },
};

const FIELD_MAPPINGS = {
  req_rdo_leave_table: {
    employee_id: "Payroll",
    ai_result: "ai_result",
    period: "Period",
    status: "Status",
  },
  couple_special_request: {
    employee_id: "EmpNo",
    ai_type: "ai_type",
    ai_value: "ai_value",
    until_date: "Until",
  },
  wm_wp_ev_es_employee: {
    employee_id: "EmployeeID",
    name: "Name",
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
  },
};

// ============ HELPERS ============
function parseAiResult(aiResult) {
  if (!aiResult) return [];
  try {
    const p = JSON.parse(aiResult);
    if (Array.isArray(p)) {
      return p.map((d) => {
        if (typeof d === "string" && d.includes("T")) return d.split("T")[0];
        if (typeof d === "string") return d;
        return new Date(d).toISOString().split("T")[0];
      });
    }
  } catch (_) {}
  return [];
}

function parsePeriodToDates(period) {
  if (!period) return [];
  const dates = [];
  const parts = period.split(" - ");
  if (parts.length === 2) {
    const parse = (s) => {
      const m = s.trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m) return new Date(m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"));
      return null;
    };
    const start = parse(parts[0]);
    const end = parse(parts[1]);
    if (start && end) {
      let cur = new Date(start);
      while (cur <= end) {
        dates.push(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }
  }
  return dates;
}

let pool = null;
async function getPool() {
  if (!pool) pool = await sql.connect(dbConfig);
  return pool;
}

// ============ RULE ENGINE (Chain of Responsibility) ============
/**
 * Priority 1 - RDO:     Blocks dates listed in ai_result or Period
 * Priority 2 - SR:      allow=only these shifts | refuse=block these shifts
 * Priority 3 - EVES:    All employees in wm_wp_ev_es_employee table work nights only (14:00+)
 * Conflict resolution: higher priority wins (RDO > SR > EVES)
 */
class RuleEngine {
  constructor() {
    this.ctx = {
      rdoBlocks: new Map(),
      specialRequests: new Map(),
      evesEmployees: new Set(),
    };
  }

  async loadRDO(pool) {
    try {
      const m = FIELD_MAPPINGS.req_rdo_leave_table;
      const result = await pool.request().query(
        "SELECT " + m.employee_id + ", " + m.ai_result + ", " + m.period + " "
        + "FROM req_rdo_leave_table WHERE " + m.status + " = 'Approved'"
      );
      for (const row of result.recordset) {
        const empId = String(row[m.employee_id] || "").trim();
        if (!empId) continue;
        const dates = new Set([
          ...parseAiResult(row[m.ai_result] || ""),
          ...parsePeriodToDates(row[m.period] || ""),
        ]);
        if (dates.size > 0) this.ctx.rdoBlocks.set(empId, dates);
      }
      console.log("[RDO] Loaded " + this.ctx.rdoBlocks.size + " employees with RDO blocks");
    } catch (err) {
      console.error("[RDO] Load error:", err.message);
    }
  }

  async loadSR(pool) {
    try {
      const m = FIELD_MAPPINGS.couple_special_request;
      const result = await pool.request().query(
        "SELECT " + m.employee_id + ", " + m.ai_type + ", " + m.ai_value + ", " + m.until_date + " "
        + "FROM couple_special_request "
        + "WHERE (" + m.until_date + " IS NULL OR " + m.until_date + " >= GETDATE())"
      );
      for (const row of result.recordset) {
        const empId = String(row[m.employee_id] || "").trim();
        if (!empId) continue;
        const aiType = String(row[m.ai_type] || "").toLowerCase();
        let values = [];
        try { values = JSON.parse(row[m.ai_value] || "[]"); } catch (_) {}
        const allow = aiType === "allow";
        if (!this.ctx.specialRequests.has(empId)) {
          this.ctx.specialRequests.set(empId, []);
        }
        this.ctx.specialRequests.get(empId).push({ type: aiType, values, allow });
      }
      console.log("[SR] Loaded " + this.ctx.specialRequests.size + " employees with special requests");
    } catch (err) {
      console.error("[SR] Load error:", err.message);
    }
  }

  async loadEVES(pool) {
    try {
      const m = FIELD_MAPPINGS.wm_wp_ev_es_employee;
      const result = await pool.request().query(
        "SELECT " + m.employee_id + " FROM wm_wp_ev_es_employee"
      );
      for (const row of result.recordset) {
        const empId = String(row[m.employee_id] || "").trim();
        if (empId) this.ctx.evesEmployees.add(empId);
      }
      console.log("[EVES] Loaded " + this.ctx.evesEmployees.size + " EVES employees");
    } catch (err) {
      console.error("[EVES] Load error:", err.message);
    }
  }

  async loadAll(pool) {
    await Promise.all([this.loadRDO(pool), this.loadSR(pool), this.loadEVES(pool)]);
  }

  checkRDO(empId, date) {
    const dates = this.ctx.rdoBlocks.get(empId);
    if (dates && dates.has(date)) {
      return { valid: false, reason: "RDO_BLOCKED", priority: 1, detail: "RDO blocks " + date };
    }
    return { valid: true };
  }

  checkSR(empId, shiftValue) {
    const reqs = this.ctx.specialRequests.get(empId);
    if (!reqs) return { valid: true };
    for (const req of reqs) {
      const matchesShift = req.values.some((v) => shiftValue && shiftValue.includes(v));
      if (req.allow && !matchesShift) {
        return { valid: false, reason: "SR_REFUSE", priority: 2, detail: "only allows " + req.values.join(",") };
      }
      if (!req.allow && matchesShift) {
        return { valid: false, reason: "SR_ALLOW", priority: 2, detail: "refuses " + req.values.join(",") };
      }
    }
    return { valid: true };
  }

  checkEVES(empId, shiftValue) {
    if (!this.ctx.evesEmployees.has(empId)) return { valid: true };
    if (!shiftValue) return { valid: true };
    const hour = parseInt(shiftValue.split(":")[0] || "0", 10);
    if (hour < 14) {
      return { valid: false, reason: "EVES_VIOLATION", priority: 3, detail: "EVES employees cannot start before 14:00" };
    }
    return { valid: true };
  }

  validate(empId, date, shiftValue) {
    const rdo = this.checkRDO(empId, date);
    if (!rdo.valid) return rdo;
    const sr = this.checkSR(empId, shiftValue);
    if (!sr.valid) return sr;
    const eves = this.checkEVES(empId, shiftValue);
    if (!eves.valid) return eves;
    return { valid: true };
  }
}

const ruleEngine = new RuleEngine();

// ============ EXPRESS SERVER ============
const upload = multer({
  dest: "/tmp/wynn-uploads/",
  limits: { fileSize: 50 * 1024 * 1024 },
});

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const staticPath = path.resolve(__dirname, "../dist/public");
  app.use(express.static(staticPath));

  // Health
  app.get("/api/health", async (_req, res) => {
    try {
      const p = await getPool();
      await p.request().query("SELECT 1");
      res.json({ status: "ok", ts: new Date().toISOString(), db: "connected" });
    } catch (err) {
      res.json({ status: "degraded", ts: new Date().toISOString(), db: "disconnected", error: err.message });
    }
  });

  // POST /api/schedule/upload
  app.post("/api/schedule/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const pool = await getPool();
      await ruleEngine.loadAll(pool);
      const wb = XLSX.readFile(req.file.path);
      const sheets = wb.SheetNames.map((sn) => ({
        sheet: sn,
        rows: XLSX.utils.sheet_to_json(wb.Sheets[sn]).length,
      }));
      res.json({ success: true, sheets });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/schedule/constraints
  app.get("/api/schedule/constraints", async (_req, res) => {
    try {
      const pool = await getPool();
      const m = FIELD_MAPPINGS;
      const rdoResult = await pool.request().query(
        "SELECT COUNT(DISTINCT " + m.req_rdo_leave_table.employee_id + ") as n FROM req_rdo_leave_table WHERE " + m.req_rdo_leave_table.status + " = 'Approved'"
      );
      const srResult = await pool.request().query(
        "SELECT COUNT(*) as n FROM couple_special_request WHERE (" + m.couple_special_request.until_date + " IS NULL OR " + m.couple_special_request.until_date + " >= GETDATE())"
      );
      const evesResult = await pool.request().query(
        "SELECT COUNT(*) as n FROM wm_wp_ev_es_employee"
      );
      res.json({
        rdo: { priority: 1, rule: "RDO blocks approved leave dates", activeCount: rdoResult.recordset[0] && rdoResult.recordset[0].n || 0 },
        specialRequest: { priority: 2, rule: "allow/refuse specific shifts", activeCount: srResult.recordset[0] && srResult.recordset[0].n || 0 },
        eves: { priority: 3, rule: "EVES employees start at 14:00 or later", activeCount: evesResult.recordset[0] && evesResult.recordset[0].n || 0 },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/schedule/generate
  app.post("/api/schedule/generate", async (_req, res) => {
    try {
      const pool = await getPool();
      await ruleEngine.loadAll(pool);
      res.json({ success: true, message: "Rule engine loaded. Schedule generation triggered." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/schedule/results
  app.get("/api/schedule/results", async (req, res) => {
    try {
      const pool = await getPool();
      const m = FIELD_MAPPINGS.AI_Shift_Scheduling_Result_Table;
      const page = parseInt(String(req.query.page || "1"), 10);
      const limit = parseInt(String(req.query.limit || "100"), 10);
      const offset = (page - 1) * limit;
      const result = await pool.request().query(
        "SELECT TOP " + limit + " * FROM AI_Shift_Scheduling_Result_Table "
        + "WHERE Id NOT IN (SELECT TOP " + offset + " Id FROM AI_Shift_Scheduling_Result_Table ORDER BY Id) "
        + "ORDER BY Id"
      );
      const countResult = await pool.request().query("SELECT COUNT(*) as total FROM AI_Shift_Scheduling_Result_Table");
      res.json({
        data: result.recordset,
        pagination: { page, limit, total: (countResult.recordset[0] && countResult.recordset[0].total) || 0 },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/schedule/override
  app.put("/api/schedule/override", async (req, res) => {
    try {
      const { assignmentId, employeeId, shiftDate, shiftStart, shiftEnd, shiftValue } = req.body;
      if (!assignmentId && !(employeeId && shiftDate)) {
        return res.status(400).json({ error: "Missing assignmentId or (employeeId + shiftDate)" });
      }
      const pool = await getPool();
      const finalShift = shiftValue || (shiftStart && shiftEnd ? shiftStart + "-" + shiftEnd : null);
      if (!finalShift) return res.status(400).json({ error: "No shift value provided" });
      const m = FIELD_MAPPINGS.AI_Shift_Scheduling_Result_Table;
      if (assignmentId) {
        await pool.request()
          .input("id", sql.Int, assignmentId)
          .input("shiftValue", sql.VarChar, finalShift)
          .query(
            "UPDATE AI_Shift_Scheduling_Result_Table "
            + "SET " + m.shift_value + " = @shiftValue, " + m.is_changed + " = 1 "
            + "WHERE Id = @id"
          );
      } else {
        await pool.request()
          .input("empId", sql.VarChar, employeeId)
          .input("shiftDate", sql.Date, shiftDate)
          .input("shiftValue", sql.VarChar, finalShift)
          .query(
            "UPDATE AI_Shift_Scheduling_Result_Table "
            + "SET " + m.shift_value + " = @shiftValue, " + m.is_changed + " = 1 "
            + "WHERE " + m.employee_id + " = @empId AND " + m.shift_date + " = @shiftDate"
          );
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/schedule/validate (bonus)
  app.get("/api/schedule/validate", async (req, res) => {
    try {
      const { employeeId, date, shiftValue } = req.query;
      if (!employeeId || !date) return res.status(400).json({ error: "employeeId and date are required" });
      await ruleEngine.loadAll(await getPool());
      const result = ruleEngine.validate(String(employeeId), String(date), String(shiftValue || ""));
      res.json({ employeeId, date, shiftValue, ...result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = parseInt(process.env.PORT || "3001", 10);
  http.createServer(app).listen(port, "0.0.0.0", () => {
    console.log("\n Wynn Roster API running on http://0.0.0.0:" + port);
    console.log(" Endpoints: /api/health, /api/schedule/upload, /api/schedule/constraints, /api/schedule/generate, /api/schedule/results, /api/schedule/override, /api/schedule/validate\n");
  });
}

startServer().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
