import requests
import json

SUPABASE_URL = "https://bcnfcmdwccftidgpuzek.supabase.co"
SUPABASE_KEY = "sb_publishable_Tx1juei9gkK3J2bY6PaRLA_9RgmVsC-"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# 1. Check sessions
print("=== SESSIONS ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/sessions?select=*&order=created_at.desc", headers=headers)
sessions = r.json()
for s in sessions:
    print(f"  ID: {s['id']}, Name: {s.get('session_name')}, Status: {s.get('status')}, Created: {s.get('created_at')}")

# 2. Check upload_batches
print("\n=== UPLOAD_BATCHES ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/upload_batches?select=*&order=created_at.desc", headers=headers)
batches = r.json()
for b in batches:
    print(f"  ID: {b['id']}, Session: {b.get('session_id')}, Name: {b.get('upload_name')}, Type: {b.get('file_type')}, Total: {b.get('total_records')}, Status: {b.get('status')}")

# 3. Check etl_records count
print("\n=== ETL_RECORDS COUNT ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/etl_records?select=count", headers={**headers, "Prefer": "count=exact", "Range": "0-0"})
print(f"  Total records: {r.headers.get('Content-Range', 'unknown')}")

# 4. Sample etl_records
print("\n=== ETL_RECORDS SAMPLE (first 5) ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/etl_records?select=*&limit=5&order=created_at.asc", headers=headers)
records = r.json()
for rec in records:
    print(f"  ID: {rec['id']}")
    print(f"    session_id: {rec.get('session_id')}")
    print(f"    upload_batch_id: {rec.get('upload_batch_id')}")
    print(f"    source_file: {rec.get('source_file')}")
    print(f"    source_sheet: {rec.get('source_sheet')}")
    print(f"    row_number: {rec.get('row_number')}")
    print(f"    record_type: {rec.get('record_type')}")
    print(f"    confidence_level: {rec.get('confidence_level')}")
    print(f"    needs_review: {rec.get('needs_review')}")
    print(f"    warning_flags: {rec.get('warning_flags')}")
    print(f"    approved: {rec.get('approved')}")
    raw = rec.get('raw_data')
    if raw:
        print(f"    raw_data keys: {list(raw.keys()) if isinstance(raw, dict) else str(raw)[:200]}")
    norm = rec.get('normalized_data')
    if norm:
        print(f"    normalized_data keys: {list(norm.keys()) if isinstance(norm, dict) else str(norm)[:200]}")
    print()

# 5. Record types distribution
print("=== RECORD TYPES DISTRIBUTION ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/etl_records?select=record_type,confidence_level,needs_review,warning_flags", headers=headers)
all_recs = r.json()
from collections import Counter
type_counts = Counter(rec.get('record_type') for rec in all_recs)
for t, c in type_counts.most_common():
    print(f"  {t}: {c}")

# 6. Confidence distribution
print("\n=== CONFIDENCE DISTRIBUTION ===")
low_conf = [r for r in all_recs if r.get('confidence_level', 100) < 80]
needs_review = [r for r in all_recs if r.get('needs_review')]
print(f"  Total records: {len(all_recs)}")
print(f"  Low confidence (<80): {len(low_conf)}")
print(f"  Needs review: {len(needs_review)}")

# 7. Sample a record with raw_data to understand structure
print("\n=== SAMPLE RAW_DATA STRUCTURE BY TYPE ===")
seen_types = set()
r = requests.get(f"{SUPABASE_URL}/rest/v1/etl_records?select=record_type,raw_data,normalized_data,warning_flags&limit=100", headers=headers)
sample_recs = r.json()
for rec in sample_recs:
    rt = rec.get('record_type')
    if rt not in seen_types:
        seen_types.add(rt)
        raw = rec.get('raw_data')
        norm = rec.get('normalized_data')
        print(f"\n  Type: {rt}")
        print(f"  raw_data: {json.dumps(raw, ensure_ascii=False)[:300]}")
        print(f"  normalized_data: {json.dumps(norm, ensure_ascii=False)[:300]}")
        print(f"  warning_flags: {rec.get('warning_flags')}")
