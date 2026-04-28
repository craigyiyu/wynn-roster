import express, { Request, Response } from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import cors from 'cors';
import * as XLSX from 'xlsx';
import { getPool, sql } from './db.js';
import { FIELD_MAPPINGS, parseAiResult, parsePeriodToDates } from './fieldMappings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer for file uploads
const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 50 * 1024 * 1024 } });

// ============ RULE ENGINE ============

interface RuleContext {
  rdoBlocks: Map<string, Set<string>>;
  specialRequests: Map<string, { type: string; values: string[]; allow: boolean }[]>;
  evesEmployees: Set<string>;
}

class RuleEngine {
  private ctx: RuleContext = {
    rdoBlocks: new Map(),
    specialRequests: new Map(),
    evesEmployees: new Set(),
  };

  // Priority 1: Load RDO blocks
  async loadRDO(pool: sql.ConnectionPool) {
    try {
      const m = FIELD_MAPPINGS.req_rdo_leave_table;
      const result = await pool.request().query(`
        SELECT ${m.employee_id}, ${m.ai_result}, ${m.period}
        FROM req_rdo_leave_table WHERE ${m.status} = 'Approved'
      `);
      for (const row of result.recordset) {
        const empId = String(row[m.employee_id] || '');
        const dates = new Set<string>();
        const aiResult = parseAiResult(row[m.ai_result] || '');
        const periodDates = parsePeriodToDates(row[m.period] || '');
        [...aiResult, ...periodDates].forEach(d => dates.add(d));
        if (dates.size > 0) this.ctx.rdoBlocks.set(empId, dates);
      }
      console.log(`[RDO] Loaded ${this.ctx.rdoBlocks.size} employees with RDO blocks`);
    } catch (err) {
      console.error('[RDO] Load error:', err);
    }
  }

  // Priority 2: Load Special Requests
  async loadSR(pool: sql.ConnectionPool) {
    try {
      const m = FIELD_MAPPINGS.couple_special_request;
      const result = await pool.request().query(`
        SELECT ${m.employee_id}, ${m.ai_type}, ${m.ai_value}
        FROM couple_special_request
        WHERE ${m.until_date} IS NULL OR ${m.until_date} >= GETDATE()
      `);
      for (const row of result.recordset) {
        const empId = String(row[m.employee_id] || '');
        const aiType = String(row[m.ai_type] || '');
        let values: string[] = [];
        try { values = JSON.parse(row[m.ai_value] || '[]'); } catch {}
        const allow = aiType.toLowerCase() === 'allow';
        if (!this.ctx.specialRequests.has(empId)) {
          this.ctx.specialRequests.set(empId, []);
        }
        this.ctx.specialRequests.get(empId)!.push({ type: aiType, values, allow });
      }
      console.log(`[SR] Loaded ${this.ctx.specialRequests.size} employees with SR`);
    } catch (err) {
      console.error('[SR] Load error:', err);
    }
  }

  // Priority 3: Load EVES employees
  async loadEVES(pool: sql.ConnectionPool) {
    try {
      const m = FIELD_MAPPINGS.wm_wp_ev_es_employee;
      const result = await pool.request().query(`
        SELECT ${m.employee_id} FROM wm_wp_ev_es_employee
      `);
      for (const row of result.recordset) {
        this.ctx.evesEmployees.add(String(row[m.employee_id] || ''));
      }
      console.log(`[EVES] Loaded ${this.ctx.evesEmployees.size} EVES employees`);
    } catch (err) {
      console.error('[EVES] Load error:', err);
    }
  }

  async loadAll(pool: sql.ConnectionPool) {
    await Promise.all([this.loadRDO(pool), this.loadSR(pool), this.loadEVES(pool)]);
  }

  // Priority 1: RDO check
  checkRDO(empId: string, date: string) {
    const dates = this.ctx.rdoBlocks.get(empId);
    if (dates?.has(date)) return { valid: false, reason: 'RDO_BLOCKED', priority: 1 };
    return { valid: true };
  }

  // Priority 2: SR check
  checkSR(empId: string, shiftStart: string) {
    const reqs = this.ctx.specialRequests.get(empId);
    if (!reqs) return { valid: true };
    for (const req of reqs) {
      const matchesShift = req.values.some(v => shiftStart.includes(v));
      if (req.allow && !matchesShift) return { valid: false, reason: `'SR_REFUSE: needs ${req.values.join(',')}'`, priority: 2 };
      if (!req.allow && matchesShift) return { valid: false, reason: `'SR_ALLOW: forbids ${req.values.join(',')}'`, priority: 2 };
    }
    return { valid: true };
  }

