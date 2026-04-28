/*
 * Rule Studio — Rule Control Center
 * 5 Sections: Rule Library, Rule Pipeline, Rule Detail, Conflict Matrix, Override Console
 * Rules are visible, traceable, governable, and auditable
 */
import { useState } from 'react';
import {
  BookOpen, GitBranch, Eye, Zap, Shield, AlertTriangle,
  CheckCircle2, Clock, XCircle, Pause, Database, ArrowRight,
  ChevronRight, ChevronDown, Settings2, FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RULE_MODULES, RULE_CONFLICTS, OVERRIDE_LOGS, PIPELINE_STEPS, RuleModule } from '@/lib/databaseMockData';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-teal/10 text-teal border-teal/30',
  completed: 'bg-teal/10 text-teal border-teal/30',
  built_not_enabled: 'bg-amber/10 text-amber border-amber/30',
  data_only: 'bg-indigo/10 text-indigo border-indigo/30',
  pending: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  future: 'bg-secondary text-muted-foreground border-border',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Active / Completed',
  built_not_enabled: 'Built, Not Enabled',
  data_only: 'Data Loaded Only',
  pending: 'Pending Integration',
  future: 'Future',
};

const TYPE_COLORS: Record<string, string> = {
  hard: 'bg-coral/10 text-coral border-coral/30',
  priority: 'bg-amber/10 text-amber border-amber/30',
  soft: 'bg-teal/10 text-teal border-teal/30',
  fallback: 'bg-indigo/10 text-indigo border-indigo/30',
  post_process: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  export: 'bg-secondary text-muted-foreground border-border',
};

