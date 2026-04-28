import * as XLSX from 'xlsx';

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: any[];
  rowCount: number;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * File type categories based on the upload API structure
 * 1. Shift - 上传历史排班结果表 / 历史预排班表 / 本批次预排班表
 * 2. RDO Request - 上传 RDO 申请表
 * 3. Couple Shift - 上传情侣班次 & 情侣特殊申请
 * 4. EVES - 上传 EVES 员工表
 * 5. Floor Spread - 上传需求表（Demand shift / Spares for SL）
 */
export type FileType = 'shift' | 'rdo_request' | 'couple_shift' | 'eves' | 'floor_spread' | 'unknown';

/**
 * Parse Excel file and extract all sheets
 */
export async function parseExcelFile(file: File): Promise<ParsedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets: ParsedSheet[] = [];
        
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          const headers = Object.keys(jsonData[0] || {});
          
          sheets.push({
            name: sheetName,
            headers,
            rows: jsonData,
            rowCount: jsonData.length,
          });
        });
        
        resolve(sheets);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Detect file type based on filename or sheet names
 */
export function detectFileType(fileName: string, sheetNames: string[]): FileType {
  const lowerFileName = fileName.toLowerCase();
  
  // Check filename patterns
  if (lowerFileName.includes('shift') || lowerFileName.includes('排班')) {
    return 'shift';
  }
  if (lowerFileName.includes('rdo') || lowerFileName.includes('rdo申请')) {
    return 'rdo_request';
  }
  if (lowerFileName.includes('couple') || lowerFileName.includes('情侣')) {
    return 'couple_shift';
  }
  if (lowerFileName.includes('eves') || lowerFileName.includes('员工')) {
    return 'eves';
  }
  if (lowerFileName.includes('demand') || lowerFileName.includes('需求') || lowerFileName.includes('floor')) {
    return 'floor_spread';
  }
  
  // Check sheet names
  for (const sheetName of sheetNames) {
    const lowerSheetName = sheetName.toLowerCase();
    if (lowerSheetName.includes('shift') || lowerSheetName.includes('排班')) return 'shift';
    if (lowerSheetName.includes('rdo')) return 'rdo_request';
    if (lowerSheetName.includes('couple')) return 'couple_shift';
    if (lowerSheetName.includes('eves')) return 'eves';
    if (lowerSheetName.includes('demand') || lowerSheetName.includes('floor')) return 'floor_spread';
  }
  
  return 'unknown';
}

/**
 * Detect record type based on sheet name and headers
 */
export function detectRecordType(sheetName: string, headers: string[]): string {
  const lowerSheetName = sheetName.toLowerCase();
  
  if (lowerSheetName.includes('shift') || lowerSheetName.includes('排班')) return 'shift';
  if (lowerSheetName.includes('rdo')) return 'rdo_request';
  if (lowerSheetName.includes('couple')) return 'couple_shift';
  if (lowerSheetName.includes('eves') || lowerSheetName.includes('员工')) return 'eves';
  if (lowerSheetName.includes('demand') || lowerSheetName.includes('floor')) return 'floor_spread';
  
  // Fallback: check headers
  const headerStr = headers.join(',').toLowerCase();
  if (headerStr.includes('employee_id') && headerStr.includes('preferred_day')) return 'rdo_request';
  if (headerStr.includes('game_name') && headerStr.includes('shift_type')) return 'floor_spread';
  if (headerStr.includes('shift_date') || headerStr.includes('shift_type')) return 'shift';
  
  return 'unknown';
}

/**
 * Validate shift data
 */
export function validateShiftData(row: any): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (!row.employee_id) errors.push('Missing employee_id');
  if (!row.shift_date) errors.push('Missing shift_date');
  if (!row.shift_type) errors.push('Missing shift_type');
  
  const validShifts = ['M', 'LM', 'ED', 'D', 'EV', 'ES', 'S', 'N'];
  if (row.shift_type && !validShifts.includes(row.shift_type)) {
    warnings.push(`Unknown shift_type: ${row.shift_type}`);
  }
  
  if (row.shift_date && !isValidDate(row.shift_date)) {
    warnings.push(`Invalid shift_date format: ${row.shift_date}`);
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate RDO request data
 */
export function validateRDORequestData(row: any): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (!row.employee_id) errors.push('Missing employee_id');
  if (!row.preferred_day) errors.push('Missing preferred_day');
  
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (row.preferred_day && !validDays.includes(row.preferred_day)) {
    warnings.push(`Invalid day: ${row.preferred_day}`);
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate couple shift data
 */
export function validateCoupleShiftData(row: any): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (!row.employee_id_1) errors.push('Missing employee_id_1');
  if (!row.employee_id_2) errors.push('Missing employee_id_2');
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate EVES employee data
 */
export function validateEVESData(row: any): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (!row.employee_id) errors.push('Missing employee_id');
  if (!row.name) errors.push('Missing name');
  
  if (!row.role) warnings.push('Missing role');
  if (!row.property) warnings.push('Missing property');
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate floor spread (demand) data
 */
export function validateFloorSpreadData(row: any): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (!row.game_name) errors.push('Missing game_name');
  if (!row.shift_type) errors.push('Missing shift_type');
  if (!row.min_dealers) errors.push('Missing min_dealers');
  
  const validShifts = ['M', 'LM', 'ED', 'D', 'EV', 'ES', 'S', 'N'];
  if (row.shift_type && !validShifts.includes(row.shift_type)) {
    warnings.push(`Unknown shift_type: ${row.shift_type}`);
  }
  
  if (row.min_dealers && isNaN(parseInt(row.min_dealers))) {
    errors.push('min_dealers must be a number');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate data based on record type
 */
export function validateData(row: any, recordType: string): ValidationResult {
  switch (recordType) {
    case 'shift':
      return validateShiftData(row);
    case 'rdo_request':
      return validateRDORequestData(row);
    case 'couple_shift':
      return validateCoupleShiftData(row);
    case 'eves':
      return validateEVESData(row);
    case 'floor_spread':
      return validateFloorSpreadData(row);
    default:
      return { isValid: true, warnings: [], errors: [] };
  }
}

/**
 * Helper: Check if string is valid date
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Generate AI confidence level based on data completeness
 */
export function calculateConfidenceLevel(row: any, recordType: string): number {
  let confidence = 100;
  const emptyFields = Object.values(row).filter(v => v === '' || v === null).length;
  const totalFields = Object.keys(row).length;
  
  if (totalFields === 0) return 0;
  
  // Reduce confidence for each empty field
  const emptyPercentage = (emptyFields / totalFields) * 100;
  confidence -= emptyPercentage * 0.3; // Each 1% empty = 0.3% confidence loss
  
  // Additional penalties for specific missing fields
  if (recordType === 'shift' && !row.shift_type) confidence -= 10;
  if (recordType === 'rdo_request' && !row.reason) confidence -= 5;
  if (recordType === 'couple_shift' && (!row.employee_id_1 || !row.employee_id_2)) confidence -= 15;
  if (recordType === 'eves' && !row.role) confidence -= 5;
  if (recordType === 'floor_spread' && !row.min_dealers) confidence -= 10;
  
  return Math.max(0, Math.min(100, confidence));
}