  // Priority 3: EVES check
  checkEVES(empId: string, shiftStart: string) {
    if (!this.ctx.evesEmployees.has(empId)) return { valid: true };
    const hour = parseInt(shiftStart.split(':')[0] || '0');
    if (hour < 14) return { valid: false, reason: 'EVES_VIOLATION: no day shift', priority: 3 };
    return { valid: true };
  }

  validate(empId: string, date: string, shiftStart: string) {
    const rdo = this.checkRDO(empId, date);
    if (!rdo.valid) return rdo;
    const sr = this.checkSR(empId, shiftStart);
    if (!sr.valid) return sr;
    const eves = this.checkEVES(empId, shiftStart);
    if (!eves.valid) return eves;
    return { valid: true };
  }
}

const ruleEngine = new RuleEngine();

// ============ EXPRESS SERVER ============

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const staticPath = process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, 'public')
    : path.resolve(__dirname, '../dist/public');
  app.use(express.static(staticPath));

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
  });

  // POST /api/schedule/upload
  app.post('/api/schedule/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file' });
      const pool = await getPool();
      const wb = XLSX.readFile(req.file.path);
      const results: any[] = [];
      for (const sn of wb.SheetNames) {
        const data = XLSX.utils.sheet_to_json(wb.Sheets[sn]);
        results.push({ sheet: sn, rows: data.length });
      }
      await ruleEngine.loadAll(pool);
      res.json({ success: true, sheets: results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/schedule/constraints
  app.get('/api/schedule/constraints', async (_req: Request, res: Response) => {
    try {
      const pool = await getPool();
      const r = await pool.request().query(`SELECT COUNT(DISTINCT ${FIELD_MAPPINGS.req_rdo_leave_table.employee_id}) as n FROM req_rdo_leave_table`);
      const sr = await pool.request().query(`SELECT COUNT(*) as n FROM couple_special_request`);
      const ev = await pool.request().query(`SELECT COUNT(*) as n FROM wm_wp_ev_es_employee`);
      res.json({
        rdo: { priority: 1, activeCount: r.recordset[0]?.n || 0 },
        specialRequest: { priority: 2, activeCount: sr.recordset[0]?.n || 0 },
        eves: { priority: 3, activeCount: ev.recordset[0]?.n || 0 },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/schedule/generate
  app.post('/api/schedule/generate', async (_req: Request, res: Response) => {
    try {
      const pool = await getPool();
      await ruleEngine.loadAll(pool);
      res.json({ success: true, message: 'Schedule generation triggered' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/schedule/results
  app.get('/api/schedule/results', async (req: Request, res: Response) => {
    try {
      const pool = await getPool();
      const m = FIELD_MAPPINGS.AI_Shift_Scheduling_Result_Table;
      const page = parseInt(String(req.query.page || '1'));
      const limit = parseInt(String(req.query.limit || '100'));
      const offset = (page - 1) * limit;
      const result = await pool.request().query(`
        SELECT TOP ${limit} * FROM AI_Shift_Scheduling_Result_Table
        WHERE Id NOT IN (SELECT TOP ${offset} Id FROM AI_Shift_Scheduling_Result_Table ORDER BY Id)
        ORDER BY Id
      `);
      const countResult = await pool.request().query(`SELECT COUNT(*) as total FROM AI_Shift_Scheduling_Result_Table`);
      res.json({
        data: result.recordset,
        pagination: { page, limit, total: countResult.recordset[0]?.total || 0 }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/schedule/override
  app.put('/api/schedule/override', async (req: Request, res: Response) => {
    try {
      const { assignmentId, employeeId, shiftDate, shiftStart, shiftEnd } = req.body;
      if (!assignmentId && !(employeeId && shiftDate)) {
        return res.status(400).json({ error: 'Missing params' });
      }
      const pool = await getPool();
      if (assignmentId) {
        await pool.request()
          .input('id', assignmentId)
          .input('shiftStart', shiftStart)
          .input('shiftEnd', shiftEnd)
          .query(`UPDATE AI_Shift_Scheduling_Result_Table SET ShiftValue = @shiftStart + '-' + @shiftEnd, IsChanged = 1 WHERE Id = @id`);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  const port = parseInt(String(process.env.PORT || '3000'));
  createServer(app).listen(port, () => {
    console.log(`Wynn Roster API running on port ${port}`);
    console.log('Endpoints: /api/health, /api/schedule/upload, /api/schedule/constraints, /api/schedule/generate, /api/schedule/results, /api/schedule/override');
  });
}

startServer().catch(console.error);
