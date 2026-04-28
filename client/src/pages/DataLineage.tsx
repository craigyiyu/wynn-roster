/*
 * Data Lineage View — Source-to-result lineage for RDO, SR, and EV/ES
 * Three visual lineage cards showing data flow from source tables to result fields
 */
import {
  Link2, Database, Sparkles, ArrowDown, ArrowRight,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DATA_LINEAGE } from '@/lib/databaseMockData';

const TYPE_STYLES: Record<string, { accent: string; bg: string; border: string }> = {
  rdo: { accent: 'text-teal', bg: 'bg-teal/5', border: 'border-teal/20' },
  sr: { accent: 'text-indigo', bg: 'bg-indigo/5', border: 'border-indigo/20' },
  eves: { accent: 'text-amber', bg: 'bg-amber/5', border: 'border-amber/20' },
};

function LineageCard({ item }: { item: typeof DATA_LINEAGE[0] }) {
  const style = TYPE_STYLES[item.type];

  return (
    <Card className={`${style.bg} ${style.border}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className={`w-4 h-4 ${style.accent}`} />
          <h3 className={`text-sm font-mono font-semibold ${style.accent}`}>{item.title}</h3>
          <Badge variant="outline" className={`text-[9px] ml-auto ${style.accent} ${style.border}`}>
            {item.type === 'eves' ? 'List-driven' : 'AI Extraction'}
          </Badge>
        </div>

        {/* Flow Diagram */}
        <div className="space-y-0">
          {/* Source */}
          <div className="p-3 bg-secondary/30 rounded-t border border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Database className="w-3 h-3 text-muted-foreground" />
              <p className="text-[9px] font-mono text-muted-foreground uppercase">Source Table</p>
            </div>
            <p className={`text-xs font-mono font-medium ${style.accent}`}>{item.sourceTable}</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.sourceFields.map(f => (
                <Badge key={f} variant="outline" className="text-[9px] px-1.5 border-border text-muted-foreground font-mono">{f}</Badge>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center py-1">
            <div className="flex flex-col items-center">
              <ArrowDown className={`w-4 h-4 ${style.accent}`} />
            </div>
          </div>

          {/* AI Processing */}
          <div className={`p-3 ${style.bg} border ${style.border} rounded`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className={`w-3 h-3 ${style.accent}`} />
              <p className="text-[9px] font-mono text-muted-foreground uppercase">
                {item.type === 'eves' ? 'Rule Tagging' : 'AI Processing'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{item.aiProcessing}</p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center py-1">
            <ArrowDown className={`w-4 h-4 ${style.accent}`} />
          </div>

          {/* Result */}
          <div className="p-3 bg-secondary/30 rounded-b border border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
              <p className="text-[9px] font-mono text-muted-foreground uppercase">Result Table</p>
            </div>
            <p className={`text-xs font-mono font-medium ${style.accent}`}>{item.resultTable}</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.resultFields.map(f => (
                <Badge key={f} variant="outline" className={`text-[9px] px-1.5 ${style.border} ${style.accent} font-mono`}>{f}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Example */}
        <div className="p-3 bg-secondary/20 rounded border border-border/30">
          <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1.5">Example</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground"><span className="text-muted-foreground/60">Input:</span> <span className="font-mono">{item.exampleInput}</span></p>
            <p className="text-xs text-muted-foreground"><span className="text-muted-foreground/60">Output:</span> <span className={`font-mono ${style.accent}`}>{item.exampleOutput}</span></p>
          </div>
        </div>

        {/* Meaning */}
        <p className="text-xs text-muted-foreground leading-relaxed">{item.meaning}</p>
      </CardContent>
    </Card>
  );
}

export default function DataLineage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
          <Link2 className="w-4 h-4 text-teal" />
          DATA LINEAGE
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Source-to-result data flow for RDO, Special Request, and EV/ES tagging</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {DATA_LINEAGE.map(item => (
          <LineageCard key={item.id} item={item} />
        ))}
      </div>

      {/* Summary */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-foreground mb-2">Key Distinction</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-2 bg-teal/5 rounded border border-teal/20">
              <p className="text-[10px] font-medium text-teal mb-0.5">RDO Extraction</p>
              <p className="text-[10px] text-muted-foreground">AI extracts date patterns from free-text Notes field. The RDO Scheduler then applies these dates to the roster.</p>
            </div>
            <div className="p-2 bg-indigo/5 rounded border border-indigo/20">
              <p className="text-[10px] font-medium text-indigo mb-0.5">SR Extraction</p>
              <p className="text-[10px] text-muted-foreground">AI parses employee request text into structured allow/refuse/rdo constraints. The SR Scheduler enforces these rules.</p>
            </div>
            <div className="p-2 bg-amber/5 rounded border border-amber/20">
              <p className="text-[10px] font-medium text-amber mb-0.5">EV/ES Tagging</p>
              <p className="text-[10px] text-muted-foreground">Not AI extraction. List-driven rule tagging from wm_wp_ev_es_employee. Employees on the list get fixed EV/ES patterns.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
