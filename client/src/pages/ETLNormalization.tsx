/**
 * ETL & Normalization — Reads real data from Supabase etl_records table
 * Shows uploaded records grouped by file, with confidence scores, warnings, and review status
 * Design: Control Tower dark theme — slate/teal/amber/red
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Database, CheckCircle2, AlertTriangle, XCircle, Eye,
  RefreshCw, ChevronDown, ChevronRight, FileSpreadsheet,
  Filter, Layers, ArrowRight, Clock, Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getOrCreateSession } from '@/lib/sessionManager';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ETLRecord {
  id: string;
  session_id: string | null;
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

interface UploadBatch {
  id: string;
  upload_name: string;
  file_type: string;
  total_records: number;
  processed_records: number;
  status: string;
}

interface FileGroup {
  batch: UploadBatch;
  records: ETLRecord[];
  totalCount: number;
  lowConfCount: number;
  needsReviewCount: number;
  approvedCount: number;
}

type FilterType = 'all' | 'warning' | 'review' | 'approved' | 'ok';

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
    shift: 'Shift',
    rdo_request: 'RDO Request',
    couple_shift: 'Couple Shift',
    eves: 'EV/ES Employee',
    floor_spread: 'Floor Spread',
    unknown: 'Unclassified',
  };
  return labels[type] || type;
}

function getRecordTypeColor(type: string): string {
  const colors: Record<string, string> = {
    shift: 'text-teal border-teal/30',
    rdo_request: 'text-indigo border-indigo/30',
    couple_shift: 'text-amber border-amber/30',
    eves: 'text-violet-400 border-violet-400/30',
    floor_spread: 'text-sky-400 border-sky-400/30',
    unknown: 'text-muted-foreground border-border',
  };
  return colors[type] || 'text-muted-foreground border-border';
}

function formatRawData(data: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .slice(0, 12)
    .map(([k, v]) => ({
      key: k,
      value: typeof v === 'number' && v > 40000 && v < 50000
        ? `[Excel date: ${v}]`
        : String(v),
    }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RecordRow({ record, onApprove }: { record: ETLRecord; onApprove: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const conf = record.confidence_level;
  const hasWarnings = record.warning_flags.length > 0;
  const isApproved = !!record.approved_by;

  return (
    <div className={`border-b border-border last:border-0 ${record.needs_review ? 'bg-amber/3' : ''}`}>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand toggle */}
        <button className="text-muted-foreground flex-shrink-0">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* Row number */}
        <span className="text-[10px] font-mono text-muted-foreground w-10 flex-shrink-0">
          #{record.row_number}
        </span>

        {/* Sheet */}
        <span className="text-[10px] text-muted-foreground w-32 flex-shrink-0 truncate">
          {record.source_sheet}
        </span>

        {/* Record type */}
        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 flex-shrink-0 ${getRecordTypeColor(record.record_type)}`}>
          {getRecordTypeLabel(record.record_type)}
        </Badge>

        {/* Confidence */}
        <span className={`text-[10px] font-mono font-semibold w-12 flex-shrink-0 ${getConfidenceColor(conf)}`}>
          {conf.toFixed(0)}%
        </span>

        {/* Status indicators */}
        <div className="flex items-center gap-1.5 flex-1">
          {isApproved && (
            <span className="flex items-center gap-1 text-[9px] text-teal">
              <CheckCircle2 className="w-3 h-3" /> Approved
            </span>
          )}
          {record.needs_review && !isApproved && (
            <span className="flex items-center gap-1 text-[9px] text-amber">
              <Eye className="w-3 h-3" /> Needs Review
            </span>
          )}
          {hasWarnings && (
            <span className="flex items-center gap-1 text-[9px] text-amber">
              <AlertTriangle className="w-3 h-3" /> {record.warning_flags.length} warning{record.warning_flags.length > 1 ? 's' : ''}
            </span>
          )}
          {!record.needs_review && !hasWarnings && !isApproved && (
            <span className="flex items-center gap-1 text-[9px] text-teal">
              <CheckCircle2 className="w-3 h-3" /> Valid
            </span>
          )}
        </div>

        {/* Approve button */}
        {record.needs_review && !isApproved && (
          <Button
            size="sm"
            variant="outline"
            className="h-5 text-[9px] px-2 border-teal/30 text-teal hover:bg-teal/10"
            onClick={(e) => { e.stopPropagation(); onApprove(record.id); }}
          >
            Approve
          </Button>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-8 pb-3 space-y-2">
          {/* Warning flags */}
          {hasWarnings && (
            <div className="bg-amber/5 border border-amber/20 rounded p-2">
              <p className="text-[9px] font-mono text-amber mb-1">⚠ Warning Flags</p>
              {record.warning_flags.map((w, i) => (
                <p key={i} className="text-[10px] text-amber/80">• {w}</p>
              ))}
            </div>
          )}

          {/* Raw data fields */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary/30 rounded p-2">
              <p className="text-[9px] font-mono text-muted-foreground mb-1.5">RAW DATA</p>
              <div className="space-y-0.5">
                {formatRawData(record.raw_data).map(({ key, value }) => (
                  <div key={key} className="flex gap-2 text-[9px]">
                    <span className="font-mono text-muted-foreground w-24 flex-shrink-0 truncate">{key}:</span>
                    <span className="text-foreground/80 truncate">{value}</span>
                  </div>
                ))}
                {Object.keys(record.raw_data).length > 12 && (
                  <p className="text-[9px] text-muted-foreground">+{Object.keys(record.raw_data).length - 12} more fields</p>
                )}
              </div>
            </div>

            <div className="bg-teal/5 border border-teal/10 rounded p-2">
              <p className="text-[9px] font-mono text-teal mb-1.5">NORMALIZED DATA</p>
              <div className="space-y-0.5">
                {record.normalized_data
                  ? formatRawData(record.normalized_data).map(({ key, value }) => (
                    <div key={key} className="flex gap-2 text-[9px]">
                      <span className="font-mono text-muted-foreground w-24 flex-shrink-0 truncate">{key}:</span>
                      <span className="text-foreground/80 truncate">{value}</span>
                    </div>
                  ))
                  : <p className="text-[9px] text-muted-foreground italic">Same as raw data</p>
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileGroupCard({
  group,
  filter,
  onApprove,
}: {
  group: FileGroup;
  filter: FilterType;
  onApprove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const filteredRecords = group.records.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'warning') return r.warning_flags.length > 0;
    if (filter === 'review') return r.needs_review && !r.approved_by;
    if (filter === 'approved') return !!r.approved_by;
    if (filter === 'ok') return !r.needs_review && r.warning_flags.length === 0;
    return true;
  });

  const confAvg = group.records.length > 0
    ? group.records.reduce((s, r) => s + r.confidence_level, 0) / group.records.length
    : 0;

  return (
    <Card className="bg-card border-border overflow-hidden">
      {/* File header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/20 transition-colors border-b border-border"
        onClick={() => setExpanded(!expanded)}
      >
        <FileSpreadsheet className="w-4 h-4 text-teal flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono font-medium text-foreground truncate">{group.batch.upload_name}</p>
          <p className="text-[10px] text-muted-foreground">
            {group.totalCount.toLocaleString()} records · {group.batch.file_type || 'unknown type'}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-center">
            <p className={`text-xs font-mono font-semibold ${getConfidenceColor(confAvg)}`}>{confAvg.toFixed(0)}%</p>
            <p className="text-[9px] text-muted-foreground">avg conf</p>
          </div>
          {group.needsReviewCount > 0 && (
            <Badge variant="outline" className="text-[9px] border-amber/30 text-amber px-1.5">
              {group.needsReviewCount} review
            </Badge>
          )}
          {group.approvedCount > 0 && (
            <Badge variant="outline" className="text-[9px] border-teal/30 text-teal px-1.5">
              {group.approvedCount} approved
            </Badge>
          )}
          <Badge variant="outline" className={`text-[9px] px-1.5 ${group.batch.status === 'completed' ? 'border-teal/30 text-teal' : 'border-amber/30 text-amber'}`}>
            {group.batch.status}
          </Badge>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>

      {/* Records table */}
      {expanded && (
        <div>
          {/* Table header */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 border-b border-border">
            <span className="w-4 flex-shrink-0" />
            <span className="text-[9px] font-mono text-muted-foreground w-10 flex-shrink-0">ROW</span>
            <span className="text-[9px] font-mono text-muted-foreground w-32 flex-shrink-0">SHEET</span>
            <span className="text-[9px] font-mono text-muted-foreground w-24 flex-shrink-0">TYPE</span>
            <span className="text-[9px] font-mono text-muted-foreground w-12 flex-shrink-0">CONF</span>
            <span className="text-[9px] font-mono text-muted-foreground flex-1">STATUS</span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No records match the current filter.
            </div>
          ) : (
            <div>
              {filteredRecords.slice(0, 200).map(record => (
                <RecordRow key={record.id} record={record} onApprove={onApprove} />
              ))}
              {filteredRecords.length > 200 && (
                <div className="p-3 text-center text-xs text-muted-foreground border-t border-border">
                  Showing 200 of {filteredRecords.length.toLocaleString()} records. Use filters to narrow down.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ETLNormalization() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [fileGroups, setFileGroups] = useState<FileGroup[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalStats, setTotalStats] = useState({
    total: 0, lowConf: 0, needsReview: 0, approved: 0,
  });

  // Load session and batches
  useEffect(() => {
    async function init() {
      try {
        const session = await getOrCreateSession();
        setSessionId(session.id);
      } catch (e) {
        setError('Failed to load session');
        setLoading(false);
      }
    }
    init();
  }, []);

  // Load batches when session changes
  useEffect(() => {
    if (!sessionId) return;
    loadData(sessionId);
  }, [sessionId]);

  const loadData = useCallback(async (sid: string) => {
    setLoading(true);
    setError(null);
    try {
      // Load batches
      const { data: batchData, error: batchErr } = await supabase
        .from('upload_batches')
        .select('*')
        .eq('session_id', sid)
        .order('batch_order', { ascending: true });

      if (batchErr) throw batchErr;
      const loadedBatches: UploadBatch[] = batchData || [];
      setBatches(loadedBatches);

      if (loadedBatches.length === 0) {
        setFileGroups([]);
        setLoading(false);
        return;
      }

      // Load ETL records for all batches
      setLoadingRecords(true);
      const allRecords: ETLRecord[] = [];
      const PAGE = 1000;

      for (let start = 0; ; start += PAGE) {
        const end = start + PAGE - 1;
        const { data, error: recErr } = await supabase
          .from('etl_records')
          .select('id,session_id,upload_batch_id,source_file,source_sheet,row_number,record_type,raw_data,normalized_data,confidence_level,warning_flags,needs_review,approved_by,approved_at,status')
          .eq('session_id', sid)
          .range(start, end);

        if (recErr) throw recErr;
        if (!data || data.length === 0) break;
        allRecords.push(...(data as ETLRecord[]));
        if (data.length < PAGE) break;
      }

      // Group by batch
      const groups: FileGroup[] = loadedBatches.map(batch => {
        const records = allRecords.filter(r => r.upload_batch_id === batch.id);
        return {
          batch,
          records,
          totalCount: batch.total_records,
          lowConfCount: records.filter(r => r.confidence_level < 80).length,
          needsReviewCount: records.filter(r => r.needs_review && !r.approved_by).length,
          approvedCount: records.filter(r => !!r.approved_by).length,
        };
      });

      setFileGroups(groups);
      setTotalStats({
        total: allRecords.length,
        lowConf: allRecords.filter(r => r.confidence_level < 80).length,
        needsReview: allRecords.filter(r => r.needs_review && !r.approved_by).length,
        approved: allRecords.filter(r => !!r.approved_by).length,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setLoadingRecords(false);
    }
  }, []);

  const handleApprove = async (recordId: string) => {
    const { error } = await supabase
      .from('etl_records')
      .update({ approved_by: 'ops_manager', approved_at: new Date().toISOString() })
      .eq('id', recordId);

    if (!error && sessionId) {
      // Refresh data
      loadData(sessionId);
    }
  };

  const filterButtons: { key: FilterType; label: string; count: number; cls: string }[] = [
    { key: 'all', label: 'All Records', count: totalStats.total, cls: 'text-foreground border-border' },
    { key: 'review', label: 'Needs Review', count: totalStats.needsReview, cls: 'text-amber border-amber/30' },
    { key: 'warning', label: 'Warnings', count: totalStats.lowConf, cls: 'text-amber border-amber/30' },
    { key: 'approved', label: 'Approved', count: totalStats.approved, cls: 'text-teal border-teal/30' },
    { key: 'ok', label: 'Clean', count: Math.max(0, totalStats.total - totalStats.needsReview - totalStats.lowConf), cls: 'text-teal border-teal/30' },
  ];

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-amber" />
            ETL & NORMALIZATION
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Raw Excel data parsed, normalized, and validated. Review warnings and approve records before roster generation.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 border-border text-muted-foreground hover:text-foreground"
          onClick={() => sessionId && loadData(sessionId)}
          disabled={loading}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Pipeline steps */}
      <Card className="bg-card border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Excel Upload', icon: FileSpreadsheet, done: true },
              { label: 'Parse & Extract', icon: Layers, done: true },
              { label: 'Normalize Fields', icon: Database, done: true },
              { label: 'Confidence Score', icon: Info, done: true },
              { label: 'Review & Approve', icon: CheckCircle2, done: totalStats.approved > 0 },
              { label: 'Roster Generation', icon: ArrowRight, done: false },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1 text-[10px] font-mono ${step.done ? 'text-teal' : 'text-muted-foreground'}`}>
                  <step.icon className="w-3 h-3" />
                  {step.label}
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/40" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: totalStats.total.toLocaleString(), color: 'text-foreground', bg: 'bg-secondary/30' },
          { label: 'Needs Review', value: totalStats.needsReview.toLocaleString(), color: 'text-amber', bg: 'bg-amber/5 border-amber/20' },
          { label: 'Low Confidence', value: totalStats.lowConf.toLocaleString(), color: 'text-coral', bg: 'bg-coral/5 border-coral/20' },
          { label: 'Approved', value: totalStats.approved.toLocaleString(), color: 'text-teal', bg: 'bg-teal/5 border-teal/20' },
        ].map(stat => (
          <Card key={stat.label} className={`border ${stat.bg}`}>
            <CardContent className="p-3">
              <p className={`text-xl font-mono font-bold ${stat.color}`}>{loading ? '—' : stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        {filterButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-mono transition-colors
              ${filter === btn.key ? `${btn.cls} bg-secondary/50` : 'text-muted-foreground border-border hover:border-foreground/20'}`}
          >
            {btn.label}
            <span className="opacity-70">({loading ? '…' : btn.count.toLocaleString()})</span>
          </button>
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
            <RefreshCw className="w-6 h-6 text-teal animate-spin mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">
              {loadingRecords ? 'Loading ETL records from database…' : 'Initializing session…'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && batches.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Go to <span className="text-teal font-mono">Data Intake</span> to upload your Excel roster files.
            </p>
          </CardContent>
        </Card>
      )}

      {/* File groups */}
      {!loading && !error && fileGroups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] font-mono text-muted-foreground">
              {fileGroups.length} file{fileGroups.length > 1 ? 's' : ''} in current session
              {totalStats.needsReview > 0 && (
                <span className="text-amber ml-2">· {totalStats.needsReview.toLocaleString()} records need review</span>
              )}
            </p>
          </div>
          {fileGroups.map(group => (
            <FileGroupCard
              key={group.batch.id}
              group={group}
              filter={filter}
              onApprove={handleApprove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
