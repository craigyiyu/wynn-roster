/**
 * rdoLearning.ts
 *
 * Persists approved RDO note → date mappings so that future identical
 * (or similar) notes are auto-resolved without human review.
 *
 * Storage: Supabase table `rdo_pattern_library` (created lazily via upsert).
 * Local cache: sessionStorage for instant lookup within a browser session.
 *
 * Schema expected in Supabase:
 *   rdo_pattern_library (
 *     id          uuid primary key default gen_random_uuid(),
 *     pattern     text unique not null,   -- normalised note text (lowercase, trimmed)
 *     dates       text[] not null,        -- ISO date strings ["2026-04-17", ...]
 *     confidence  text not null,          -- 'high' | 'medium' | 'low'
 *     approved_by text not null,
 *     approved_at timestamptz default now(),
 *     use_count   int default 1
 *   )
 *
 * If the table doesn't exist yet, saves are silently ignored and the local
 * cache is still maintained so the UI works correctly.
 */

import { supabase } from '@/lib/supabase';

const CACHE_KEY = 'rdo_pattern_library_v1';

export interface RDOPattern {
  pattern: string;
  dates: string[];
  confidence: 'high' | 'medium' | 'low';
  approved_by: string;
  approved_at: string;
  use_count: number;
}

// ── Local cache ──────────────────────────────────────────────────────────────

function getLocalCache(): Record<string, RDOPattern> {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalCache(cache: Record<string, RDOPattern>) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

/** Normalise a note for pattern matching (lowercase, collapse whitespace) */
export function normalisePattern(note: string): string {
  return note.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Look up a note in the local pattern library.
 * Returns the known dates if found, null otherwise.
 */
export function lookupPattern(note: string): RDOPattern | null {
  const key = normalisePattern(note);
  const cache = getLocalCache();
  return cache[key] ?? null;
}

/**
 * Save an approved note → dates mapping to both local cache and Supabase.
 * Call this when the user clicks "Approve" on a review record.
 */
export async function savePattern(
  note: string,
  dates: string[],
  confidence: 'high' | 'medium' | 'low',
  approvedBy: string,
): Promise<void> {
  const key = normalisePattern(note);
  const now = new Date().toISOString();

  // Update local cache immediately
  const cache = getLocalCache();
  const existing = cache[key];
  cache[key] = {
    pattern: key,
    dates,
    confidence,
    approved_by: approvedBy,
    approved_at: now,
    use_count: (existing?.use_count ?? 0) + 1,
  };
  setLocalCache(cache);

  // Persist to Supabase (best-effort, ignore errors)
  try {
    await supabase.from('rdo_pattern_library').upsert(
      {
        pattern: key,
        dates,
        confidence,
        approved_by: approvedBy,
        approved_at: now,
        use_count: (existing?.use_count ?? 0) + 1,
      },
      { onConflict: 'pattern' },
    );
  } catch {
    // Table may not exist yet — silently ignore
  }
}

/**
 * Load all patterns from Supabase into local cache.
 * Call once on app start or when the ETL page loads.
 */
export async function loadPatterns(): Promise<void> {
  try {
    const { data } = await supabase
      .from('rdo_pattern_library')
      .select('*')
      .order('use_count', { ascending: false })
      .limit(2000);

    if (data && data.length > 0) {
      const cache: Record<string, RDOPattern> = {};
      for (const row of data) {
        cache[row.pattern as string] = row as RDOPattern;
      }
      setLocalCache(cache);
    }
  } catch {
    // Table doesn't exist yet — ignore
  }
}

/**
 * Get all patterns sorted by use_count descending (for the learning log UI).
 */
export function getAllPatterns(): RDOPattern[] {
  const cache = getLocalCache();
  return Object.values(cache).sort((a, b) => b.use_count - a.use_count);
}

/**
 * Get count of known patterns.
 */
export function getPatternCount(): number {
  return Object.keys(getLocalCache()).length;
}
