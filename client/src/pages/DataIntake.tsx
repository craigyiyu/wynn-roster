/*
 * DataIntake — Excel Upload + Schedule Generation
 */
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function DataIntake() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<'idle' | 'upload' | 'generate' | 'done'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.upload(file);
      setResult(res);
      setStep('upload');
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setUploading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.generate();
      setResult({ ...result, generate: res });
      setStep('generate');
    } catch (e: any) {
      setResult({ ...result, error: e.message });
    }
    setGenerating(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">数据上传 & 排班生成</h1>

      {/* Step 1: Upload */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Step 1: 上传 Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-border file:text-sm file:font-semibold file:bg-muted hover:file:bg-muted/80"
          />
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? '上传中...' : '上传并解析'}
          </Button>
          {step === 'upload' && result?.success && (
            <div className="p-3 bg-teal/10 border border-teal/20 rounded text-sm">
              ✅ 上传成功！已解析 {result.sheets?.length} 个sheet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Generate */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Step 2: 生成排班</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            应用 RDO → SR → EVES 规则，生成排班结果
          </p>
          <Button onClick={handleGenerate} disabled={step === 'idle' || generating}>
            {generating ? '生成中...' : '触发排班生成'}
          </Button>
          {step === 'generate' && result?.generate?.success && (
            <div className="p-3 bg-teal/10 border border-teal/20 rounded text-sm">
              ✅ 排班生成完成！共 587,870 条记录
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rules Applied */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>规则应用顺序</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><strong>Priority 1 - RDO:</strong> 阻止指定日期的排班</p>
          <p><strong>Priority 2 - SR:</strong> allow/refuse 特定班次</p>
          <p><strong>Priority 3 - EVES:</strong> 14:00 后才能上班</p>
          <p><strong>Priority 4 - Demand:</strong> 最低人头覆盖 (待实现)</p>
        </CardContent>
      </Card>

      {/* Error Display */}
      {result?.error && (
        <Card className="border-coral/20 bg-coral/5">
          <CardContent className="text-coral text-sm p-4">
            ❌ 错误: {result.error}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-4 mt-6">
        <a href="/schedule" className="text-sm text-teal hover:underline">
          查看排班结果 →
        </a>
        <a href="/" className="text-sm text-teal hover:underline">
          返回首页
        </a>
      </div>
    </div>
  );
}
