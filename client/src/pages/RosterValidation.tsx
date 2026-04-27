/*
 * Roster Validation Console — Key page for reviewing generated roster results
 * 4 Layers: Batch Info, Result Table, AI Tag Detail Drawer, Review/Override
 * Database-aligned field names from AI_Shift_Scheduling_Result_Table
 */
import { useState, useMemo } from 'react';
import {
  Database, FileCheck, Eye, ArrowRight, ChevronRight, ChevronDown,
  Filter, Search, AlertTriangle, CheckCircle2, Clock, XCircle,
  Sparkles, FileText, Link2, Shield, X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BATCH_TASKS, ROSTER_RESULTS, RosterResultRow, OVERRIDE_LOGS } from '@/lib/databaseMockData';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  approved: { color: 'text-teal', icon: CheckCircle2 },
  pending: { color: 'text-amber', icon: Clock },
  needs_review: { color: 'text-coral', icon: AlertTriangle },
  overridden: { color: 'text-indigo', icon: Shield },
};

type FilterKey = 'all' | 'changed' | 'rdo' | 'sr' | 'eves' | 'training' | 'couple' | 'needs_review';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'changed', label: 'Changed Only' },
  { key: 'rdo', label: 'RDO Related' },
  { key: 'sr', label: 'Special Request' },
  { key: 'eves', label: 'EV/ES' },
  { key: 'training', label: 'Training' },
  { key: 'couple', label: 'Couple' },
  { key: 'needs_review', label: 'Needs Review' },
];

function TagBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  const colors: Record<string, string> = {
    RDO: 'bg-teal/10 text-teal border-teal/20',
    SR: 'bg-indigo/10 text-indigo border-indigo/20',
    'EV/ES': 'bg-amber/10 text-amber border-amber/20',
    Training: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Couple: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    Changed: 'bg-amber/10 text-amber border-amber/20',
  };
  return (
    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${colors[label] || 'border-border text-muted-foreground'}`}>
      {label}
    </Badge>
  );
}

function DetailDrawer({ row, onClose }: { row: RosterResultRow; onClose: () => void }) {
  const [tab, setTab] = useState('summary');
  const override = OVERRIDE_LOGS.find(o => o.EmployeeNumber === row.EmployeeNumber && o.ShiftDate === row.ShiftDate);

  return (
    <div className="w-[420px] border-l border-border bg-card flex flex-col shrink-0 h-full">
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div>
          <p className="text-sm font-mono font-semibold text-foreground">{row.EmployeeName}</p>
          <p className="text-[10px] text-muted-foreground font-mono">{row.EmployeeNumber} · {row.ShiftDate}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary/50"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-3 bg-secondary/30 shrink-0">
          <TabsTrigger value="summary" className="text-[11px]">Change Summary</TabsTrigger>
          <TabsTrigger value="ai" className="text-[11px]">AI Tags</TabsTrigger>
          <TabsTrigger value="lineage" className="text-[11px]">Source Lineage</TabsTrigger>
          <TabsTrigger value="override" className="text-[11px]">Review</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="summary" className="mt-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-secondary/20 rounded">
                <p className="text-[9px] text-muted-foreground uppercase">Old Shift</p>
                <p className="text-sm font-mono font-bold text-muted-foreground">{row.OldShiftValue || '—'}</p>
              </div>
              <div className="p-2 bg-secondary/20 rounded">
                <p className="text-[9px] text-muted-foreground uppercase">New Shift</p>
                <p className={`text-sm font-mono font-bold ${row.IsChanged ? 'text-amber' : 'text-foreground'}`}>{row.ShiftValue}</p>
              </div>
            </div>
            {row.IsChanged === 1 && (
              <div className="flex items-center gap-2 p-2 bg-amber/5 rounded border border-amber/20">
                <AlertTriangle className="w-3.5 h-3.5 text-amber shrink-0" />
                <p className="text-xs text-muted-foreground">Changed by Rule</p>
              </div>
            )}
            <div className="space-y-2">
              <div><p className="text-[9px] text-muted-foreground uppercase mb-1">Change Detail</p><p className="text-xs text-muted-foreground">{row.ChangeDetail || 'No changes'}</p></div>
              <div><p className="text-[9px] text-muted-foreground uppercase mb-1">Rotation</p><p className="text-xs font-mono text-muted-foreground">{row.Rotation}</p></div>
              <div><p className="text-[9px] text-muted-foreground uppercase mb-1">RDO Display</p><p className="text-xs font-mono text-muted-foreground">{row.RDO_Display || '—'}</p></div>
              <div><p className="text-[9px] text-muted-foreground uppercase mb-1">Review Status</p>
                <Badge variant="outline" className={`text-[10px] ${STATUS_CONFIG[row.review_status]?.color || ''}`}>
                  {row.review_status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-0 space-y-3">
            <div className="space-y-2">
              <div className="p-2 bg-secondary/20 rounded">
                <p className="text-[9px] text-muted-foreground uppercase mb-1">ai_result_raw</p>
                <p className="text-xs font-mono text-teal">{row.ai_result_raw || '(empty)'}</p>
                <p className="text-[10px] text-muted-foreground mt-1">AI-extracted RDO date array from Notes field</p>
              </div>
              <div className="p-2 bg-secondary/20 rounded">
                <p className="text-[9px] text-muted-foreground uppercase mb-1">SpecialRequestAI</p>
                <p className="text-xs font-mono text-indigo">{row.SpecialRequestAI || '(empty)'}</p>
                <p className="text-[10px] text-muted-foreground mt-1">AI-parsed allow/refuse shift constraint from free text</p>
              </div>
              <div className="p-2 bg-secondary/20 rounded">
                <p className="text-[9px] text-muted-foreground uppercase mb-1">IsEVES</p>
                <p className="text-xs font-mono text-amber">{row.IsEVES}</p>
                <p className="text-[10px] text-muted-foreground mt-1">EV/ES flag — list-driven tagging, not AI extraction</p>
              </div>
              <div className="p-2 bg-secondary/20 rounded">
                <p className="text-[9px] text-muted-foreground uppercase mb-1">RDO_Display</p>
                <p className="text-xs font-mono text-foreground">{row.RDO_Display || '—'}</p>
              </div>
              <div className="p-2 bg-secondary/20 rounded">
                <p className="text-[9px] text-muted-foreground uppercase mb-1">CoupleIDs</p>
                <p className="text-xs font-mono text-pink-400">{row.CoupleIDs || '(none)'}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Couple data loaded — not active as algorithmic constraint</p>
              </div>
              <div className="p-2 bg-secondary/20 rounded">
                <p className="text-[9px] text-muted-foreground uppercase mb-1">HasTraining</p>
                <p className="text-xs font-mono text-purple-400">{row.HasTraining}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Training module built but not enabled in production</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lineage" className="mt-0 space-y-3">
            {row.ai_result_raw && row.ai_result_raw !== '' && (
              <div className="p-3 bg-teal/5 rounded border border-teal/20">
                <p className="text-xs font-medium text-teal mb-2 flex items-center gap-1"><Link2 className="w-3 h-3" /> RDO Lineage</p>
                <div className="space-y-1 text-[10px] text-muted-foreground font-mono">
                  <p>req_rdo_leave_table.Notes</p>
                  <p className="text-teal">→ ai_result (AI extraction)</p>
                  <p>→ AI_Shift_Scheduling_Result_Table.ai_result_raw</p>
                  <p>→ RDO_Display / ShiftValue</p>
                </div>
              </div>
            )}
            {row.SpecialRequestAI && (
              <div className="p-3 bg-indigo/5 rounded border border-indigo/20">
                <p className="text-xs font-medium text-indigo mb-2 flex items-center gap-1"><Link2 className="w-3 h-3" /> SR Lineage</p>
                <div className="space-y-1 text-[10px] text-muted-foreground font-mono">
                  <p>couple_special_request.AssignedTo</p>
                  <p className="text-indigo">→ ai_type / ai_value / ai_rdo (AI parsing)</p>
                  <p>→ SpecialRequestAI</p>
                  <p>→ ShiftValue impact</p>
                </div>
              </div>
            )}
            {row.IsEVES === 1 && (
              <div className="p-3 bg-amber/5 rounded border border-amber/20">
                <p className="text-xs font-medium text-amber mb-2 flex items-center gap-1"><Link2 className="w-3 h-3" /> EV/ES Lineage</p>
                <div className="space-y-1 text-[10px] text-muted-foreground font-mono">
                  <p>wm_wp_ev_es_employee.EmployeeID</p>
                  <p className="text-amber">→ IsEVES = 1 (list-driven, not AI)</p>
                  <p>→ EV/ES schedule pattern</p>
                  <p>→ ShiftValue</p>
                </div>
              </div>
            )}
            {!row.ai_result_raw && !row.SpecialRequestAI && row.IsEVES === 0 && (
              <div className="p-3 bg-secondary/20 rounded">
                <p className="text-xs text-muted-foreground">No AI tags or special lineage for this row. Standard validation applied.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="override" className="mt-0 space-y-3">
            {override ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-secondary/20 rounded">
                    <p className="text-[9px] text-muted-foreground uppercase">Original</p>
                    <p className="text-sm font-mono font-bold text-muted-foreground">{override.originalShift}</p>
                  </div>
                  <div className="p-2 bg-secondary/20 rounded">
                    <p className="text-[9px] text-muted-foreground uppercase">Rule Output</p>
                    <p className="text-sm font-mono font-bold text-amber">{override.ruleGeneratedShift}</p>
                  </div>
                  <div className="p-2 bg-indigo/10 rounded border border-indigo/20">
                    <p className="text-[9px] text-muted-foreground uppercase">Override</p>
                    <p className="text-sm font-mono font-bold text-indigo">{override.managerOverrideShift}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div><p className="text-[9px] text-muted-foreground uppercase mb-1">Affected Rule</p><p className="text-xs text-muted-foreground">{override.affectedRule}</p></div>
                  <div><p className="text-[9px] text-muted-foreground uppercase mb-1">Override Reason</p><p className="text-xs text-muted-foreground">{override.overrideReason}</p></div>
                  <div><p className="text-[9px] text-muted-foreground uppercase mb-1">Approver</p><p className="text-xs text-muted-foreground">{override.approver || 'Pending'}</p></div>
                  <div><p className="text-[9px] text-muted-foreground uppercase mb-1">Status</p>
                    <Badge variant="outline" className={`text-[10px] ${override.status === 'approved' ? 'text-teal border-teal/30' : override.status === 'pending' ? 'text-amber border-amber/30' : 'text-coral border-coral/30'}`}>
                      {override.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">No override recorded for this row.</p>
                <Button variant="outline" size="sm" className="text-xs gap-1 w-full" onClick={() => toast.info('Override form', { description: 'Feature coming soon — will connect to backend API' })}>
                  <Shield className="w-3 h-3" /> Request Manual Override
                </Button>
                <p className="text-[10px] text-muted-foreground">Managers can override where allowed. The system keeps an audit trail of all changes.</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default function RosterValidation() {
  const batch = BATCH_TASKS[0];
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<RosterResultRow | null>(null);

  const filteredRows = useMemo(() => {
    let rows = ROSTER_RESULTS.filter(r => r.batch_id === batch.batch_id);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      rows = rows.filter(r => r.EmployeeNumber.includes(s) || r.EmployeeName.toLowerCase().includes(s) || r.ShiftDate.includes(s));
    }
    switch (activeFilter) {
      case 'changed': return rows.filter(r => r.IsChanged === 1);
      case 'rdo': return rows.filter(r => r.ai_result_raw && r.ai_result_raw !== '' && r.ai_result_raw !== '[]');
      case 'sr': return rows.filter(r => r.SpecialRequestAI !== '');
      case 'eves': return rows.filter(r => r.IsEVES === 1);
      case 'training': return rows.filter(r => r.HasTraining === 1);
      case 'couple': return rows.filter(r => r.CoupleIDs !== '');
      case 'needs_review': return rows.filter(r => r.review_status === 'needs_review');
      default: return rows;
    }
  }, [activeFilter, searchTerm, batch.batch_id]);

  const changedCount = ROSTER_RESULTS.filter(r => r.batch_id === batch.batch_id && r.IsChanged === 1).length;
  const reviewCount = ROSTER_RESULTS.filter(r => r.batch_id === batch.batch_id && r.review_status === 'needs_review').length;

  return (
    <div className="flex gap-0 -m-5 h-[calc(100vh-3.5rem)]">
      <div className={`flex-1 flex flex-col overflow-hidden ${selectedRow ? '' : ''}`}>
        {/* Layer 1: Batch Info */}
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
                <Database className="w-4 h-4 text-teal" />
                ROSTER VALIDATION CONSOLE
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{batch.batch_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-teal/30 text-teal">{batch.status}</Badge>
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground font-mono">{batch.batch_id}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-2 bg-secondary/20 rounded">
              <p className="text-[9px] text-muted-foreground uppercase">Employees</p>
              <p className="text-lg font-mono font-bold text-foreground">{batch.total_employees}</p>
            </div>
            <div className="p-2 bg-secondary/20 rounded">
              <p className="text-[9px] text-muted-foreground uppercase">Result Rows</p>
              <p className="text-lg font-mono font-bold text-foreground">{batch.total_result_rows}</p>
            </div>
            <div className="p-2 bg-amber/5 rounded border border-amber/20">
              <p className="text-[9px] text-muted-foreground uppercase">Changed Rows</p>
              <p className="text-lg font-mono font-bold text-amber">{batch.changed_rows}</p>
            </div>
            <div className="p-2 bg-secondary/20 rounded">
              <p className="text-[9px] text-muted-foreground uppercase">Export</p>
              <p className="text-xs font-mono text-teal mt-1">{batch.export_status}</p>
            </div>
            <div className="p-2 bg-secondary/20 rounded">
              <p className="text-[9px] text-muted-foreground uppercase">Active Modules</p>
              <p className="text-lg font-mono font-bold text-teal">{batch.active_modules.length}</p>
            </div>
            <div className="p-2 bg-secondary/20 rounded">
              <p className="text-[9px] text-muted-foreground uppercase">Validation</p>
              <Badge variant="outline" className="text-[10px] border-amber/30 text-amber mt-1">{batch.customer_validation}</Badge>
            </div>
          </div>
        </div>

        {/* Layer 2: Filters + Result Table */}
        <div className="p-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-secondary/30 rounded-md px-2.5 py-1.5">
              <Search className="w-3 h-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search employee, date..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-36"
              />
            </div>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                  activeFilter === f.key ? 'bg-teal/15 text-teal border border-teal/30' : 'bg-secondary/20 text-muted-foreground hover:bg-secondary/40 border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-[10px] text-muted-foreground font-mono ml-auto">{filteredRows.length} rows</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 pb-4">
          <table className="w-full border-collapse min-w-[900px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-secondary/50">
                <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Employee</th>
                <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Date</th>
                <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Old</th>
                <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">→</th>
                <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">New</th>
                <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Change Detail</th>
                <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Tags</th>
                <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => {
                const isSelected = selectedRow?.id === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRow(row)}
                    className={`border-b border-border/30 transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo/5' : row.IsChanged ? 'bg-amber/3 hover:bg-amber/5' : 'hover:bg-secondary/20'
                    }`}
                  >
                    <td className="p-2">
                      <p className="text-xs font-medium text-foreground">{row.EmployeeName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{row.EmployeeNumber} · {row.Cls}</p>
                    </td>
                    <td className="p-2 text-xs font-mono text-muted-foreground">{row.ShiftDate}</td>
                    <td className="p-2 text-center">
                      <span className="text-xs font-mono text-muted-foreground">{row.OldShiftValue || '—'}</span>
                    </td>
                    <td className="p-2 text-center">
                      {row.IsChanged === 1 && <ArrowRight className="w-3 h-3 text-amber mx-auto" />}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`text-xs font-mono font-bold ${row.IsChanged ? 'text-amber' : 'text-foreground'}`}>{row.ShiftValue}</span>
                    </td>
                    <td className="p-2">
                      <p className="text-[10px] text-muted-foreground max-w-[250px] truncate">{row.ChangeDetail || '—'}</p>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <TagBadge label="RDO" active={!!(row.ai_result_raw && row.ai_result_raw !== '' && row.ai_result_raw !== '[]')} />
                        <TagBadge label="SR" active={row.SpecialRequestAI !== ''} />
                        <TagBadge label="EV/ES" active={row.IsEVES === 1} />
                        <TagBadge label="Training" active={row.HasTraining === 1} />
                        <TagBadge label="Couple" active={row.CoupleIDs !== ''} />
                        <TagBadge label="Changed" active={row.IsChanged === 1} />
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      {(() => {
                        const cfg = STATUS_CONFIG[row.review_status];
                        const Icon = cfg?.icon || Clock;
                        return <Icon className={`w-3.5 h-3.5 mx-auto ${cfg?.color || 'text-muted-foreground'}`} />;
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Layer 3 & 4: Detail Drawer */}
      {selectedRow && (
        <DetailDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  );
}
