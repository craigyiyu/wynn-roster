/*
 * Demand & Skills View — Operational demand vs supply by game/shift
 * Control Tower design: heatmap-style table with SUP/DLR coverage
 * Shows that roster quality = operational demand satisfaction
 */
import { useState } from 'react';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Users,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DEMAND_SKILLS, type DemandSkillRow } from '@/lib/mockDataV2';

const statusConfig = {
  met: { label: 'Met', cls: 'text-teal', bg: 'bg-teal/5', border: 'border-teal/20' },
  short: { label: 'Short', cls: 'text-coral', bg: 'bg-coral/5', border: 'border-coral/20' },
  surplus: { label: 'Surplus', cls: 'text-amber', bg: 'bg-amber/5', border: 'border-amber/20' },
};

function VarianceCell({ value }: { value: number }) {
  if (value === 0) return <span className="text-teal font-mono">0</span>;
  if (value > 0) return <span className="text-amber font-mono flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+{value}</span>;
  return <span className="text-coral font-mono flex items-center gap-0.5"><TrendingDown className="w-3 h-3" />{value}</span>;
}

function CoverageCell({ current, required }: { current: number; required: number }) {
  const ok = current >= required;
  return (
    <span className={`font-mono font-bold ${ok ? 'text-teal' : 'text-coral'}`}>
      {current}<span className="text-muted-foreground font-normal">/{required}</span>
    </span>
  );
}

