/*
 * Data Intake — Excel file upload pipeline
 * Control Tower design: dark, pipeline-style view
 * Shows 8 uploaded Excel files, ~10 detected sheets, completeness checks
 */
import { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  ArrowRight,
  Upload,
  Database,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EXCEL_FILES, DETECTED_SHEETS, type ExcelFile, type DetectedSheet } from '@/lib/mockDataV2';

const statusIcon = (s: ExcelFile['status']) => {
  switch (s) {
    case 'success': return <CheckCircle2 className="w-4 h-4 text-teal" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber" />;
    case 'error': return <XCircle className="w-4 h-4 text-coral" />;
    case 'processing': return <Loader2 className="w-4 h-4 text-indigo animate-spin" />;
  }
};

const statusBadge = (s: DetectedSheet['status']) => {
  const map = {
    mapped: { label: 'Mapped', cls: 'border-teal/40 text-teal' },
    partial: { label: 'Partial', cls: 'border-amber/40 text-amber' },
    unmapped: { label: 'Unmapped', cls: 'border-coral/40 text-coral' },
  };
  const m = map[s];
  return <Badge variant="outline" className={`text-[10px] ${m.cls}`}>{m.label}</Badge>;
};

function FileCard({ file, sheets, expanded, onToggle }: {
  file: ExcelFile;
  sheets: DetectedSheet[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="bg-card border-border hover:border-teal/20 transition-colors">
      <CardContent className="p-0">
        {/* File header */}
        <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onToggle}>
          <div className="p-2 rounded-md bg-secondary/50">
            <FileSpreadsheet className="w-5 h-5 text-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-medium text-foreground truncate">{file.filename}</p>
              {statusIcon(file.status)}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
              <span>{file.size}</span>
              <span>·</span>
              <span>{file.sheetsDetected} sheet{file.sheetsDetected > 1 ? 's' : ''}</span>
              <span>·</span>
              <span>{file.uploadedAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">{file.category}</Badge>
            <div className="flex items-center gap-1.5">
              <Progress value={file.completeness} className="w-16 h-1.5" />
              <span className={`text-[10px] font-mono font-bold ${file.completeness === 100 ? 'text-teal' : file.completeness >= 90 ? 'text-amber' : 'text-coral'}`}>
                {file.completeness}%
              </span>
            </div>
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded sheets */}
        {expanded && sheets.length > 0 && (
          <div className="border-t border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-2 text-muted-foreground font-mono font-medium">Sheet</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-mono font-medium">Category</th>
                  <th className="text-center px-4 py-2 text-muted-foreground font-mono font-medium">Rows</th>
                  <th className="text-center px-4 py-2 text-muted-foreground font-mono font-medium">Cols</th>
                  <th className="text-center px-4 py-2 text-muted-foreground font-mono font-medium">Status</th>
                  <th className="text-center px-4 py-2 text-muted-foreground font-mono font-medium">Confidence</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-mono font-medium">Missing Fields</th>
                </tr>
              </thead>
              <tbody>
                {sheets.map(sh => (
                  <tr key={sh.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="px-4 py-2 font-medium text-foreground">{sh.sheetName}</td>
                    <td className="px-4 py-2 text-muted-foreground">{sh.category}</td>
                    <td className="px-4 py-2 text-center font-mono">{sh.rows}</td>
                    <td className="px-4 py-2 text-center font-mono">{sh.columns}</td>
                    <td className="px-4 py-2 text-center">{statusBadge(sh.status)}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`font-mono font-bold ${sh.confidence >= 95 ? 'text-teal' : sh.confidence >= 85 ? 'text-amber' : 'text-coral'}`}>
                        {sh.confidence}%
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {sh.missingFields.length === 0 ? (
                        <span className="text-teal">None</span>
                      ) : (
                        sh.missingFields.map((f, i) => (
                          <span key={i} className="text-amber">{f}{i < sh.missingFields.length - 1 ? '; ' : ''}</span>
                        ))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DataIntake() {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set(['F01', 'F04']));

  const toggleFile = (id: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalSheets = DETECTED_SHEETS.length;
  const mappedSheets = DETECTED_SHEETS.filter(s => s.status === 'mapped').length;
  const partialSheets = DETECTED_SHEETS.filter(s => s.status === 'partial').length;
  const successFiles = EXCEL_FILES.filter(f => f.status === 'success').length;
  const warningFiles = EXCEL_FILES.filter(f => f.status === 'warning').length;

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Pipeline overview */}
      <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-md">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-md bg-teal/10 border border-teal/20 flex items-center justify-center">
            <Upload className="w-5 h-5 text-teal" />
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground">STEP 1</p>
            <p className="text-sm font-medium text-foreground">Excel Upload</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-md bg-indigo/10 border border-indigo/20 flex items-center justify-center">
            <Eye className="w-5 h-5 text-indigo" />
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground">STEP 2</p>
            <p className="text-sm font-medium text-foreground">Sheet Detection</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-md bg-amber/10 border border-amber/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-amber" />
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground">STEP 3</p>
            <p className="text-sm font-medium text-foreground">ETL & Normalize</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-md bg-coral/10 border border-coral/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-coral" />
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground">STEP 4</p>
            <p className="text-sm font-medium text-foreground">AI Extraction</p>
          </div>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-foreground">{EXCEL_FILES.length}</p>
          <p className="text-[10px] text-muted-foreground">Excel Files Uploaded</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-foreground">{totalSheets}</p>
          <p className="text-[10px] text-muted-foreground">Sheets Detected</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-teal">{mappedSheets}</p>
          <p className="text-[10px] text-muted-foreground">Fully Mapped</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-amber">{partialSheets}</p>
          <p className="text-[10px] text-muted-foreground">Partial / Needs Review</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-foreground">{successFiles}/{EXCEL_FILES.length}</p>
          <p className="text-[10px] text-muted-foreground">Files Clean ({warningFiles} warnings)</p>
        </div>
      </div>

      {/* File cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono font-semibold text-foreground tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-teal" />
            UPLOADED FILES & DETECTED SHEETS
          </h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => {
            if (expandedFiles.size === EXCEL_FILES.length) setExpandedFiles(new Set());
            else setExpandedFiles(new Set(EXCEL_FILES.map(f => f.id)));
          }}>
            {expandedFiles.size === EXCEL_FILES.length ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>
        {EXCEL_FILES.map(file => (
          <FileCard
            key={file.id}
            file={file}
            sheets={DETECTED_SHEETS.filter(s => s.fileId === file.id)}
            expanded={expandedFiles.has(file.id)}
            onToggle={() => toggleFile(file.id)}
          />
        ))}
      </div>
    </div>
  );
}
