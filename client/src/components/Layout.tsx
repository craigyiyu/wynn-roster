/*
 * Layout — Wynn Roster Navigation (Redesigned by Manus)
 * Organized by user scenarios
 */
import { ReactNode, useState } from 'react';
import { useLocation, Link } from 'wouter';
import {
  LayoutDashboard,
  CalendarDays,
  Play,
  RotateCw,
  Upload,
  Filter,
  Sparkles,
  GitBranch,
  AlertTriangle,
  ClipboardCheck,
  CheckSquare,
  Users,
  Settings,
  BarChart3,
  UserSearch,
  ShieldCheck,
  Code2,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles as SparkleIcon,
  Bell,
  Search,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: '核心排班工作流',
    items: [
      { path: '/', label: 'Command Center', icon: LayoutDashboard },
      { path: '/intake', label: 'Data Intake', icon: Upload },
      { path: '/generation', label: 'Generation Flow', icon: Play },
      { path: '/schedule', label: 'Schedule Builder', icon: CalendarDays },
      { path: '/rotation', label: 'Rotation View', icon: RotateCw },
    ]
  },
  {
    title: '数据管道',
    items: [
      { path: '/etl', label: 'ETL & Normalize', icon: Filter },
      { path: '/ai-review', label: 'AI Extraction', icon: Sparkles },
      { path: '/lineage', label: 'Data Lineage', icon: GitBranch },
    ]
  },
  {
    title: '异常处理与审批',
    items: [
      { path: '/exceptions', label: 'Exception Center', icon: AlertTriangle },
      { path: '/validation', label: 'Roster Validation', icon: ClipboardCheck },
      { path: '/approvals', label: 'Approval Center', icon: CheckSquare },
    ]
  },
  {
    title: '策略配置与分析',
    items: [
      { path: '/rules', label: 'Rules & Constraints', icon: ShieldCheck },
      { path: '/studio', label: 'Rule Studio', icon: Code2 },
      { path: '/demand', label: 'Demand & Skills', icon: BarChart3 },
      { path: '/trace', label: 'Employee Trace', icon: UserSearch },
    ]
  },
  {
    title: '管理',
    items: [
      { path: '/team', label: 'Team & Profiles', icon: Users },
      { path: '/export', label: 'Export Data', icon: Download },
    ]
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['核心排班工作流', '数据管道', '异常处理与审批', '策略配置与分析', '管理']));

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const isActive = (path: string) => location === path;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded-md bg-teal flex items-center justify-center shrink-0">
            <SparkleIcon className="w-4 h-4 text-[#0f1117]" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold font-mono text-sidebar-foreground truncate">WYNN ROSTER</p>
              <p className="text-[10px] text-muted-foreground tracking-widest">AI SCHEDULING</p>
            </div>
          )}
        </div>

        {/* Nav sections */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {NAV_SECTIONS.map(section => (
            <div key={section.title} className="mb-4">
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  <span>{section.title}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${expandedSections.has(section.title) ? '' : '-rotate-90'}`} />
                </button>
              )}
              
              {(!collapsed && !expandedSections.has(section.title)) || collapsed ? null : (
                <div className="space-y-0.5 mt-1">
                  {section.items.map(item => (
                    <Link key={item.path} href={item.path}>
                      <div className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                        isActive(item.path)
                          ? 'bg-sidebar-accent text-teal'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-teal'
                      }`}>
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top strip */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-mono font-semibold text-foreground tracking-wide">
              {NAV_SECTIONS.flatMap(s => s.items).find(i => i.path === location)?.label?.toUpperCase() || 'COMMAND CENTER'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary/50 rounded-md px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-40"
              />
            </div>
            <button className="relative p-2 rounded-md hover:bg-secondary/50 transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
