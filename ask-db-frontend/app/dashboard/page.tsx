'use client';
import { API_BASE_URL } from '@/lib/api-config';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Database,
  Play,
  Cpu,
  HardDrive,
  Plus,
  MessageSquare,
  Upload,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Clock,
  Plug
} from 'lucide-react';

interface SummaryData {
  connected_databases_count: number;
  queries_today_count: number;
  active_database: {
    id: number;
    dialect: string;
    database_name: string;
    tables: string[];
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [greeting, setGreeting] = useState('Welcome');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get user name dynamically
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj.email) {
          const emailPrefix = userObj.email.split('@')[0];
          const formattedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          setUserName(formattedName);
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }

    // 2. Set dynamic greeting based on hour
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }

    // 3. Fetch summary metrics from backend
    const fetchSummary = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/database/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSummary(data);
        }
      } catch (e) {
        console.error('Failed to fetch summary data', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground animate-pulse text-sm">
        Loading workspace summary...
      </div>
    );
  }

  const isConnected = !!summary?.active_database;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Welcome/Header */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {greeting}, {userName}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here is a summary of your database workspace and operations today.
            </p>
          </div>

          {!isConnected ? (
            /* Requirement 4: No connection fallback alert wrapper keeping existing UI shell styling */
            <div className="border border-dashed border-border/60 rounded-2xl bg-card/25 p-8 py-16 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-secondary rounded-full text-muted-foreground mb-4">
                <Plug className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">No Database Connected</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6 whitespace-pre-line leading-relaxed">
                No database is currently connected.{"\n"}
                Please connect a database to start asking questions.
              </p>
              <Button size="lg" asChild>
                <Link href="/database/connect">Connect Database</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <PremiumCard className="p-6 relative overflow-hidden hover:border-blue-500/40 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Connected Databases
                    </span>
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight mb-1">
                    {summary?.connected_databases_count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Active: <span className="text-primary font-semibold capitalize">{summary?.active_database?.dialect}</span>
                  </div>
                </PremiumCard>

                <PremiumCard className="p-6 relative overflow-hidden hover:border-blue-500/40 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Queries Today
                    </span>
                    <Play className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight mb-1">
                    {summary?.queries_today_count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Target: <span className="text-foreground font-semibold">{summary?.active_database?.database_name}</span>
                  </div>
                </PremiumCard>

                <PremiumCard className="p-6 relative overflow-hidden hover:border-blue-500/40 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Database Tables
                    </span>
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight mb-1">
                    {summary?.active_database?.tables?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Schema parsed and indexed
                  </div>
                </PremiumCard>

                <PremiumCard className="p-6 relative overflow-hidden hover:border-blue-500/40 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Connection Port
                    </span>
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight mb-1">
                    Ready
                  </div>
                  <div className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Schema Sync
                  </div>
                </PremiumCard>
              </div>

              {/* Quick Actions Panel */}
              <div>
                <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 justify-start px-6 gap-3 border-border/40 hover:border-blue-500/40 hover:bg-secondary/40"
                    onClick={() => router.push('/database/connect')}
                  >
                    <Plus className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">Connect New Database</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 justify-start px-6 gap-3 border-border/40 hover:border-blue-500/40 hover:bg-secondary/40"
                    onClick={() => router.push('/dashboard/new')}
                  >
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">Start New Chat</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 justify-start px-6 gap-3 border-border/40 hover:border-blue-500/40 hover:bg-secondary/40"
                    onClick={() => router.push('/dashboard/connections')}
                  >
                    <Database className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">Browse Active Tables</span>
                  </Button>
                </div>
              </div>

              {/* Connected Active Schema Info */}
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                  <h2 className="text-lg font-bold">Active Workspace Schema</h2>
                  <PremiumCard className="p-6 border-border/40 bg-secondary/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-sm">Active Database Connection: <span className="font-mono text-primary font-bold">{summary?.active_database?.database_name}</span></h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Schema mapped directly from dialet source</p>
                      </div>
                      <span className="text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Live Truth Source
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 bg-card border border-border/20 p-4 rounded-xl font-mono leading-relaxed">
                      <div className="text-foreground font-semibold mb-1 uppercase tracking-wider text-[10px]">Detected Table Schema Indices:</div>
                      {summary?.active_database?.tables && summary.active_database.tables.length > 0 ? (
                        summary.active_database.tables.map(table => (
                          <div key={table} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>table: <strong className="text-foreground">{table}</strong> (RAG embeddings loaded)</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No tables found inside this database workspace.</p>
                      )}
                    </div>
                  </PremiumCard>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
