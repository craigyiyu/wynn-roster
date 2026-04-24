/*
 * Rule Engine — Hard / Priority / Soft / Fairness / Override model
 * Control Tower design: operational rule engine with clear priority order
 * Shows the deterministic rule processing model, not a black-box
 */
import { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight,
  Info,
  Sliders,
  ArrowRight,
  Sparkles,
  Lock,
  Unlock,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RULES, type Rule, type RuleCategory } from '@/lib/mockData';
import { toast } from 'sonner';

const CATEGORIES: RuleCategory[] = [
  'Regulations', 'Business', 'Gaming Demand', 'Training', 'Overtime',
  'Fairness', 'CPH', 'Special Request', 'Couple Shift',
];

const TAG_STYLES: Record<string, string> = {
  'Hard Violation': 'bg-coral/10 text-coral border-coral/30',
  'Soft Warning': 'bg-amber/10 text-amber border-amber/30',
  'Priority Conflict': 'bg-indigo/10 text-indigo border-indigo/30',
  'Override Allowed': 'bg-teal/10 text-teal border-teal/30',
  'Override Not Allowed': 'bg-coral/10 text-coral border-coral/30',
  'Needs Manager Review': 'bg-amber/10 text-amber border-amber/30',
};

function getRuleTags(rule: Rule): string[] {
  const tags: string[] = [];
  if (rule.severity === 'hard') tags.push('Hard Violation');
  else tags.push('Soft Warning');
  if (rule.overridable) tags.push('Override Allowed');
  else tags.push('Override Not Allowed');
  if (rule.category === 'Couple Shift' || rule.category === 'Special Request') tags.push('Priority Conflict');
  if (rule.severity === 'soft' && rule.category === 'Fairness') tags.push('Needs Manager Review');
  return tags;
}

