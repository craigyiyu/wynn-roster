/**
 * AI Extraction Review
 * =====================
 * Shows the results of the RDO + Special Request extraction pipeline.
 * 5 tabs: Upload Summary | RDO Results | Special Request Results | Enriched Roster | Review Queue
 *
 * Data is loaded once and cached in memory (extractionEngine.ts).
 * Design: Control Tower dark theme — slate/teal/amber/coral
 */

import { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet, CheckCircle2, AlertTriangle, Clock, RefreshCw,
  Search, ChevronDown, ChevronRight, Sparkles, Database, User,
  CalendarDays, Shield, XCircle, Info, ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  runExtraction, getExtractionCache, clearExtractionCache,
  ALL_FILES, ExtractionResult, RDOExtraction, SRExtraction, EnrichedEmployee,
} from '@/lib/extractionEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function confidenceBadge(conf: 'high' | 'medium' | 'low') {
  if (conf === 'high') return <Badge variant="outline" className="text-[9px] border-teal/30 text-teal px-1.5">High</Badge>;
  if (conf === 'medium') return <Badge variant="outline" className="text-[9px] border-amber/30 text-amber px-1.5">Medium</Badge>;
  return <Badge variant="outline" className="text-[9px] border-coral/30 text-coral px-1.5">Low</Badge>;
}

function statusBadge(status: string) {
  if (status === 'extracted') return <Badge variant="outline" className="text-[9px] border-teal/30 text-teal px-1.5">Extracted</Badge>;
  if (status === 'needs_review') return <Badge variant="outline" className="text-[9px] border-amber/30 text-amber px-1.5">Needs Review</Badge>;
  if (status === 'no_notes') return <Badge variant="outline" className="text-[9px] border-border text-muted-foreground px-1.5">No Notes</Badge>;
  if (status === 'no_rdo') return <Badge variant="outline" className="text-[9px] border-border text-muted-foreground px-1.5">No RDO</Badge>;
  if (status === 'partial') return <Badge variant="outline" className="text-[9px] border-amber/30 text-amber px-1.5">Partial</Badge>;
  if (status === 'unclassified') return <Badge variant="outline" className="text-[9px] border-coral/30 text-coral px-1.5">Unclassified</Badge>;
  return <Badge variant="outline" className="text-[9px] border-border text-muted-foreground px-1.5">{status}</Badge>;
}

// ─── Tab 1: Upload Summary ────────────────────────────────────────────────────

