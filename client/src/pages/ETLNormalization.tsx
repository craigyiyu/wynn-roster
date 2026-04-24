/*
 * ETL & Normalization — Raw Excel text → structured database fields
 * Control Tower design: dark, table-centric with validation status
 */
import { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  ArrowRight,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ETL_ROWS, type ETLRow } from '@/lib/mockDataV2';

const statusConfig: Record<ETLRow['validationStatus'], { label: string; cls: string; icon: any }> = {
  valid: { label: 'Valid', cls: 'border-teal/40 text-teal', icon: CheckCircle2 },
  warning: { label: 'Warning', cls: 'border-amber/40 text-amber', icon: AlertTriangle },
  error: { label: 'Error', cls: 'border-coral/40 text-coral', icon: XCircle },
  review: { label: 'Needs Review', cls: 'border-indigo/40 text-indigo', icon: Eye },
};

export default function ETLNormalization() {
  const [filter, setFilter] = useState<'all' | 'valid' | 'warning' | 'error' | 'review'>('all');
  const [selectedRow, setSelectedRow] = useState<ETLRow | null>(null);

  const filtered = filter === 'all' ? ETL_ROWS : ETL_ROWS.filter(r => r.validationStatus === filter);
  const counts = {
    all: ETL_ROWS.length,
    valid: ETL_ROWS.filter(r => r.validationStatus === 'valid').length,
    warning: ETL_ROWS.filter(r => r.validationStatus === 'warning').length,
    error: ETL_ROWS.filter(r => r.validationStatus === 'error').length,
    review: ETL_ROWS.filter(r => r.validationStatus === 'review').length,
  };

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Pipeline context */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-amber" />
            <div>
              <p className="text-sm font-medium text-foreground">ETL & Normalization Pipeline</p>
              <p className="text-xs text-muted-foreground">Raw Excel text is parsed, normalized into database-friendly fields, and validated by AI + rules.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-secondary/50 rounded font-mono">Raw Excel Text</span>
            <ArrowRight className="w-3 h-3" />
            <span className="px-2 py-1 bg-secondary/50 rounded font-mono">Field Normalization</span>
            <ArrowRight className="w-3 h-3" />
            <span className="px-2 py-1 bg-indigo/10 border border-indigo/20 rounded font-mono text-indigo">AI Parsing</span>
            <ArrowRight className="w-3 h-3" />
            <span className="px-2 py-1 bg-teal/10 border border-teal/20 rounded font-mono text-teal">Validation</span>
            <ArrowRight className="w-3 h-3" />
            <span className="px-2 py-1 bg-secondary/50 rounded font-mono">Database</span>
          </div>
        </CardContent>
      </Card>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {(['all', 'valid', 'warning', 'review', 'error'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            className={`text-xs h-7 ${filter === f ? '' : 'border-border text-muted-foreground'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : statusConfig[f]?.label || f} ({counts[f]})
          </Button>
        ))}
      </div>

      {/* Main content: table + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-mono font-medium">Source Sheet</th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-mono font-medium">Raw Text</th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-mono font-medium">Normalized Field</th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-mono font-medium">AI / Rule Output</th>
                    <th className="text-center px-4 py-2.5 text-muted-foreground font-mono font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => {
                    const sc = statusConfig[row.validationStatus];
                    const Icon = sc.icon;
                    const isSelected = selectedRow?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-border/50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo/5' : 'hover:bg-secondary/20'}`}
                        onClick={() => setSelectedRow(row)}
                      >
                        <td className="px-4 py-2.5 text-muted-foreground">{row.sourceSheet}</td>
                        <td className="px-4 py-2.5 font-mono text-foreground">
                          <span className="bg-secondary/50 px-1.5 py-0.5 rounded">{row.rawText}</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.normalizedField}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-indigo text-[11px]">{row.aiRuleOutput}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Icon className={`w-3 h-3 ${sc.cls.split(' ')[1]}`} />
                            <Badge variant="outline" className={`text-[10px] ${sc.cls}`}>{sc.label}</Badge>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {selectedRow ? (
            <Card className="bg-card border-border sticky top-5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo" />
                  <p className="text-sm font-medium text-foreground">Transformation Detail</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground mb-1">SOURCE</p>
                    <p className="text-xs text-foreground">{selectedRow.sourceSheet}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground mb-1">RAW TEXT</p>
                    <p className="text-sm font-mono bg-secondary/50 px-3 py-2 rounded text-foreground">{selectedRow.rawText}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground mb-1">NORMALIZED FIELD</p>
                    <p className="text-xs text-foreground">{selectedRow.normalizedField}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground mb-1">AI / RULE OUTPUT</p>
                    <p className="text-sm font-mono bg-indigo/5 border border-indigo/20 px-3 py-2 rounded text-indigo">{selectedRow.aiRuleOutput}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground mb-1">VALIDATION STATUS</p>
                    <Badge variant="outline" className={`text-xs ${statusConfig[selectedRow.validationStatus].cls}`}>
                      {statusConfig[selectedRow.validationStatus].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground mb-1">REVIEW ACTION</p>
                    <p className="text-xs text-muted-foreground">{selectedRow.reviewAction}</p>
                  </div>
                </div>

                {(selectedRow.validationStatus === 'warning' || selectedRow.validationStatus === 'review') && (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button size="sm" className="text-xs h-7 bg-teal text-[#0f1117] hover:bg-teal/80">Approve</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-amber/30 text-amber hover:bg-amber/10">Edit</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-coral/30 text-coral hover:bg-coral/10">Reject</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Database className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Select a row to view transformation details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
