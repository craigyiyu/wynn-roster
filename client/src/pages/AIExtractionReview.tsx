/*
 * AI Extraction Review — RDO Extraction + Special Request Extraction tabs
 * Control Tower design: dark, tabbed view with confidence indicators
 */
import { useState } from 'react';
import {
  Sparkles,
  CalendarDays,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Eye,
  XCircle,
  Edit3,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RDO_EXTRACTIONS, SR_EXTRACTIONS, type RDOExtraction, type SRExtraction } from '@/lib/mockDataV2';

const rdoStatusIcon = (s: RDOExtraction['status']) => {
  switch (s) {
    case 'confirmed': return <CheckCircle2 className="w-3.5 h-3.5 text-teal" />;
    case 'review': return <Eye className="w-3.5 h-3.5 text-amber" />;
    case 'corrected': return <Edit3 className="w-3.5 h-3.5 text-indigo" />;
    case 'rejected': return <XCircle className="w-3.5 h-3.5 text-coral" />;
  }
};

const rdoStatusBadge = (s: RDOExtraction['status']) => {
  const map: Record<string, { label: string; cls: string }> = {
    confirmed: { label: 'Confirmed', cls: 'border-teal/40 text-teal' },
    review: { label: 'Needs Review', cls: 'border-amber/40 text-amber' },
    corrected: { label: 'Corrected', cls: 'border-indigo/40 text-indigo' },
    rejected: { label: 'Rejected', cls: 'border-coral/40 text-coral' },
  };
  const m = map[s];
  return <Badge variant="outline" className={`text-[10px] ${m.cls}`}>{m.label}</Badge>;
};

