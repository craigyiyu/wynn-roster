/*
 * Schedule Builder — Calendar / Gantt View
 * Control Tower: dense grid, heat-map cells, shift color coding
 * Features: drag-drop (simulated), AI Smart Fill, conflict indicators
 */
import { useState } from 'react';
import {
  Sparkles,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  X,
  CheckCircle2,
  Info,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  EMPLOYEES,
  DRAFT_SCHEDULE,
  CONFLICTS,
  SHIFT_TYPES,
  DAYS,
  WEEK_LABEL,
  type Employee,
  type ShiftType,
  type Conflict,
} from '@/lib/mockData';
import { toast } from 'sonner';

function ShiftCell({
  shift,
  employeeId,
  dayIndex,
  conflicts,
  onSelect,
}: {
  shift: ShiftType;
  employeeId: string;
  dayIndex: number;
  conflicts: Conflict[];
  onSelect: () => void;
}) {
  const info = SHIFT_TYPES[shift];
  const cellConflict = conflicts.find(
    c => c.employeeId === employeeId && c.day === dayIndex && !c.resolved
  );

  return (
    <button
      onClick={onSelect}
      className={`relative w-full h-10 rounded text-xs font-mono font-medium flex items-center justify-center gap-1 transition-all hover:brightness-125 hover:scale-[1.02] ${
        cellConflict?.severity === 'critical'
          ? 'ring-2 ring-coral/60 ring-offset-1 ring-offset-background'
          : cellConflict?.severity === 'warning'
          ? 'ring-1 ring-amber/40'
          : ''
      }`}
      style={{
        backgroundColor: info?.bgColor || 'rgba(100,116,139,0.1)',
        color: info?.color || '#64748b',
      }}
    >
      {shift}
      {cellConflict && (
        <AlertTriangle
          className={`w-3 h-3 absolute -top-1 -right-1 ${
            cellConflict.severity === 'critical' ? 'text-coral' : 'text-amber'
          }`}
        />
      )}
    </button>
  );
}

