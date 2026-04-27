/*
 * Employee Calculation Trace — Inspect how one employee's roster was calculated
 * Journey: Profile → Source Records → AI Tags → Route Decision → Applied Modules → Before/After → Review
 * Database-aligned field names
 */
import { useState } from 'react';
import {
  User, Database, Sparkles, GitBranch, ArrowRight, CheckCircle2,
  AlertTriangle, Clock, FileText, Link2, Shield, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EMPLOYEE_TRACES, EmployeeTrace } from '@/lib/databaseMockData';
import { useLocation } from 'wouter';

const SHIFT_COLORS: Record<string, string> = {
  M: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  LM: 'bg-sky-400/20 text-sky-300 border-sky-400/30',
  ED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  D: 'bg-teal/20 text-teal border-teal/30',
  EV: 'bg-amber/20 text-amber border-amber/30',
  ES: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  S: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  N: 'bg-indigo/20 text-indigo border-indigo/30',
  RDO: 'bg-coral/20 text-coral border-coral/30',
  AL: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

function ShiftCell({ shift, isChanged, oldShift }: { shift: string; isChanged: boolean; oldShift?: string }) {
  const color = SHIFT_COLORS[shift] || 'bg-secondary text-muted-foreground border-border';
  return (
    <div className="flex flex-col items-center gap-0.5">
      {isChanged && oldShift && (
        <span className="text-[8px] font-mono text-muted-foreground line-through">{oldShift}</span>
      )}
      <div className={`w-9 h-7 rounded flex items-center justify-center text-[10px] font-mono font-bold border ${color} ${isChanged ? 'ring-1 ring-amber/50' : ''}`}>
        {shift}
      </div>
    </div>
  );
}

function TraceView({ trace }: { trace: EmployeeTrace }) {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-4">
      {/* Employee Profile */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center">
              <User className="w-5 h-5 text-teal" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-mono font-semibold text-foreground">{trace.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{trace.EmployeeNumber} · {trace.Cls} · {trace.Positions} · {trace.venue}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-[9px] border-border text-muted-foreground font-mono">Rotation: {trace.Rotation}</Badge>
                {trace.IsEVES === 1 && <Badge variant="outline" className="text-[9px] border-amber/30 text-amber">EV/ES</Badge>}
                {trace.CoupleIDs && <Badge variant="outline" className="text-[9px] border-pink-500/30 text-pink-400">Couple: {trace.CoupleIDs}</Badge>}
                {trace.HasTraining === 1 && <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400">Training</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Records */}
      <div>
        <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2 flex items-center gap-1"><Database className="w-3 h-3" /> Source Records</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className={`border-border/50 ${trace.rdoSource ? 'bg-teal/5 border-teal/20' : 'bg-card/30'}`}>
            <CardContent className="p-3">
              <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">RDO Source</p>
              <p className="text-[10px] text-muted-foreground font-mono">req_rdo_leave_table</p>
              {trace.rdoSource ? (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-foreground">Notes: <span className="text-teal font-mono">"{trace.rdoSource.Notes}"</span></p>
                  <p className="text-xs text-foreground">ai_result: <span className="text-teal font-mono">{trace.rdoSource.ai_result}</span></p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">No RDO request found</p>
              )}
            </CardContent>
          </Card>
          <Card className={`border-border/50 ${trace.srSource ? 'bg-indigo/5 border-indigo/20' : 'bg-card/30'}`}>
            <CardContent className="p-3">
              <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">SR Source</p>
              <p className="text-[10px] text-muted-foreground font-mono">couple_special_request</p>
              {trace.srSource ? (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-foreground">AssignedTo: <span className="text-indigo font-mono">"{trace.srSource.AssignedTo}"</span></p>
                  <p className="text-xs text-foreground">ai_type: <span className="text-indigo font-mono">{trace.srSource.ai_type}</span></p>
                  <p className="text-xs text-foreground">ai_value: <span className="text-indigo font-mono">[{trace.srSource.ai_value.join(', ')}]</span></p>
                  {trace.srSource.ai_rdo.length > 0 && (
                    <p className="text-xs text-foreground">ai_rdo: <span className="text-indigo font-mono">[{trace.srSource.ai_rdo.join(', ')}]</span></p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">No special request found</p>
              )}
            </CardContent>
          </Card>
          <Card className={`border-border/50 ${trace.evesSource ? 'bg-amber/5 border-amber/20' : 'bg-card/30'}`}>
            <CardContent className="p-3">
              <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">EV/ES Source</p>
              <p className="text-[10px] text-muted-foreground font-mono">wm_wp_ev_es_employee</p>
              {trace.evesSource ? (
                <div className="mt-2">
                  <p className="text-xs text-foreground">IsEVES: <span className="text-amber font-mono">1</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">List-driven tagging, not AI extraction</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">Not on EV/ES list</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Route Decision */}
      <Card className="bg-indigo/5 border-indigo/20">
        <CardContent className="p-3">
          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1 flex items-center gap-1"><GitBranch className="w-3 h-3 text-indigo" /> Route Decision</p>
          <p className="text-xs text-indigo font-medium">{trace.routeDecision}</p>
        </CardContent>
      </Card>

      {/* Applied Modules */}
      <div>
        <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Applied Rule Modules</p>
        <div className="flex items-center gap-1 flex-wrap">
          {trace.appliedModules.map((mod, i) => (
            <div key={mod} className="flex items-center gap-1">
              <Badge
                variant="outline"
                className={`text-[10px] cursor-pointer hover:bg-teal/10 ${mod.includes('failed') ? 'border-coral/30 text-coral' : 'border-teal/30 text-teal'}`}
                onClick={() => navigate('/rules')}
              >
                {mod}
              </Badge>
              {i < trace.appliedModules.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>

      {/* Before / After Roster Strip */}
      <div className="space-y-3">
        <p className="text-[10px] font-mono text-muted-foreground uppercase">Before / After Roster</p>
        <div className="grid grid-cols-1 gap-3">
          <Card className="bg-card/30 border-border/50">
            <CardContent className="p-3">
              <p className="text-[9px] text-muted-foreground uppercase mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Previous Week (locked history / anchor)</p>
              <div className="flex items-end gap-2">
                {trace.previousWeek.map(d => (
                  <div key={d.day} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] text-muted-foreground font-mono">{d.day}</span>
                    <ShiftCell shift={d.shift} isChanged={false} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-teal/20">
            <CardContent className="p-3">
              <p className="text-[9px] text-muted-foreground uppercase mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3 text-teal" /> Current Week (calculated result)</p>
              <div className="flex items-end gap-2">
                {trace.currentWeek.map(d => (
                  <div key={d.day} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] text-muted-foreground font-mono">{d.day}</span>
                    <ShiftCell shift={d.shift} isChanged={d.isChanged} oldShift={d.oldShift} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Changed Date Details */}
      <div>
        <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Changed Date Details</p>
        <div className="space-y-2">
          {trace.currentWeek.filter(d => d.isChanged).map(d => (
            <Card key={d.day} className="bg-amber/5 border-amber/20">
              <CardContent className="p-3 flex items-start gap-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-foreground">{d.day}</span>
                    <span className="text-xs font-mono text-muted-foreground">{d.oldShift}</span>
                    <ArrowRight className="w-3 h-3 text-amber" />
                    <span className="text-xs font-mono font-bold text-amber">{d.shift}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{d.changeDetail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {trace.currentWeek.filter(d => d.isChanged).length === 0 && (
            <p className="text-xs text-muted-foreground">No changes in current week.</p>
          )}
        </div>
      </div>

      {/* Special Notices */}
      {trace.CoupleIDs && (
        <Card className="bg-pink-500/5 border-pink-500/20">
          <CardContent className="p-3">
            <p className="text-xs text-pink-400 font-medium mb-1">Couple Shift — Data Loaded Only</p>
            <p className="text-[10px] text-muted-foreground">CoupleIDs = {trace.CoupleIDs}. Couple data is loaded and tagged, but the couple alignment algorithm is not currently active as a scheduling constraint.</p>
          </CardContent>
        </Card>
      )}
      {trace.HasTraining === 1 && (
        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="p-3">
            <p className="text-xs text-purple-400 font-medium mb-1">Training — Built but Not Enabled</p>
            <p className="text-[10px] text-muted-foreground">HasTraining = 1. The Training Scheduler module is built and tested but not enabled in the current production pipeline.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function EmployeeTracePage() {
  const [selectedId, setSelectedId] = useState<string>(EMPLOYEE_TRACES[0].EmployeeNumber);
  const trace = EMPLOYEE_TRACES.find(t => t.EmployeeNumber === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal" />
            EMPLOYEE CALCULATION TRACE
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Inspect how one employee's roster was calculated from source data to final result</p>
        </div>
      </div>

      {/* Employee Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {EMPLOYEE_TRACES.map(t => (
          <button
            key={t.EmployeeNumber}
            onClick={() => setSelectedId(t.EmployeeNumber)}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              selectedId === t.EmployeeNumber
                ? 'bg-teal/15 text-teal border border-teal/30'
                : 'bg-secondary/20 text-muted-foreground hover:bg-secondary/40 border border-transparent'
            }`}
          >
            {t.EmployeeNumber} · {t.name}
            <span className="ml-1 text-[9px] opacity-60">
              {t.IsEVES ? '(EV/ES)' : t.rdoSource ? '(RDO)' : t.srSource ? '(SR)' : t.CoupleIDs ? '(Couple)' : ''}
            </span>
          </button>
        ))}
      </div>

      {trace && <TraceView trace={trace} />}
    </div>
  );
}
