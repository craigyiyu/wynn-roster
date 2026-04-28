/*
 * AI Extraction Review — Improved with real DB field names and source-to-result explanation
 * Tabs: RDO Extraction, SR Extraction, EV/ES Tagging
 * Database-aligned field names from req_rdo_leave_table, couple_special_request, wm_wp_ev_es_employee
 */
import { useState } from 'react';
import {
  Sparkles, CheckCircle2, AlertTriangle, Clock, Eye,
  ArrowRight, Database, Link2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RDO_REQUESTS, SPECIAL_REQUESTS, EVES_EMPLOYEES } from '@/lib/databaseMockData';
import { useLocation } from 'wouter';

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'text-teal border-teal/30',
  review: 'text-amber border-amber/30',
  rejected: 'text-coral border-coral/30',
};

export default function AIExtractionReview() {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal" />
            AI EXTRACTION REVIEW
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Review AI-parsed tags from source data with real database field names</p>
        </div>
      </div>

      <Tabs defaultValue="rdo">
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="rdo" className="text-xs gap-1"><Database className="w-3 h-3" /> RDO Extraction</TabsTrigger>
          <TabsTrigger value="sr" className="text-xs gap-1"><Sparkles className="w-3 h-3" /> SR Extraction</TabsTrigger>
          <TabsTrigger value="eves" className="text-xs gap-1"><Eye className="w-3 h-3" /> EV/ES Tagging</TabsTrigger>
        </TabsList>

        {/* RDO Extraction */}
        <TabsContent value="rdo" className="mt-4 space-y-3">
          <Card className="bg-teal/5 border-teal/20">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">
                <span className="text-teal font-medium">RDO AI Extraction</span> — AI extracts date patterns from the free-text <span className="font-mono text-teal">Notes</span> field in <span className="font-mono text-teal">req_rdo_leave_table</span>. Results are stored in <span className="font-mono text-teal">ai_result</span> and flow into the roster as <span className="font-mono text-teal">ai_result_raw</span> / <span className="font-mono text-teal">RDO_Display</span>.
              </p>
            </CardContent>
          </Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Payroll</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Employee</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">LeaveType</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Period</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Notes</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">ai_result</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">RDO_Display</th>
                  <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Applied?</th>
                  <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Status</th>
                  <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Trace</th>
                </tr>
              </thead>
              <tbody>
                {RDO_REQUESTS.map(r => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/20">
                    <td className="p-2 text-xs font-mono text-muted-foreground">{r.Payroll}</td>
                    <td className="p-2 text-xs text-foreground">{r.EmployeeName}</td>
                    <td className="p-2 text-xs font-mono text-muted-foreground">{r.LeaveType}</td>
                    <td className="p-2 text-[10px] text-muted-foreground">{r.Period}</td>
                    <td className="p-2">
                      <span className="text-xs font-mono text-amber">"{r.Notes}"</span>
                    </td>
                    <td className="p-2">
                      <span className="text-xs font-mono text-teal">{r.ai_result || '(empty)'}</span>
                    </td>
                    <td className="p-2 text-xs font-mono text-foreground">{r.RDO_Display || '—'}</td>
                    <td className="p-2 text-center">
                      {r.applied_to_roster ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal mx-auto" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber mx-auto" />
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className={`text-[9px] ${STATUS_BADGE[r.review_status]}`}>{r.review_status}</Badge>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => navigate('/trace')}
                        className="text-[10px] text-teal hover:underline font-mono"
                      >
                        Trace →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* SR Extraction */}
        <TabsContent value="sr" className="mt-4 space-y-3">
          <Card className="bg-indigo/5 border-indigo/20">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">
                <span className="text-indigo font-medium">SR AI Extraction</span> — AI parses free-text requests from <span className="font-mono text-indigo">couple_special_request.AssignedTo</span> into structured <span className="font-mono text-indigo">ai_type</span> / <span className="font-mono text-indigo">ai_value</span> / <span className="font-mono text-indigo">ai_rdo</span> fields. Results flow into <span className="font-mono text-indigo">SpecialRequestAI</span>.
              </p>
            </CardContent>
          </Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">EmpNo</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Employee</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Type</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">AssignedTo</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">ai_type</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">ai_value</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">ai_rdo</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">SpecialRequestAI</th>
                  <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Applied?</th>
                  <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Status</th>
                </tr>
              </thead>
              <tbody>
                {SPECIAL_REQUESTS.map(r => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/20">
                    <td className="p-2 text-xs font-mono text-muted-foreground">{r.EmpNo}</td>
                    <td className="p-2 text-xs text-foreground">{r.EmployeeName}</td>
                    <td className="p-2 text-xs text-muted-foreground">{r.Type}</td>
                    <td className="p-2">
                      <span className="text-xs font-mono text-amber">"{r.AssignedTo}"</span>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className={`text-[9px] font-mono ${
                        r.ai_type === 'refuse' ? 'text-coral border-coral/30' :
                        r.ai_type === 'allow' ? 'text-teal border-teal/30' :
                        r.ai_type === 'rdo' ? 'text-indigo border-indigo/30' :
                        'text-muted-foreground border-border'
                      }`}>
                        {r.ai_type || '—'}
                      </Badge>
                    </td>
                    <td className="p-2 text-xs font-mono text-indigo">{r.ai_value.length > 0 ? `[${r.ai_value.join(', ')}]` : '—'}</td>
                    <td className="p-2 text-xs font-mono text-indigo">{r.ai_rdo.length > 0 ? `[${r.ai_rdo.join(', ')}]` : '—'}</td>
                    <td className="p-2 text-[10px] font-mono text-muted-foreground">{r.SpecialRequestAI || '—'}</td>
                    <td className="p-2 text-center">
                      {r.applied_to_roster ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal mx-auto" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber mx-auto" />
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className={`text-[9px] ${STATUS_BADGE[r.review_status]}`}>{r.review_status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* EV/ES Tagging */}
        <TabsContent value="eves" className="mt-4 space-y-3">
          <Card className="bg-amber/5 border-amber/20">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">
                <span className="text-amber font-medium">EV/ES Tagging</span> — This is <strong>not AI extraction</strong>. It is list-based rule tagging from <span className="font-mono text-amber">wm_wp_ev_es_employee</span>. Employees on the list are marked <span className="font-mono text-amber">IsEVES = 1</span> and receive fixed EV/ES shift patterns.
              </p>
            </CardContent>
          </Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">EmployeeID</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Name</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Venue</th>
                  <th className="text-center text-[9px] font-mono text-muted-foreground p-2 border-b border-border">IsEVES</th>
                  <th className="text-left text-[9px] font-mono text-muted-foreground p-2 border-b border-border">Pattern Example</th>
                </tr>
              </thead>
              <tbody>
                {EVES_EMPLOYEES.map(r => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-secondary/20">
                    <td className="p-2 text-xs font-mono text-muted-foreground">{r.EmployeeID}</td>
                    <td className="p-2 text-xs text-foreground">{r.EmployeeName}</td>
                    <td className="p-2 text-xs text-muted-foreground">{r.Venue}</td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className="text-[9px] text-amber border-amber/30 font-mono">{r.IsEVES}</Badge>
                    </td>
                    <td className="p-2 text-xs font-mono text-amber">{r.pattern_example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
