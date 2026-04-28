import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bcnfcmdwccftidgpuzek.supabase.co';
const supabaseKey = 'sb_publishable_Tx1juei9gkK3J2bY6PaRLA_9RgmVsC-';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions for database tables
export interface Employee {
  id: string;
  name: string;
  role: string;
  property: string;
  email?: string;
  phone?: string;
  hire_date?: string;
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
  updated_at: string;
}

export interface RDORequest {
  id: string;
  employee_id: string;
  week_start_date: string;
  preferred_day: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'assigned';
  confidence_level: number;
  ai_notes?: string;
  needs_review: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SpecialRequest {
  id: string;
  employee_id: string;
  request_type: string;
  request_details?: any;
  week_start_date?: string;
  end_date?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'assigned';
  confidence_level: number;
  ai_notes?: string;
  needs_review: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ETLRecord {
  id: string;
  upload_batch_id: string;
  source_file: string;
  source_sheet?: string;
  row_number?: number;
  record_type: string;
  raw_data: any;
  normalized_data?: any;
  ai_extracted_data?: any;
  confidence_level: number;
  warning_flags: string[];
  needs_review: boolean;
  review_reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  user_edits?: any;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadBatch {
  id: string;
  upload_name: string;
  week_start_date?: string;
  file_count: number;
  total_records: number;
  processed_records: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  rule_type: 'hard' | 'soft';
  priority?: number;
  category?: string;
  parameters?: any;
  active: boolean;
  created_at: string;
  updated_at: string;
}
