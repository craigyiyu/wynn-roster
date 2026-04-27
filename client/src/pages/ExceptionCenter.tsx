/*
 * Exception Center — Conflict Detection & Resolution + Exception Input
 * Triage inbox for rule violations, leave requests, shift swaps
 * AI provides ranked solutions for each conflict
 * NEW: "Report New Exception" form for manual exception submission
 */
import { useState } from 'react';
import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Shield,
  Clock,
  Users,
  Zap,
  Plus,
  X,
  Send,
  CalendarDays,
  User,
  FileText,
  Tag,
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

/* ─── Exception Input Form Types ─── */
interface NewException {
  employeeId: string;
  type: 'shift_swap' | 'leave_request' | 'rdo_change' | 'overtime' | 'no_show' | 'custom';
  severity: 'critical' | 'warning' | 'info';
  day: number;
  description: string;
  requestedShift?: string;
}

const EXCEPTION_TYPES = [
  { value: 'shift_swap', label: 'Shift Swap Request', icon: '🔄' },
  { value: 'leave_request', label: 'Leave / Absence', icon: '🏖️' },
  { value: 'rdo_change', label: 'RDO Change', icon: '📅' },
  { value: 'overtime', label: 'Overtime Request', icon: '⏰' },
  { value: 'no_show', label: 'No-Show Report', icon: '⚠️' },
  { value: 'custom', label: 'Custom Exception', icon: '📝' },
];

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical', cls: 'border-coral/40 text-coral bg-coral/10 hover:bg-coral/20' },
  { value: 'warning', label: 'Warning', cls: 'border-amber/40 text-amber bg-amber/10 hover:bg-amber/20' },
  { value: 'info', label: 'Info', cls: 'border-indigo/40 text-indigo bg-indigo/10 hover:bg-indigo/20' },
];

/* ─── Sub-components ─── */

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

