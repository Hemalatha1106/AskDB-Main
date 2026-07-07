'use client';

import { AskDBLogo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Home,
  MessageSquare,
  Database,
  LayoutDashboard,
  BarChart3,
  History,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [conversations, setConversations] = useState<any[]>([]);
  const [dbName, setDbName] = useState<string>('Connect DB');
  const [aiStatus, setAiStatus] = useState<{ enabled: boolean; provider: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchAiStatus = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8000/api/settings/ai', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setAiStatus({
            enabled: data.settings.use_personal_key && data.settings.has_key,
            provider: data.settings.provider
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI settings status', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      try {
        // Fetch chats
        const chatsRes = await fetch('http://localhost:8000/api/chats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (chatsRes.ok) {
          const chatsData = await chatsRes.json();
          setConversations(chatsData.chats || []);
        } else if (chatsRes.status === 401) {
          localStorage.removeItem('authToken');
          router.push('/auth/login');
          return;
        }
        
        // Fetch connection status
        const dbRes = await fetch('http://localhost:8000/api/database/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          if (dbData.connected) {
            setDbName(dbData.dialect.charAt(0).toUpperCase() + dbData.dialect.slice(1));
          } else {
            setDbName('Connect DB');
          }
        }
      } catch (err) {
        console.error('Failed to fetch sidebar data', err);
        setDbName('Offline');
      }
    };
    
    fetchData();
    fetchAiStatus();
    window.addEventListener('storage', fetchData);
    window.addEventListener('ai-settings-changed', fetchAiStatus);
    return () => {
      window.removeEventListener('storage', fetchData);
      window.removeEventListener('ai-settings-changed', fetchAiStatus);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };


  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/new', label: 'Chats', icon: MessageSquare },
    { href: '/dashboard/connections', label: 'Databases', icon: Database, badge: dbName !== 'Connect DB' && dbName !== 'Offline' ? dbName : undefined },
    { href: '/dashboard/dashboards', label: 'Dashboards', icon: LayoutDashboard },
    { href: '/dashboard/visualizations', label: 'Visualizations', icon: BarChart3 },
    { href: '/dashboard/history', label: 'Query History', icon: History },
    { href: '/dashboard/reports', label: 'Saved Reports', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`border-r border-border/40 bg-card flex flex-col h-screen transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between gap-2">
        {!isCollapsed && <AskDBLogo className="flex-1" />}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button size="lg" className="w-full flex items-center justify-center gap-2" asChild>
          <Link href="/dashboard/new">
            <Plus className="h-4 w-4" />
            {!isCollapsed && <span>New Chat</span>}
          </Link>
        </Button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
              {!isCollapsed && (
                <span className="flex-1 truncate flex items-center justify-between gap-2">
                  {item.label}
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary-foreground/15 text-muted-foreground'}`}>
                      {item.badge}
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}

        {/* Recent Conversations Group */}
        {!isCollapsed && conversations.length > 0 && (
          <div className="pt-4 space-y-1">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase px-3 py-2 tracking-wider">
              Recent Conversations
            </div>
            <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1">
              {conversations.slice(0, 5).map((conv) => (
                <Link
                  key={conv.id}
                  href={`/dashboard/chat/${conv.id}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs truncate transition-colors ${
                    pathname === `/dashboard/chat/${conv.id}`
                      ? 'bg-secondary text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                  }`}
                >
                  <MessageSquare className="h-3 w-3 shrink-0 opacity-75" />
                  <span className="truncate">{conv.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-border/40 space-y-1">
        {/* AI BYOK Status */}
        {aiStatus && (
          <div className="px-3 py-2 text-[11px] flex items-center gap-2 border-b border-border/20 mb-1 leading-normal select-none">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${aiStatus.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-primary'}`} />
            {!isCollapsed && (
              <span className="truncate text-muted-foreground font-semibold">
                {aiStatus.enabled ? (
                  <span className="text-emerald-500">✓ Personal {aiStatus.provider === 'gemini' ? 'Gemini' : aiStatus.provider.charAt(0).toUpperCase() + aiStatus.provider.slice(1)} key</span>
                ) : (
                  <span>✓ AskDB default AI</span>
                )}
              </span>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-3 px-3 py-2.5 rounded-lg"
          onClick={handleLogout}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>

    </aside>
  );
}
