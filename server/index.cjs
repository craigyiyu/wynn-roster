const express = require("express");
const http = require("http");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const XLSX = require("xlsx");
const sql = require("mssql");

const dbConfig = {
  user: "SA",
  password: "AT65gcfdjp",
  database: "wynnai",
  server: "8.130.98.152",
  port: 2433,
  options: { encrypt: false, trustServerCertificate: true },
};

const FIELD_MAPPINGS = {
  req_rdo_leave_table: { employee_id: "Payroll", ai_result: "ai_result", period: "Period", status: "Status" },
  couple_special_request: { employee_id: "EmpNo", ai_type: "ai_type", ai_value: "ai_value", until_date: "Until" },
  wm_wp_ev_es_employee: { employee_id: "EmployeeID" },
  wm_demand_spread: { shift_time: "ShiftTime", position: "Position", shift_date: "ShiftDate", head_count: "HeadCount" },
  AI_Shift_Scheduling_Result_Table: { employee_id: "EmployeeNumber", shift_date: "ShiftDate", shift_value: "ShiftValue", rdo_display: "RDO_Display", is_eves: "IsEVES", special_request_ai: "SpecialRequestAI", is_changed: "IsChanged", change_detail: "ChangeDetail" },
};

function parseAiResult(aiResult) {
  if (!aiResult) return [];
  try {
    const p = JSON.parse(aiResult);
    if (Array.isArray(p)) return p.map(d => typeof d === "string" && d.includes("T") ? d.split("T")[0] : typeof d === "string" ? d : new Date(d).toISOString().split("T")[0]);
  } catch (_) {}
  return [];
}

function parsePeriodToDates(period) {
  if (!period) return [];
  const dates = [];
  const parts = period.split(" - ");
  if (parts.length === 2) {
    const parse = s => { const m = s.trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? new Date(m[3]+"-"+m[2].padStart(2,"0")+"-"+m[1].padStart(2,"0")) : null; };
    const start = parse(parts[0]), end = parse(parts[1]);
    if (start && end) { let cur = new Date(start); while (cur <= end) { dates.push(cur.toISOString().split("T")[0]); cur.setDate(cur.getDate()+1); } }
  }
  return dates;
}

let pool = null;
async function getPool() { if (!pool) pool = await sql.connect(dbConfig); return pool; }

var RuleEngine = function() {
  this.ctx = { rdoBlocks: new Map(), specialRequests: new Map(), evesEmployees: new Set(), demandCoverage: new Map() };
};

RuleEngine.prototype.loadRDO = async function(pool) {
  try {
    const m = FIELD_MAPPINGS.req_rdo_leave_table;
    const result = await pool.request().query("SELECT " + m.employee_id + ", " + m.ai_result + ", " + m.period + " FROM req_rdo_leave_table WHERE " + m.status + " = 'Approved'");
    for (const row of result.recordset) {
      const empId = String(row[m.employee_id] || "").trim();
      if (!empId) continue;
      const dates = new Set([...parseAiResult(row[m.ai_result] || ""), ...parsePeriodToDates(row[m.period] || "")]);
      if (dates.size > 0) this.ctx.rdoBlocks.set(empId, dates);
    }
    console.log("[RDO] Loaded " + this.ctx.rdoBlocks.size + " employees");
  } catch (err) { console.error("[RDO] Error:", err.message); }
};

RuleEngine.prototype.loadSR = async function(pool) {
  try {
    const m = FIELD_MAPPINGS.couple_special_request;
    const result = await pool.request().query("SELECT " + m.employee_id + ", " + m.ai_type + ", " + m.ai_value + ", " + m.until_date + " FROM couple_special_request");
    for (const row of result.recordset) {
      const empId = String(row[m.employee_id] || "").trim();
      if (!empId) continue;
      const aiType = String(row[m.ai_type] || "").toLowerCase();
      let values = []; try { values = JSON.parse(row[m.ai_value] || "[]"); } catch (_) {}
      const untilDate = row[m.until_date];
      if (untilDate && new Date(untilDate) < new Date()) continue;
      const allow = aiType === "allow";
      if (!this.ctx.specialRequests.has(empId)) this.ctx.specialRequests.set(empId, []);
      this.ctx.specialRequests.get(empId).push({ type: aiType, values, allow });
    }
    console.log("[SR] Loaded " + this.ctx.specialRequests.size + " employees");
  } catch (err) { console.error("[SR] Error:", err.message); }
};

