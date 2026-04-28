/*
 * ExportPanel — Excel Export UI
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function ExportPanel() {
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('http://localhost:3001/api/schedule/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'roster_export_' + new Date().toISOString().split('T')[0] + '.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setResult({ success: true, size: blob.size });
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setExporting(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">导出排班数据</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Excel 导出</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            导出的 Excel 文件包含所有排班记录，包括员工、日期、班次等信息。
          </p>
          
          <div className="space-y-2">
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? '导出中...' : '导出 Excel'}
            </Button>
          </div>

          {result?.success && (
            <p className="text-sm text-green-500">
              ✅ 导出成功！文件大小: {(result.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
          
          {result?.error && (
            <p className="text-sm text-red-500">
              ❌ 导出失败: {result.error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