function UploadSummaryTab({ result }: { result: ExtractionResult }) {
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Roster Employees', value: result.stats.total_roster, color: 'teal' },
          { label: 'Leave Records', value: result.stats.total_leave_records, color: 'indigo' },
          { label: 'Special Requests', value: result.stats.total_sr_records, color: 'amber' },
          { label: 'Needs Review', value: result.stats.rdo_needs_review + result.enriched_roster.filter(e => e.review_status === 'needs_review').length, color: 'coral' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-card/50 border-border/50">
            <CardContent className="p-3">
              <p className="text-[10px] font-mono text-muted-foreground uppercase">{label}</p>
              <p className={`text-2xl font-mono font-bold text-${color}`}>{value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* File list */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-3 flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3" /> Uploaded Files — This Extraction Step
          </p>
          <div className="space-y-2">
            {ALL_FILES.map((f) => (
              <div key={f.name} className={`flex items-start gap-3 p-2.5 rounded-lg border ${f.used ? 'bg-teal/5 border-teal/20' : 'bg-secondary/20 border-border/30'}`}>
                <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${f.used ? 'bg-teal/20' : 'bg-secondary'}`}>
                  {f.used
                    ? <CheckCircle2 className="w-3 h-3 text-teal" />
                    : <Clock className="w-3 h-3 text-muted-foreground" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-mono truncate ${f.used ? 'text-foreground' : 'text-muted-foreground'}`}>{f.name}</p>
                  {f.used
                    ? <p className="text-[10px] text-teal/70 mt-0.5">{(f as { role: string }).role}</p>
                    : <p className="text-[10px] text-muted-foreground/60 mt-0.5">{(f as { reason: string }).reason}</p>
                  }
                </div>
                <Badge variant="outline" className={`text-[9px] flex-shrink-0 ${f.used ? 'border-teal/30 text-teal' : 'border-border text-muted-foreground'}`}>
                  {f.used ? 'Used' : 'Reserved'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Extraction summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] font-mono text-muted-foreground uppercase mb-3 flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-teal" /> RDO Extraction Summary
            </p>
            <div className="space-y-1.5">
              {[
                { label: 'Total leave records (Approved)', value: result.stats.total_leave_records },
                { label: 'With extracted RDO dates', value: result.stats.rdo_with_dates, highlight: true },
                { label: 'Needs human review', value: result.stats.rdo_needs_review, warn: true },
                { label: 'Matched to roster', value: result.stats.roster_with_rdo },
                { label: 'Unmatched payrolls', value: result.stats.unmatched_rdo, warn: result.stats.unmatched_rdo > 0 },
              ].map(({ label, value, highlight, warn }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <span className={`text-[11px] font-mono font-semibold ${highlight ? 'text-teal' : warn ? 'text-amber' : 'text-foreground'}`}>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] font-mono text-muted-foreground uppercase mb-3 flex items-center gap-1">
              <Shield className="w-3 h-3 text-indigo" /> Special Request Summary
            </p>
            <div className="space-y-1.5">
              {[
                { label: 'Total SR records (SUP/DLR)', value: result.stats.total_sr_records },
                { label: 'Active (not expired)', value: result.stats.sr_active, highlight: true },
                { label: 'Expired (historical)', value: result.stats.total_sr_records - result.stats.sr_active },
                { label: 'Matched to roster', value: result.stats.roster_with_sr },
                { label: 'Unmatched emp_nos', value: result.stats.unmatched_sr, warn: result.stats.unmatched_sr > 0 },
              ].map(({ label, value, highlight, warn }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <span className={`text-[11px] font-mono font-semibold ${highlight ? 'text-teal' : warn ? 'text-amber' : 'text-foreground'}`}>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab 2: RDO Results ───────────────────────────────────────────────────────

function RDOResultsTab({ records }: { records: RDOExtraction[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'extracted' | 'needs_review' | 'no_rdo'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (filter !== 'all' && r.extraction_status !== filter) return false;
      if (search) {
        const s = search.toLowerCase();
        return r.payroll.includes(s) || r.raw_notes.toLowerCase().includes(s) || r.period.toLowerCase().includes(s);
      }
      return true;
    });
  }, [records, filter, search]);

  const counts = useMemo(() => ({
    all: records.length,
    extracted: records.filter(r => r.extraction_status === 'extracted').length,
    needs_review: records.filter(r => r.extraction_status === 'needs_review').length,
    no_rdo: records.filter(r => r.extraction_status === 'no_notes' || r.extraction_status === 'no_rdo').length,
  }), [records]);

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          ['all', 'All', counts.all],
          ['extracted', 'Extracted', counts.extracted],
          ['needs_review', 'Needs Review', counts.needs_review],
          ['no_rdo', 'No RDO', counts.no_rdo],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
              filter === key
                ? 'bg-teal/10 border-teal/30 text-teal'
                : 'border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            {label} <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
        <div className="flex-1 max-w-xs ml-auto">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search payroll, notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 pl-7 text-xs bg-secondary/30 border-border/50"
            />
          </div>
        </div>
      </div>

      {/* Records */}
      <div className="space-y-1">
        {filtered.slice(0, 200).map(r => (
          <div key={r.source_etl_record_id} className="border border-border/50 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors"
              onClick={() => setExpanded(expanded === r.source_etl_record_id ? null : r.source_etl_record_id)}
            >
              {expanded === r.source_etl_record_id
                ? <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                : <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              }

              {/* Payroll */}
              <span className="text-[11px] font-mono font-semibold text-foreground w-16 flex-shrink-0">#{r.payroll}</span>

              {/* Period */}
              <span className="text-[10px] font-mono text-muted-foreground w-32 flex-shrink-0">{r.period}</span>

              {/* Notes */}
              <span className="text-[10px] font-mono text-muted-foreground flex-1 truncate">
                {r.raw_notes || <span className="italic opacity-50">no notes</span>}
              </span>

              {/* Extracted dates */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {r.extracted_rdo_dates.map(d => (
                  <Badge key={d} variant="outline" className="text-[9px] border-teal/30 text-teal px-1.5 font-mono">
                    {formatDate(d)}
                  </Badge>
                ))}
              </div>

              {/* Status */}
              <div className="flex-shrink-0">{statusBadge(r.extraction_status)}</div>
            </div>

            {/* Expanded detail */}
            {expanded === r.source_etl_record_id && (
              <div className="px-4 pb-3 pt-1 bg-secondary/10 border-t border-border/30">
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div className="space-y-1">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Leave Record</p>
                    <div className="flex gap-2"><span className="text-muted-foreground w-20">Payroll</span><span className="font-mono text-foreground">#{r.payroll}</span></div>
                    <div className="flex gap-2"><span className="text-muted-foreground w-20">Period</span><span className="font-mono text-foreground">{r.period}</span></div>
                    <div className="flex gap-2"><span className="text-muted-foreground w-20">Days</span><span className="font-mono text-foreground">{r.days}</span></div>
                    <div className="flex gap-2"><span className="text-muted-foreground w-20">Leave Type</span><span className="font-mono text-foreground">{r.leave_type}</span></div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">AI Extraction</p>
                    <div className="flex gap-2"><span className="text-muted-foreground w-20">Raw Notes</span><span className="font-mono text-amber">{r.raw_notes || '—'}</span></div>
                    <div className="flex gap-2 items-start">
                      <span className="text-muted-foreground w-20 flex-shrink-0">RDO Dates</span>
                      <div className="flex gap-1 flex-wrap">
                        {r.extracted_rdo_dates.length > 0
                          ? r.extracted_rdo_dates.map(d => <Badge key={d} variant="outline" className="text-[9px] border-teal/30 text-teal px-1.5 font-mono">{d}</Badge>)
                          : <span className="text-muted-foreground italic">none extracted</span>
                        }
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-muted-foreground w-20">Confidence</span>
                      {confidenceBadge(r.confidence)}
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-muted-foreground w-20">Status</span>
                      {statusBadge(r.extraction_status)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length > 200 && (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Showing 200 of {filtered.length} records. Use search to narrow down.
          </p>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No records match the current filter.</div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 3: Special Request Results ──────────────────────────────────────────

function SRResultsTab({ records }: { records: SRExtraction[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'extracted' | 'unclassified'>('active');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (filter === 'active' && r.is_expired) return false;
      if (filter === 'expired' && !r.is_expired) return false;
      if (filter === 'extracted' && r.extraction_status !== 'extracted') return false;
      if (filter === 'unclassified' && r.extraction_status !== 'unclassified') return false;
      if (search) {
        const s = search.toLowerCase();
        return r.emp_no.includes(s) || r.assigned_to_raw.toLowerCase().includes(s) || r.position.toLowerCase().includes(s);
      }
      return true;
    });
  }, [records, filter, search]);

  const counts = useMemo(() => ({
    all: records.length,
    active: records.filter(r => !r.is_expired).length,
    expired: records.filter(r => r.is_expired).length,
    extracted: records.filter(r => r.extraction_status === 'extracted').length,
    unclassified: records.filter(r => r.extraction_status === 'unclassified').length,
  }), [records]);

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          ['all', 'All', counts.all],
          ['active', 'Active', counts.active],
          ['expired', 'Expired', counts.expired],
          ['extracted', 'Extracted', counts.extracted],
          ['unclassified', 'Unclassified', counts.unclassified],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
              filter === key
                ? 'bg-teal/10 border-teal/30 text-teal'
                : 'border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            {label} <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
        <div className="flex-1 max-w-xs ml-auto">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search emp#, assigned to..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 pl-7 text-xs bg-secondary/30 border-border/50"
            />
          </div>
        </div>
      </div>

      {/* Records */}
      <div className="space-y-1">
        {filtered.slice(0, 200).map(r => (
          <div key={r.source_etl_record_id} className={`border rounded-lg overflow-hidden ${r.is_expired ? 'border-border/30 opacity-60' : 'border-border/50'}`}>
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors"
              onClick={() => setExpanded(expanded === r.source_etl_record_id ? null : r.source_etl_record_id)}
            >
              {expanded === r.source_etl_record_id
                ? <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                : <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              }

              {/* Emp no + position */}
              <span className="text-[11px] font-mono font-semibold text-foreground w-16 flex-shrink-0">#{r.emp_no}</span>
              <Badge variant="outline" className={`text-[9px] flex-shrink-0 ${r.position === 'SUP' ? 'border-indigo/30 text-indigo' : 'border-amber/30 text-amber'}`}>{r.position}</Badge>

              {/* Assigned to */}
              <span className="text-[10px] font-mono text-muted-foreground flex-1 truncate">{r.assigned_to_raw}</span>

              {/* AI tags */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {r.ai_type && (
                  <Badge variant="outline" className={`text-[9px] px-1.5 ${r.ai_type === 'allow' ? 'border-teal/30 text-teal' : 'border-coral/30 text-coral'}`}>
                    {r.ai_type}
                  </Badge>
                )}
                {r.ai_value.map(v => (
                  <Badge key={v} variant="outline" className="text-[9px] border-indigo/30 text-indigo px-1 font-mono">{v}</Badge>
                ))}
                {r.ai_rdo.map(v => (
                  <Badge key={v} variant="outline" className="text-[9px] border-teal/30 text-teal px-1 font-mono">RDO:{v}</Badge>
                ))}
              </div>

              {/* Status */}
              <div className="flex-shrink-0">{statusBadge(r.extraction_status)}</div>
              {r.is_expired && <Badge variant="outline" className="text-[9px] border-border text-muted-foreground px-1.5 flex-shrink-0">Expired</Badge>}
            </div>

            {/* Expanded detail */}
            {expanded === r.source_etl_record_id && (
              <div className="px-4 pb-3 pt-1 bg-secondary/10 border-t border-border/30">
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div className="space-y-1">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Source Record</p>
                    <div className="flex gap-2"><span className="text-muted-foreground w-24">Emp No</span><span className="font-mono text-foreground">#{r.emp_no}</span></div>
                    <div className="flex gap-2"><span className="text-muted-foreground w-24">Dept</span><span className="font-mono text-foreground">{r.dept}</span></div>
                    <div className="flex gap-2"><span className="text-muted-foreground w-24">Position</span><span className="font-mono text-foreground">{r.position}</span></div>
                    <div className="flex gap-2"><span className="text-muted-foreground w-24">Type</span><span className="font-mono text-foreground">{r.req_type}</span></div>
                    <div className="flex gap-2"><span className="text-muted-foreground w-24">Expired</span><span className={`font-mono ${r.is_expired ? 'text-coral' : 'text-teal'}`}>{r.is_expired ? 'Yes' : 'No'}</span></div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">AI Extraction</p>
                    <div className="flex gap-2"><span className="text-muted-foreground w-24">Assigned To</span><span className="font-mono text-amber">{r.assigned_to_raw || '—'}</span></div>
                    <div className="flex gap-2 items-center"><span className="text-muted-foreground w-24">ai_type</span>
                      {r.ai_type
                        ? <Badge variant="outline" className={`text-[9px] px-1.5 ${r.ai_type === 'allow' ? 'border-teal/30 text-teal' : 'border-coral/30 text-coral'}`}>{r.ai_type}</Badge>
                        : <span className="text-muted-foreground italic">—</span>
                      }
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="text-muted-foreground w-24 flex-shrink-0">ai_value</span>
                      <div className="flex gap-1 flex-wrap">
                        {r.ai_value.length > 0
                          ? r.ai_value.map(v => <Badge key={v} variant="outline" className="text-[9px] border-indigo/30 text-indigo px-1.5 font-mono">{v}</Badge>)
                          : <span className="text-muted-foreground italic">[]</span>
                        }
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="text-muted-foreground w-24 flex-shrink-0">ai_rdo</span>
                      <div className="flex gap-1 flex-wrap">
                        {r.ai_rdo.length > 0
                          ? r.ai_rdo.map(v => <Badge key={v} variant="outline" className="text-[9px] border-teal/30 text-teal px-1.5 font-mono">{v}</Badge>)
                          : <span className="text-muted-foreground italic">[]</span>
                        }
                      </div>
                    </div>
                    {r.excluded_terms.length > 0 && (
                      <div className="flex gap-2 items-start">
                        <span className="text-muted-foreground w-24 flex-shrink-0">excluded</span>
                        <div className="flex gap-1 flex-wrap">
                          {r.excluded_terms.map(v => <Badge key={v} variant="outline" className="text-[9px] border-border text-muted-foreground px-1.5 font-mono">{v}</Badge>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length > 200 && (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Showing 200 of {filtered.length} records. Use search to narrow down.
          </p>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No records match the current filter.</div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 4: Enriched Roster ───────────────────────────────────────────────────

function EnrichedRosterTab({ employees }: { employees: EnrichedEmployee[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'with_rdo' | 'with_sr' | 'needs_review'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return employees.filter(e => {
      if (filter === 'with_rdo' && e.rdo_records.length === 0) return false;
      if (filter === 'with_sr' && e.sr_records.length === 0) return false;
      if (filter === 'needs_review' && e.review_status !== 'needs_review') return false;
      if (search) {
        const s = search.toLowerCase();
        return e.employee_number.includes(s) || e.dept_position.toLowerCase().includes(s) || e.rotation.toLowerCase().includes(s);
      }
      return true;
    });
  }, [employees, filter, search]);

  const counts = useMemo(() => ({
    all: employees.length,
    with_rdo: employees.filter(e => e.rdo_records.length > 0).length,
    with_sr: employees.filter(e => e.sr_records.length > 0).length,
    needs_review: employees.filter(e => e.review_status === 'needs_review').length,
  }), [employees]);

  const SHIFT_COLORS: Record<string, string> = {
    '0700-1500': 'bg-sky-500/20 text-sky-400', '1000-1800': 'bg-sky-400/20 text-sky-300',
    '1200-2000': 'bg-emerald-500/20 text-emerald-400', '1500-2300': 'bg-teal/20 text-teal',
    '1800-0200': 'bg-amber/20 text-amber', '2000-0400': 'bg-orange-500/20 text-orange-400',
    '2300-0700': 'bg-purple-500/20 text-purple-400',
    'RDO': 'bg-coral/20 text-coral', 'UnifL': 'bg-pink-500/20 text-pink-400',
  };

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          ['all', 'All Employees', counts.all],
          ['with_rdo', 'Has RDO Request', counts.with_rdo],
          ['with_sr', 'Has Special Request', counts.with_sr],
          ['needs_review', 'Needs Review', counts.needs_review],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
              filter === key
                ? 'bg-teal/10 border-teal/30 text-teal'
                : 'border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            {label} <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
        <div className="flex-1 max-w-xs ml-auto">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search emp#, dept, rotation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 pl-7 text-xs bg-secondary/30 border-border/50"
            />
          </div>
        </div>
      </div>

      {/* Employees */}
      <div className="space-y-1">
        {filtered.slice(0, 150).map(e => (
          <div key={e.employee_number} className="border border-border/50 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors"
              onClick={() => setExpanded(expanded === e.employee_number ? null : e.employee_number)}
            >
              {expanded === e.employee_number
                ? <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                : <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              }

              {/* Emp no */}
              <span className="text-[11px] font-mono font-semibold text-foreground w-16 flex-shrink-0">{e.employee_number}</span>

              {/* Dept/position */}
              <span className="text-[10px] font-mono text-muted-foreground w-28 flex-shrink-0 truncate">{e.dept_position}</span>

              {/* Rotation */}
              <span className="text-[10px] font-mono text-muted-foreground w-24 flex-shrink-0 truncate">{e.rotation}</span>

              {/* Tags */}
              <div className="flex items-center gap-1 flex-1 flex-wrap">
                {e.extracted_rdo_dates.map(d => (
                  <Badge key={d} variant="outline" className="text-[9px] border-teal/30 text-teal px-1.5 font-mono">RDO {formatDate(d)}</Badge>
                ))}
                {e.sr_records.filter(s => !s.is_expired).slice(0, 2).map((s, i) => (
                  <Badge key={i} variant="outline" className={`text-[9px] px-1.5 font-mono ${s.ai_type === 'allow' ? 'border-indigo/30 text-indigo' : 'border-coral/30 text-coral'}`}>
                    SR:{s.ai_type}{s.ai_value.length > 0 ? ` [${s.ai_value.join(',')}]` : ''}{s.ai_rdo.length > 0 ? ` RDO:${s.ai_rdo.join(',')}` : ''}
                  </Badge>
                ))}
              </div>

              {/* Review status */}
              {e.review_status === 'needs_review' && (
                <Badge variant="outline" className="text-[9px] border-amber/30 text-amber px-1.5 flex-shrink-0">⚠ Review</Badge>
              )}
            </div>

            {/* Expanded detail */}
            {expanded === e.employee_number && (
              <div className="px-4 pb-3 pt-1 bg-secondary/10 border-t border-border/30 space-y-3">
                {/* Shift schedule */}
                <div>
                  <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1.5">Shift Schedule (Apr 13–26)</p>
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(e.shifts).map(([date, shift]) => {
                      const color = SHIFT_COLORS[shift] || 'bg-secondary text-muted-foreground';
                      return (
                        <div key={date} className="flex flex-col items-center gap-0.5">
                          <span className="text-[8px] font-mono text-muted-foreground">{date.slice(5)}</span>
                          <div className={`w-10 h-7 rounded flex items-center justify-center text-[9px] font-mono font-bold ${color}`}>
                            {shift || '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RDO records */}
                {e.rdo_records.length > 0 && (
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-teal" /> RDO Requests ({e.rdo_records.length})
                    </p>
                    <div className="space-y-1">
                      {e.rdo_records.map(r => (
                        <div key={r.source_etl_record_id} className="flex items-center gap-2 text-[10px] font-mono bg-teal/5 border border-teal/10 rounded px-2 py-1">
                          <span className="text-muted-foreground">{r.period}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-amber">{r.raw_notes || 'no notes'}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <div className="flex gap-1">
                            {r.extracted_rdo_dates.length > 0
                              ? r.extracted_rdo_dates.map(d => <Badge key={d} variant="outline" className="text-[9px] border-teal/30 text-teal px-1 font-mono">{formatDate(d)}</Badge>)
                              : <span className="text-muted-foreground italic">no dates</span>
                            }
                          </div>
                          {statusBadge(r.extraction_status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SR records */}
                {e.sr_records.length > 0 && (
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-indigo" /> Special Requests ({e.sr_records.length}, {e.active_sr_count} active)
                    </p>
                    <div className="space-y-1">
                      {e.sr_records.map(s => (
                        <div key={s.source_etl_record_id} className={`flex items-center gap-2 text-[10px] font-mono rounded px-2 py-1 border ${s.is_expired ? 'bg-secondary/20 border-border/20 opacity-50' : 'bg-indigo/5 border-indigo/10'}`}>
                          <span className="text-muted-foreground">{s.position}</span>
                          <span className="text-amber flex-1 truncate">{s.assigned_to_raw}</span>
                          {s.ai_type && <Badge variant="outline" className={`text-[9px] px-1.5 ${s.ai_type === 'allow' ? 'border-teal/30 text-teal' : 'border-coral/30 text-coral'}`}>{s.ai_type}</Badge>}
                          {s.ai_value.map(v => <Badge key={v} variant="outline" className="text-[9px] border-indigo/30 text-indigo px-1 font-mono">{v}</Badge>)}
                          {s.ai_rdo.map(v => <Badge key={v} variant="outline" className="text-[9px] border-teal/30 text-teal px-1 font-mono">RDO:{v}</Badge>)}
                          {s.is_expired && <Badge variant="outline" className="text-[9px] border-border text-muted-foreground px-1.5">Expired</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length > 150 && (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Showing 150 of {filtered.length} employees. Use search to narrow down.
          </p>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No employees match the current filter.</div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 5: Review Queue ──────────────────────────────────────────────────────

function ReviewQueueTab({ result }: { result: ExtractionResult }) {
  const rdoNeedsReview = result.rdo_extractions.filter(r => r.extraction_status === 'needs_review');
  const srUnclassified = result.sr_extractions.filter(r => r.extraction_status === 'unclassified' && !r.is_expired);
  const unmatched_rdo = result.unmatched_rdo;
  const unmatched_sr = result.unmatched_sr;

  return (
    <div className="space-y-4">
      {/* RDO needs review */}
      <Card className="bg-card/50 border-amber/20">
        <CardContent className="p-4">
          <p className="text-[10px] font-mono text-amber uppercase mb-3 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> RDO Notes — Cannot Parse ({rdoNeedsReview.length})
          </p>
          {rdoNeedsReview.length === 0
            ? <p className="text-xs text-muted-foreground italic">None — all RDO notes were parsed successfully.</p>
            : (
              <div className="space-y-1.5">
                {rdoNeedsReview.map(r => (
                  <div key={r.source_etl_record_id} className="flex items-center gap-3 text-[11px] font-mono bg-amber/5 border border-amber/10 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground w-16">#{r.payroll}</span>
                    <span className="text-muted-foreground w-32">{r.period}</span>
                    <span className="text-amber flex-1">"{r.raw_notes}"</span>
                    <Badge variant="outline" className="text-[9px] border-amber/30 text-amber px-1.5">Needs Review</Badge>
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>

      {/* SR unclassified */}
      <Card className="bg-card/50 border-coral/20">
        <CardContent className="p-4">
          <p className="text-[10px] font-mono text-coral uppercase mb-3 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Special Requests — Cannot Classify ({srUnclassified.length})
          </p>
          {srUnclassified.length === 0
            ? <p className="text-xs text-muted-foreground italic">None — all active special requests were classified.</p>
            : (
              <div className="space-y-1.5">
                {srUnclassified.map(r => (
                  <div key={r.source_etl_record_id} className="flex items-center gap-3 text-[11px] font-mono bg-coral/5 border border-coral/10 rounded px-2.5 py-1.5">
                    <span className="text-muted-foreground w-16">#{r.emp_no}</span>
                    <Badge variant="outline" className={`text-[9px] flex-shrink-0 ${r.position === 'SUP' ? 'border-indigo/30 text-indigo' : 'border-amber/30 text-amber'}`}>{r.position}</Badge>
                    <span className="text-coral flex-1">"{r.assigned_to_raw}"</span>
                    <Badge variant="outline" className="text-[9px] border-coral/30 text-coral px-1.5">Unclassified</Badge>
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>

      {/* Unmatched RDO */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-3 flex items-center gap-1">
            <Info className="w-3 h-3" /> Unmatched RDO Payrolls ({unmatched_rdo.length})
          </p>
          {unmatched_rdo.length === 0
            ? <p className="text-xs text-muted-foreground italic">All RDO payrolls matched to roster employees.</p>
            : (
              <div className="space-y-1.5">
                {unmatched_rdo.map(r => (
                  <div key={r.source_etl_record_id} className="flex items-center gap-3 text-[11px] font-mono bg-secondary/20 border border-border/30 rounded px-2.5 py-1.5">
                    <span className="text-foreground w-16">#{r.payroll}</span>
                    <span className="text-muted-foreground w-32">{r.period}</span>
                    <div className="flex gap-1">
                      {r.extracted_rdo_dates.map(d => <Badge key={d} variant="outline" className="text-[9px] border-teal/30 text-teal px-1.5 font-mono">{d}</Badge>)}
                    </div>
                    <Badge variant="outline" className="text-[9px] border-border text-muted-foreground px-1.5">Not in 1.3</Badge>
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>

      {/* Unmatched SR */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-3 flex items-center gap-1">
            <Info className="w-3 h-3" /> Unmatched Special Requests ({unmatched_sr.length})
          </p>
          {unmatched_sr.length === 0
            ? <p className="text-xs text-muted-foreground italic">All active special request employees matched to roster.</p>
            : (
              <div className="space-y-1.5">
                {unmatched_sr.map(r => (
                  <div key={r.source_etl_record_id} className="flex items-center gap-3 text-[11px] font-mono bg-secondary/20 border border-border/30 rounded px-2.5 py-1.5">
                    <span className="text-foreground w-16">#{r.emp_no}</span>
                    <Badge variant="outline" className={`text-[9px] flex-shrink-0 ${r.position === 'SUP' ? 'border-indigo/30 text-indigo' : 'border-amber/30 text-amber'}`}>{r.position}</Badge>
                    <span className="text-muted-foreground flex-1 truncate">"{r.assigned_to_raw}"</span>
                    <Badge variant="outline" className="text-[9px] border-border text-muted-foreground px-1.5">Not in 1.3</Badge>
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIExtractionReview() {
  const [result, setResult] = useState<ExtractionResult | null>(getExtractionCache());
  const [loading, setLoading] = useState(!getExtractionCache());
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(getExtractionCache() ? new Date() : null);

  useEffect(() => {
    if (result) return;
    setLoading(true);
    runExtraction()
      .then(r => {
        setResult(r);
        setLoadedAt(new Date());
        setError(null);
      })
      .catch(e => setError(String(e?.message || e)))
      .finally(() => setLoading(false));
  }, [result]);

  const handleRefresh = () => {
    clearExtractionCache();
    setResult(null);
    setError(null);
    setLoading(true);
    runExtraction()
      .then(r => {
        setResult(r);
        setLoadedAt(new Date());
        setError(null);
      })
      .catch(e => setError(String(e?.message || e)))
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal" /> AI Extraction Review
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            RDO + Special Request extraction from leave request & couple shift files, matched to 1.3 roster
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loadedAt && (
            <span className="text-[10px] font-mono text-muted-foreground">
              Loaded {loadedAt.toLocaleTimeString()} · cached
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="h-7 text-xs border-border/50"
          >
            <RefreshCw className={`w-3 h-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-6 h-6 text-teal animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Running extraction pipeline...</p>
            <p className="text-[10px] text-muted-foreground mt-1">Loading 3 source files and matching to roster</p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="bg-coral/5 border-coral/20">
          <CardContent className="p-4 flex items-start gap-3">
            <XCircle className="w-4 h-4 text-coral mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-coral">Extraction failed</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      {result && !loading && (
        <Tabs defaultValue="summary">
          <TabsList className="bg-secondary/30 border border-border/50 h-8">
            <TabsTrigger value="summary" className="text-[11px] h-6 data-[state=active]:bg-teal/10 data-[state=active]:text-teal">
              Upload Summary
            </TabsTrigger>
            <TabsTrigger value="rdo" className="text-[11px] h-6 data-[state=active]:bg-teal/10 data-[state=active]:text-teal">
              RDO Results <span className="ml-1 opacity-60">({result.stats.rdo_with_dates})</span>
            </TabsTrigger>
            <TabsTrigger value="sr" className="text-[11px] h-6 data-[state=active]:bg-teal/10 data-[state=active]:text-teal">
              Special Requests <span className="ml-1 opacity-60">({result.stats.sr_active})</span>
            </TabsTrigger>
            <TabsTrigger value="roster" className="text-[11px] h-6 data-[state=active]:bg-teal/10 data-[state=active]:text-teal">
              Enriched Roster <span className="ml-1 opacity-60">({result.stats.total_roster})</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="text-[11px] h-6 data-[state=active]:bg-teal/10 data-[state=active]:text-teal">
              Review Queue <span className="ml-1 opacity-60">({result.stats.rdo_needs_review + result.sr_extractions.filter(r => r.extraction_status === 'unclassified' && !r.is_expired).length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <UploadSummaryTab result={result} />
          </TabsContent>
          <TabsContent value="rdo" className="mt-4">
            <RDOResultsTab records={result.rdo_extractions} />
          </TabsContent>
          <TabsContent value="sr" className="mt-4">
            <SRResultsTab records={result.sr_extractions} />
          </TabsContent>
          <TabsContent value="roster" className="mt-4">
            <EnrichedRosterTab employees={result.enriched_roster} />
          </TabsContent>
          <TabsContent value="review" className="mt-4">
            <ReviewQueueTab result={result} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
