'use client';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Plug,
  Calendar,
  Trash2,
  Database
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      // 1. Check connection status
      const connRes = await fetch('http://localhost:8000/api/database/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (connRes.ok) {
        const connData = await connRes.json();
        setIsConnected(connData.connected);
      }

      // 2. Fetch saved reports
      const reportsRes = await fetch('http://localhost:8000/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        if (data.success) {
          setReports(data.reports);
        }
      }
    } catch (e) {
      console.error("Failed to load reports data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [router]);

  const handleDelete = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this saved report?")) {
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setReports(reports.filter(r => r.id !== reportId));
      } else {
        alert("Failed to delete report.");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting report.");
    }
  };

  const filteredReports = reports.filter(report => {
    const term = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(term) ||
      (report.query && report.query.toLowerCase().includes(term)) ||
      (report.sql_query && report.sql_query.toLowerCase().includes(term)) ||
      (report.answer && report.answer.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground animate-pulse text-sm">
        Loading saved reports...
      </div>
    );
  }

  // 1. If no database is connected, show standard connection warning
  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-8">
        <div className="max-w-md w-full border border-dashed border-border/60 rounded-2xl bg-card/25 p-8 py-16 flex flex-col items-center justify-center text-center">
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
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Saved Reports</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Access your saved query summaries, snapshots, and scheduled reports.
              </p>
            </div>
            
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Reports Content */}
          {filteredReports.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/20 text-muted-foreground text-sm max-w-md mx-auto">
              <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-foreground mb-1">
                {searchQuery ? "No Reports Found" : "No Saved Reports"}
              </h4>
              <p className="text-xs text-muted-foreground/80 leading-relaxed mb-4">
                {searchQuery 
                  ? "Try checking your spelling or search terms." 
                  : "You haven't saved any reports yet."}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground/60">
                  When querying your database in Chats, click the "Save" button on any response card to persist the analysis here.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredReports.map((report) => (
                <PremiumCard key={report.id} className="p-6 flex flex-col border-border/40 hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground leading-snug">{report.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{report.created_at}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Original Query */}
                      <div className="bg-secondary/40 border border-border/30 rounded-xl p-3">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Original Question</span>
                        <p className="text-xs text-foreground font-medium">{report.query}</p>
                      </div>

                      {/* SQL Section */}
                      {report.sql_query && (
                        <div className="bg-muted/70 rounded-xl p-3 border border-border/60">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">SQL Query</span>
                            <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-mono font-medium">SQL</span>
                          </div>
                          <pre className="text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-24 leading-relaxed scrollbar-thin">
                            {report.sql_query}
                          </pre>
                        </div>
                      )}

                      {/* Answer Section */}
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Analysis Summary</span>
                        <p className="whitespace-pre-line bg-secondary/20 rounded-xl p-3 border border-border/20">{report.answer}</p>
                      </div>
                    </div>

                    {/* Visualization Section */}
                    {report.plot && (
                      <div className="mt-4 pt-4 border-t border-border/40">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Visual Insight</span>
                        <div className="rounded-xl overflow-hidden border border-border bg-card">
                          <img
                            src={`data:image/png;base64,${report.plot}`}
                            alt={report.title}
                            className="w-full object-contain max-h-48 hover:scale-[1.02] transition-transform duration-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </PremiumCard>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