function RDOTab() {
  const [selected, setSelected] = useState<RDOExtraction | null>(null);
  const confirmed = RDO_EXTRACTIONS.filter(r => r.status === 'confirmed').length;
  const review = RDO_EXTRACTIONS.filter(r => r.status === 'review').length;

  return (
    <div className="space-y-4">
      {/* AI detection concepts */}
      <Card className="bg-indigo/5 border-indigo/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">RDO Extraction Engine</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                <span className="bg-secondary/50 px-2 py-1 rounded">Detects: RDO, RD0, R D O, RFO, RDD, Rod, rd</span>
                <span className="bg-secondary/50 px-2 py-1 rounded">Ignores CXL-related numbers</span>
                <span className="bg-secondary/50 px-2 py-1 rounded">Infers date from Period boundary</span>
                <span className="bg-secondary/50 px-2 py-1 rounded">Max 2 valid RDO dates returned</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">{RDO_EXTRACTIONS.length} extractions</span>
        <span className="text-teal font-mono">{confirmed} confirmed</span>
        <span className="text-amber font-mono">{review} needs review</span>
      </div>

      {/* Table + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 overflow-x-auto">
          <Card className="bg-card border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-3 py-2 text-muted-foreground font-mono font-medium">Employee</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-mono font-medium">Raw Notes</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-mono font-medium">Period</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-mono font-medium">Extracted RDO</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-mono font-medium">Adjacent</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-mono font-medium">Conf.</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-mono font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {RDO_EXTRACTIONS.map(rx => {
                  const isSelected = selected?.id === rx.id;
                  return (
                    <tr
                      key={rx.id}
                      className={`border-b border-border/50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo/5' : 'hover:bg-secondary/20'}`}
                      onClick={() => setSelected(rx)}
                    >
                      <td className="px-3 py-2">
                        <div>
                          <p className="font-medium text-foreground">{rx.employeeName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{rx.employeeId}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono bg-secondary/50 px-1.5 py-0.5 rounded text-foreground">{rx.rawNotes}</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground font-mono">{rx.period}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {rx.extractedRDO.map((d, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] border-teal/40 text-teal font-mono">{d}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {rx.adjacencyValid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal mx-auto" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber mx-auto" />
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-mono font-bold ${rx.confidence >= 90 ? 'text-teal' : rx.confidence >= 80 ? 'text-amber' : 'text-coral'}`}>
                          {rx.confidence}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {rdoStatusIcon(rx.status)}
                          {rdoStatusBadge(rx.status)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Detail */}
        <div className="lg:col-span-1">
          {selected ? (
            <Card className="bg-card border-border sticky top-5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo" />
                  <p className="text-sm font-medium text-foreground">RDO Extraction Detail</p>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground">EMPLOYEE</p>
                    <p className="text-xs text-foreground">{selected.employeeName} ({selected.employeeId})</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground">RAW NOTES</p>
                    <p className="text-sm font-mono bg-secondary/50 px-3 py-2 rounded text-foreground">{selected.rawNotes}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">PERIOD</p>
                      <p className="text-xs font-mono text-foreground">{selected.period}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">DAYS</p>
                      <p className="text-xs font-mono text-foreground">{selected.days}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground">EXTRACTED RDO DATES</p>
                    <div className="flex gap-1 mt-1">
                      {selected.extractedRDO.map((d, i) => (
                        <Badge key={i} className="bg-teal/10 text-teal border-teal/30 font-mono">{d}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">ADJACENCY</p>
                      <p className={`text-xs font-medium ${selected.adjacencyValid ? 'text-teal' : 'text-amber'}`}>
                        {selected.adjacencyValid ? 'Valid — adjacent to period' : 'Inside period (override)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">CONFIDENCE</p>
                      <div className="flex items-center gap-2">
                        <Progress value={selected.confidence} className="h-1.5 flex-1" />
                        <span className={`text-xs font-mono font-bold ${selected.confidence >= 90 ? 'text-teal' : 'text-amber'}`}>{selected.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  {selected.correctionNote && (
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">AI NOTE</p>
                      <p className="text-xs text-muted-foreground bg-indigo/5 border border-indigo/20 px-3 py-2 rounded">{selected.correctionNote}</p>
                    </div>
                  )}
                </div>
                {selected.status === 'review' && (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button size="sm" className="text-xs h-7 bg-teal text-[#0f1117] hover:bg-teal/80">Confirm</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-indigo/30 text-indigo hover:bg-indigo/10">Edit</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-coral/30 text-coral hover:bg-coral/10">Reject</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Select a row to view extraction details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SRTab() {
  const [selected, setSelected] = useState<SRExtraction | null>(null);

  return (
    <div className="space-y-4">
      {/* AI parsing concepts */}
      <Card className="bg-indigo/5 border-indigo/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Special Request Parsing Engine</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                <span className="bg-secondary/50 px-2 py-1 rounded">"only" / "fix" → <span className="text-teal">allow</span></span>
                <span className="bg-secondary/50 px-2 py-1 rounded">"avoid" / "no" / "not" → <span className="text-coral">refuse</span></span>
                <span className="bg-secondary/50 px-2 py-1 rounded">Shift codes: M, LM, ED, D, EV, ES, S</span>
                <span className="bg-secondary/50 px-2 py-1 rounded">Exclude: RDO, LT, SUN, seat game</span>
                <span className="bg-secondary/50 px-2 py-1 rounded">"Night Shift" → EV / ES / S</span>
                <span className="bg-secondary/50 px-2 py-1 rounded">RDO weekday extracted separately</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 overflow-x-auto">
          <Card className="bg-card border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-3 py-2 text-muted-foreground font-mono font-medium">Employee</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-mono font-medium">Assigned To / Notes</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-mono font-medium">Type</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-mono font-medium">Shift Codes</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-mono font-medium">RDO</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-mono font-medium">Excluded</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-mono font-medium">Conf.</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-mono font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {SR_EXTRACTIONS.map(sr => {
                  const isSelected = selected?.id === sr.id;
                  return (
                    <tr
                      key={sr.id}
                      className={`border-b border-border/50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo/5' : 'hover:bg-secondary/20'}`}
                      onClick={() => setSelected(sr)}
                    >
                      <td className="px-3 py-2">
                        <div>
                          <p className="font-medium text-foreground">{sr.employeeName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{sr.employeeId}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono bg-secondary/50 px-1.5 py-0.5 rounded text-foreground">{sr.rawAssignedTo}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant="outline" className={`text-[10px] ${sr.aiType === 'allow' ? 'border-teal/40 text-teal' : 'border-coral/40 text-coral'}`}>
                          {sr.aiType}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {sr.aiValue.map((v, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] border-indigo/40 text-indigo font-mono">{v}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground font-mono">{sr.aiRDO || '—'}</td>
                      <td className="px-3 py-2">
                        {sr.excludedTerms.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {sr.excludedTerms.map((t, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] border-amber/40 text-amber">{t}</Badge>
                            ))}
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-mono font-bold ${sr.confidence >= 90 ? 'text-teal' : sr.confidence >= 80 ? 'text-amber' : 'text-coral'}`}>
                          {sr.confidence}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {rdoStatusBadge(sr.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Detail */}
        <div className="lg:col-span-1">
          {selected ? (
            <Card className="bg-card border-border sticky top-5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo" />
                  <p className="text-sm font-medium text-foreground">SR Parsing Detail</p>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground">EMPLOYEE</p>
                    <p className="text-xs text-foreground">{selected.employeeName} ({selected.employeeId})</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground">RAW INPUT</p>
                    <p className="text-sm font-mono bg-secondary/50 px-3 py-2 rounded text-foreground">{selected.rawAssignedTo}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">AI TYPE</p>
                      <Badge className={`${selected.aiType === 'allow' ? 'bg-teal/10 text-teal border-teal/30' : 'bg-coral/10 text-coral border-coral/30'}`}>
                        {selected.aiType}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">AI RDO</p>
                      <p className="text-xs font-mono text-foreground">{selected.aiRDO || 'None'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground">SHIFT CODES</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {selected.aiValue.map((v, i) => (
                        <Badge key={i} className="bg-indigo/10 text-indigo border-indigo/30 font-mono">{v}</Badge>
                      ))}
                    </div>
                  </div>
                  {selected.excludedTerms.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">EXCLUDED (NON-SHIFT TERMS)</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {selected.excludedTerms.map((t, i) => (
                          <Badge key={i} className="bg-amber/10 text-amber border-amber/30">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.correctionNote && (
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground">AI NOTE</p>
                      <p className="text-xs text-muted-foreground bg-indigo/5 border border-indigo/20 px-3 py-2 rounded">{selected.correctionNote}</p>
                    </div>
                  )}
                </div>
                {selected.status === 'review' && (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button size="sm" className="text-xs h-7 bg-teal text-[#0f1117] hover:bg-teal/80">Confirm</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-indigo/30 text-indigo hover:bg-indigo/10">Edit</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-coral/30 text-coral hover:bg-coral/10">Reject</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Select a row to view parsing details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIExtractionReview() {
  return (
    <div className="space-y-5 max-w-[1400px]">
      <Tabs defaultValue="rdo" className="w-full">
        <TabsList className="bg-secondary/50 border border-border">
          <TabsTrigger value="rdo" className="text-xs font-mono data-[state=active]:bg-card data-[state=active]:text-teal">
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
            RDO Extraction
          </TabsTrigger>
          <TabsTrigger value="sr" className="text-xs font-mono data-[state=active]:bg-card data-[state=active]:text-teal">
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Special Request Extraction
          </TabsTrigger>
        </TabsList>
        <TabsContent value="rdo" className="mt-4">
          <RDOTab />
        </TabsContent>
        <TabsContent value="sr" className="mt-4">
          <SRTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
