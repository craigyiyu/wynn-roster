/*
 * Dashboard — Command Center with Real API Data
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function Dashboard() {
  const [constraints, setConstraints] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.constraints().then(data => {
      setConstraints(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Wynn Roster Command Center</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-teal/10 border-teal/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-teal">RDO规则</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{constraints?.rdo?.activeCount || 0}</p>
            <p className="text-xs text-muted-foreground">员工有RDO阻止</p>
            <p className="text-xs text-muted-foreground mt-2">Priority 1</p>
          </CardContent>
        </Card>

        <Card className="bg-indigo/10 border-indigo/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-indigo">特殊请求</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{constraints?.specialRequest?.activeCount || 0}</p>
            <p className="text-xs text-muted-foreground">SR规则请求</p>
            <p className="text-xs text-muted-foreground mt-2">Priority 2</p>
          </CardContent>
        </Card>

        <Card className="bg-amber/10 border-amber/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber">EVES员工</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{constraints?.eves?.activeCount || 0}</p>
            <p className="text-xs text-muted-foreground">只上夜班</p>
            <p className="text-xs text-muted-foreground mt-2">Priority 3</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>规则说明</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>RDO:</strong> 阻止指定日期的所有排班</p>
            <p><strong>SR:</strong> allow/refuse特定班次</p>
            <p><strong>EVES:</strong> 只允许14:00后班次</p>
            <p><strong>Demand:</strong> 最低人头覆盖（待实现）</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>快速链接</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <a href="/api-test" className="block text-sm text-teal hover:underline">API测试页</a>
            <a href="/schedule" className="block text-sm text-teal hover:underline">排班生成</a>
            <a href="/rules" className="block text-sm text-teal hover:underline">规则配置</a>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          后端: {constraints ? '已连接' : '未连接'} | 
          数据库: wynnai | 
          表: AI_Shift_Scheduling_Result_Table (587,870行)
        </p>
      </div>
    </div>
  );
}