function RuleLibrary({ onSelect }: { onSelect: (m: RuleModule) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-3">All rule modules with their current implementation status. Click any module for details.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {RULE_MODULES.map(mod => (
          <Card
            key={mod.id}
            className="bg-card/50 border-border/50 hover:border-teal/30 transition-colors cursor-pointer"
            onClick={() => onSelect(mod)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-foreground">{mod.name}</p>
                <Badge variant="outline" className={`text-[9px] px-1.5 ${STATUS_COLORS[mod.status]}`}>
                  {STATUS_LABELS[mod.status]}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{mod.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-[9px] px-1.5 ${TYPE_COLORS[mod.ruleType]}`}>
                  {mod.ruleType.replace('_', ' ')}
                </Badge>
                <span className="text-[9px] text-muted-foreground font-mono">{mod.inputTable}</span>
              </div>
              {(mod.status === 'active' || mod.status === 'completed') && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/30">
                  <span className="text-[9px] text-muted-foreground">Affected: <span className="text-foreground font-mono">{mod.affectedRecords}</span></span>
                  <span className="text-[9px] text-muted-foreground">Changed: <span className="text-amber font-mono">{mod.changedRecords}</span></span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RulePipeline() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-3">Actual production execution order. Each step shows status, input, output, and sample impact.</p>
      <div className="space-y-0">
        {PIPELINE_STEPS.map((step, i) => {
          const statusColor = step.status === 'completed' ? 'border-teal/40 bg-teal/5' :
            step.status === 'active' ? 'border-teal/40 bg-teal/5' :
            step.status === 'not_enabled' ? 'border-amber/40 bg-amber/5' :
            'border-border bg-secondary/20';
          const dotColor = step.status === 'completed' ? 'bg-teal' :
            step.status === 'active' ? 'bg-teal' :
            step.status === 'not_enabled' ? 'bg-amber' :
            'bg-muted-foreground';

          return (
            <div key={step.id} className="flex gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center shrink-0 w-6">
                <div className={`w-3 h-3 rounded-full ${dotColor} shrink-0 mt-3`} />
                {i < PIPELINE_STEPS.length - 1 && <div className="w-px flex-1 bg-border/50" />}
              </div>
              {/* Card */}
              <div className={`flex-1 mb-2 p-3 rounded border ${statusColor}`}>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-muted-foreground w-5">{String(step.id).padStart(2, '0')}</span>
                    <p className="text-xs font-medium text-foreground">{step.name}</p>
                    {step.isConditional && (
                      <Badge variant="outline" className="text-[8px] px-1 border-indigo/30 text-indigo">conditional</Badge>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-[9px] px-1.5 ${STATUS_COLORS[step.status] || STATUS_COLORS['future']}`}>
                    {step.status.replace('_', ' ')}
                  </Badge>
                </div>
                {step.condition && (
                  <p className="text-[10px] text-indigo font-mono mb-1">if {step.condition}</p>
                )}
                <p className="text-[10px] text-muted-foreground mb-1.5">{step.description}</p>
                <div className="flex items-center gap-4 text-[9px] text-muted-foreground font-mono">
                  <span>in: {step.inputTable.length > 40 ? step.inputTable.slice(0, 40) + '...' : step.inputTable}</span>
                  <span>out: {step.outputField.length > 30 ? step.outputField.slice(0, 30) + '...' : step.outputField}</span>
                  <span className="text-amber">{step.sampleImpact}</span>
                  {step.reviewNeeded && <span className="text-coral">review needed</span>}
                </div>
                <p className="text-[9px] text-muted-foreground/60 font-mono mt-1">{step.codeRef}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RuleDetail({ module: mod, onBack }: { module: RuleModule; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-teal hover:underline flex items-center gap-1">
        ← Back to Library
      </button>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-mono font-semibold text-foreground">{mod.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{mod.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[mod.status]}`}>{STATUS_LABELS[mod.status]}</Badge>
          <Badge variant="outline" className={`text-[10px] ${TYPE_COLORS[mod.ruleType]}`}>{mod.ruleType.replace('_', ' ')}</Badge>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase mb-1">Business Explanation</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{mod.explanation}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase mb-1">Input Table</p>
              <p className="text-xs font-mono text-teal">{mod.inputTable}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase mb-1">Override Policy</p>
              <p className="text-xs text-muted-foreground">{mod.overridePolicy}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase mb-1">Input Fields</p>
              <div className="flex flex-wrap gap-1">
                {mod.inputFields.map(f => (
                  <Badge key={f} variant="outline" className="text-[9px] px-1.5 border-border text-muted-foreground font-mono">{f}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase mb-1">Output Fields</p>
              <div className="flex flex-wrap gap-1">
                {mod.outputFields.map(f => (
                  <Badge key={f} variant="outline" className="text-[9px] px-1.5 border-teal/30 text-teal font-mono">{f}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border/30">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">Affected</p>
              <p className="text-sm font-mono font-bold text-foreground">{mod.affectedRecords}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">Changed</p>
              <p className="text-sm font-mono font-bold text-amber">{mod.changedRecords}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">Validation</p>
              <Badge variant="outline" className={`text-[10px] mt-0.5 ${mod.customer_validation === 'validated' ? 'text-teal border-teal/30' : mod.customer_validation === 'pending' ? 'text-amber border-amber/30' : 'text-muted-foreground border-border'}`}>
                {mod.customer_validation.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">Owner</p>
              <p className="text-xs text-muted-foreground">{mod.owner}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConflictMatrix() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-3">Common rule conflict pairs showing priority resolution and implementation status.</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Rule A</th>
              <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Rule B</th>
              <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Conflict Type</th>
              <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Winning Rule</th>
              <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Review</th>
              <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Override</th>
              <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Status</th>
            </tr>
          </thead>
          <tbody>
            {RULE_CONFLICTS.map(c => (
              <tr key={c.id} className="border-b border-border/30 hover:bg-secondary/20">
                <td className="p-2 text-xs font-medium text-foreground">{c.ruleA}</td>
                <td className="p-2 text-xs font-medium text-foreground">{c.ruleB}</td>
                <td className="p-2 text-[10px] text-muted-foreground">{c.conflictType}</td>
                <td className="p-2 text-xs text-amber font-mono">{c.winningRule}</td>
                <td className="p-2 text-center">
                  {c.managerReview ? (
                    <AlertTriangle className="w-3 h-3 text-amber mx-auto" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-teal mx-auto" />
                  )}
                </td>
                <td className="p-2 text-center">
                  {c.overrideAllowed ? (
                    <CheckCircle2 className="w-3 h-3 text-teal mx-auto" />
                  ) : (
                    <XCircle className="w-3 h-3 text-coral mx-auto" />
                  )}
                </td>
                <td className="p-2 text-[10px] text-muted-foreground">{c.implementationStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverrideConsole() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-3">Managers can override where allowed. The system keeps an audit trail of all changes.</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Employee</th>
              <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Date</th>
              <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Original</th>
              <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Rule</th>
              <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Override</th>
              <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Affected Rule</th>
              <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Reason</th>
              <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Approver</th>
              <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Status</th>
            </tr>
          </thead>
          <tbody>
            {OVERRIDE_LOGS.map(o => (
              <tr key={o.id} className="border-b border-border/30 hover:bg-secondary/20">
                <td className="p-2">
                  <p className="text-xs font-medium text-foreground">{o.EmployeeName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{o.EmployeeNumber}</p>
                </td>
                <td className="p-2 text-xs font-mono text-muted-foreground">{o.ShiftDate}</td>
                <td className="p-2 text-center text-xs font-mono text-muted-foreground">{o.originalShift}</td>
                <td className="p-2 text-center text-xs font-mono text-amber">{o.ruleGeneratedShift}</td>
                <td className="p-2 text-center text-xs font-mono font-bold text-indigo">{o.managerOverrideShift}</td>
                <td className="p-2 text-[10px] text-muted-foreground">{o.affectedRule}</td>
                <td className="p-2 text-[10px] text-muted-foreground max-w-[200px] truncate">{o.overrideReason}</td>
                <td className="p-2 text-xs text-muted-foreground">{o.approver || '—'}</td>
                <td className="p-2 text-center">
                  <Badge variant="outline" className={`text-[9px] ${
                    o.status === 'approved' ? 'text-teal border-teal/30' :
                    o.status === 'pending' ? 'text-amber border-amber/30' :
                    'text-coral border-coral/30'
                  }`}>
                    {o.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RuleStudio() {
  const [activeTab, setActiveTab] = useState('library');
  const [selectedModule, setSelectedModule] = useState<RuleModule | null>(null);

  const handleSelectModule = (mod: RuleModule) => {
    setSelectedModule(mod);
    setActiveTab('detail');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-teal" />
            RULE STUDIO
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Rule-visible, traceable, governable, and auditable scheduling rules</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-teal/30 text-teal font-mono">
            {RULE_MODULES.filter(m => m.status === 'active' || m.status === 'completed').length} Active
          </Badge>
          <Badge variant="outline" className="text-[10px] border-amber/30 text-amber font-mono">
            {RULE_MODULES.filter(m => m.status === 'built_not_enabled' || m.status === 'data_only').length} Partial
          </Badge>
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground font-mono">
            {RULE_MODULES.filter(m => m.status === 'pending' || m.status === 'future').length} Planned
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="library" className="text-xs gap-1"><BookOpen className="w-3 h-3" /> Rule Library</TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs gap-1"><GitBranch className="w-3 h-3" /> Rule Pipeline</TabsTrigger>
          <TabsTrigger value="detail" className="text-xs gap-1" disabled={!selectedModule}><Eye className="w-3 h-3" /> Rule Detail</TabsTrigger>
          <TabsTrigger value="conflicts" className="text-xs gap-1"><Zap className="w-3 h-3" /> Conflict Matrix</TabsTrigger>
          <TabsTrigger value="overrides" className="text-xs gap-1"><Shield className="w-3 h-3" /> Override Console</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-4">
          <RuleLibrary onSelect={handleSelectModule} />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <RulePipeline />
        </TabsContent>

        <TabsContent value="detail" className="mt-4">
          {selectedModule ? (
            <RuleDetail module={selectedModule} onBack={() => { setSelectedModule(null); setActiveTab('library'); }} />
          ) : (
            <p className="text-xs text-muted-foreground">Select a rule module from the library to view details.</p>
          )}
        </TabsContent>

        <TabsContent value="conflicts" className="mt-4">
          <ConflictMatrix />
        </TabsContent>

        <TabsContent value="overrides" className="mt-4">
          <OverrideConsole />
        </TabsContent>
      </Tabs>
    </div>
  );
}