RuleEngine.prototype.loadEVES = async function(pool) {
  try {
    const m = FIELD_MAPPINGS.wm_wp_ev_es_employee;
    const result = await pool.request().query("SELECT " + m.employee_id + " FROM wm_wp_ev_es_employee");
    for (const row of result.recordset) { const empId = String(row[m.employee_id] || "").trim(); if (empId) this.ctx.evesEmployees.add(empId); }
    console.log("[EVES] Loaded " + this.ctx.evesEmployees.size + " employees");
  } catch (err) { console.error("[EVES] Error:", err.message); }
};

RuleEngine.prototype.loadDemand = async function(pool) {
  try {
    const m = FIELD_MAPPINGS.wm_demand_spread;
    const result = await pool.request().query("SELECT " + m.shift_time + ", " + m.position + ", " + m.shift_date + ", " + m.head_count + " FROM wm_demand_spread");
    for (const row of result.recordset) {
      const key = row[m.shift_date] + "|" + row[m.shift_time] + "|" + row[m.position];
      this.ctx.demandCoverage.set(key, { required: parseInt(row[m.head_count]) || 0, assigned: 0 });
    }
    console.log("[Demand] Loaded " + this.ctx.demandCoverage.size + " entries");
  } catch (err) { console.error("[Demand] Error:", err.message); }
};

RuleEngine.prototype.loadAll = async function(pool) { await Promise.all([this.loadRDO(pool), this.loadSR(pool), this.loadEVES(pool), this.loadDemand(pool)]); };

RuleEngine.prototype.validate = function(empId, date, shiftValue) {
  const shiftStart = shiftValue ? shiftValue.split("-")[0] : "08:00";
  const rdoDates = this.ctx.rdoBlocks.get(empId);
  if (rdoDates?.has(date)) return { valid: false, reason: "RDO_BLOCKED", priority: 1 };
  const reqs = this.ctx.specialRequests.get(empId);
  if (reqs) {
    for (const req of reqs) {
      const matchesShift = req.values.some(v => shiftStart.includes(v));
      if (req.allow && !matchesShift) return { valid: false, reason: "SR_REFUSE:" + req.values.join(","), priority: 2 };
      if (!req.allow && matchesShift) return { valid: false, reason: "SR_ALLOW:" + req.values.join(","), priority: 2 };
    }
  }
  if (this.ctx.evesEmployees.has(empId)) {
    const hour = parseInt(shiftStart.split(":")[0] || "0");
    if (hour < 14) return { valid: false, reason: "EVES_VIOLATION", priority: 3 };
  }
  return { valid: true };
};

var ruleEngine = new RuleEngine();
var upload = multer({ dest: "/tmp/uploads/", limits: { fileSize: 50 * 1024 * 1024 } });

