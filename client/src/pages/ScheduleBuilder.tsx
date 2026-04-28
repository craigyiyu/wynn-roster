/*
 * ScheduleBuilder — 显示排班结果
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function ScheduleBuilder() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const loadResults = () => {
    setLoading(true);
    api.results(page, 20).then(data => {
      setResults(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadResults(); }, [page]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">排班结果</h1>
      
      <div className="flex gap-4 mb-6">
        <Button onClick={loadResults} disabled={loading}>
          {loading ? '加载中...' : '刷新'}
        </Button>
        <span className="self-center text-sm text-muted-foreground">
          共 {results?.pagination?.total || 0} 条记录
        </span>
      </div>

      {results?.data && (
        <Card>
          <CardHeader>
            <CardTitle>第 {page} 页 (显示 {results.data.length} 条)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="p-2 text-left">员工</th>
                    <th className="p-2 text-left">日期</th>
                    <th className="p-2 text-left">班次</th>
                    <th className="p-2 text-left">RDO</th>
                    <th className="p-2 text-left">EVES</th>
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((row: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{row.EmployeeNumber}</td>
                      <td className="p-2">{row.ShiftDate}</td>
                      <td className="p-2">{row.ShiftValue}</td>
                      <td className="p-2">{row.RDO_Display || '-'}</td>
                      <td className="p-2">{row.IsEVES || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 mt-4">
        <Button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}>上一页</Button>
        <span className="self-center">第 {page} 页</span>
        <Button onClick={() => setPage(p => p+1)} disabled={!results?.data?.length}>下一页</Button>
      </div>
    </div>
  );
}
