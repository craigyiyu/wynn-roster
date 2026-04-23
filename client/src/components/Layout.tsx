/*
 * Layout — Control Tower Design
 * Persistent left command rail + main viewport + top status strip
 * Dark theme: charcoal base, teal/amber/coral/indigo semantic colors
 */
import { ReactNode, useState } from 'react';
import { useLocation, Link } from 'wouter';
import {
  LayoutDashboard,
  CalendarDays,
  AlertTriangle,
  Users,
  ShieldCheck,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bell,
  Search,
} from 'lucide-react';
import { ALERTS } from '@/lib/mockData';

const NAV_ITEMS = [
  { path: '/', label: 'Command Center', icon: LayoutDashboard },
  { path: '/schedule', label: 'Schedule Builder', icon: CalendarDays },
  { path: '/exceptions', label: 'Exception Center', icon: AlertTriangle },
  { path: '/team', label: 'Team & Profiles', icon: Users },
  { path: '/rules', label: 'Rules & Constraints', icon: ShieldCheck },
  { path: '/approvals', label: 'Approval Center', icon: CheckSquare },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const criticalCount = ALERTS.filter(a => a.severity === 'critical' && a.actionRequired).length;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo area */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded-md bg-teal flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#0f1117]" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold font-mono text-sidebar-foreground truncate">WYNN ROSTER</p>
              <p className="text-[10px] text-muted-foreground tracking-widest">AI SCHEDULING</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors group ${
                    isActive
                      ? 'bg-sidebar-accent text-teal'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-teal'
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-teal' : 'text-muted-foreground group-hover:text-teal'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {item.path === '/exceptions' && criticalCount > 0 && (
                    <span className="ml-auto bg-coral text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {criticalCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
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
        {/* Top status strip */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-mono font-semibold text-foreground tracking-wide">
              {NAV_ITEMS.find(n => n.path === location)?.label?.toUpperCase() || 'COMMAND CENTER'}
            </h1>
            <span className="text-xs text-muted-foreground font-mono">
              Week 17 — Apr 21–27, 2026
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-secondary/50 rounded-md px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search employees, rules..."
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-40"
              />
            </div>
            {/* Notifications */}
            <button className="relative p-2 rounded-md hover:bg-secondary/50 transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              {criticalCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-coral rounded-full" />
              )}
            </button>
            {/* User */}
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-indigo/20 flex items-center justify-center">
                <span className="text-xs font-mono text-indigo font-semibold">OM</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-foreground">Ops Manager</p>
                <p className="text-[10px] text-muted-foreground">Table Games · WM</p>
              </div>
            </div>
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
