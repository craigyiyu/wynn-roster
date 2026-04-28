/**
 * AI Extraction Review — Reads low-confidence & needs_review records from Supabase
 * Groups by record_type, shows AI confidence score, source vs interpretation side-by-side
 * Design: Control Tower dark theme — slate/teal/amber/red
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, CheckCircle2, AlertTriangle, XCircle, Eye,
  RefreshCw, ChevronDown, ChevronRight, FileSpreadsheet,
  Filter, ArrowRight, Brain, ShieldCheck, Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { getOrCreateSession } from '@/lib/sessionManager';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ETLRecord {
  id: string;
  upload_batch_id: string;
  source_file: string;
  source_sheet: string;
  row_number: number;
  record_type: string;
  raw_data: Record<string, unknown>;
  normalized_data: Record<string, unknown> | null;
  confidence_level: number;
  warning_flags: string[];
  needs_review: boolean;
  approved_by: string | null;
  approved_at: string | null;
  status: string | null;
}

type ReviewFilter = 'all' | 'low_conf' | 'needs_review' | 'approved';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getConfidenceColor(conf: number): string {
  if (conf >= 90) return 'text-teal';
  if (conf >= 75) return 'text-amber';
  return 'text-coral';
}

function getConfidenceBg(conf: number): string {
  if (conf >= 90) return 'bg-teal/10 border-teal/20';
  if (conf >= 75) return 'bg-amber/10 border-amber/20';
  return 'bg-coral/10 border-coral/20';
}

function getRecordTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    shift: 'Shift Records',
    rdo_request: 'RDO Requests',
    couple_shift: 'Couple Shifts',
    eves: 'EV/ES Employees',
    floor_spread: 'Floor Spreads',
    unknown: 'Unclassified',
  };
  return labels[type] || type;
}

function getRecordTypeIcon(type: string) {
  const icons: Record<string, string> = {
    shift: '📅',
    rdo_request: '🗓',
    couple_shift: '👫',
    eves: '👤',
    floor_spread: '📊',
    unknown: '❓',
  };
  return icons[type] || '📄';
}

/**
 * Build a human-readable AI interpretation from raw_data
 * This simulates what an AI would extract from the raw Excel fields
 */
function buildAIInterpretation(record: ETLRecord): { field: string; aiValue: string; rawValue: string; confidence: number }[] {
  const raw = record.raw_data;
  const results: { field: string; aiValue: string; rawValue: string; confidence: number }[] = [];

  if (record.record_type === 'shift') {
    // Shift records: look for employee ID, position, shift times
    const empId = raw['__EMPTY'] || raw['Payroll'] || raw['EMP_ID'];
    const position = raw['__EMPTY_1'] || raw['Position'] || raw['POSITION'];
    
    if (empId) results.push({
      field: 'Employee ID',
      aiValue: typeof empId === 'number' && empId > 100000 ? `EMP-${empId}` : String(empId),
      rawValue: String(empId),
      confidence: typeof empId === 'number' ? 95 : 70,
    });
    if (position) results.push({
      field: 'Position',
      aiValue: String(position).replace('TGF-', '').trim(),
      rawValue: String(position),
      confidence: 90,
    });

    // Extract shift times from date columns
    const shiftTimes = Object.entries(raw)
      .filter(([k, v]) => k.startsWith('__EMPTY_') && typeof v === 'string' && /\d{4}-\d{4}/.test(String(v)))
      .slice(0, 3);
    
    shiftTimes.forEach(([k, v]) => {
      results.push({
        field: `Shift (col ${k})`,
        aiValue: String(v),
        rawValue: String(v),
        confidence: 88,
      });
    });

    // Check for RDO
    const rdoEntries = Object.entries(raw).filter(([, v]) => v === 'RDO');
    if (rdoEntries.length > 0) {
      results.push({
        field: 'RDO Days',
        aiValue: `${rdoEntries.length} RDO day(s) detected`,
        rawValue: rdoEntries.map(([k]) => k).join(', '),
        confidence: 95,
      });
    }
  } else if (record.record_type === 'couple_shift') {
    const emp1Id = raw['__EMPTY'];
    const emp2Id = raw['__EMPTY_3'];
    const emp2Name = raw['__EMPTY_4'];
    const shiftType = raw['__EMPTY_7'];
    const status = raw['__EMPTY_11'];

    if (emp1Id) results.push({ field: 'Employee 1 ID', aiValue: String(emp1Id), rawValue: String(emp1Id), confidence: 85 });
    if (emp2Id) results.push({ field: 'Employee 2 ID', aiValue: String(emp2Id), rawValue: String(emp2Id), confidence: 85 });
    if (emp2Name) results.push({ field: 'Employee 2 Name', aiValue: String(emp2Name), rawValue: String(emp2Name), confidence: 90 });
    if (shiftType) results.push({ field: 'Couple Type', aiValue: String(shiftType), rawValue: String(shiftType), confidence: 88 });
    if (status) results.push({ field: 'Approval Status', aiValue: String(status), rawValue: String(status), confidence: 92 });
  } else if (record.record_type === 'floor_spread') {
    const shift = raw['SHIFT'] || raw['2026 Spares for SL'];
    const mon = raw['Mon'];
    const tue = raw['Tue'];
    const wed = raw['Wed'];

    if (shift) results.push({ field: 'Shift Time', aiValue: String(shift), rawValue: String(shift), confidence: 85 });
    if (mon !== undefined) results.push({ field: 'Mon Headcount', aiValue: String(mon), rawValue: String(mon), confidence: 90 });
    if (tue !== undefined) results.push({ field: 'Tue Headcount', aiValue: String(tue), rawValue: String(tue), confidence: 90 });
    if (wed !== undefined) results.push({ field: 'Wed Headcount', aiValue: String(wed), rawValue: String(wed), confidence: 90 });
  } else {
    // Unknown: show first 4 non-empty fields
    Object.entries(raw)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .slice(0, 4)
      .forEach(([k, v]) => {
        results.push({
          field: k,
          aiValue: String(v),
          rawValue: String(v),
          confidence: 60,
        });
      });
  }

  return results;
}

