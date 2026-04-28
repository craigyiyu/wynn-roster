/*
 * Exception Center — Conflict Detection & Resolution
 * Triage inbox for rule violations, leave requests, shift swaps
 * AI provides ranked solutions for each conflict
 */
import { useState } from 'react';
import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle2,
  Sparkles,
  Filter,
  ChevronRight,
  Shield,
  Clock,
  Users,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CONFLICTS,
  EMPLOYEES,
  RULES,
  SHIFT_TYPES,
  DAYS,
  type Conflict,
  type AISuggestion,
} from '@/lib/mockData';
import { toast } from 'sonner';

function ConflictCard({
  conflict,
  isSelected,
  onClick,
}: {
  conflict: Conflict;
  isSelected: boolean;
  onClick: () => void;
}) {
  const employee = EMPLOYEES.find(e => e.id === conflict.employeeId);
  const rule = RULES.find(r => r.id === conflict.ruleId);
  const severityStyles: Record<string, { border: string; icon: any; iconColor: string; badge: string }> = {
    critical: { border: 'border-l-coral', icon: XCircle, iconColor: 'text-coral', badge: 'bg-coral/10 text-coral border-coral/20' },
    warning: { border: 'border-l-amber', icon: AlertTriangle, iconColor: 'text-amber', badge: 'bg-amber/10 text-amber border-amber/20' },
    info: { border: 'border-l-indigo', icon: Info, iconColor: 'text-indigo', badge: 'bg-indigo/10 text-indigo border-indigo/20' },
  };
  const style = severityStyles[conflict.severity];
  const SevIcon = style.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left border-l-2 rounded-r-md p-3 transition-all ${style.border} ${
        isSelected ? 'bg-secondary/50 ring-1 ring-indigo/30' : 'bg-card hover:bg-secondary/20'
      } ${conflict.resolved ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <SevIcon className={`w-4 h-4 mt-0.5 shrink-0 ${style.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-foreground truncate">
              {employee?.name || conflict.employeeId}
            </p>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${style.badge}`}>
              {conflict.severity}
            </Badge>
            {conflict.resolved && (
              <Badge variant="outline" className="text-[10px] border-teal/40 text-teal shrink-0">
                Resolved
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{conflict.description}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-muted-foreground/60 font-mono flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {rule?.id} · {rule?.severity === 'hard' ? 'Hard Rule' : 'Soft Rule'}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {DAYS[conflict.day]}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {conflict.aiSuggestions.length} suggestions
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </button>
  );
}

function SuggestionDetail({ suggestion, onApply }: { suggestion: AISuggestion; onApply: () => void }) {
  return (
    <Card className="bg-indigo/5 border-indigo/15 hover:border-indigo/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo" />
            <p className="text-sm font-medium text-foreground">{suggestion.label}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-16">
              <Progress value={suggestion.confidence} className="h-1.5" />
            </div>
            <span className={`text-xs font-mono font-bold ${
              suggestion.confidence >= 90 ? 'text-teal' : suggestion.confidence >= 75 ? 'text-indigo' : 'text-amber'
            }`}>
              {suggestion.confidence}%
            </span>
          </div>
        </div>

        {/* Rationale */}
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Rationale</p>
          <div className="space-y-1.5">
            {suggestion.rationale.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-teal mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">{r}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trade-offs */}
        {suggestion.tradeoffs.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Trade-offs</p>
            <div className="space-y-1.5">
              {suggestion.tradeoffs.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-amber mt-0.5 shrink-0" />
                  <p className="text-xs text-amber/80">{t}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action details */}
        {suggestion.newShift && (
          <div className="mb-3 p-2 bg-secondary/30 rounded flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Proposed shift:</span>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{
                backgroundColor: SHIFT_TYPES[suggestion.newShift]?.bgColor,
                color: SHIFT_TYPES[suggestion.newShift]?.color,
              }}
            >
              {suggestion.newShift} — {SHIFT_TYPES[suggestion.newShift]?.time}
            </span>
          </div>
        )}
        {suggestion.swapWith && (
          <div className="mb-3 p-2 bg-secondary/30 rounded flex items-center gap-2">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Swap with:</span>
            <span className="text-xs font-mono text-foreground">
              {EMPLOYEES.find(e => e.id === suggestion.swapWith)?.name} ({suggestion.swapWith})
            </span>
          </div>
        )}

        <Button
          size="sm"
          className="w-full h-8 text-xs bg-indigo/20 text-indigo hover:bg-indigo/30 border border-indigo/20"
          onClick={onApply}
        >
          Apply This Recommendation
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ExceptionCenter() {
  const [selectedId, setSelectedId] = useState<string | null>(CONFLICTS[0]?.id || null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set(CONFLICTS.filter(c => c.resolved).map(c => c.id)));

  const filtered = CONFLICTS.filter(c => filterSeverity === 'all' || c.severity === filterSeverity);
  const selected = CONFLICTS.find(c => c.id === selectedId);
  const selectedEmployee = selected ? EMPLOYEES.find(e => e.id === selected.employeeId) : null;
  const selectedRule = selected ? RULES.find(r => r.id === selected.ruleId) : null;

  const handleResolve = (conflictId: string, suggestionLabel: string) => {
    setResolvedIds(prev => { const next = new Set(Array.from(prev)); next.add(conflictId); return next; });
    toast.success(`Conflict resolved: ${suggestionLabel}`, {
      description: 'Schedule updated. Change logged for audit trail.',
    });
  };

  return (
    <div className="flex gap-0 -m-5 h-[calc(100vh-3.5rem)]">
      {/* Triage list */}
      <div className="w-96 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-mono font-semibold text-foreground tracking-wide">TRIAGE QUEUE</h2>
            <span className="text-xs font-mono text-muted-foreground">
              {filtered.filter(c => !resolvedIds.has(c.id)).length} open
            </span>
          </div>
          <div className="flex items-center gap-1 bg-secondary/30 rounded-md p-0.5">
            {(['all', 'critical', 'warning', 'info'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`flex-1 px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                  filterSeverity === sev ? 'bg-teal/20 text-teal' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.map(conflict => (
            <ConflictCard
              key={conflict.id}
              conflict={{ ...conflict, resolved: resolvedIds.has(conflict.id) }}
              isSelected={selectedId === conflict.id}
              onClick={() => setSelectedId(conflict.id)}
            />
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto p-5">
        {selected ? (
          <div className="max-w-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-mono font-bold text-foreground">
                    {selectedEmployee?.name}
                  </h2>
                  <Badge variant="outline" className={`text-[10px] ${
                    selected.severity === 'critical' ? 'border-coral/40 text-coral' : selected.severity === 'warning' ? 'border-amber/40 text-amber' : 'border-indigo/40 text-indigo'
                  }`}>
                    {selected.severity}
                  </Badge>
                  {resolvedIds.has(selected.id) && (
                    <Badge variant="outline" className="text-[10px] border-teal/40 text-teal">Resolved</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedEmployee?.id} · {selectedEmployee?.role} · {selectedEmployee?.property} · {DAYS[selected.day]}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => toast.info('Override recorded', { description: 'Reason required for audit.' })}
              >
                Manual Override
              </Button>
            </div>

            {/* Conflict description */}
            <Card className={`mb-4 ${
              selected.severity === 'critical' ? 'bg-coral/5 border-coral/20' : selected.severity === 'warning' ? 'bg-amber/5 border-amber/20' : 'bg-indigo/5 border-indigo/20'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${
                    selected.severity === 'critical' ? 'text-coral' : selected.severity === 'warning' ? 'text-amber' : 'text-indigo'
                  }`} />
                  <div>
                    <p className="text-sm text-foreground mb-2">{selected.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Rule {selectedRule?.id}: {selectedRule?.description}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${selectedRule?.severity === 'hard' ? 'border-coral/40 text-coral' : 'border-amber/40 text-amber'}`}>
                        {selectedRule?.severity === 'hard' ? 'HARD RULE' : 'SOFT RULE'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{selectedRule?.reason}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo" />
              <h3 className="text-sm font-mono font-semibold text-foreground tracking-wide">AI RECOMMENDATIONS</h3>
              <span className="text-[10px] text-muted-foreground font-mono">
                {selected.aiSuggestions.length} options ranked by confidence
              </span>
            </div>
            <div className="space-y-3">
              {selected.aiSuggestions.map((sug) => (
                <SuggestionDetail
                  key={sug.id}
                  suggestion={sug}
                  onApply={() => handleResolve(selected.id, sug.label)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select a conflict from the triage queue to view details
          </div>
        )}
      </div>
    </div>
  );
}