function InspectorPanel({
  employee,
  conflict,
  onClose,
}: {
  employee: Employee | null;
  conflict: Conflict | null;
  onClose: () => void;
}) {
  if (!employee) return null;

  return (
    <div className="w-80 border-l border-border bg-card overflow-y-auto shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-mono font-semibold text-foreground">INSPECTOR</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Employee info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-md bg-indigo/15 flex items-center justify-center">
            <span className="text-xs font-mono text-indigo font-bold">{employee.role[0]}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{employee.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {employee.id} · {employee.role} · Grade {employee.grade} · {employee.property}
            </p>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Skills</p>
          <div className="flex flex-wrap gap-1">
            {employee.skills.map((s, i) => (
              <Badge key={i} variant="outline" className={`text-[10px] ${s.level === 'Primary' ? 'border-teal/40 text-teal' : s.level === 'Secondary' ? 'border-indigo/40 text-indigo' : 'border-amber/40 text-amber'}`}>
                {s.game} ({s.level})
              </Badge>
            ))}
          </div>
        </div>

        {/* Fatigue */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fatigue Score</p>
            <span className={`text-xs font-mono font-bold ${employee.fatigueScore > 70 ? 'text-coral' : employee.fatigueScore > 50 ? 'text-amber' : 'text-teal'}`}>
              {employee.fatigueScore}%
            </span>
          </div>
          <Progress value={employee.fatigueScore} className="h-1.5" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-secondary/30 rounded p-2">
            <p className="text-muted-foreground text-[10px]">Weekly Hours</p>
            <p className="font-mono font-semibold text-foreground">{employee.weeklyHours}h</p>
          </div>
          <div className="bg-secondary/30 rounded p-2">
            <p className="text-muted-foreground text-[10px]">Consec. Nights</p>
            <p className={`font-mono font-semibold ${employee.consecutiveNights >= 6 ? 'text-coral' : employee.consecutiveNights >= 4 ? 'text-amber' : 'text-foreground'}`}>
              {employee.consecutiveNights}
            </p>
          </div>
          <div className="bg-secondary/30 rounded p-2">
            <p className="text-muted-foreground text-[10px]">PHNW Count</p>
            <p className="font-mono font-semibold text-foreground">{employee.phnwCount}</p>
          </div>
          <div className="bg-secondary/30 rounded p-2">
            <p className="text-muted-foreground text-[10px]">Languages</p>
            <p className="font-mono font-semibold text-foreground text-[10px]">{employee.languages.join(', ')}</p>
          </div>
        </div>

        {employee.specialRequest && (
          <div className="mt-2 p-2 bg-amber/5 border border-amber/20 rounded text-[10px] text-amber">
            Special Request: {employee.specialRequest}
          </div>
        )}
        {employee.coupleId && (
          <div className="mt-2 p-2 bg-indigo/5 border border-indigo/20 rounded text-[10px] text-indigo">
            Couple Shift: paired with {employee.coupleId}
          </div>
        )}
      </div>

      {/* Conflict detail */}
      {conflict && !conflict.resolved && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className={`w-4 h-4 ${conflict.severity === 'critical' ? 'text-coral' : 'text-amber'}`} />
            <p className="text-sm font-medium text-foreground">Conflict Detected</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{conflict.description}</p>

          {/* AI Suggestions */}
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo" />
            <p className="text-[10px] font-mono text-indigo uppercase tracking-wider">AI Recommendations</p>
          </div>
          <div className="space-y-2">
            {conflict.aiSuggestions.map((sug) => (
              <Card key={sug.id} className="bg-indigo/5 border-indigo/15 hover:border-indigo/30 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-medium text-foreground">{sug.label}</p>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${sug.confidence >= 90 ? 'border-teal/40 text-teal' : sug.confidence >= 75 ? 'border-indigo/40 text-indigo' : 'border-amber/40 text-amber'}`}>
                      {sug.confidence}%
                    </Badge>
                  </div>
                  <div className="space-y-1 mb-2">
                    {sug.rationale.map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-teal mt-0.5 shrink-0" />
                        <p className="text-[10px] text-muted-foreground">{r}</p>
                      </div>
                    ))}
                  </div>
                  {sug.tradeoffs.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {sug.tradeoffs.map((t, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <Info className="w-3 h-3 text-amber mt-0.5 shrink-0" />
                          <p className="text-[10px] text-amber/80">{t}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full h-7 text-[10px] bg-indigo/20 text-indigo hover:bg-indigo/30 border border-indigo/20"
                    onClick={() => toast.success(`Applied: ${sug.label}`, { description: 'Schedule updated. Conflict resolved.' })}
                  >
                    Apply Recommendation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Manual override */}
          <div className="mt-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-[10px] text-muted-foreground border-border hover:text-foreground"
              onClick={() => toast.info('Override recorded', { description: 'Please provide a reason for the override.' })}
            >
              Manual Override (Requires Reason)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScheduleBuilder() {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'Supervisor' | 'Dealer'>('all');

  const filteredEmployees = EMPLOYEES.filter(e => filterRole === 'all' || e.role === filterRole);
  const employee = EMPLOYEES.find(e => e.id === selectedEmployee) || null;
  const conflict = selectedEmployee ? CONFLICTS.find(c => c.employeeId === selectedEmployee && !c.resolved) || null : null;

  const handleCellSelect = (empId: string) => {
    setSelectedEmployee(empId);
    setShowInspector(true);
  };

  return (
    <div className="flex gap-0 -m-5 h-[calc(100vh-3.5rem)]">
      {/* Main schedule area */}
      <div className="flex-1 flex flex-col overflow-hidden p-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-mono font-semibold text-foreground tracking-wide">DRAFT SCHEDULE</h2>
            <Badge variant="outline" className="text-[10px] border-amber/40 text-amber">Draft</Badge>
            <span className="text-xs text-muted-foreground font-mono ml-2">{WEEK_LABEL}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex items-center gap-1 bg-secondary/30 rounded-md p-0.5">
              {(['all', 'Supervisor', 'Dealer'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded transition-colors ${
                    filterRole === role ? 'bg-teal/20 text-teal' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {role === 'all' ? 'All' : role}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => toast.info('Filters panel', { description: 'Feature coming soon' })}>
              <Filter className="w-3 h-3" /> Filters
            </Button>
            <Button size="sm" className="h-7 text-[10px] gap-1 bg-indigo/20 text-indigo hover:bg-indigo/30 border border-indigo/20" onClick={() => toast.success('AI Smart Fill', { description: 'AI is optimizing empty slots...' })}>
              <Sparkles className="w-3 h-3" /> Smart Fill
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => toast.info('Regenerating schedule...', { description: 'AI is recalculating with current constraints.' })}>
              <RefreshCw className="w-3 h-3" /> Regenerate
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => toast.info('Export', { description: 'Feature coming soon' })}>
              <Download className="w-3 h-3" /> Export
            </Button>
          </div>
        </div>

        {/* Shift legend */}
        <div className="flex items-center gap-3 mb-3 shrink-0 flex-wrap">
          {Object.values(SHIFT_TYPES).slice(0, 9).map(s => (
            <div key={s.code} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] text-muted-foreground font-mono">{s.code} {s.time}</span>
            </div>
          ))}
        </div>

        {/* Schedule grid */}
        <div className="flex-1 overflow-auto border border-border rounded-md">
          <table className="w-full border-collapse min-w-[700px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-secondary/50">
                <th className="text-left text-[10px] font-mono text-muted-foreground p-2 w-48 border-b border-border sticky left-0 bg-secondary/50 z-20">
                  EMPLOYEE
                </th>
                <th className="text-left text-[10px] font-mono text-muted-foreground p-2 w-16 border-b border-border">ROLE</th>
                {DAYS.map(day => (
                  <th key={day} className="text-center text-[10px] font-mono text-muted-foreground p-2 border-b border-border w-20">
                    {day}
                  </th>
                ))}
                <th className="text-center text-[10px] font-mono text-muted-foreground p-2 border-b border-border w-16">HRS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => {
                const schedule = DRAFT_SCHEDULE.find(s => s.employeeId === emp.id);
                if (!schedule) return null;
                const isSelected = selectedEmployee === emp.id;
                const hasConflict = CONFLICTS.some(c => c.employeeId === emp.id && !c.resolved);

                return (
                  <tr
                    key={emp.id}
                    className={`border-b border-border/50 transition-colors ${
                      isSelected ? 'bg-indigo/5' : hasConflict ? 'bg-coral/3' : 'hover:bg-secondary/20'
                    }`}
                  >
                    <td className="p-2 sticky left-0 bg-card z-10">
                      <button
                        onClick={() => handleCellSelect(emp.id)}
                        className="text-left"
                      >
                        <p className="text-xs font-medium text-foreground">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{emp.id}</p>
                      </button>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className={`text-[10px] ${emp.role === 'Supervisor' ? 'border-teal/30 text-teal' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                        {emp.role === 'Supervisor' ? 'SUP' : 'DLR'}
                      </Badge>
                    </td>
                    {schedule.week.map((shift, dayIdx) => (
                      <td key={dayIdx} className="p-1">
                        <ShiftCell
                          shift={shift}
                          employeeId={emp.id}
                          dayIndex={dayIdx}
                          conflicts={CONFLICTS}
                          onSelect={() => handleCellSelect(emp.id)}
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      <span className={`text-xs font-mono ${emp.weeklyHours > 44 ? 'text-coral font-bold' : emp.weeklyHours > 40 ? 'text-amber' : 'text-muted-foreground'}`}>
                        {emp.weeklyHours}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector panel */}
      {showInspector && (
        <InspectorPanel
          employee={employee}
          conflict={conflict}
          onClose={() => {
            setShowInspector(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
}