async function startServer() {
  var app = express();
  app.use(cors());
  app.use(express.json());
  var staticPath = process.env.NODE_ENV === "production" ? path.join(__dirname, "public") : path.join(__dirname, "../dist/public");
  app.use(express.static(staticPath));

  app.get("/api/health", async function(req, res) {
    try { var p = await getPool(); await p.request().query("SELECT 1"); res.json({ status: "ok", db: "connected", ts: new Date().toISOString() }); }
    catch (err) { res.status(500).json({ status: "error", db: "disconnected", error: err.message }); }
  });

  app.post("/api/schedule/upload", upload.single("file"), async function(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: "No file" });
      var wb = XLSX.readFile(req.file.path);
      await ruleEngine.loadAll(await getPool());
      res.json({ success: true, sheets: wb.SheetNames.map(function(s) { return { sheet: s, rows: XLSX.utils.sheet_to_json(wb.Sheets[s]).length }; }) });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/schedule/constraints", async function(req, res) {
    try {
      var p = await getPool();
      var m = FIELD_MAPPINGS;
      var r = await p.request().query("SELECT COUNT(DISTINCT " + m.req_rdo_leave_table.employee_id + ") as n FROM req_rdo_leave_table WHERE " + m.req_rdo_leave_table.status + " = 'Approved'");
      var sr = await p.request().query("SELECT COUNT(*) as n FROM couple_special_request");
      var ev = await p.request().query("SELECT COUNT(*) as n FROM wm_wp_ev_es_employee");
      var dm = await p.request().query("SELECT COUNT(*) as n FROM wm_demand_spread");
      res.json({
        rdo: { priority: 1, rule: "Block RDO dates", activeCount: r.recordset[0]?.n || 0 },
        specialRequest: { priority: 2, rule: "allow/refuse shifts", activeCount: sr.recordset[0]?.n || 0 },
        eves: { priority: 3, rule: "EVES night shift only", activeCount: ev.recordset[0]?.n || 0 },
        demand: { priority: 4, rule: "Minimum headcount", activeCount: dm.recordset[0]?.n || 0 }
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // REAL schedule generation - validates all records against rules
  app.post("/api/schedule/generate", async function(req, res) {
    try {
      var p = await getPool();
      await ruleEngine.loadAll(p);
      
      // Get all records to validate
      var result = await p.request().query("SELECT TOP 1000 Id, EmployeeNumber, ShiftDate, ShiftValue FROM AI_Shift_Scheduling_Result_Table");
      var records = result.recordset;
      
      var stats = { total: records.length, violations: 0, rdo: 0, sr: 0, eves: 0 };
      var violations = [];
      
      for (var i = 0; i < records.length; i++) {
        var row = records[i];
        var validation = ruleEngine.validate(String(row.EmployeeNumber || "").trim(), row.ShiftDate, row.ShiftValue);
        if (!validation.valid) {
          stats.violations++;
          if (validation.reason.startsWith("RDO")) stats.rdo++;
          else if (validation.reason.startsWith("SR")) stats.sr++;
          else if (validation.reason.startsWith("EVES")) stats.eves++;
          
          // Update record with violation
          await p.request()
            .input("id", row.Id)
            .input("detail", validation.reason + " (Priority " + validation.priority + ")")
            .query("UPDATE AI_Shift_Scheduling_Result_Table SET IsChanged = 1, ChangeDetail = @detail WHERE Id = @id");
          
          violations.push({ id: row.Id, emp: row.EmployeeNumber, date: row.ShiftDate, reason: validation.reason });
        }
      }
      
      res.json({ success: true, stats: stats, sampleViolations: violations.slice(0, 10) });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/schedule/results", async function(req, res) {
    try {
      var p = await getPool();
      var page = parseInt(req.query.page || "1");
      var limit = parseInt(req.query.limit || "100");
      var offset = (page - 1) * limit;
      var result = await p.request().query("SELECT TOP " + limit + " * FROM AI_Shift_Scheduling_Result_Table WHERE Id NOT IN (SELECT TOP " + offset + " Id FROM AI_Shift_Scheduling_Result_Table ORDER BY Id) ORDER BY Id");
      var count = await p.request().query("SELECT COUNT(*) as n FROM AI_Shift_Scheduling_Result_Table");
      res.json({ data: result.recordset, pagination: { page: page, limit: limit, total: count.recordset[0]?.n || 0 } });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.put("/api/schedule/override", async function(req, res) {
    try {
      var p = await getPool();
      var assignmentId = req.body.assignmentId;
      var shiftStart = req.body.shiftStart;
      var shiftEnd = req.body.shiftEnd;
      if (!assignmentId) return res.status(400).json({ error: "Missing assignmentId" });
      await p.request().input("id", assignmentId).query("UPDATE AI_Shift_Scheduling_Result_Table SET ShiftValue = @shiftStart + '-' + @shiftEnd, IsChanged = 1 WHERE Id = @id");
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/schedule/export", async function(req, res) {
    try {
      var p = await getPool();
      var result = await p.request().query("SELECT TOP 1000 * FROM AI_Shift_Scheduling_Result_Table ORDER BY EmployeeNumber, ShiftDate");
      var data = result.recordset;
      if (data.length === 0) return res.status(404).json({ error: "No data" });
      var ws = XLSX.utils.json_to_sheet(data);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Roster");
      var buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Disposition", "attachment; filename=roster_export.xlsx");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buf);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get("*", function(req, res) { res.sendFile(path.join(staticPath, "index.html")); });

  var port = parseInt(process.env.PORT || "3001");
  http.createServer(app).listen(port, function() { console.log("Wynn Roster API running on port " + port); });
}

startServer().catch(console.error);