function RuleRow({ rule, onToggle }: { rule: Rule; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const tags = getRuleTags(rule);

  return (
    <div className={`border rounded-md transition-colors ${
      rule.severity === 'hard'
        ? 'border-coral/20 bg-coral/[0.03]'
        : 'border-amber/15 bg-amber/[0.03]'
    } ${!rule.enabled ? 'opacity-40' : ''}`}>
      <div className="flex items-start gap-3 p-3">
        <button onClick={onToggle} className="mt-0.5 shrink-0">
          {rule.enabled ? (
            <ToggleRight className="w-5 h-5 text-teal" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground">{rule.id}</span>
            <span className="text-[10px] font-mono text-muted-foreground">P{rule.priority}</span>
            {tags.map(tag => (
              <Badge key={tag} variant="outline" className={`text-[10px] ${TAG_STYLES[tag] || 'border-border text-muted-foreground'}`}>
                {tag}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-foreground mb-1">{rule.description}</p>

          {expanded && (
            <div className="mt-2 space-y-2 text-xs text-muted-foreground bg-secondary/20 rounded-md p-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div>
                  <span className="text-indigo font-medium">Reason: </span>
                  {rule.reason}
                </div>
                {rule.referenceDoc && (
                  <div>
                    <span className="font-medium">Reference: </span>
                    {rule.referenceDoc}
                  </div>
                )}
                <div>
                  <span className="font-medium">Sprint: </span>
                  {rule.sprint}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Override: </span>
                  {rule.overridable ? (
                    <span className="flex items-center gap-1 text-teal"><Unlock className="w-3 h-3" /> Allowed with reason</span>
                  ) : (
                    <span className="flex items-center gap-1 text-coral"><Lock className="w-3 h-3" /> Not allowed</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function RulesConstraints() {
  const [filterCategory, setFilterCategory] = useState<'all' | RuleCategory>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'hard' | 'soft'>('all');
  const [rules, setRules] = useState(RULES);

  const filtered = rules.filter(r => {
    const matchCat = filterCategory === 'all' || r.category === filterCategory;
    const matchSev = filterSeverity === 'all' || r.severity === filterSeverity;
    return matchCat && matchSev;
  });

  const hardCount = rules.filter(r => r.severity === 'hard').length;
  const softCount = rules.filter(r => r.severity === 'soft').length;
  const enabledCount = rules.filter(r => r.enabled).length;

  const handleToggle = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule && rule.severity === 'hard' && !rule.overridable) {
      toast.error('Cannot disable hard rule', { description: `Rule ${ruleId} is a mandatory regulation and cannot be overridden.` });
      return;
    }
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    toast.info(`Rule ${ruleId} ${rule?.enabled ? 'disabled' : 'enabled'}`);
  };

  return (
    <div className="max-w-[1200px] space-y-5">
      {/* Rule Processing Model */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo" />
            <p className="text-sm font-medium text-foreground">Deterministic Rule Processing Model</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs mb-4">
            <div className="px-3 py-1.5 bg-coral/10 border border-coral/20 rounded-md text-coral font-mono font-medium">Hard Rules</div>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <div className="px-3 py-1.5 bg-indigo/10 border border-indigo/20 rounded-md text-indigo font-mono font-medium">Priority Rules</div>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <div className="px-3 py-1.5 bg-amber/10 border border-amber/20 rounded-md text-amber font-mono font-medium">Soft Rules</div>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <div className="px-3 py-1.5 bg-teal/10 border border-teal/20 rounded-md text-teal font-mono font-medium">Fairness Scoring</div>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <div className="px-3 py-1.5 bg-secondary/50 border border-border rounded-md text-foreground font-mono font-medium">Manager Override</div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono text-foreground font-medium">PRIORITY ORDER:</span>
            <Badge variant="outline" className="text-[10px] border-coral/40 text-coral">Req RDO</Badge>
            <ArrowRight className="w-3 h-3" />
            <Badge variant="outline" className="text-[10px] border-amber/40 text-amber">Approved Couple Shift</Badge>
            <ArrowRight className="w-3 h-3" />
            <Badge variant="outline" className="text-[10px] border-indigo/40 text-indigo">Special Request</Badge>
            <ArrowRight className="w-3 h-3" />
            <Badge variant="outline" className="text-[10px] border-teal/40 text-teal">Rotation Pattern</Badge>
            <ArrowRight className="w-3 h-3" />
            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">Fairness Rules</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tag legend */}
      <div className="flex items-center gap-2 flex-wrap text-xs px-1">
        <span className="text-muted-foreground font-mono">TAGS:</span>
        {Object.entries(TAG_STYLES).map(([tag, cls]) => (
          <Badge key={tag} variant="outline" className={`text-[10px] ${cls}`}>{tag}</Badge>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-mono font-bold text-foreground">{rules.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Rules</p>
          </CardContent>
        </Card>
        <Card className="bg-coral/5 border-coral/20">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-mono font-bold text-coral">{hardCount}</p>
            <p className="text-[10px] text-muted-foreground">Hard Rules</p>
          </CardContent>
        </Card>
        <Card className="bg-amber/5 border-amber/20">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-mono font-bold text-amber">{softCount}</p>
            <p className="text-[10px] text-muted-foreground">Soft Rules</p>
          </CardContent>
        </Card>
        <Card className="bg-teal/5 border-teal/20">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-mono font-bold text-teal">{enabledCount}</p>
            <p className="text-[10px] text-muted-foreground">Active Rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-secondary/30 rounded-md p-0.5">
          {(['all', 'hard', 'soft'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 text-[10px] font-mono rounded transition-colors ${
                filterSeverity === sev ? 'bg-teal/20 text-teal' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {sev === 'all' ? 'All' : sev === 'hard' ? 'Hard Rules' : 'Soft Rules'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 text-[10px] font-mono rounded-md transition-colors ${
              filterCategory === 'all' ? 'bg-teal/20 text-teal' : 'bg-secondary/30 text-muted-foreground hover:text-foreground'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 text-[10px] font-mono rounded-md transition-colors ${
                filterCategory === cat ? 'bg-teal/20 text-teal' : 'bg-secondary/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rules list grouped by category */}
      <div className="space-y-4">
        {(filterCategory === 'all' ? CATEGORIES : [filterCategory]).map(cat => {
          const catRules = filtered.filter(r => r.category === cat);
          if (catRules.length === 0) return null;
          return (
            <div key={cat}>
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                {cat} ({catRules.length})
              </h3>
              <div className="space-y-2">
                {catRules.map(rule => (
                  <RuleRow key={rule.id} rule={rule} onToggle={() => handleToggle(rule.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
