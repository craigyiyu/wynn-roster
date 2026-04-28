import { supabase } from './supabase';

export interface Session {
  id: string;
  user_id: string;
  session_name: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'completed' | 'archived';
  notes?: string;
}

export interface UploadBatch {
  id: string;
  session_id: string;
  upload_name: string;
  file_type: string;
  batch_order: number;
  file_count: number;
  total_records: number;
  processed_records: number;
  status: 'processing' | 'completed' | 'failed' | 'deleted';
  created_at: string;
  updated_at: string;
}

/**
 * Create a new session
 */
export async function createSession(sessionName: string = 'Untitled Session'): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert([
      {
        user_id: 'default_user',
        session_name: sessionName,
        status: 'active',
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data;
}

/**
 * Get current session or create a new one
 */
export async function getOrCreateSession(): Promise<Session> {
  // Try to get the most recent active session
  const { data: sessions, error: fetchError } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', 'default_user')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError) throw new Error(`Failed to fetch sessions: ${fetchError.message}`);

  if (sessions && sessions.length > 0) {
    return sessions[0];
  }

  // Create a new session if none exists
  return createSession(`Session ${new Date().toLocaleDateString()}`);
}

/**
 * Create an upload batch
 */
export async function createUploadBatch(
  sessionId: string,
  uploadName: string,
  fileType: string,
  fileCount: number,
  totalRecords: number
): Promise<UploadBatch> {
  // Get the next batch order
  const { data: batches } = await supabase
    .from('upload_batches')
    .select('batch_order')
    .eq('session_id', sessionId)
    .order('batch_order', { ascending: false })
    .limit(1);

  const nextBatchOrder = (batches && batches.length > 0) ? batches[0].batch_order + 1 : 1;

  const { data, error } = await supabase
    .from('upload_batches')
    .insert([
      {
        session_id: sessionId,
        upload_name: uploadName,
        file_type: fileType,
        batch_order: nextBatchOrder,
        file_count: fileCount,
        total_records: totalRecords,
        processed_records: 0,
        status: 'processing',
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Failed to create upload batch: ${error.message}`);
  return data;
}

/**
 * Batch insert ETL records (500 rows per batch)
 */
export async function batchInsertETLRecords(
  sessionId: string,
  uploadBatchId: string,
  records: any[],
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  const BATCH_SIZE = 500;
  const totalRecords = records.length;

  for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    const etlRecords = batch.map((record, index) => ({
      session_id: sessionId,
      upload_batch_id: uploadBatchId,
      source_file: record.source_file || 'unknown',
      source_sheet: record.source_sheet || 'unknown',
      row_number: record.row_number || i + index + 1,
      record_type: record.record_type || 'unknown',
      raw_data: record.raw_data || record,
      normalized_data: record.normalized_data || record,
      confidence_level: record.confidence_level || 100,
      warning_flags: record.warning_flags || [],
      needs_review: record.needs_review || false,
      status: 'pending',
    }));

    const { error } = await supabase
      .from('etl_records')
      .insert(etlRecords);

    if (error) {
      throw new Error(`Failed to insert ETL records: ${error.message}`);
    }

    // Call progress callback
    const processed = Math.min(i + BATCH_SIZE, totalRecords);
    if (onProgress) {
      onProgress(processed, totalRecords);
    }

    // Add small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Update upload batch status
  await supabase
    .from('upload_batches')
    .update({
      processed_records: totalRecords,
      status: 'completed',
    })
    .eq('id', uploadBatchId);
}

/**
 * Get all batches in a session
 */
export async function getSessionBatches(sessionId: string): Promise<UploadBatch[]> {
  const { data, error } = await supabase
    .from('upload_batches')
    .select('*')
    .eq('session_id', sessionId)
    .order('batch_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch batches: ${error.message}`);
  return data || [];
}

/**
 * Delete a single batch (cascade deletes ETL records)
 */
export async function deleteBatch(batchId: string): Promise<void> {
  const { error } = await supabase
    .from('upload_batches')
    .delete()
    .eq('id', batchId);

  if (error) throw new Error(`Failed to delete batch: ${error.message}`);
}

/**
 * Delete all batches in a session (cascade deletes ETL records)
 */
export async function deleteAllBatches(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('upload_batches')
    .delete()
    .eq('session_id', sessionId);

  if (error) throw new Error(`Failed to delete all batches: ${error.message}`);
}

/**
 * Delete entire session (cascade deletes batches and ETL records)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to delete session: ${error.message}`);
}

/**
 * Complete a session
 */
export async function completeSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to complete session: ${error.message}`);
}

/**
 * Get session statistics
 */
export async function getSessionStats(sessionId: string): Promise<{
  totalBatches: number;
  totalRecords: number;
  processedRecords: number;
  completedBatches: number;
}> {
  const { data: batches, error } = await supabase
    .from('upload_batches')
    .select('*')
    .eq('session_id', sessionId);

  if (error) throw new Error(`Failed to fetch session stats: ${error.message}`);

  const totalBatches = batches?.length || 0;
  const totalRecords = batches?.reduce((sum, b) => sum + b.total_records, 0) || 0;
  const processedRecords = batches?.reduce((sum, b) => sum + b.processed_records, 0) || 0;
  const completedBatches = batches?.filter(b => b.status === 'completed').length || 0;

  return {
    totalBatches,
    totalRecords,
    processedRecords,
    completedBatches,
  };
}
