/*
 * Rules & Constraints — Configuration area
 * Displays all hard/soft rules from the actual Wynn rostering rules
 * Allows toggling, priority weighting, and sprint filtering
 */
import { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Filter,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight,
  Info,
  Sliders,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RULES, type Rule, type RuleCategory } from '@/lib/mockData';
import { toast } from 'sonner';

const CATEGORIES: RuleCategory[] = [
  'Regulations',
  'Business',
  'Gaming Demand',
  'Training',
  'Overtime',
  'Fairness',
  'CPH',
  'Special Request',
  'Couple Shift',
];

function RuleRow({ rule, onToggle }: { rule: Rule; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-md transition-colors ${
      rule.severity === 'hard'
        ? 'border-coral/20 bg-coral/3'
        : 'border-amber/15 bg-amber/3'
    } ${!rule.enabled ? 'opacity-40' : ''}`}>
      <div className="flex items-start gap-3 p-3">
        {/* Toggle */}
        <button onClick={onToggle} className="mt-0.5 shrink-0">
          {rule.enabled ? (
            <ToggleRight className="w-5 h-5 text-teal" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground">{rule.id}</span>
            <Badge variant="outline" className={`text-[10px] ${
              rule.severity === 'hard' ? 'border-coral/40 text-coral' : 'border-amber/40 text-amber'
            }`}>
              {rule.severity === 'hard' ? 'HARD RULE' : 'SOFT RULE'}
            </Badge>
            {!rule.overridable && (
              <Badge variant="outline" className="text-[10px] border-coral/30 text-coral">
                Cannot Override
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
              {rule.sprint}
            </Badge>
          </div>
          <p className="text-sm text-foreground mb-1">{rule.description}</p>

          {expanded && (
            <div className="mt-2 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Info className="w-3 h-3 mt-0.5 shrink-0 text-indigo" />
                <div>
                  <span className="text-indigo font-medium">Reason: </span>
                  {rule.reason}
                </div>
              </div>
              {rule.referenceDoc && (
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Reference: </span>
                    {rule.referenceDoc}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-medium">Priority:</span>
                <span className="font-mono">{rule.priority}</span>
              </div>
            </div>
          )}
        </div>

        {/* Expand */}
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
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono font-semibold text-foreground tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal" />
            RULES & CONSTRAINTS ENGINE
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Configure the AI scheduling engine's constraint logic. Based on Wynn Macau Table Games rostering rules v3.1.
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => toast.info('Priority weighting', { description: 'Feature coming soon' })}>
          <Sliders className="w-3 h-3" /> Priority Weights
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
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