/* ─── New Exception Form ─── */
function NewExceptionForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (e: NewException) => void }) {
  const [form, setForm] = useState<NewException>({
    employeeId: '',
    type: 'shift_swap',
    severity: 'warning',
    day: 0,
    description: '',
    requestedShift: '',
  });

  const handleSubmit = () => {
    if (!form.employeeId) { toast.error('Please select an employee'); return; }
    if (!form.description.trim()) { toast.error('Please enter a description'); return; }
    onSubmit(form);
    onClose();
  };

  return (
    <div className="border border-teal/30 bg-teal/5 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono font-semibold text-teal flex items-center gap-2">
          <Plus className="w-4 h-4" />
          REPORT NEW EXCEPTION
        </h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Exception Type */}
      <div>
        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Tag className="w-3 h-3" /> Exception Type
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {EXCEPTION_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setForm(prev => ({ ...prev, type: t.value as NewException['type'] }))}
              className={`text-left px-2.5 py-1.5 rounded text-[11px] transition-colors border ${
                form.type === t.value
                  ? 'border-teal/40 bg-teal/10 text-teal'
                  : 'border-border bg-secondary/20 text-muted-foreground hover:border-teal/20'
              }`}
            >
              <span className="mr-1">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Select */}
      <div>
        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <User className="w-3 h-3" /> Employee
        </label>
        <select
          value={form.employeeId}
          onChange={(e) => setForm(prev => ({ ...prev, employeeId: e.target.value }))}
          className="w-full bg-secondary/30 border border-border rounded-md px-3 py-2 text-xs text-foreground outline-none focus:border-teal/40"
        >
          <option value="">Select employee...</option>
          {EMPLOYEES.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.id} — {emp.name} ({emp.role})</option>
          ))}
        </select>
      </div>

      {/* Day + Severity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> Day
          </label>
          <select
            value={form.day}
            onChange={(e) => setForm(prev => ({ ...prev, day: parseInt(e.target.value) }))}
            className="w-full bg-secondary/30 border border-border rounded-md px-3 py-2 text-xs text-foreground outline-none focus:border-teal/40"
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Severity
          </label>
          <div className="flex gap-1">
            {SEVERITY_OPTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => setForm(prev => ({ ...prev, severity: s.value as NewException['severity'] }))}
                className={`flex-1 px-2 py-1.5 rounded text-[10px] font-mono border transition-colors ${
                  form.severity === s.value ? s.cls : 'border-border text-muted-foreground hover:border-border'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requested Shift (optional) */}
      {(form.type === 'shift_swap' || form.type === 'rdo_change') && (
        <div>
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Requested Shift (optional)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(SHIFT_TYPES).map(([key, shift]) => (
              <button
                key={key}
                onClick={() => setForm(prev => ({ ...prev, requestedShift: prev.requestedShift === key ? '' : key }))}
                className="px-2 py-1 rounded text-[10px] font-mono border transition-colors"
                style={{
                  backgroundColor: form.requestedShift === key ? shift.bgColor : 'transparent',
                  color: form.requestedShift === key ? shift.color : undefined,
                  borderColor: form.requestedShift === key ? shift.bgColor : undefined,
                }}
              >
                {key} ({shift.time})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <FileText className="w-3 h-3" /> Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the exception, reason, and any relevant context..."
          rows={3}
          className="w-full bg-secondary/30 border border-border rounded-md px-3 py-2 text-xs text-foreground outline-none focus:border-teal/40 resize-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Submit */}
      <Button
        size="sm"
        className="w-full h-9 text-xs bg-teal text-[#0f1117] hover:bg-teal/80 font-medium"
        onClick={handleSubmit}
      >
        <Send className="w-3.5 h-3.5 mr-1.5" />
        Submit Exception → AI will generate resolution suggestions
      </Button>
    </div>
  );
}

/* ─── Main Component ─── */
export default function ExceptionCenter() {
  const [selectedId, setSelectedId] = useState<string | null>(CONFLICTS[0]?.id || null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set(CONFLICTS.filter(c => c.resolved).map(c => c.id)));
  const [showNewForm, setShowNewForm] = useState(false);
  const [manualExceptions, setManualExceptions] = useState<Array<{
    id: string;
    employeeId: string;
    type: string;
    severity: 'critical' | 'warning' | 'info';
    day: number;
    description: string;
    submittedAt: string;
  }>>([]);

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

  const handleNewException = (exc: NewException) => {
    const newExc = {
      id: `MAN-${Date.now()}`,
      employeeId: exc.employeeId,
      type: exc.type,
      severity: exc.severity,
      day: exc.day,
      description: exc.description,
      submittedAt: new Date().toLocaleTimeString(),
    };
    setManualExceptions(prev => [newExc, ...prev]);
    toast.success('Exception submitted', {
      description: 'AI is analyzing the exception and generating resolution suggestions...',
    });
    // Simulate AI processing
    setTimeout(() => {
      toast.info('AI analysis complete', {
        description: `2 resolution suggestions generated for ${EMPLOYEES.find(e => e.id === exc.employeeId)?.name || exc.employeeId}.`,
      });
    }, 2500);
  };

  const selectedManual = manualExceptions.find(m => m.id === selectedId);

  return (
    <div className="flex gap-0 -m-5 h-[calc(100vh-3.5rem)]">
      {/* Triage list */}
      <div className="w-96 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-mono font-semibold text-foreground tracking-wide">TRIAGE QUEUE</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                {filtered.filter(c => !resolvedIds.has(c.id)).length} open
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] border-teal/30 text-teal hover:bg-teal/10"
                onClick={() => setShowNewForm(!showNewForm)}
              >
                <Plus className="w-3 h-3 mr-1" />
                New
              </Button>
            </div>
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
          {/* New Exception Form (inline) */}
          {showNewForm && (
            <NewExceptionForm
              onClose={() => setShowNewForm(false)}
              onSubmit={handleNewException}
            />
          )}

          {/* Manually submitted exceptions */}
          {manualExceptions.map(exc => {
            const emp = EMPLOYEES.find(e => e.id === exc.employeeId);
            const sevStyles: Record<string, { border: string; iconColor: string }> = {
              critical: { border: 'border-l-coral', iconColor: 'text-coral' },
              warning: { border: 'border-l-amber', iconColor: 'text-amber' },
              info: { border: 'border-l-indigo', iconColor: 'text-indigo' },
            };
            const sty = sevStyles[exc.severity];
            return (
              <button
                key={exc.id}
                onClick={() => setSelectedId(exc.id)}
                className={`w-full text-left border-l-2 rounded-r-md p-3 transition-all ${sty.border} ${
                  selectedId === exc.id ? 'bg-secondary/50 ring-1 ring-indigo/30' : 'bg-card hover:bg-secondary/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${sty.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {emp?.name || exc.employeeId}
                      </p>
                      <Badge variant="outline" className="text-[10px] border-teal/40 text-teal shrink-0">Manual</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{exc.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-muted-foreground/60 font-mono">{EXCEPTION_TYPES.find(t => t.value === exc.type)?.label}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono">{DAYS[exc.day]}</span>
                      <span className="text-[10px] text-muted-foreground/60 font-mono">{exc.submittedAt}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </button>
            );
          })}

          {/* Existing conflicts */}
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
        {selectedManual ? (
          /* Manual exception detail */
          <div className="max-w-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-mono font-bold text-foreground">
                    {EMPLOYEES.find(e => e.id === selectedManual.employeeId)?.name || selectedManual.employeeId}
                  </h2>
                  <Badge variant="outline" className="text-[10px] border-teal/40 text-teal">Manual Exception</Badge>
                  <Badge variant="outline" className={`text-[10px] ${
                    selectedManual.severity === 'critical' ? 'border-coral/40 text-coral' : selectedManual.severity === 'warning' ? 'border-amber/40 text-amber' : 'border-indigo/40 text-indigo'
                  }`}>
                    {selectedManual.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedManual.employeeId} · {DAYS[selectedManual.day]} · Submitted at {selectedManual.submittedAt}
                </p>
              </div>
            </div>

            <Card className="mb-4 bg-amber/5 border-amber/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber" />
                  <div>
                    <p className="text-sm text-foreground mb-2">{selectedManual.description}</p>
                    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                      {EXCEPTION_TYPES.find(t => t.value === selectedManual.type)?.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simulated AI suggestions for manual exceptions */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo" />
              <h3 className="text-sm font-mono font-semibold text-foreground tracking-wide">AI RECOMMENDATIONS</h3>
              <Badge variant="outline" className="text-[10px] border-indigo/30 text-indigo">Processing...</Badge>
            </div>
            <Card className="bg-indigo/5 border-indigo/15">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Sparkles className="w-5 h-5 text-indigo animate-pulse" />
                  <div>
                    <p className="text-foreground font-medium mb-1">AI is analyzing this exception...</p>
                    <p className="text-xs text-muted-foreground">
                      The system is checking rule compliance, employee history, demand coverage, and available swap candidates.
                      Resolution suggestions will appear here once analysis is complete.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : selected ? (
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
