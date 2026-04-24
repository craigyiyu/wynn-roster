/*
 * Roster Generation Flow — 10-step deterministic pipeline
 * Control Tower design: step-by-step pipeline with status, warnings, conflicts
 * Makes the manual process feel productized, repeatable, and auditable
 */
import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Shield,
  Users,
  CalendarDays,
  FileOutput,
  Heart,
  FileText,
  Link2,
  Crosshair,
  BarChart3,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GENERATION_STEPS, type GenerationStep } from '@/lib/mockDataV2';
import { toast } from 'sonner';

const stepIcons = [
  CalendarDays, Heart, FileText, Link2, Link2, Crosshair, BarChart3, Shield, Eye, FileOutput,
];

const statusConfig: Record<GenerationStep['status'], { label: string; cls: string; icon: any; bgCls: string }> = {
  completed: { label: 'Completed', cls: 'text-teal', icon: CheckCircle2, bgCls: 'bg-teal/10 border-teal/20' },
  'in-progress': { label: 'In Progress', cls: 'text-indigo', icon: Loader2, bgCls: 'bg-indigo/10 border-indigo/20' },
  pending: { label: 'Pending', cls: 'text-muted-foreground', icon: Clock, bgCls: 'bg-secondary/30 border-border' },
  warning: { label: 'Warnings', cls: 'text-amber', icon: AlertTriangle, bgCls: 'bg-amber/10 border-amber/20' },
};

function StepCard({ step, expanded, onToggle }: {
  step: GenerationStep;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sc = statusConfig[step.status];
  const StatusIcon = sc.icon;
  const StepIcon = stepIcons[step.id - 1] || Shield;
  const isAnimated = step.status === 'in-progress';

  return (
    <Card className={`border ${sc.bgCls} transition-all hover:brightness-105`}>
      <CardContent className="p-0">
        {/* Step header */}
        <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={onToggle}>
          {/* Step number */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${sc.bgCls}`}>
            <span className={`text-sm font-mono font-bold ${sc.cls}`}>{step.id}</span>
          </div>

          {/* Icon + Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <StepIcon className={`w-4 h-4 ${sc.cls} shrink-0`} />
              <p className="text-sm font-medium text-foreground">{step.title}</p>
              <StatusIcon className={`w-4 h-4 ${sc.cls} shrink-0 ${isAnimated ? 'animate-spin' : ''}`} />
              <Badge variant="outline" className={`text-[10px] ${sc.cls} border-current/30`}>{sc.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{step.description}</p>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-xs font-mono font-bold text-foreground">{step.affectedEmployees}</p>
              <p className="text-[10px] text-muted-foreground">Affected</p>
            </div>
            {step.warnings > 0 && (
              <div className="text-center">
                <p className="text-xs font-mono font-bold text-amber">{step.warnings}</p>
                <p className="text-[10px] text-muted-foreground">Warnings</p>
              </div>
            )}
            {step.conflicts > 0 && (
              <div className="text-center">
                <p className="text-xs font-mono font-bold text-coral">{step.conflicts}</p>
                <p className="text-[10px] text-muted-foreground">Conflicts</p>
              </div>
            )}
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-border/50 p-4 space-y-3 bg-card/50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-mono text-muted-foreground mb-1">INPUT SOURCE</p>
                <p className="text-xs text-foreground">{step.inputSource}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground mb-1">RULE APPLIED</p>
                <p className="text-xs text-indigo font-mono">{step.ruleApplied}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground mb-1">STATUS DETAIL</p>
                <p className="text-xs text-muted-foreground">{step.details}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" className="text-xs h-7 border-indigo/30 text-indigo hover:bg-indigo/10"
                onClick={(e) => { e.stopPropagation(); toast.info(`Viewing details for Step ${step.id}: ${step.title}`); }}>
                <Eye className="w-3 h-3 mr-1" /> Review Details
              </Button>
              {(step.warnings > 0 || step.conflicts > 0) && (
                <Button size="sm" variant="outline" className="text-xs h-7 border-amber/30 text-amber hover:bg-amber/10"
                  onClick={(e) => { e.stopPropagation(); toast.info('Navigating to Exception Center...'); }}>
                  <AlertTriangle className="w-3 h-3 mr-1" /> View Warnings
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RosterGenerationFlow() {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([7, 8, 9]));

  const toggleStep = (id: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completed = GENERATION_STEPS.filter(s => s.status === 'completed').length;
  const totalWarnings = GENERATION_STEPS.reduce((sum, s) => sum + s.warnings, 0);
  const totalConflicts = GENERATION_STEPS.reduce((sum, s) => sum + s.conflicts, 0);
  const progress = Math.round((completed / GENERATION_STEPS.length) * 100);

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Pipeline overview */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo" />
              <div>
                <p className="text-sm font-medium text-foreground">Roster Generation Pipeline — Week 17</p>
                <p className="text-xs text-muted-foreground">Deterministic rule engine with AI-assisted extraction and validation</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-indigo/40 text-indigo font-mono">
              {completed}/{GENERATION_STEPS.length} Steps Complete
            </Badge>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm font-mono font-bold text-foreground">{progress}%</span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-secondary/30 rounded-md p-2 text-center">
              <p className="text-lg font-mono font-bold text-teal">{completed}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </div>
            <div className="bg-secondary/30 rounded-md p-2 text-center">
              <p className="text-lg font-mono font-bold text-indigo">{GENERATION_STEPS.filter(s => s.status === 'in-progress').length}</p>
              <p className="text-[10px] text-muted-foreground">In Progress</p>
            </div>
            <div className="bg-secondary/30 rounded-md p-2 text-center">
              <p className="text-lg font-mono font-bold text-amber">{totalWarnings}</p>
              <p className="text-[10px] text-muted-foreground">Total Warnings</p>
            </div>
            <div className="bg-secondary/30 rounded-md p-2 text-center">
              <p className="text-lg font-mono font-bold text-coral">{totalConflicts}</p>
              <p className="text-[10px] text-muted-foreground">Hard Conflicts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority order */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <span className="font-mono text-foreground font-medium">PRIORITY ORDER:</span>
        <Badge variant="outline" className="text-[10px] border-coral/40 text-coral">Req RDO</Badge>
        <ArrowRight className="w-3 h-3" />
        <Badge variant="outline" className="text-[10px] border-amber/40 text-amber">Couple Shift</Badge>
        <ArrowRight className="w-3 h-3" />
        <Badge variant="outline" className="text-[10px] border-indigo/40 text-indigo">Special Request</Badge>
        <ArrowRight className="w-3 h-3" />
        <Badge variant="outline" className="text-[10px] border-teal/40 text-teal">Rotation Pattern</Badge>
        <ArrowRight className="w-3 h-3" />
        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">Fairness Rules</Badge>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {GENERATION_STEPS.map((step, i) => (
          <div key={step.id}>
            <StepCard
              step={step}
              expanded={expandedSteps.has(step.id)}
              onToggle={() => toggleStep(step.id)}
            />
            {i < GENERATION_STEPS.length - 1 && (
              <div className="flex justify-center py-1">
                <div className={`w-0.5 h-4 ${step.status === 'completed' || step.status === 'warning' ? 'bg-teal/30' : 'bg-border'}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
