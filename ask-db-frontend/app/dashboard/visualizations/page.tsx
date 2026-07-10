'use client';
import { API_BASE_URL } from '@/lib/api-config';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Search,
  Download,
  Code2,
  Plug,
  TrendingUp,
  Info,
  PieChart,
  MapPin,
  Users,
  Briefcase
} from 'lucide-react';

interface ChatVisualization {
  id: string;
  chat_id: string;
  title: string;
  query: string;
  sql: string;
  plot: string;
  date: string;
}

interface AggregateCharts {
  // E-commerce charts
  product_revenue?: { product: string; revenue: number }[];
  product_quantity?: { product: string; total_qty: number }[];
  customers_by_city?: { city: string; count: number }[];
  // HR charts
  salary_by_department?: { department_name: string; avg_salary: number }[];
  employees_by_department?: { department_name: string; count: number }[];
  employees_by_job?: { job_title: string; count: number }[];
}

export default function VisualizationsPage() {
  const router = useRouter();
  const [chatVisuals, setChatVisuals] = useState<ChatVisualization[]>([]);
  const [aggrCharts, setAggrCharts] = useState<AggregateCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        // 1. Fetch Chat Visualizations
        const response = await fetch(`${API_BASE_URL}/api/database/visualizations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setChatVisuals(data.visualizations || []);
        } else {
          setError('No database connected');
        }

        // 2. Fetch Aggregate Database Charts
        const chartResponse = await fetch(`${API_BASE_URL}/api/database/dashboard-charts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (chartResponse.ok) {
          const cData = await chartResponse.json();
          if (cData.success) {
            setAggrCharts(cData.charts || null);
          }
        }
      } catch (e) {
        console.error(e);
        setError('Failed to fetch visualizations');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground animate-pulse text-sm">
        Loading visualizations...
      </div>
    );
  }

  if (error === 'No database connected') {
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

  // E-commerce chart checks
  const hasAggrQty = (aggrCharts?.product_quantity?.length || 0) > 0;
  const hasAggrRev = (aggrCharts?.product_revenue?.length || 0) > 0;
  const hasAggrCity = (aggrCharts?.customers_by_city?.length || 0) > 0;

  // HR chart checks
  const hasAggrEmpDept = (aggrCharts?.employees_by_department?.length || 0) > 0;
  const hasAggrSalaryDept = (aggrCharts?.salary_by_department?.length || 0) > 0;
  const hasAggrEmpJob = (aggrCharts?.employees_by_job?.length || 0) > 0;

  const totalVisualsCount = chatVisuals.length + 
    (hasAggrQty ? 1 : 0) + (hasAggrRev ? 1 : 0) + (hasAggrCity ? 1 : 0) +
    (hasAggrEmpDept ? 1 : 0) + (hasAggrSalaryDept ? 1 : 0) + (hasAggrEmpJob ? 1 : 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Visualizations Library</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Browse and export chart visual components generated from queries.
              </p>
            </div>
            
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search charts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              />
            </div>
          </div>

          {totalVisualsCount === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/20 text-muted-foreground text-sm max-w-md mx-auto">
              <BarChart3 className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-foreground mb-1">No Visualizations Yet</h4>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                Ask questions in the Chats section to dynamically generate charts from your actual database records.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* --- E-COMMERCE CHARTS --- */}
              {/* Qty Chart */}
              {hasAggrQty && (
                <PremiumCard className="p-5 flex flex-col justify-between border border-border/40 bg-secondary/10">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-base text-foreground">Top Products by Quantities Sold</h3>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 font-bold text-primary uppercase">E-commerce Analysis</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold uppercase">
                        <BarChart3 className="h-3 w-3" /> Bar Chart
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-4">"Real-time quantity sold spread per item from 'orders' database table."</p>
                    <div className="h-64 bg-card rounded-xl border border-border/25 p-5 flex flex-col justify-center space-y-4">
                      {aggrCharts?.product_quantity?.map((item, idx) => {
                        const maxVal = Math.max(...(aggrCharts?.product_quantity?.map(p => p.total_qty) || [1]));
                        const pct = (item.total_qty / maxVal) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span>{item.product}</span>
                              <span className="font-mono text-muted-foreground">{item.total_qty} units</span>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PremiumCard>
              )}

              {/* Revenue Chart */}
              {hasAggrRev && (
                <PremiumCard className="p-5 flex flex-col justify-between border border-border/40 bg-secondary/10">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-base text-foreground">Revenue Split by Product</h3>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 font-bold text-primary uppercase">E-commerce Analysis</p>
                      </div>
                      <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold uppercase">
                        <PieChart className="h-3 w-3" /> Donut Chart
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-4">"Real-time revenue split calculated from order prices and quantities."</p>
                    <div className="h-64 bg-card rounded-xl border border-border/25 p-5 flex flex-col justify-center space-y-4">
                      {aggrCharts?.product_revenue?.map((item, idx) => {
                        const total = aggrCharts?.product_revenue?.reduce((a, c) => a + c.revenue, 0) || 1;
                        const pct = (item.revenue / total) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span>{item.product}</span>
                              <span className="font-mono text-muted-foreground">₹{item.revenue.toLocaleString()} ({pct.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PremiumCard>
              )}


              {/* --- HR SCHEMAS CHARTS --- */}
              {/* Headcount by Dept */}
              {hasAggrEmpDept && (
                <PremiumCard className="p-5 flex flex-col justify-between border border-border/40 bg-secondary/10">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-base text-foreground">Headcount by Department</h3>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 font-bold text-indigo-500 uppercase">HR Metadata Analysis</p>
                      </div>
                      <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold uppercase">
                        <Users className="h-3.5 w-3.5" /> Bar Chart
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-4">"Active company headcount size distributed across corporate business units."</p>
                    <div className="h-64 bg-card rounded-xl border border-border/25 p-5 flex flex-col justify-center space-y-4">
                      {aggrCharts?.employees_by_department?.map((item, idx) => {
                        const maxVal = Math.max(...(aggrCharts?.employees_by_department?.map(e => e.count) || [1]));
                        const pct = (item.count / maxVal) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span>{item.department_name || 'Unassigned'}</span>
                              <span className="font-mono text-muted-foreground">{item.count} staff</span>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PremiumCard>
              )}

              {/* Salary by Dept */}
              {hasAggrSalaryDept && (
                <PremiumCard className="p-5 flex flex-col justify-between border border-border/40 bg-secondary/10">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-base text-foreground">Average Salary by Department</h3>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 font-bold text-indigo-500 uppercase">HR Metadata Analysis</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold uppercase">
                        <TrendingUp className="h-3.5 w-3.5" /> Bar Chart
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-4">"Department average salary packages computed across employee payroll indices."</p>
                    <div className="h-64 bg-card rounded-xl border border-border/25 p-5 flex flex-col justify-center space-y-4">
                      {aggrCharts?.salary_by_department?.map((item, idx) => {
                        const maxVal = Math.max(...(aggrCharts?.salary_by_department?.map(s => s.avg_salary) || [1]));
                        const pct = (item.avg_salary / maxVal) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span>{item.department_name || 'Unassigned'}</span>
                              <span className="font-mono text-muted-foreground">₹{item.avg_salary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PremiumCard>
              )}

              {/* Employees by Job Role */}
              {hasAggrEmpJob && (
                <PremiumCard className="p-5 flex flex-col justify-between border border-border/40 bg-secondary/10">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-base text-foreground">Headcount by Job Title</h3>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 font-bold text-indigo-500 uppercase">HR Metadata Analysis</p>
                      </div>
                      <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold uppercase">
                        <Briefcase className="h-3.5 w-3.5" /> Bar Chart
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-4">"Employee count mapping by dynamic job definitions."</p>
                    <div className="h-64 bg-card rounded-xl border border-border/25 p-5 flex flex-col justify-center space-y-4">
                      {aggrCharts?.employees_by_job?.map((item, idx) => {
                        const maxVal = Math.max(...(aggrCharts?.employees_by_job?.map(j => j.count) || [1]));
                        const pct = (item.count / maxVal) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span>{item.job_title}</span>
                              <span className="font-mono text-muted-foreground">{item.count} staff</span>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PremiumCard>
              )}

              {/* Chat-generated Visualizations List */}
              {chatVisuals.map((visual) => (
                <PremiumCard
                  key={visual.id}
                  className="p-5 flex flex-col justify-between hover:border-blue-500/40 hover:shadow-md transition-all border border-border/40"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-base text-foreground truncate">
                          {visual.title}
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          Generated on {visual.date}
                        </p>
                      </div>
                      <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold uppercase">
                        <TrendingUp className="h-3 w-3" /> Visual Chart
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 italic mb-4">
                      "{visual.query}"
                    </p>

                    <div className="h-64 bg-card rounded-xl border border-border/25 p-2.5 flex items-center justify-center mb-5">
                      <img 
                        src={`data:image/png;base64,${visual.plot}`} 
                        alt="Query Result Visualization" 
                        className="w-full h-full object-contain rounded"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 border-t border-border/40 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border/40 hover:bg-secondary/40 text-xs flex items-center justify-center gap-1.5"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `data:image/png;base64,${visual.plot}`;
                        link.download = `visualization_${visual.id}.png`;
                        link.click();
                      }}
                    >
                      <Download className="h-3.5 w-3.5 text-primary" />
                      <span>Download PNG</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border/40 hover:bg-secondary/40 text-xs flex items-center justify-center gap-1.5"
                      onClick={() => alert(`SQL Code:\n\n${visual.sql}`)}
                    >
                      <Code2 className="h-3.5 w-3.5 text-primary" />
                      <span>View SQL</span>
                    </Button>
                  </div>
                </PremiumCard>
              ))}
            </div>
          )}

          <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              These visual representations represent actual database structures and metrics. Mock representations are omitted automatically to enforce strict data authenticity.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