export default function DemandSkills() {
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [selectedRow, setSelectedRow] = useState<DemandSkillRow | null>(null);

  const games = ['all', ...Array.from(new Set(DEMAND_SKILLS.map(d => d.game)))];
  const filtered = gameFilter === 'all' ? DEMAND_SKILLS : DEMAND_SKILLS.filter(d => d.game === gameFilter);

  const totalShort = DEMAND_SKILLS.filter(d => d.status === 'short').length;
  const totalMet = DEMAND_SKILLS.filter(d => d.status === 'met').length;
  const totalSurplus = DEMAND_SKILLS.filter(d => d.status === 'surplus').length;
  const totalDLRGap = DEMAND_SKILLS.reduce((sum, d) => sum + Math.min(0, d.curDLR - d.reqDLR), 0);
  const totalSUPGap = DEMAND_SKILLS.reduce((sum, d) => sum + Math.min(0, d.curSUP - d.reqSUP), 0);

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-foreground">{DEMAND_SKILLS.length}</p>
          <p className="text-[10px] text-muted-foreground">Game × Shift Slots</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-teal">{totalMet}</p>
          <p className="text-[10px] text-muted-foreground">Fully Met</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-coral">{totalShort}</p>
          <p className="text-[10px] text-muted-foreground">Shortages</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className={`text-lg font-mono font-bold ${totalDLRGap < 0 ? 'text-coral' : 'text-teal'}`}>{totalDLRGap}</p>
          <p className="text-[10px] text-muted-foreground">DLR Gap (Total)</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className={`text-lg font-mono font-bold ${totalSUPGap < 0 ? 'text-coral' : 'text-teal'}`}>{totalSUPGap}</p>
          <p className="text-[10px] text-muted-foreground">SUP Gap (Total)</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {games.map(g => (
          <Button
            key={g}
            variant={gameFilter === g ? 'default' : 'outline'}
            size="sm"
            className={`text-xs h-7 ${gameFilter === g ? '' : 'border-border text-muted-foreground'}`}
            onClick={() => setGameFilter(g)}
          >
            {g === 'all' ? 'All Games' : g}
          </Button>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table */}
        <div className="lg:col-span-2 overflow-x-auto">
          <Card className="bg-card border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-3 py-2.5 text-muted-foreground font-mono font-medium">Game</th>
                  <th className="text-left px-3 py-2.5 text-muted-foreground font-mono font-medium">Shift</th>
                  <th className="text-center px-3 py-2.5 text-muted-foreground font-mono font-medium">DLR</th>
                  <th className="text-center px-3 py-2.5 text-muted-foreground font-mono font-medium">SUP</th>
                  <th className="text-center px-3 py-2.5 text-muted-foreground font-mono font-medium">Spare</th>
                  <th className="text-center px-3 py-2.5 text-muted-foreground font-mono font-medium">Variance</th>
                  <th className="text-center px-3 py-2.5 text-muted-foreground font-mono font-medium">Status</th>
                  <th className="text-left px-3 py-2.5 text-muted-foreground font-mono font-medium">Skills</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const sc = statusConfig[row.status];
                  const isSelected = selectedRow === row;
                  return (
                    <tr
                      key={`${row.game}-${row.shift}`}
                      className={`border-b border-border/50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo/5' : `hover:${sc.bg}`}`}
                      onClick={() => setSelectedRow(row)}
                    >
                      <td className="px-3 py-2.5 font-medium text-foreground">{row.game}</td>
                      <td className="px-3 py-2.5">
                        <div>
                          <span className="font-mono text-foreground">{row.shift}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">{row.shiftTime}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center"><CoverageCell current={row.curDLR} required={row.reqDLR} /></td>
                      <td className="px-3 py-2.5 text-center"><CoverageCell current={row.curSUP} required={row.reqSUP} /></td>
                      <td className="px-3 py-2.5 text-center"><CoverageCell current={row.curSpare} required={row.reqSpare} /></td>
                      <td className="px-3 py-2.5 text-center"><VarianceCell value={row.variance} /></td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant="outline" className={`text-[10px] ${sc.cls} border-current/30`}>{sc.label}</Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {row.specialSkills.map((s, j) => (
                            <Badge key={j} variant="outline" className="text-[10px] border-indigo/30 text-indigo">{s}</Badge>
                          ))}
                          {row.specialSkills.length === 0 && <span className="text-muted-foreground">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Detail / AI panel */}
        <div className="lg:col-span-1">
          {selectedRow ? (
            <Card className="bg-card border-border sticky top-5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo" />
                  <p className="text-sm font-medium text-foreground">Demand Detail</p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">GAME</p>
                      <p className="text-sm font-medium text-foreground">{selectedRow.game}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">SHIFT</p>
                      <p className="text-sm font-mono text-foreground">{selectedRow.shift} ({selectedRow.shiftTime})</p>
                    </div>
                  </div>

                  {/* Coverage bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">DLR Coverage</span>
                        <span className={`font-mono font-bold ${selectedRow.curDLR >= selectedRow.reqDLR ? 'text-teal' : 'text-coral'}`}>
                          {selectedRow.curDLR}/{selectedRow.reqDLR}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${selectedRow.curDLR >= selectedRow.reqDLR ? 'bg-teal' : 'bg-coral'}`}
                          style={{ width: `${Math.min(100, (selectedRow.curDLR / selectedRow.reqDLR) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">SUP Coverage</span>
                        <span className={`font-mono font-bold ${selectedRow.curSUP >= selectedRow.reqSUP ? 'text-teal' : 'text-coral'}`}>
                          {selectedRow.curSUP}/{selectedRow.reqSUP}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${selectedRow.curSUP >= selectedRow.reqSUP ? 'bg-teal' : 'bg-coral'}`}
                          style={{ width: `${Math.min(100, (selectedRow.curSUP / selectedRow.reqSUP) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Spare Coverage</span>
                        <span className={`font-mono font-bold ${selectedRow.curSpare >= selectedRow.reqSpare ? 'text-teal' : 'text-coral'}`}>
                          {selectedRow.curSpare}/{selectedRow.reqSpare}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${selectedRow.reqSpare === 0 ? 'bg-teal' : selectedRow.curSpare >= selectedRow.reqSpare ? 'bg-teal' : 'bg-coral'}`}
                          style={{ width: `${selectedRow.reqSpare === 0 ? 100 : Math.min(100, (selectedRow.curSpare / selectedRow.reqSpare) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {selectedRow.specialSkills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground mb-1">SPECIAL SKILLS REQUIRED</p>
                      <div className="flex gap-1 flex-wrap">
                        {selectedRow.specialSkills.map((s, i) => (
                          <Badge key={i} className="bg-indigo/10 text-indigo border-indigo/30 text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* R11 note */}
                  <div className="bg-secondary/30 rounded-md p-3">
                    <p className="text-[10px] font-mono text-muted-foreground mb-1">RULE R11</p>
                    <p className="text-xs text-muted-foreground">Supervisor headcount can supplement Dealer headcount when DLR is short.</p>
                  </div>

                  {/* AI recommendation */}
                  {selectedRow.aiRecommendation && (
                    <Card className="bg-indigo/5 border-indigo/20">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-indigo mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-mono text-indigo mb-1">AI RECOMMENDATION</p>
                            <p className="text-xs text-muted-foreground">{selectedRow.aiRecommendation}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Select a row to view demand details and AI recommendations</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
