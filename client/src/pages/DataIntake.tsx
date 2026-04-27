/*
 * Data Intake — Excel file upload pipeline
 * Control Tower design: dark, pipeline-style view
 * Features: drag-drop upload zone, processing simulation, file cards with sheet detection
 */
import { useState, useRef, useCallback } from 'react';
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
  CloudUpload,
  Trash2,
  RotateCcw,
  FolderOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EXCEL_FILES, DETECTED_SHEETS, type ExcelFile, type DetectedSheet } from '@/lib/mockDataV2';
import { toast } from 'sonner';

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

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: 'uploading' | 'detecting' | 'processing' | 'done' | 'error';
  progress: number;
  sheetsFound: number;
  addedAt: string;
}

function FileCard({ file, sheets, expanded, onToggle }: {
  file: ExcelFile;
  sheets: DetectedSheet[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="bg-card border-border hover:border-teal/20 transition-colors">
      <CardContent className="p-0">
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFile = (id: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const simulateUpload = useCallback((fileName: string, fileSize: string) => {
    const id = `UP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newFile: UploadedFile = {
      id,
      name: fileName,
      size: fileSize,
      status: 'uploading',
      progress: 0,
      sheetsFound: 0,
      addedAt: new Date().toLocaleTimeString(),
    };
    setUploadedFiles(prev => [newFile, ...prev]);

    // Simulate upload progress
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);
        setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 100, status: 'detecting' } : f));

        // Simulate sheet detection
        setTimeout(() => {
          const sheets = Math.floor(Math.random() * 4) + 1;
          setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'processing', sheetsFound: sheets } : f));

          // Simulate processing complete
          setTimeout(() => {
            setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'done' } : f));
            toast.success(`${fileName} processed`, {
              description: `${sheets} sheet${sheets > 1 ? 's' : ''} detected and mapped.`,
            });
          }, 1500);
        }, 1000);
      } else {
        setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, progress: Math.min(progress, 99) } : f));
      }
    }, 300);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;
      simulateUpload(file.name, sizeStr);
    });
  }, [simulateUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;
      simulateUpload(file.name, sizeStr);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [simulateUpload]);

  const handleDemoUpload = () => {
    const demoFiles = [
      { name: 'WM_Roster_Week18_Draft.xlsx', size: '2.4 MB' },
      { name: 'RDO_Requests_May2026.xlsx', size: '156 KB' },
      { name: 'Special_Requests_Update.xlsx', size: '89 KB' },
    ];
    demoFiles.forEach((f, i) => {
      setTimeout(() => simulateUpload(f.name, f.size), i * 500);
    });
  };

  const handleProcessAll = () => {
    setIsProcessingBatch(true);
    toast.info('Processing batch...', { description: 'Running ETL pipeline on all uploaded files.' });
    setTimeout(() => {
      setIsProcessingBatch(false);
      toast.success('Batch processing complete', {
        description: 'All files processed. Proceed to ETL & Normalize.',
      });
    }, 3000);
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const totalSheets = DETECTED_SHEETS.length;
  const mappedSheets = DETECTED_SHEETS.filter(s => s.status === 'mapped').length;
  const partialSheets = DETECTED_SHEETS.filter(s => s.status === 'partial').length;
  const successFiles = EXCEL_FILES.filter(f => f.status === 'success').length;
  const warningFiles = EXCEL_FILES.filter(f => f.status === 'warning').length;

  const uploadStatusIcon = (s: UploadedFile['status']) => {
    switch (s) {
      case 'uploading': return <Loader2 className="w-4 h-4 text-indigo animate-spin" />;
      case 'detecting': return <Eye className="w-4 h-4 text-amber animate-pulse" />;
      case 'processing': return <Sparkles className="w-4 h-4 text-indigo animate-pulse" />;
      case 'done': return <CheckCircle2 className="w-4 h-4 text-teal" />;
      case 'error': return <XCircle className="w-4 h-4 text-coral" />;
    }
  };

  const uploadStatusLabel = (s: UploadedFile['status']) => {
    switch (s) {
      case 'uploading': return 'Uploading...';
      case 'detecting': return 'Detecting sheets...';
      case 'processing': return 'Processing...';
      case 'done': return 'Complete';
      case 'error': return 'Failed';
    }
  };

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

      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Drag & Drop Zone */}
        <div className="lg:col-span-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-teal bg-teal/5 scale-[1.01]'
                : 'border-border hover:border-teal/40 hover:bg-secondary/20'
            }`}
          >
            <CloudUpload className={`w-12 h-12 mx-auto mb-3 transition-colors ${isDragOver ? 'text-teal' : 'text-muted-foreground'}`} />
            <p className="text-sm font-medium text-foreground mb-1">
              {isDragOver ? 'Drop files here...' : 'Drag & drop Excel files here'}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              or click to browse · Supports .xlsx, .xls, .csv
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-teal/30 text-teal hover:bg-teal/10"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                Browse Files
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-indigo/30 text-indigo hover:bg-indigo/10"
                onClick={(e) => { e.stopPropagation(); handleDemoUpload(); }}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Demo Upload
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Queue */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-semibold text-foreground tracking-wide">UPLOAD QUEUE</h3>
            {uploadedFiles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] text-muted-foreground h-6"
                onClick={() => setUploadedFiles([])}
              >
                Clear All
              </Button>
            )}
          </div>
          {uploadedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Upload className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">No files in queue</p>
              <p className="text-[10px] mt-1">Upload files or try Demo Upload</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center gap-2 p-2 bg-secondary/20 rounded-md">
                  {uploadStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground font-mono">{file.size}</span>
                      <span className={`text-[10px] font-mono ${file.status === 'done' ? 'text-teal' : file.status === 'error' ? 'text-coral' : 'text-indigo'}`}>
                        {uploadStatusLabel(file.status)}
                      </span>
                      {file.sheetsFound > 0 && (
                        <span className="text-[10px] text-muted-foreground font-mono">{file.sheetsFound} sheets</span>
                      )}
                    </div>
                    {(file.status === 'uploading') && (
                      <Progress value={file.progress} className="h-1 mt-1" />
                    )}
                  </div>
                  <button
                    onClick={() => removeUploadedFile(file.id)}
                    className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-coral transition-colors shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {uploadedFiles.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <Button
                size="sm"
                className="w-full h-8 text-xs bg-teal text-[#0f1117] hover:bg-teal/80"
                onClick={handleProcessAll}
                disabled={isProcessingBatch || uploadedFiles.every(f => f.status !== 'done')}
              >
                {isProcessingBatch ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Processing Batch...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Process All → ETL Pipeline
                  </>
                )}
              </Button>
            </div>
          )}
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
