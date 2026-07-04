'use client';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Plug,
  Info,
  Layers,
  BarChart3,
  PieChart,
  MapPin,
  Briefcase
} from 'lucide-react';

interface KPIResponse {
  success: boolean;
  error?: string;
  has_data?: boolean;
  kpis?: {
    customers?: number;
    orders?: number;
    revenue?: number;
    // HR KPIs
    employees?: number;
    payroll?: number;
    avg_salary?: number;
    departments?: number;
  };
}

interface ChartDataResponse {
  success: boolean;
  charts?: {
    // E-commerce charts
    product_revenue?: { product: string; revenue: number }[];
    product_quantity?: { product: string; total_qty: number }[];
    customers_by_city?: { city: string; count: number }[];
    // HR charts
    salary_by_department?: { department_name: string; avg_salary: number }[];
    employees_by_department?: { department_name: string; count: number }[];
    employees_by_job?: { job_title: string; count: number }[];
  };
}

export default function DashboardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIResponse | null>(null);
  const [chartData, setChartData] = useState<ChartDataResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        // 1. Fetch KPIs
        const kpiResponse = await fetch('http://localhost:8000/api/database/kpis', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (kpiResponse.ok) {
          const kpis = await kpiResponse.json();
          setKpiData(kpis);
        }

        // 2. Fetch Charts
        const chartResponse = await fetch('http://localhost:8000/api/database/dashboard-charts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (chartResponse.ok) {
          const charts = await chartResponse.json();
          setChartData(charts);
        }
      } catch (e) {
        console.error(e);
        setKpiData({ success: false, error: 'Backend server connection error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground animate-pulse text-sm">
        Loading executive dashboard charts & KPIs...
      </div>
    );
  }

  const isConnected = kpiData?.success !== false;
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

  const hasKPIs = !!kpiData?.has_data;
  if (!hasKPIs) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-8">
        <div className="max-w-md w-full border border-border/40 rounded-2xl bg-card/20 p-6 text-center">
          <div className="p-3 bg-secondary rounded-full text-primary mb-4 w-12 h-12 flex items-center justify-center mx-auto">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-base text-foreground mb-2">No Executive Data Found</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            The connected database does not contain schema structures (such as 'customers', 'orders', or 'employees') to compute visual executive metrics.
          </p>
          <p className="text-xs text-muted-foreground/70 italic">
            Go to Chats to run custom natural language SQL queries on your active schema tables.
          </p>
        </div>
      </div>
    );
  }

  // Calculate lists for KPIs (dynamic based on E-commerce vs. HR databases)
  const kpisList = [];
  
  // E-commerce metrics
  if (kpiData?.kpis?.revenue !== undefined) {
    kpisList.push({
      label: 'Calculated Revenue',
      value: `₹${kpiData.kpis.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      desc: 'Sum of order balances',
      icon: TrendingUp,
      color: 'text-blue-500'
    });
  }
  if (kpiData?.kpis?.orders !== undefined) {
    kpisList.push({
      label: 'Orders Count',
      value: kpiData.kpis.orders.toLocaleString(),
      desc: 'Total rows in orders table',
      icon: ShoppingCart,
      color: 'text-indigo-500'
    });
  }
  if (kpiData?.kpis?.customers !== undefined) {
    kpisList.push({
      label: 'Customers Count',
      value: kpiData.kpis.customers.toLocaleString(),
      desc: 'Total rows in customers table',
      icon: Users,
      color: 'text-emerald-500'
    });
  }

  // HR metrics
  if (kpiData?.kpis?.employees !== undefined) {
    kpisList.push({
      label: 'Total Headcount',
      value: kpiData.kpis.employees.toLocaleString(),
      desc: 'Active company employees',
      icon: Users,
      color: 'text-blue-500'
    });
  }
  if (kpiData?.kpis?.payroll !== undefined) {
    kpisList.push({
      label: 'Total Payroll Expenses',
      value: `₹${kpiData.kpis.payroll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      desc: 'Sum of employee salaries',
      icon: TrendingUp,
      color: 'text-indigo-500'
    });
  }
  if (kpiData?.kpis?.avg_salary !== undefined) {
    kpisList.push({
      label: 'Average Employee Salary',
      value: `₹${kpiData.kpis.avg_salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      desc: 'Mean compensation rate',
      icon: TrendingUp,
      color: 'text-emerald-500'
    });
  }
  if (kpiData?.kpis?.departments !== undefined) {
    kpisList.push({
      label: 'Active Departments',
      value: kpiData.kpis.departments.toLocaleString(),
      desc: 'Count of department groups',
      icon: Layers,
      color: 'text-purple-500'
    });
  }

  // E-commerce chart data
  const prodQty = chartData?.charts?.product_quantity || [];
  const prodRev = chartData?.charts?.product_revenue || [];
  const citySpread = chartData?.charts?.customers_by_city || [];

  const maxQty = prodQty.length > 0 ? Math.max(...prodQty.map(p => p.total_qty)) : 0;
  const totalRevenue = prodRev.reduce((acc, curr) => acc + curr.revenue, 0);
  const maxCityCount = citySpread.length > 0 ? Math.max(...citySpread.map(c => c.count)) : 0;

  // HR chart data
  const salaryByDept = chartData?.charts?.salary_by_department || [];
  const employeesByDept = chartData?.charts?.employees_by_department || [];
  const employeesByJob = chartData?.charts?.employees_by_job || [];

  const maxSalaryDept = salaryByDept.length > 0 ? Math.max(...salaryByDept.map(s => s.avg_salary)) : 0;
  const maxEmpDept = employeesByDept.length > 0 ? Math.max(...employeesByDept.map(e => e.count)) : 0;
  const maxEmpJob = employeesByJob.length > 0 ? Math.max(...employeesByJob.map(j => j.count)) : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Executive Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time analytics and visualizations generated from the active database.
            </p>
          </div>

          {/* Real KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpisList.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <PremiumCard key={idx} className="p-6 relative overflow-hidden group hover:border-blue-500/40 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {kpi.label}
                    </span>
                    <div className={`p-2 rounded-lg bg-secondary ${kpi.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold tracking-tight mb-2">
                    {kpi.value}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {kpi.desc}
                  </p>
                </PremiumCard>
              );
            })}
          </div>

          {/* Real Visual Charts Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* --- E-COMMERCE CHARTS --- */}
            {/* 1. Product Quantity Breakdown */}
            {prodQty.length > 0 && (
              <PremiumCard className="p-6 border-border/40">
                <div className="flex items-center gap-2 mb-6 border-b border-border/20 pb-3">
                  <BarChart3 className="h-4.5 w-4.5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Top Products by Quantities Sold</h3>
                </div>
                <div className="space-y-4">
                  {prodQty.map((item, idx) => {
                    const pct = maxQty > 0 ? (item.total_qty / maxQty) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground">{item.product}</span>
                          <span className="text-muted-foreground font-mono">{item.total_qty} units</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PremiumCard>
            )}

            {/* 2. Product Revenue Share */}
            {prodRev.length > 0 && (
              <PremiumCard className="p-6 border-border/40">
                <div className="flex items-center gap-2 mb-6 border-b border-border/20 pb-3">
                  <PieChart className="h-4.5 w-4.5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Revenue Split by Product</h3>
                </div>
                <div className="space-y-4">
                  {prodRev.map((item, idx) => {
                    const pct = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground">{item.product}</span>
                          <span className="text-muted-foreground font-mono">
                            ₹{item.revenue.toLocaleString()} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PremiumCard>
            )}

            {/* 3. Customer Spread by City */}
            {citySpread.length > 0 && (
              <PremiumCard className="p-6 border-border/40 md:col-span-2">
                <div className="flex items-center gap-2 mb-6 border-b border-border/20 pb-3">
                  <MapPin className="h-4.5 w-4.5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Shopper Demographics by City</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {citySpread.map((item, idx) => {
                    const pct = maxCityCount > 0 ? (item.count / maxCityCount) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground">{item.city || 'Unknown'}</span>
                          <span className="text-muted-foreground font-mono">{item.count} shopper(s)</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PremiumCard>
            )}


            {/* --- HR CHARTS --- */}
            {/* 4. Headcount by Department */}
            {employeesByDept.length > 0 && (
              <PremiumCard className="p-6 border-border/40">
                <div className="flex items-center gap-2 mb-6 border-b border-border/20 pb-3">
                  <Users className="h-4.5 w-4.5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Headcount by Department</h3>
                </div>
                <div className="space-y-4">
                  {employeesByDept.map((item, idx) => {
                    const pct = maxEmpDept > 0 ? (item.count / maxEmpDept) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground">{item.department_name || 'Unassigned'}</span>
                          <span className="text-muted-foreground font-mono">{item.count} staff</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PremiumCard>
            )}

            {/* 5. Average Salary by Department */}
            {salaryByDept.length > 0 && (
              <PremiumCard className="p-6 border-border/40">
                <div className="flex items-center gap-2 mb-6 border-b border-border/20 pb-3">
                  <TrendingUp className="h-4.5 w-4.5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Average Salary by Department</h3>
                </div>
                <div className="space-y-4">
                  {salaryByDept.map((item, idx) => {
                    const pct = maxSalaryDept > 0 ? (item.avg_salary / maxSalaryDept) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground">{item.department_name || 'Unassigned'}</span>
                          <span className="text-muted-foreground font-mono">
                            ₹{item.avg_salary.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PremiumCard>
            )}

            {/* 6. Employees by Job Title */}
            {employeesByJob.length > 0 && (
              <PremiumCard className="p-6 border-border/40 md:col-span-2">
                <div className="flex items-center gap-2 mb-6 border-b border-border/20 pb-3">
                  <Briefcase className="h-4.5 w-4.5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Headcount distribution by Job Title</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {employeesByJob.map((item, idx) => {
                    const pct = maxEmpJob > 0 ? (item.count / maxEmpJob) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground">{item.job_title}</span>
                          <span className="text-muted-foreground font-mono">{item.count} staff</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PremiumCard>
            )}

          </div>

          <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              These charts and KPIs represent actual aggregates compiled in real-time from your active database workspace. No mock data is utilized.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
