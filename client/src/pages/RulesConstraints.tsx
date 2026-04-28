/*
 * RulesConstraints — 规则配置页面 (增强版)
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AlertCircle, CheckCircle, Settings, ChevronDown, ChevronUp } from 'lucide-react';

export default function RulesConstraints() {
  const [constraints, setConstraints] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    rdo: true, sr: true, eves: true, demand: false
  });

  useEffect(() => {
    api.constraints().then(data => {
      setConstraints(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const toggleRule = (rule: string) => {
    setEnabled(prev => ({ ...prev, [rule]: !prev[rule] }));
  };

  if (loading) return <div className="p-8">加载中...</div>;

  const rules = [
    {
      key: 'rdo',
      color: 'teal',
      icon: AlertCircle,
      title: 'RDO 规则 (Priority 1)',
      description: 'Rest Day Off - 阻止批准请假日期的所有排班',
      priority: '最高',
      count: constraints?.rdo?.activeCount || 0,
      params: ['假期类型', '提前通知天数']
    },
    {
      key: 'sr',
      color: 'indigo',
      icon: CheckCircle,
      title: '特殊请求规则 (Priority 2)',
      description: 'Special Request - allow/refuse 特定班次',
      priority: '高',
      count: constraints?.specialRequest?.activeCount || 0,
      params: ['请求类型 (allow/refuse)', '班次列表']
    },
    {
      key: 'eves',
      color: 'amber',
      icon: AlertCircle,
      title: 'EVES 规则 (Priority 3)',
      description: 'Evening/Shift - EVES 员工只能在 14:00 后开始上班',
      priority: '中',
      count: constraints?.eves?.activeCount || 0,
      params: ['最早开始时间 (14:00)']
    },
    {
      key: 'demand',
      color: 'coral',
      icon: Settings,
      title: 'Demand 规则 (Priority 4)',
      description: '最低人头覆盖 - 确保每个班次的最低人数',
      priority: '低',
      count: constraints?.demand?.activeCount || 0,
      params: ['最低人数阈值']
    }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">规则配置</h1>
        <Button variant="outline" onClick={() => setConstraints(null)}>
          刷新
        </Button>
      </div>

      <div className="space-y-4">
        {rules.map(rule => {
          const Icon = rule.icon;
          const isExpanded = expanded === rule.key;
          const isEnabled = enabled[rule.key];
          
          return (
            <Card key={rule.key} className={`border-${rule.color}/30 bg-${rule.color}/5`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 text-${rule.color}`} />
                    <div>
                      <CardTitle className={`text-${rule.color}`}>{rule.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold">{rule.count}</span>
                    <Button
                      variant={isEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleRule(rule.key)}
                    >
                      {isEnabled ? '已启用' : '已禁用'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    <span>优先级: <strong>{rule.priority}</strong></span>
                    <span>活动规则: <strong>{rule.count}</strong></span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(isExpanded ? null : rule.key)}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    详情
                  </Button>
                </div>
                
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">可配置参数:</h4>
                    <ul className="text-sm space-y-1">
                      {rule.params.map((p, i) => (
                        <li key={i}>• {p}</li>
                      ))}
                    </ul>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm">编辑参数</Button>
                      <Button size="sm" variant="outline">查看日志</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">规则执行顺序</h3>
        <p className="text-sm text-muted-foreground">
          1. RDO (阻止) → 2. SR (限制) → 3. EVES (限制) → 4. Demand (覆盖) → 5. OR-Tools (优化)
        </p>
      </div>
    </div>
  );
}
