import { useState, useEffect } from 'react';
import { Upload, Trash2, CheckCircle, AlertCircle, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { parseExcelFile, detectFileType, detectRecordType, validateData, calculateConfidenceLevel } from '@/lib/excelParser';
import {
  createSession,
  getOrCreateSession,
  createUploadBatch,
  batchInsertETLRecords,
  getSessionBatches,
  deleteBatch,
  deleteAllBatches,
  getSessionStats,
  Session,
  UploadBatch,
} from '@/lib/sessionManager';

export default function DataIntake() {
  const [session, setSession] = useState<Session | null>(null);
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sessionStats, setSessionStats] = useState({ totalBatches: 0, totalRecords: 0, processedRecords: 0, completedBatches: 0 });

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const currentSession = await getOrCreateSession();
      setSession(currentSession);
      await refreshBatches(currentSession.id);
    } catch (error) {
      console.error('[DataIntake] Failed to initialize session:', error);
      toast.error('Failed to initialize session');
    }
  };

  const refreshBatches = async (sessionId: string) => {
    try {
      const sessionBatches = await getSessionBatches(sessionId);
      setBatches(sessionBatches);
      
      const stats = await getSessionStats(sessionId);
      setSessionStats(stats);
    } catch (error) {
      console.error('[DataIntake] Failed to refresh batches:', error);
    }
  };

  const handleFiles = async (files: File[]) => {
    if (!session) {
      toast.error('No session available');
      return;
    }

    for (const file of files) {
      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Parse Excel file
        const sheets = await parseExcelFile(file);
        const fileType = detectFileType(file.name, sheets.map(s => s.name));

        // Create upload batch
        const batch = await createUploadBatch(
          session.id,
          file.name,
          fileType,
          sheets.length,
          sheets.reduce((sum, s) => sum + s.rowCount, 0)
        );

        console.log(`[DataIntake] Created batch: ${batch.id}, file: ${file.name}, sheets: ${sheets.length}`);

        // Process each sheet
        let totalRowsProcessed = 0;
        for (const sheet of sheets) {
          const recordType = detectRecordType(sheet.name, sheet.headers);
          
          // Prepare ETL records with validation and confidence calculation
          const etlRecords = sheet.rows.map((row, index) => {
            const validation = validateData(row, recordType);
            const confidence = calculateConfidenceLevel(row, recordType);

            return {
              source_file: file.name,
              source_sheet: sheet.name,
              row_number: index + 2, // +2 because Excel starts at 1 and has header
              record_type: recordType,
              raw_data: row,
              normalized_data: row,
              confidence_level: confidence,
              warning_flags: validation.warnings,
              needs_review: confidence < 80 || validation.warnings.length > 0,
            };
          });

          // Batch insert ETL records (500 rows per batch)
          await batchInsertETLRecords(
            session.id,
            batch.id,
            etlRecords,
            (processed, total) => {
              totalRowsProcessed += processed;
              const overallProgress = Math.round((totalRowsProcessed / (sheets.reduce((sum, s) => sum + s.rowCount, 0))) * 100);
              setUploadProgress(overallProgress);
              console.log(`[DataIntake] Progress: ${processed}/${total} rows processed`);
            }
          );
        }

        setUploadProgress(100);
        toast.success(`✅ File uploaded: ${file.name} (${batch.total_records} records)`);
        
        // Refresh batches
        await refreshBatches(session.id);
        
      } catch (error) {
        console.error('[DataIntake] Error uploading file:', error);
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (!window.confirm(`Delete batch "${batchName}"? This will remove all associated data.`)) return;

    try {
      await deleteBatch(batchId);
      toast.success(`Deleted: ${batchName}`);
      if (session) await refreshBatches(session.id);
    } catch (error) {
      console.error('[DataIntake] Error deleting batch:', error);
      toast.error('Failed to delete batch');
    }
  };

  const handleDeleteAllBatches = async () => {
    if (!window.confirm('Delete ALL files in this session? This cannot be undone.')) return;

    try {
      if (session) {
        await deleteAllBatches(session.id);
        toast.success('All files deleted');
        await refreshBatches(session.id);
      }
    } catch (error) {
      console.error('[DataIntake] Error deleting all batches:', error);
      toast.error('Failed to delete files');
    }
  };

  const handleNewSession = async () => {
    try {
      const newSession = await createSession(`Session ${new Date().toLocaleDateString()}`);
      setSession(newSession);
      setBatches([]);
      setSessionStats({ totalBatches: 0, totalRecords: 0, processedRecords: 0, completedBatches: 0 });
      toast.success('New session created');
    } catch (error) {
      console.error('[DataIntake] Error creating session:', error);
      toast.error('Failed to create new session');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Data Intake</h1>
          <p className="text-slate-400">Upload and manage your roster data files</p>
        </div>

        {/* Session Info Card */}
        {session && (
          <Card className="bg-slate-800 border-slate-700 mb-6 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{session.session_name}</h2>
                <p className="text-sm text-slate-400">
                  Session ID: <code className="text-teal-400">{session.id.substring(0, 8)}...</code>
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  📁 {sessionStats.totalBatches} files | 📝 {sessionStats.totalRecords} records | ✅ {sessionStats.completedBatches} completed
                </p>
              </div>
              <Button onClick={handleNewSession} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Button>
            </div>
          </Card>
        )}

        {/* Upload Area */}
        <Card className="bg-slate-800 border-slate-700 border-2 border-dashed p-12 mb-8 cursor-pointer hover:border-teal-500 transition-colors"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="w-16 h-16 text-teal-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Drag & drop files here</h3>
            <p className="text-slate-400 mb-6">or click to browse</p>
            <input
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button asChild variant="default" className="cursor-pointer">
                <span>Browse Files</span>
              </Button>
            </label>
            <p className="text-xs text-slate-500 mt-4">Supported: Excel (.xlsx, .xls), CSV</p>
          </div>
        </Card>

        {/* Progress Bar */}
        {isUploading && (
          <Card className="bg-slate-800 border-slate-700 p-4 mb-6">
            <div className="flex items-center gap-4">
              <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-white">Processing...</span>
                  <span className="text-sm text-slate-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-teal-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Uploaded Files List */}
        {batches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">📁 Uploaded Files</h2>
            <div className="space-y-3">
              {batches.map((batch) => (
                <Card key={batch.id} className="bg-slate-800 border-slate-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {batch.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-teal-400" />
                        ) : batch.status === 'processing' ? (
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <h3 className="font-semibold text-white">{batch.upload_name}</h3>
                          <p className="text-sm text-slate-400">
                            {batch.file_type} • {batch.total_records} records • {batch.file_count} sheets
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeleteBatch(batch.id, batch.upload_name)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Batch Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleDeleteAllBatches}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Files
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {batches.length === 0 && !isUploading && (
          <Card className="bg-slate-800 border-slate-700 p-12 text-center">
            <p className="text-slate-400">No files uploaded yet. Start by uploading your first file above.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
