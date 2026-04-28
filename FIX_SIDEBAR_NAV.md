# Fix: 侧边栏缺少 Data Pipeline 导航

## 问题
Layout.tsx 中的 NAV_ITEMS 数组只有 6 个项目，缺少整个 Data Pipeline 分组。

## 当前 NAV_ITEMS
const NAV_ITEMS = [
  { path: "/", label: "Command Center", icon: LayoutDashboard },
  { path: "/schedule", label: "Schedule Builder", icon: CalendarDays },
  { path: "/exceptions", label: "Exception Center", icon: AlertTriangle },
  { path: "/team", label: "Team & Profiles", icon: Users },
  { path: "/rules", label: "Rules & Constraints", icon: ShieldCheck },
  { path: "/approvals", label: "Approval Center", icon: CheckSquare },
];

## 需要添加的导航项（参考 Manus 版本）

### Data Pipeline 分组
- { path: "/intake", label: "Data Intake", icon: Upload }
- { path: "/etl", label: "ETL & Normalize", icon: Filter }
- { path: "/ai-review", label: "AI Extraction", icon: Sparkles }
- { path: "/lineage", label: "Data Lineage", icon: GitBranch }

### Schedule 分组
- { path: "/generation", label: "Generation Flow", icon: Play }
- { path: "/demand", label: "Demand & Skills", icon: BarChart3 }
- { path: "/rotation", label: "Rotation View", icon: RotateCw }

### Analysis 分组
- { path: "/trace", label: "Employee Trace", icon: UserSearch }
- { path: "/validation", label: "Roster Validation", icon: ClipboardCheck }
- { path: "/studio", label: "Rule Studio", icon: Code2 }

## 需要的 lucide-react 图标
import { Upload, Filter, Sparkles, GitBranch, Play, BarChart3, RotateCw, UserSearch, ClipboardCheck, Code2 } from "lucide-react";

## 执行
1. 编辑 ~/.openclaw/workspace/wynn-roster/client/src/components/Layout.tsx
2. 添加缺失的图标 import
3. 修改 NAV_ITEMS 数组，添加分组标题和所有页面
4. 重建: npm run build
5. 重启前端

## 完成后
报告修改内容和测试结果
