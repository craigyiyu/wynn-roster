/*
 * Dashboard — Command Center
 * Control Tower design: dark, data-dense, operational urgency
 * Shows schedule health, critical alerts, headcount, AI insights
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Activity,
  ShieldCheck,
  Users,
  Clock,
  Heart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Info,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DASHBOARD_METRICS,
  ALERTS,
  CONFLICTS,
  EMPLOYEES,
  GAME_DEMANDS,
  SHIFT_TYPES,
  type Alert,
} from '@/lib/mockData';

function MetricCard({
  label,
  value,
  suffix,
  icon: Icon,
  color,
  trend,
  trendLabel,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: any;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}) {
  const colorMap: Record<string, string> = {
    teal: 'text-teal bg-teal/10 border-teal/20',
    amber: 'text-amber bg-amber/10 border-amber/20',
    coral: 'text-coral bg-coral/10 border-coral/20',
    indigo: 'text-indigo bg-indigo/10 border-indigo/20',
  };
  const cls = colorMap[color] || colorMap.teal;

  return (
    <Card className="bg-card border-border hover:border-teal/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-md border ${cls}`}>
            <Icon className="w-4 h-4" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-[10px] font-mono ${trend === 'up' ? 'text-teal' : trend === 'down' ? 'text-coral' : 'text-muted-foreground'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
              {trendLabel}
            </div>
          )}
        </div>
        <p className="text-2xl font-mono font-bold text-foreground">
          {value}
          {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function AlertRow({ alert, onNavigate }: { alert: Alert; onNavigate: () => void }) {
  const severityStyles: Record<string, string> = {
    critical: 'border-l-coral bg-coral/5',
    warning: 'border-l-amber bg-amber/5',
    info: 'border-l-indigo bg-indigo/5',
  };
  const severityIcon: Record<string, any> = {
    critical: XCircle,
    warning: AlertTriangle,
    info: Info,
  };
  const SevIcon = severityIcon[alert.severity];

  return (
    <div
      className={`border-l-2 rounded-r-md p-3 cursor-pointer hover:brightness-110 transition-all ${severityStyles[alert.severity]}`}
      onClick={onNavigate}
    >
      <div className="flex items-start gap-3">
        <SevIcon className={`w-4 h-4 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-coral' : alert.severity === 'warning' ? 'text-amber' : 'text-indigo'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
            {alert.actionRequired && (
              <Badge variant="outline" className="text-[10px] border-amber/40 text-amber shrink-0">
                Action Required
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
          <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">{alert.timestamp}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const m = DASHBOARD_METRICS;

  // Gaming demand summary
  const demandIssues = GAME_DEMANDS.filter(d => d.currentDealers < d.minDealers || d.currentSupervisors < d.minSupervisors);

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Hero metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Schedule Health Score"
          value={m.scheduleHealth}
          suffix="%"
          icon={Activity}
          color="teal"
          trend="up"
          trendLabel="+3% vs last week"
        />
        <MetricCard
          label="Compliance Rate"
          value={m.complianceRate}
          suffix="%"
          icon={ShieldCheck}
          color={m.complianceRate >= 95 ? 'teal' : 'amber'}
          trend={m.complianceRate >= 95 ? 'up' : 'down'}
          trendLabel={m.complianceRate >= 95 ? 'All hard rules met' : '2 violations detected'}
        />
        <MetricCard
          label="Headcount vs Demand"
          value={`${m.headcountVsDemand.current}/${m.headcountVsDemand.required}`}
          icon={Users}
          color={m.headcountVsDemand.current >= m.headcountVsDemand.required ? 'teal' : 'coral'}
          trend={m.headcountVsDemand.current >= m.headcountVsDemand.required ? 'neutral' : 'down'}
          trendLabel={`${m.headcountVsDemand.required - m.headcountVsDemand.current} gap`}
        />
        <MetricCard
          label="Overtime Risk"
          value={m.overtimeRisk}
          suffix="%"
          icon={Clock}
          color={m.overtimeRisk > 30 ? 'coral' : m.overtimeRisk > 15 ? 'amber' : 'teal'}
          trend={m.overtimeRisk > 20 ? 'up' : 'down'}
          trendLabel="May Day period approaching"
        />
      </div>

      {/* Second row: smaller metrics */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-foreground">{m.unresolvedConflicts}</p>
          <p className="text-[10px] text-muted-foreground">Unresolved Conflicts</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-foreground">{m.pendingApprovals}</p>
          <p className="text-[10px] text-muted-foreground">Pending Approvals</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-foreground">{m.activeEmployees}</p>
          <p className="text-[10px] text-muted-foreground">Active Employees</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-amber">{m.preferenceSatisfaction}%</p>
          <p className="text-[10px] text-muted-foreground">Preference Satisfaction</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className={`text-lg font-mono font-bold ${m.costVariance < 0 ? 'text-teal' : 'text-coral'}`}>{m.costVariance > 0 ? '+' : ''}{m.costVariance}%</p>
          <p className="text-[10px] text-muted-foreground">Cost vs Budget</p>
        </div>
        <div className="bg-card border border-border rounded-md p-3">
          <p className="text-lg font-mono font-bold text-foreground">{demandIssues.length}</p>
          <p className="text-[10px] text-muted-foreground">Demand Gaps</p>
        </div>
      </div>

      {/* Main content: Alerts + AI Insights side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Critical Alerts */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-semibold text-foreground tracking-wide flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber" />
              CRITICAL ALERTS
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/exceptions')}>
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {ALERTS.map(alert => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onNavigate={() => navigate(alert.type === 'approval' ? '/approvals' : '/exceptions')}
              />
            ))}
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-mono font-semibold text-foreground tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo" />
            AI INSIGHTS
          </h2>

          {/* Predictive warning */}
          <Card className="bg-indigo/5 border-indigo/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-indigo mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Predictive Staffing Alert</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Based on historical patterns and confirmed VIP bookings, Saturday Evening shift will require
                    <span className="text-amber font-mono font-semibold"> +5 Baccarat dealers</span> and
                    <span className="text-amber font-mono font-semibold"> +1 Supervisor</span>.
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] border-indigo/40 text-indigo">
                      92% Confidence
                    </Badge>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] border-indigo/30 text-indigo hover:bg-indigo/10" onClick={() => navigate('/schedule')}>
                      View in Schedule
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fatigue risk */}
          <Card className="bg-amber/5 border-amber/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Heart className="w-4 h-4 text-amber mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Fatigue Risk: 3 Employees</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Ng Siu Fung (018102), Yip Ka Ho (019012), and Wong Ka Yan (016337) have fatigue scores above 60.
                    Recommend reducing consecutive night shifts.
                  </p>
                  <div className="space-y-1.5">
                    {EMPLOYEES.filter(e => e.fatigueScore > 60).map(emp => (
                      <div key={emp.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground w-14">{emp.id}</span>
                        <div className="flex-1">
                          <Progress value={emp.fatigueScore} className="h-1.5" />
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${emp.fatigueScore > 70 ? 'text-coral' : 'text-amber'}`}>
                          {emp.fatigueScore}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimization suggestion */}
          <Card className="bg-teal/5 border-teal/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Optimization Opportunity</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Couple shift pair (Leung Mei Ling & Ho Chi Wai) can be aligned to same Morning pattern.
                    This improves preference satisfaction by +4% with zero demand impact.
                  </p>
                  <Button size="sm" className="h-6 text-[10px] bg-teal text-[#0f1117] hover:bg-teal/80" onClick={() => navigate('/exceptions')}>
                    Apply Recommendation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gaming demand gaps */}
          {demandIssues.length > 0 && (
            <Card className="bg-coral/5 border-coral/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-coral" />
                  Gaming Demand Gaps
                </p>
                <div className="space-y-2">
                  {demandIssues.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {d.game} · {SHIFT_TYPES[d.shift]?.label}
                      </span>
                      <span className="font-mono text-coral font-semibold">
                        {d.currentDealers}/{d.minDealers} dealers
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
