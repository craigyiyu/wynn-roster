/*
 * Roster Generation Flow — Real algorithm pipeline visualization
 * Reflects actual production flow: data_provider → route → schedulers → post-process → export
 * Database-aligned with PIPELINE_STEPS from databaseMockData
 */
import { useState } from 'react';
import {
  Play, CheckCircle2, Clock, AlertTriangle, Pause,
  ArrowDown, Database, GitBranch, Sparkles, FileText,
  ChevronDown, ChevronRight, Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PIPELINE_STEPS, BATCH_TASKS, PipelineStep } from '@/lib/databaseMockData';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  completed: { color: 'text-teal', bg: 'bg-teal/5', border: 'border-teal/20', icon: CheckCircle2, label: 'Active / Completed' },
  active: { color: 'text-teal', bg: 'bg-teal/5', border: 'border-teal/20', icon: Play, label: 'Active' },
  pending: { color: 'text-amber', bg: 'bg-amber/5', border: 'border-amber/20', icon: Clock, label: 'Pending' },
  not_enabled: { color: 'text-amber', bg: 'bg-amber/5', border: 'border-amber/20', icon: Pause, label: 'Built, Not Enabled' },
};

function StepCard({ step, index, expanded, onToggle }: { step: PipelineStep; index: number; expanded: boolean; onToggle: () => void }) {
  const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const [, navigate] = useLocation();

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center shrink-0 w-8">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
          <Icon className={`w-3 h-3 ${cfg.color}`} />
        </div>
        {index < PIPELINE_STEPS.length - 1 && (
          <div className="w-px flex-1 bg-border/50 my-1" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 mb-3 rounded border ${cfg.border} ${cfg.bg} overflow-hidden`}>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-muted-foreground w-5">{String(step.id).padStart(2, '0')}</span>
            <span className="text-xs font-medium text-foreground">{step.name}</span>
            {step.isConditional && (
              <Badge variant="outline" className="text-[8px] px-1 border-indigo/30 text-indigo">conditional</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[9px] ${cfg.color} ${cfg.border}`}>{cfg.label}</Badge>
            {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        </button>

        {expanded && (
          <div className="px-3 pb-3 space-y-2 border-t border-border/20">
            {step.condition && (
              <div className="mt-2 p-2 bg-indigo/5 rounded border border-indigo/20">
                <p className="text-[9px] font-mono text-indigo">Condition: {step.condition}</p>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">{step.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Input Table</p>
                <p className="text-[10px] font-mono text-teal">{step.inputTable}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Output Field</p>
                <p className="text-[10px] font-mono text-teal">{step.outputField}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">Sample Impact</p>
                <p className="text-xs font-mono text-amber">{step.sampleImpact}</p>
              </div>
              {step.reviewNeeded && (
                <div className="flex items-center gap-1 text-coral">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-[10px]">Needs Manager Review</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-[9px] font-mono text-muted-foreground/50">Code ref: {step.codeRef}</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {step.reviewNeeded && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-6 gap-1 border-teal/30 text-teal hover:bg-teal/10"
                  onClick={() => navigate('/validation')}
                >
                  <Eye className="w-3 h-3" /> View Affected Rows
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] h-6 gap-1 border-border text-muted-foreground hover:bg-secondary/30"
                onClick={() => navigate('/rules')}
              >
                <FileText className="w-3 h-3" /> Rule Detail
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RosterGenerationFlow() {
  const batch = BATCH_TASKS[0];
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([5, 7, 8]));

  const toggleStep = (id: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedSteps = PIPELINE_STEPS.filter(s => s.status === 'completed').length;
  const totalSteps = PIPELINE_STEPS.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-teal" />
            GENERATION FLOW
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Actual production algorithm pipeline — batch to export</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] h-7 gap-1"
            onClick={() => {
              if (expandedSteps.size === totalSteps) {
                setExpandedSteps(new Set());
              } else {
                setExpandedSteps(new Set(PIPELINE_STEPS.map(s => s.id)));
              }
            }}
          >
            {expandedSteps.size === totalSteps ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>
      </div>

      {/* Batch Context */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-teal" />
              <span className="text-xs font-mono text-foreground">{batch.batch_id}</span>
              <span className="text-xs text-muted-foreground">{batch.batch_name}</span>
            </div>
            <Badge variant="outline" className="text-[10px] border-teal/30 text-teal">{batch.status}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={(completedSteps / totalSteps) * 100} className="h-1.5 flex-1" />
            <span className="text-[10px] font-mono text-muted-foreground">{completedSteps}/{totalSteps} steps</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span>Employees: <span className="text-foreground font-mono">{batch.total_employees}</span></span>
            <span>Result rows: <span className="text-foreground font-mono">{batch.total_result_rows}</span></span>
            <span>Changed: <span className="text-amber font-mono">{batch.changed_rows}</span></span>
            <span>Export: <span className="text-teal font-mono">{batch.export_status}</span></span>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Steps */}
      <div>
        {PIPELINE_STEPS.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            index={i}
            expanded={expandedSteps.has(step.id)}
            onToggle={() => toggleStep(step.id)}
          />
        ))}
      </div>

      {/* Flow Summary */}
      <Card className="bg-secondary/20 border-border/50">
        <CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground">
            <span className="text-foreground font-medium">Pipeline Summary:</span> The current scheduling logic is mostly single-employee level and heuristic / rule-based. It is not yet a full global mathematical optimization engine. Each employee is routed through conditional schedulers based on their data, followed by post-processing safety nets for boundary checks and weekly RDO compliance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