// ─── Record Card ──────────────────────────────────────────────────────────────

function AIRecordCard({ record, onApprove, onReject }: {
  record: ETLRecord;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const conf = record.confidence_level;
  const interpretation = buildAIInterpretation(record);

  return (
    <div className={`border border-border rounded-lg overflow-hidden mb-2 ${record.approved_by ? 'opacity-60' : ''}`}>
      {/* Header row */}
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors ${getConfidenceBg(conf)}`}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}

        {/* File + row */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">{record.source_file}</span>
            <span className="text-[9px] text-muted-foreground/60">· {record.source_sheet} · row {record.row_number}</span>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${conf >= 90 ? 'bg-teal' : conf >= 75 ? 'bg-amber' : 'bg-coral'}`}
              style={{ width: `${conf}%` }}
            />
          </div>
          <span className={`text-[10px] font-mono font-semibold w-10 ${getConfidenceColor(conf)}`}>{conf.toFixed(0)}%</span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!!record.approved_by && <Badge variant="outline" className="text-[9px] border-teal/30 text-teal px-1.5">✓ Approved</Badge>}
          {record.needs_review && !record.approved_by && <Badge variant="outline" className="text-[9px] border-amber/30 text-amber px-1.5">⚠ Review</Badge>}
          {record.warning_flags.length > 0 && (
            <Badge variant="outline" className="text-[9px] border-amber/30 text-amber px-1.5">{record.warning_flags.length}w</Badge>
          )}
        </div>

        {/* Action buttons */}
        {!record.approved_by && (
          <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <Button size="sm" variant="outline" className="h-5 text-[9px] px-2 border-teal/30 text-teal hover:bg-teal/10"
              onClick={() => onApprove(record.id)}>
              Approve
            </Button>
            <Button size="sm" variant="outline" className="h-5 text-[9px] px-2 border-coral/30 text-coral hover:bg-coral/10"
              onClick={() => onReject(record.id)}>
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Expanded: AI interpretation vs raw */}
      {expanded && (
        <div className="p-3 bg-secondary/10 space-y-3">
          {/* Warning flags */}
          {record.warning_flags.length > 0 && (
            <div className="bg-amber/5 border border-amber/20 rounded p-2">
              <p className="text-[9px] font-mono text-amber mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Warning Flags
              </p>
              {record.warning_flags.map((w, i) => (
                <p key={i} className="text-[10px] text-amber/80">• {w}</p>
              ))}
            </div>
          )}

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Raw source */}
            <div className="bg-secondary/30 rounded p-2.5">
              <p className="text-[9px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3" /> SOURCE (Excel Raw)
              </p>
              <div className="space-y-1">
                {Object.entries(record.raw_data)
                  .filter(([, v]) => v !== null && v !== undefined && v !== '')
                  .slice(0, 10)
                  .map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-[9px]">
                      <span className="font-mono text-muted-foreground w-28 flex-shrink-0 truncate">{k}:</span>
                      <span className="text-foreground/70 truncate">
                        {typeof v === 'number' && v > 40000 && v < 50000
                          ? <span className="text-amber/70">[Excel date #{v}]</span>
                          : String(v)
                        }
                      </span>
                    </div>
                  ))}
                {Object.keys(record.raw_data).length > 10 && (
                  <p className="text-[9px] text-muted-foreground">+{Object.keys(record.raw_data).length - 10} more fields</p>
                )}
              </div>
            </div>

            {/* AI interpretation */}
            <div className="bg-teal/5 border border-teal/10 rounded p-2.5">
              <p className="text-[9px] font-mono text-teal mb-2 flex items-center gap-1">
                <Brain className="w-3 h-3" /> AI INTERPRETATION
              </p>
              {interpretation.length > 0 ? (
                <div className="space-y-1.5">
                  {interpretation.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-mono text-muted-foreground">{item.field}: </span>
                        <span className="text-[10px] text-foreground/90">{item.aiValue}</span>
                      </div>
                      <span className={`text-[9px] font-mono flex-shrink-0 ${getConfidenceColor(item.confidence)}`}>
                        {item.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">
                  No structured fields extracted. Record classified as <span className="text-amber">unknown</span>.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Type Group Panel ─────────────────────────────────────────────────────────

function TypeGroupPanel({ type, records, filter, onApprove, onReject }: {
  type: string;
  records: ETLRecord[];
  filter: ReviewFilter;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const filtered = records.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'low_conf') return r.confidence_level < 80;
    if (filter === 'needs_review') return r.needs_review && !r.approved_by;
    if (filter === 'approved') return !!r.approved_by;
    return true;
  });

  const avgConf = records.length > 0
    ? records.reduce((s, r) => s + r.confidence_level, 0) / records.length
    : 0;

  if (filtered.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground border border-border rounded-lg">
        No {getRecordTypeLabel(type)} records match the current filter.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Group header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{getRecordTypeIcon(type)}</span>
        <div>
          <p className="text-xs font-mono font-semibold text-foreground">{getRecordTypeLabel(type)}</p>
          <p className="text-[10px] text-muted-foreground">
            {filtered.length.toLocaleString()} of {records.length.toLocaleString()} records shown
            · avg confidence <span className={getConfidenceColor(avgConf)}>{avgConf.toFixed(0)}%</span>
          </p>
        </div>
      </div>

      {/* Records */}
      {filtered.slice(0, 100).map(record => (
        <AIRecordCard
          key={record.id}
          record={record}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
      {filtered.length > 100 && (
        <div className="p-3 text-center text-xs text-muted-foreground border border-border rounded">
          Showing 100 of {filtered.length.toLocaleString()} records. Use filters to narrow down.
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIExtractionReview() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [records, setRecords] = useState<ETLRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Load session
  useEffect(() => {
    getOrCreateSession()
      .then(s => setSessionId(s.id))
      .catch(() => { setError('Failed to load session'); setLoading(false); });
  }, []);

  // Load records when session changes
  useEffect(() => {
    if (!sessionId) return;
    loadRecords(sessionId);
  }, [sessionId]);

  const loadRecords = useCallback(async (sid: string) => {
    setLoading(true);
    setError(null);
    try {
      const allRecords: ETLRecord[] = [];
      const PAGE = 1000;

      for (let start = 0; ; start += PAGE) {
        const end = start + PAGE - 1;
        const { data, error: recErr } = await supabase
          .from('etl_records')
          .select('id,upload_batch_id,source_file,source_sheet,row_number,record_type,raw_data,normalized_data,confidence_level,warning_flags,needs_review,approved_by,approved_at,status')
          .eq('session_id', sid)
          .range(start, end);

        if (recErr) throw recErr;
        if (!data || data.length === 0) break;
        allRecords.push(...(data as ETLRecord[]));
        if (data.length < PAGE) break;
      }

      setRecords(allRecords);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApprove = async (recordId: string) => {
    await supabase
      .from('etl_records')
      .update({ approved_by: 'ops_manager', approved_at: new Date().toISOString() })
      .eq('id', recordId);
    if (sessionId) loadRecords(sessionId);
  };

  const handleReject = async (recordId: string) => {
    await supabase
      .from('etl_records')
      .update({ approved_by: null, approved_at: null })
      .eq('id', recordId);
    if (sessionId) loadRecords(sessionId);
  };

  // Group records by type
  const recordsByType: Record<string, ETLRecord[]> = {};
  for (const r of records) {
    const t = r.record_type || 'unknown';
    if (!recordsByType[t]) recordsByType[t] = [];
    recordsByType[t].push(r);
  }

  const recordTypes = Object.keys(recordsByType).sort((a, b) => {
    const order = ['shift', 'couple_shift', 'rdo_request', 'eves', 'floor_spread', 'unknown'];
    return (order.indexOf(a) ?? 99) - (order.indexOf(b) ?? 99);
  });

  // Stats
  const totalLowConf = records.filter(r => r.confidence_level < 80).length;
  const totalNeedsReview = records.filter(r => r.needs_review && !r.approved_by).length;
  const totalApproved = records.filter(r => !!r.approved_by).length;
  const avgConf = records.length > 0
    ? records.reduce((s, r) => s + r.confidence_level, 0) / records.length
    : 0;

  const filterButtons: { key: ReviewFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: records.length },
    { key: 'needs_review', label: 'Needs Review', count: totalNeedsReview },
    { key: 'low_conf', label: 'Low Confidence', count: totalLowConf },
    { key: 'approved', label: 'Approved', count: totalApproved },
  ];

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal" />
            AI EXTRACTION REVIEW
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-parsed fields from uploaded Excel files. Review low-confidence items and approve before roster generation.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 border-border text-muted-foreground hover:text-foreground"
          onClick={() => sessionId && loadRecords(sessionId)}
          disabled={loading}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* AI pipeline explanation */}
      <Card className="bg-teal/5 border-teal/20">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="text-teal font-medium">AI Extraction Pipeline:</span> Each uploaded Excel row is parsed by the AI engine to extract structured fields (employee IDs, shift times, RDO dates, couple pairings). Records with <span className="text-amber">confidence &lt; 80%</span> or <span className="text-amber">missing required fields</span> are flagged for human review.
              </p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {[
                  { label: 'Excel Parse', done: true },
                  { label: 'Field Extraction', done: true },
                  { label: 'Confidence Score', done: true },
                  { label: 'Human Review', done: totalApproved > 0 },
                  { label: 'Roster Ready', done: false },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono flex items-center gap-1 ${step.done ? 'text-teal' : 'text-muted-foreground'}`}>
                      {step.done ? <CheckCircle2 className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                      {step.label}
                    </span>
                    {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/30" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: records.length.toLocaleString(), color: 'text-foreground', sub: `${recordTypes.length} types` },
          { label: 'Avg Confidence', value: `${avgConf.toFixed(0)}%`, color: getConfidenceColor(avgConf), sub: 'across all records' },
          { label: 'Needs Review', value: totalNeedsReview.toLocaleString(), color: 'text-amber', sub: 'flagged by AI' },
          { label: 'Approved', value: totalApproved.toLocaleString(), color: 'text-teal', sub: 'ready for roster' },
        ].map(stat => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-3">
              <p className={`text-xl font-mono font-bold ${stat.color}`}>{loading ? '—' : stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <Card className="bg-coral/5 border-coral/20">
          <CardContent className="p-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-coral" />
            <p className="text-xs text-coral">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-6 h-6 text-teal animate-pulse mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">Loading AI extraction results…</p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && records.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No records to review.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload Excel files in <span className="text-teal font-mono">Data Intake</span> first.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      {!loading && !error && records.length > 0 && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {filterButtons.map(btn => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-mono transition-colors
                  ${filter === btn.key
                    ? 'text-teal border-teal/30 bg-teal/5'
                    : 'text-muted-foreground border-border hover:border-foreground/20'
                  }`}
              >
                {btn.label}
                <span className="opacity-70">({btn.count.toLocaleString()})</span>
              </button>
            ))}
          </div>

          {/* Tabs by record type */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-secondary/30 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="all" className="text-[10px] font-mono gap-1">
                All Types ({records.length.toLocaleString()})
              </TabsTrigger>
              {recordTypes.map(type => (
                <TabsTrigger key={type} value={type} className="text-[10px] font-mono gap-1">
                  {getRecordTypeIcon(type)} {getRecordTypeLabel(type)} ({recordsByType[type].length.toLocaleString()})
                </TabsTrigger>
              ))}
            </TabsList>

            {/* All types tab */}
            <TabsContent value="all" className="mt-4 space-y-6">
              {recordTypes.map(type => (
                <div key={type}>
                  <TypeGroupPanel
                    type={type}
                    records={recordsByType[type]}
                    filter={filter}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                </div>
              ))}
            </TabsContent>

            {/* Per-type tabs */}
            {recordTypes.map(type => (
              <TabsContent key={type} value={type} className="mt-4">
                <TypeGroupPanel
                  type={type}
                  records={recordsByType[type]}
                  filter={filter}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
