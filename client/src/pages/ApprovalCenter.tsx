/*
 * Approval Center — Schedule review & publish workflow
 * Shows draft schedule status, compliance summary, and approval actions
 */
import { useState } from 'react';
import {
  CheckSquare,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DASHBOARD_METRICS, CONFLICTS, RULES, WEEK_LABEL } from '@/lib/mockData';
import { toast } from 'sonner';

interface ApprovalItem {
  id: string;
  weekLabel: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  complianceRate: number;
  hardViolations: number;
  softWarnings: number;
  unresolvedConflicts: number;
  aiScore: number;
  comments: { author: string; text: string; timestamp: string }[];
}

const APPROVAL_ITEMS: ApprovalItem[] = [
  {
    id: 'APR-001',
    weekLabel: 'Week 18 — Apr 27 – May 3, 2026',
    status: 'pending',
    submittedBy: 'AI Scheduler + Ops Manager',
    submittedAt: '2026-04-23 09:00',
    complianceRate: 94.2,
    hardViolations: 0,
    softWarnings: 3,
    unresolvedConflicts: 3,
    aiScore: 87,
    comments: [
      { author: 'AI Engine', text: 'Schedule generated with 87% optimization score. 3 soft-rule warnings remain: couple shift mismatch, consecutive night advisory, and skip-shift info. All hard rules satisfied.', timestamp: '2026-04-23 08:45' },
      { author: 'Ops Manager', text: 'Reviewed couple shift issue — acceptable for this week due to training conflict. Please proceed with approval.', timestamp: '2026-04-23 09:15' },
    ],
  },
  {
    id: 'APR-002',
    weekLabel: 'Week 17 — Apr 21–27, 2026',
    status: 'approved',
    submittedBy: 'AI Scheduler + Ops Manager',
    submittedAt: '2026-04-16 10:30',
    complianceRate: 97.8,
    hardViolations: 0,
    softWarnings: 1,
    unresolvedConflicts: 0,
    aiScore: 92,
    comments: [
      { author: 'Dept Approver', text: 'Approved. All conflicts resolved. Good work on the VIP event coverage.', timestamp: '2026-04-16 14:00' },
    ],
  },
  {
    id: 'APR-003',
    weekLabel: 'Week 16 — Apr 14–20, 2026',
    status: 'approved',
    submittedBy: 'AI Scheduler + Ops Manager',
    submittedAt: '2026-04-09 11:00',
    complianceRate: 96.5,
    hardViolations: 0,
    softWarnings: 2,
    unresolvedConflicts: 0,
    aiScore: 89,
    comments: [],
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'border-muted-foreground/30 text-muted-foreground',
    pending: 'border-amber/40 text-amber bg-amber/5',
    approved: 'border-teal/40 text-teal bg-teal/5',
    rejected: 'border-coral/40 text-coral bg-coral/5',
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status] || ''}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function ApprovalCenter() {
  const [selectedId, setSelectedId] = useState<string>(APPROVAL_ITEMS[0].id);
  const selected = APPROVAL_ITEMS.find(a => a.id === selectedId);

  return (
    <div className="flex gap-0 -m-5 h-[calc(100vh-3.5rem)]">
      {/* List panel */}
      <div className="w-96 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border shrink-0">
          <h2 className="text-sm font-mono font-semibold text-foreground tracking-wide flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-teal" />
            APPROVAL QUEUE
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Review and approve weekly schedules</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {APPROVAL_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`w-full text-left p-3 rounded-md border transition-colors ${
                selectedId === item.id
                  ? 'border-indigo/30 bg-indigo/5'
                  : 'border-border bg-card hover:bg-secondary/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{item.weekLabel}</p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {item.complianceRate}%
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI: {item.aiScore}
                </span>
                {item.unresolvedConflicts > 0 && (
                  <span className="flex items-center gap-1 text-amber">
                    <AlertTriangle className="w-3 h-3" />
                    {item.unresolvedConflicts}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto p-5">
        {selected ? (
          <div className="max-w-3xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-mono font-bold text-foreground">{selected.weekLabel}</h2>
                  <StatusBadge status={selected.status} />
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {selected.id} · Submitted by {selected.submittedBy} · {selected.submittedAt}
                </p>
              </div>
              {selected.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1 border-coral/30 text-coral hover:bg-coral/10"
                    onClick={() => toast.error('Schedule rejected', { description: 'Returned to Ops Manager for revision.' })}
                  >
                    <XCircle className="w-3 h-3" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs gap-1 bg-teal text-[#0f1117] hover:bg-teal/80"
                    onClick={() => toast.success('Schedule approved & published!', { description: 'Week 18 schedule is now live.' })}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Approve & Publish
                  </Button>
                </div>
              )}
            </div>

            {/* Compliance summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className={`${selected.complianceRate >= 95 ? 'bg-teal/5 border-teal/20' : 'bg-amber/5 border-amber/20'}`}>
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Compliance Rate</p>
                  <p className={`text-xl font-mono font-bold ${selected.complianceRate >= 95 ? 'text-teal' : 'text-amber'}`}>
                    {selected.complianceRate}%
                  </p>
                  <Progress value={selected.complianceRate} className="h-1 mt-1" />
                </CardContent>
              </Card>
              <Card className={`${selected.hardViolations === 0 ? 'bg-teal/5 border-teal/20' : 'bg-coral/5 border-coral/20'}`}>
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Hard Violations</p>
                  <p className={`text-xl font-mono font-bold ${selected.hardViolations === 0 ? 'text-teal' : 'text-coral'}`}>
                    {selected.hardViolations}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {selected.hardViolations === 0 ? 'All regulations met' : 'Must resolve before publish'}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-amber/5 border-amber/20">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Soft Warnings</p>
                  <p className="text-xl font-mono font-bold text-amber">{selected.softWarnings}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Can override with reason</p>
                </CardContent>
              </Card>
              <Card className="bg-indigo/5 border-indigo/20">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">AI Optimization Score</p>
                  <p className="text-xl font-mono font-bold text-indigo">{selected.aiScore}</p>
                  <Progress value={selected.aiScore} className="h-1 mt-1" />
                </CardContent>
              </Card>
            </div>

            {/* Unresolved conflicts summary */}
            {selected.unresolvedConflicts > 0 && (
              <Card className="bg-amber/5 border-amber/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber" />
                    <p className="text-sm font-medium text-foreground">
                      {selected.unresolvedConflicts} Unresolved Conflicts
                    </p>
                  </div>
                  <div className="space-y-2">
                    {CONFLICTS.filter(c => !c.resolved).slice(0, selected.unresolvedConflicts).map(c => {
                      const rule = RULES.find(r => r.id === c.ruleId);
                      return (
                        <div key={c.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] ${c.severity === 'critical' ? 'border-coral/40 text-coral' : 'border-amber/40 text-amber'}`}>
                              {c.severity}
                            </Badge>
                            <span className="text-muted-foreground">{c.description.slice(0, 80)}...</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{rule?.id}</span>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs gap-1"
                    onClick={() => toast.info('Navigate to Exception Center', { description: 'Feature coming soon' })}
                  >
                    <Eye className="w-3 h-3" /> Resolve in Exception Center
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Audit trail / comments */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" /> Audit Trail
                </h3>
                <div className="space-y-3">
                  {selected.comments.map((comment, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        comment.author === 'AI Engine' ? 'bg-indigo/15' : comment.author === 'Dept Approver' ? 'bg-teal/15' : 'bg-amber/15'
                      }`}>
                        <span className={`text-[10px] font-mono font-bold ${
                          comment.author === 'AI Engine' ? 'text-indigo' : comment.author === 'Dept Approver' ? 'text-teal' : 'text-amber'
                        }`}>
                          {comment.author === 'AI Engine' ? 'AI' : comment.author[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-foreground">{comment.author}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{comment.timestamp}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add comment */}
                <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment or note..."
                    className="flex-1 bg-secondary/30 rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => toast.info('Comment added')}>
                    <Send className="w-3 h-3" /> Send
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {selected.status === 'pending' && (
              <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-md border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Ready for approval?</p>
                  <p className="text-xs text-muted-foreground">
                    {selected.hardViolations === 0
                      ? 'All hard rules are satisfied. Soft warnings can be overridden with documented reasons.'
                      : 'Hard rule violations must be resolved before approval.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => toast.info('Schedule preview', { description: 'Feature coming soon' })}
                  >
                    <Eye className="w-3 h-3" /> Preview Full Schedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => toast.info('PDF export', { description: 'Feature coming soon' })}
                  >
                    <FileText className="w-3 h-3" /> Export PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select a schedule from the approval queue
          </div>
        )}
      </div>
    </div>
  );
}
