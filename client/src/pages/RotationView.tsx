/*
 * Rotation / Pattern View — Original vs Adjusted patterns
 * Shows RDO movement, rotation preservation, transition shifts, pattern breaks
 */
import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  RotateCcw,
  ArrowLeftRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROTATION_PATTERNS, type RotationPattern } from '@/lib/mockDataV2';
import { SHIFT_TYPES, DAYS } from '@/lib/mockData';

function ShiftCell({ code }: { code: string }) {
  const info = SHIFT_TYPES[code];
  if (!info) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold text-center min-w-[32px]"
      style={{ backgroundColor: info.bgColor, color: info.color }}
    >
      {code}
    </span>
  );
}

function PatternCard({ pattern, selected, onClick }: {
  pattern: RotationPattern;
  selected: boolean;
  onClick: () => void;
}) {
  const hasViolation = pattern.reason.includes('HARD VIOLATION');
  const hasWarning = pattern.patternBreak && !hasViolation;

  return (
    <Card
      className={`bg-card border cursor-pointer transition-all hover:brightness-105 ${
        selected ? 'border-indigo/40' : hasViolation ? 'border-coral/30' : hasWarning ? 'border-amber/20' : 'border-border'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{pattern.employeeName}</p>
            <p className="text-[10px] font-mono text-muted-foreground">{pattern.employeeId}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {hasViolation && <Badge variant="outline" className="text-[10px] border-coral/40 text-coral">Hard Violation</Badge>}
            {hasWarning && <Badge variant="outline" className="text-[10px] border-amber/40 text-amber">Pattern Break</Badge>}
            {pattern.rotationPreserved && <Badge variant="outline" className="text-[10px] border-teal/40 text-teal">Preserved</Badge>}
            {pattern.transitionUsed && <Badge variant="outline" className="text-[10px] border-indigo/40 text-indigo">Transition</Badge>}
          </div>
        </div>

        {/* Pattern comparison */}
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground mb-1">ORIGINAL (Wk16)</p>
            <div className="flex gap-1">
              {pattern.originalPattern.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-[8px] text-muted-foreground mb-0.5">{DAYS[i]}</p>
                  <ShiftCell code={s} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 px-2">
            <div className="flex-1 h-px bg-border" />
            <ArrowLeftRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-mono">RDO: {pattern.rdoMovement}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground mb-1">ADJUSTED (Wk17)</p>
            <div className="flex gap-1">
              {pattern.adjustedPattern.map((s, i) => {
                const changed = s !== pattern.originalPattern[i];
                return (
                  <div key={i} className="text-center">
                    <p className="text-[8px] text-muted-foreground mb-0.5">{DAYS[i]}</p>
                    <div className={`${changed ? 'ring-1 ring-indigo/50 rounded' : ''}`}>
                      <ShiftCell code={s} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RotationView() {
  const [selected, setSelected] = useState<RotationPattern | null>(ROTATION_PATTERNS[0]);

  const preserved = ROTATION_PATTERNS.filter(p => p.rotationPreserved).length;
  const breaks = ROTATION_PATTERNS.filter(p => p.patternBreak).length;
  const transitions = ROTATION_PATTERNS.filter(p => p.transitionUsed).length;
  const violations = ROTATION_PATTERNS.filter(p => p.reason.includes('HARD VIOLATION')).length;

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-teal">{preserved}</p>
          <p className="text-[10px] text-muted-foreground">Rotation Preserved</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-amber">{breaks}</p>
          <p className="text-[10px] text-muted-foreground">Pattern Breaks</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-indigo">{transitions}</p>
          <p className="text-[10px] text-muted-foreground">Transition Shifts Used</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-coral">{violations}</p>
          <p className="text-[10px] text-muted-foreground">Hard Violations</p>
        </div>
      </div>

      {/* Transition examples */}
      <Card className="bg-indigo/5 border-indigo/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Rotation & Transition Logic</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="bg-secondary/30 rounded-md p-2">
                  <span className="text-coral font-mono">S → D</span> direct transition <span className="text-coral">blocked</span> — insufficient 10hr rest
                </div>
                <div className="bg-secondary/30 rounded-md p-2">
                  <span className="text-teal font-mono">S → EV/ES → D</span> transitional shift <span className="text-teal">recommended</span>
                </div>
                <div className="bg-secondary/30 rounded-md p-2">
                  Req RDO overrides normal <span className="font-mono">5–8 day</span> spacing rule
                </div>
                <div className="bg-secondary/30 rounded-md p-2">
                  New shift pattern must last at least <span className="font-mono">2 days</span> (R05)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pattern cards */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-mono font-semibold text-foreground tracking-wide flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-teal" />
            ROTATION PATTERNS — WEEK 16 → WEEK 17
          </h2>
          {ROTATION_PATTERNS.map(p => (
            <PatternCard
              key={p.employeeId}
              pattern={p}
              selected={selected?.employeeId === p.employeeId}
              onClick={() => setSelected(p)}
            />
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {selected ? (
            <Card className="bg-card border-border sticky top-5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo" />
                  <p className="text-sm font-medium text-foreground">Pattern Analysis</p>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground">EMPLOYEE</p>
                    <p className="text-xs text-foreground">{selected.employeeName} ({selected.employeeId})</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">RDO MOVEMENT</p>
                      <p className="text-xs font-mono text-foreground">{selected.rdoMovement}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">ROTATION</p>
                      <p className={`text-xs font-medium ${selected.rotationPreserved ? 'text-teal' : 'text-amber'}`}>
                        {selected.rotationPreserved ? 'Preserved' : 'Changed'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">PATTERN BREAK</p>
                      <p className={`text-xs font-medium ${selected.patternBreak ? 'text-coral' : 'text-teal'}`}>
                        {selected.patternBreak ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">TRANSITION SHIFT</p>
                      <p className={`text-xs font-medium ${selected.transitionUsed ? 'text-indigo' : 'text-muted-foreground'}`}>
                        {selected.transitionUsed ? 'Used' : 'Not needed'}
                      </p>
                    </div>
                  </div>

                  {selected.transitionDetail && (
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">TRANSITION DETAIL</p>
                      <p className="text-xs text-muted-foreground bg-secondary/30 px-3 py-2 rounded">{selected.transitionDetail}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground">AI EXPLANATION</p>
                    <p className={`text-xs px-3 py-2 rounded ${
                      selected.reason.includes('HARD VIOLATION')
                        ? 'text-coral bg-coral/5 border border-coral/20'
                        : 'text-muted-foreground bg-indigo/5 border border-indigo/20'
                    }`}>
                      {selected.reason}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <RotateCcw className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Select a pattern to view analysis</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
