/*
 * Team & Profiles — Employee directory
 * Skills matrix, fatigue gauges, preferences, couple pairs
 */
import { useState } from 'react';
import {
  Search,
  Users,
  Heart,
  Shield,
  Star,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EMPLOYEES, type Employee } from '@/lib/mockData';

function EmployeeCard({ emp, onSelect, isSelected }: { emp: Employee; onSelect: () => void; isSelected: boolean }) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:border-teal/30 ${isSelected ? 'border-indigo/40 bg-indigo/5' : 'bg-card border-border'}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-md flex items-center justify-center ${emp.role === 'Supervisor' ? 'bg-teal/15' : 'bg-indigo/15'}`}>
              <span className={`text-xs font-mono font-bold ${emp.role === 'Supervisor' ? 'text-teal' : 'text-indigo'}`}>
                {emp.role[0]}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{emp.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {emp.id} · Grade {emp.grade} · {emp.property}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] ${emp.role === 'Supervisor' ? 'border-teal/30 text-teal' : 'border-muted-foreground/30 text-muted-foreground'}`}>
            {emp.role}
          </Badge>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {emp.skills.map((s, i) => (
            <Badge key={i} variant="outline" className={`text-[10px] ${s.level === 'Primary' ? 'border-teal/30 text-teal' : s.level === 'Secondary' ? 'border-indigo/30 text-indigo' : 'border-amber/30 text-amber'}`}>
              {s.game}
            </Badge>
          ))}
        </div>

        {/* Fatigue bar */}
        <div className="flex items-center gap-2 mb-2">
          <Heart className={`w-3 h-3 ${emp.fatigueScore > 70 ? 'text-coral' : emp.fatigueScore > 50 ? 'text-amber' : 'text-teal'}`} />
          <div className="flex-1">
            <Progress value={emp.fatigueScore} className="h-1.5" />
          </div>
          <span className={`text-[10px] font-mono font-bold ${emp.fatigueScore > 70 ? 'text-coral' : emp.fatigueScore > 50 ? 'text-amber' : 'text-teal'}`}>
            {emp.fatigueScore}
          </span>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {emp.languages.join(', ')}
          </span>
          <span>{emp.weeklyHours}h/wk</span>
          <span>PHNW: {emp.phnwCount}</span>
        </div>

        {/* Special indicators */}
        <div className="flex gap-1 mt-2">
          {emp.specialRequest && (
            <Badge variant="outline" className="text-[10px] border-amber/30 text-amber">SR</Badge>
          )}
          {emp.coupleId && (
            <Badge variant="outline" className="text-[10px] border-indigo/30 text-indigo">Couple</Badge>
          )}
          {emp.evesLongTerm && (
            <Badge variant="outline" className="text-[10px] border-purple-400/30 text-purple-400">EV/ES</Badge>
          )}
          {emp.consecutiveNights >= 5 && (
            <Badge variant="outline" className="text-[10px] border-coral/30 text-coral">
              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
              {emp.consecutiveNights}N
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailPanel({ emp }: { emp: Employee }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${emp.role === 'Supervisor' ? 'bg-teal/15' : 'bg-indigo/15'}`}>
          <span className={`text-xl font-mono font-bold ${emp.role === 'Supervisor' ? 'text-teal' : 'text-indigo'}`}>
            {emp.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-mono font-bold text-foreground">{emp.name}</h2>
          <p className="text-xs text-muted-foreground font-mono">
            ID: {emp.id} · {emp.role} · Grade {emp.grade} · {emp.property}
          </p>
        </div>
      </div>

      {/* Skill matrix */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5" /> Skill Matrix
          </h3>
          <div className="space-y-2">
            {emp.skills.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{s.game}</span>
                <Badge variant="outline" className={`text-[10px] ${s.level === 'Primary' ? 'border-teal/40 text-teal' : s.level === 'Secondary' ? 'border-indigo/40 text-indigo' : 'border-amber/40 text-amber'}`}>
                  {s.level}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workload stats */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Workload & Compliance
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/30 rounded p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Weekly Hours</p>
              <p className={`text-lg font-mono font-bold ${emp.weeklyHours > 44 ? 'text-coral' : emp.weeklyHours > 40 ? 'text-amber' : 'text-foreground'}`}>
                {emp.weeklyHours}h
              </p>
            </div>
            <div className="bg-secondary/30 rounded p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Fatigue Score</p>
              <p className={`text-lg font-mono font-bold ${emp.fatigueScore > 70 ? 'text-coral' : emp.fatigueScore > 50 ? 'text-amber' : 'text-teal'}`}>
                {emp.fatigueScore}%
              </p>
            </div>
            <div className="bg-secondary/30 rounded p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Consecutive Nights</p>
              <p className={`text-lg font-mono font-bold ${emp.consecutiveNights >= 6 ? 'text-coral' : emp.consecutiveNights >= 4 ? 'text-amber' : 'text-foreground'}`}>
                {emp.consecutiveNights}
              </p>
            </div>
            <div className="bg-secondary/30 rounded p-3">
              <p className="text-[10px] text-muted-foreground mb-1">PHNW Count (YTD)</p>
              <p className="text-lg font-mono font-bold text-foreground">{emp.phnwCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" /> Languages
          </h3>
          <div className="flex flex-wrap gap-2">
            {emp.languages.map((lang, i) => (
              <Badge key={i} variant="outline" className="text-xs border-border text-foreground">{lang}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Special requests */}
      {(emp.specialRequest || emp.coupleId || emp.evesLongTerm) && (
        <Card className="bg-amber/5 border-amber/20">
          <CardContent className="p-4">
            <h3 className="text-xs font-mono text-amber uppercase tracking-wider mb-3">Special Conditions</h3>
            {emp.specialRequest && (
              <p className="text-sm text-foreground mb-2">
                <span className="text-amber font-medium">Special Request:</span> {emp.specialRequest}
              </p>
            )}
            {emp.coupleId && (
              <p className="text-sm text-foreground mb-2">
                <span className="text-indigo font-medium">Couple Pair:</span> {EMPLOYEES.find(e => e.id === emp.coupleId)?.name} ({emp.coupleId})
              </p>
            )}
            {emp.evesLongTerm && (
              <p className="text-sm text-foreground">
                <span className="text-purple-400 font-medium">Long-term EV/ES:</span> Only assigned to Evening and Early Swing shifts
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function TeamProfiles() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(EMPLOYEES[0]?.id || null);
  const [filterRole, setFilterRole] = useState<'all' | 'Supervisor' | 'Dealer'>('all');

  const filtered = EMPLOYEES.filter(emp => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.id.includes(search);
    const matchRole = filterRole === 'all' || emp.role === filterRole;
    return matchSearch && matchRole;
  });

  const selectedEmp = EMPLOYEES.find(e => e.id === selectedId);

  return (
    <div className="flex gap-5 -m-5 h-[calc(100vh-3.5rem)]">
      {/* List */}
      <div className="w-[420px] border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-semibold text-foreground tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-teal" />
              TEAM DIRECTORY
            </h2>
            <span className="text-xs font-mono text-muted-foreground">{filtered.length} members</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/30 rounded-md px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-1 bg-secondary/30 rounded-md p-0.5">
            {(['all', 'Supervisor', 'Dealer'] as const).map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`flex-1 px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                  filterRole === role ? 'bg-teal/20 text-teal' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {role === 'all' ? 'All' : role}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.map(emp => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              isSelected={selectedId === emp.id}
              onSelect={() => setSelectedId(emp.id)}
            />
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto p-5">
        {selectedEmp ? (
          <DetailPanel emp={selectedEmp} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select an employee to view profile
          </div>
        )}
      </div>
    </div>
  );
}
