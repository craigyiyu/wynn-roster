/**
 * ETL Data Cache
 * Stores loaded ETL data in memory so the page doesn't reload on every visit.
 * Cache is keyed by sessionId and invalidated when a new upload batch is detected.
 */

import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ETLRecord {
  id: string;
  upload_batch_id: string;
  source_file: string;
  source_sheet: string;
  row_number: number;
  record_type: string;
  raw_data: Record<string, unknown>;
  normalized_data: Record<string, unknown> | null;
  confidence_level: number;
  warning_flags: string[];
  needs_review: boolean;
  approved_by: string | null;
  approved_at: string | null;
  status: string | null;
}

export interface UploadBatch {
  id: string;
  upload_name: string;
  file_type: string;
  total_records: number;
  processed_records: number;
  status: string;
  created_at: string;
  batch_order: number;
}

export interface ETLCacheEntry {
  sessionId: string;
  batches: UploadBatch[];
  records: ETLRecord[];
  loadedAt: number;
  /** The latest batch created_at, used to detect new uploads */
  latestBatchTime: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

let cache: ETLCacheEntry | null = null;

/** Returns true if cache is valid for the given session and no new batches exist */
export async function isCacheValid(sessionId: string): Promise<boolean> {
  if (!cache || cache.sessionId !== sessionId) return false;

  // Check if any new batches have been added since we cached
  const { data } = await supabase
    .from('upload_batches')
    .select('created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return false;
  return data[0].created_at === cache.latestBatchTime;
}

export function getCache(): ETLCacheEntry | null {
  return cache;
}

export function clearCache() {
  cache = null;
}

/** Loads all ETL records for the session, with pagination */
export async function loadETLData(sessionId: string): Promise<ETLCacheEntry> {
  const PAGE = 1000;

  // Load batches
  const { data: batches, error: batchErr } = await supabase
    .from('upload_batches')
    .select('id,upload_name,file_type,total_records,processed_records,status,created_at,batch_order')
    .eq('session_id', sessionId)
    .order('batch_order', { ascending: true });

  if (batchErr) throw batchErr;
  if (!batches || batches.length === 0) {
    cache = { sessionId, batches: [], records: [], loadedAt: Date.now(), latestBatchTime: '' };
    return cache;
  }

  // Load all records with pagination
  const allRecords: ETLRecord[] = [];
  for (let start = 0; ; start += PAGE) {
    const end = start + PAGE - 1;
    const { data, error } = await supabase
      .from('etl_records')
      .select('id,upload_batch_id,source_file,source_sheet,row_number,record_type,raw_data,normalized_data,confidence_level,warning_flags,needs_review,approved_by,approved_at,status')
      .eq('session_id', sessionId)
      .range(start, end);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allRecords.push(...(data as ETLRecord[]));
    if (data.length < PAGE) break;
  }

  const latestBatch = batches.reduce((a, b) =>
    a.created_at > b.created_at ? a : b
  );

  cache = {
    sessionId,
    batches: batches as UploadBatch[],
    records: allRecords,
    loadedAt: Date.now(),
    latestBatchTime: latestBatch.created_at,
  };

  return cache;
}

/**
 * Optimistically update a record's approved_by in the cache
 * so the UI reflects the change immediately without reloading.
 */
export function cacheApproveRecord(recordId: string, approvedBy: string) {
  if (!cache) return;
  const rec = cache.records.find(r => r.id === recordId);
  if (rec) {
    rec.approved_by = approvedBy;
    rec.approved_at = new Date().toISOString();
  }
}

export function cacheUnapproveRecord(recordId: string) {
  if (!cache) return;
  const rec = cache.records.find(r => r.id === recordId);
  if (rec) {
    rec.approved_by = null;
    rec.approved_at = null;
  }
}
