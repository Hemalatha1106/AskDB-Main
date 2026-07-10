'use client';
import { API_BASE_URL } from '@/lib/api-config';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Search,
  Plug,
  Calendar,
  Trash2,
  Database,
  ArrowRight,
  ArrowLeft,
  MoveUp,
  MoveDown,
  Mail,
  Send,
  Download,
  RefreshCw,
  Sparkles,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Paperclip,
  CheckSquare,
  Square,
  Lock,
  Loader2
} from 'lucide-react';

interface SavedReport {
  id: string;
  title: string;
  query: string;
  answer: string;
  plot: string | null;
  sql_query: string | null;
  created_at: string;
}

interface ArrangeSection {
  report_id: string;
  title: string;
  notes: string;
  originalReport: SavedReport;
}

interface CompiledReport {
  id: string;
  title: string;
  selected_report_ids: string;
  sections_data: string;
  executive_summary: string;
  overall_findings: string;
  recommendations: string;
  export_format: string;
  sender: string;
  recipients: string;
  cc: string;
  bcc: string;
  subject: string;
  email_body: string;
  delivery_status: string;
  delivery_timestamp: string | null;
  error_message: string | null;
  created_at: string;
}

export default function ShipReportsPage() {
  const router = useRouter();
  
  // Navigation & View states
  const [activeTab, setActiveTab] = useState<'wizard' | 'history'>('wizard');
  const [wizardStep, setWizardStep] = useState<number>(1);
  
  // Data loading states
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [history, setHistory] = useState<CompiledReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; email?: string }>({ connected: false });
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Step 1: Selection State
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  
  // Step 2: Arrange Order State
  const [arrangedSections, setArrangedSections] = useState<ArrangeSection[]>([]);
  
  // Step 3: Combined Report Preview State
  const [reportTitle, setReportTitle] = useState<string>('Executive Database Analysis Report');
  const [compilationLoading, setCompilationLoading] = useState<boolean>(false);
  const [compiledData, setCompiledData] = useState<any | null>(null);
  const [showSqlSections, setShowSqlSections] = useState<{ [key: string]: boolean }>({});
  
  // Step 4: Email Composer State
  const [emailTo, setEmailTo] = useState<string>('');
  const [emailCc, setEmailCc] = useState<string>('');
  const [emailBcc, setEmailBcc] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'PDF' | 'DOCX' | 'Markdown'>('PDF');
  const [emailGenerating, setEmailGenerating] = useState<boolean>(false);
  
  // Step 5: Send & Delivery State
  const [sendingState, setSendingState] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [sendErrorMessage, setSendErrorMessage] = useState<string>('');
  const [deliveryDetails, setDeliveryDetails] = useState<{ compiled_id?: string; timestamp?: string }>({});
  
  // History Expansion states
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Check DB connect status
      const connRes = await fetch(`${API_BASE_URL}/api/database/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (connRes.ok) {
        const connData = await connRes.json();
        setIsConnected(connData.connected);
      }
      
      // 2. Fetch saved reports
      const reportsRes = await fetch(`${API_BASE_URL}/api/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        if (data.success) {
          setReports(data.reports);
        }
      }
      
      // 3. Fetch Gmail OAuth status
      const gmailRes = await fetch(`${API_BASE_URL}/api/reports/gmail/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (gmailRes.ok) {
        const gmailData = await gmailRes.json();
        if (gmailData.success) {
          setGmailStatus({ connected: gmailData.connected, email: gmailData.email });
        }
      }

      // 4. Fetch Shipment History
      const historyRes = await fetch(`${API_BASE_URL}/api/reports/compiled`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (historyRes.ok) {
        const histData = await historyRes.json();
        if (histData.success) {
          setHistory(histData.compiled_reports);
        }
      }
      
    } catch (e) {
      console.error('Failed to load ship reports data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  // Google OAuth flow for linking account
  const handleConnectGmail = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    // Redirect to backend auth trigger, passing user token to link accounts dynamically
    window.location.href = `${API_BASE_URL}/api/auth/google/login?token=${token}`;
  };

  // Disconnect Google Mailbox
  const handleDisconnectGmail = async () => {
    if (!confirm('Are you sure you want to disconnect your Gmail account? You won\'t be able to ship reports from your own mailbox.')) {
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
      setDisconnecting(true);
      const res = await fetch(`${API_BASE_URL}/api/reports/gmail/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setGmailStatus({ connected: false });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDisconnecting(false);
    }
  };

  // Step 1: Select Reports logic
  const handleToggleSelect = (id: string) => {
    if (selectedReportIds.includes(id)) {
      setSelectedReportIds(selectedReportIds.filter(rid => rid !== id));
    } else {
      setSelectedReportIds([...selectedReportIds, id]);
    }
  };

  const handleNextToArrange = () => {
    // Populate arranged sections based on selections
    const selected = selectedReportIds.map(rid => {
      const rep = reports.find(r => r.id === rid)!;
      return {
        report_id: rid,
        title: rep.title,
        notes: '',
        originalReport: rep
      };
    });
    setArrangedSections(selected);
    setWizardStep(2);
  };

  // Step 2: Arrange order operations
  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === arrangedSections.length - 1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const items = [...arrangedSections];
    const temp = items[index];
    items[index] = items[newIndex];
    items[newIndex] = temp;
    
    setArrangedSections(items);
  };

  const removeSection = (id: string) => {
    const updated = arrangedSections.filter(sec => sec.report_id !== id);
    setArrangedSections(updated);
    setSelectedReportIds(selectedReportIds.filter(rid => rid !== id));
  };

  const updateSectionTitle = (id: string, newTitle: string) => {
    setArrangedSections(arrangedSections.map(sec => 
      sec.report_id === id ? { ...sec, title: newTitle } : sec
    ));
  };

  const updateSectionNotes = (id: string, newNotes: string) => {
    setArrangedSections(arrangedSections.map(sec => 
      sec.report_id === id ? { ...sec, notes: newNotes } : sec
    ));
  };

  // Step 3: Compilation and AI Summary generation
  const handleGenerateReport = async () => {
    setWizardStep(3);
    setCompilationLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
      const reqBody = {
        title: reportTitle,
        reportIds: arrangedSections.map(s => s.report_id),
        sections_data: arrangedSections.map(s => ({
          report_id: s.report_id,
          title: s.title,
          notes: s.notes
        }))
      };
      
      const res = await fetch(`${API_BASE_URL}/api/reports/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reqBody)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCompiledData(data.compiled_report);
          // Set default email subject based on report title
          setEmailSubject(`Data Insight Report: ${reportTitle}`);
        } else {
          alert('Failed to compile report.');
        }
      } else {
        alert('Server error compiling report.');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to compile endpoint.');
    } finally {
      setCompilationLoading(false);
    }
  };

  // Step 4: AI Professional Email Draft Writer
  const handleGenerateAiEmail = async () => {
    if (!emailTo) {
      alert('Please fill in the recipient ("To" address) first, so AI can write a contextual greeting.');
      return;
    }
    
    setEmailGenerating(true);
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
      const reqBody = {
        recipient: emailTo,
        reportTitle: reportTitle,
        selectedReports: arrangedSections.map(s => ({
          title: s.title,
          preview: s.originalReport.answer.substring(0, 100) + '...'
        })),
        findings: compiledData?.overall_findings || ''
      };
      
      const res = await fetch(`${API_BASE_URL}/api/reports/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reqBody)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEmailBody(data.email_body);
        }
      } else {
        alert('Failed to generate email content.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEmailGenerating(false);
    }
  };

  // Step 5: Send Compiled Report
  const handleSendReport = async () => {
    if (!emailTo) {
      alert('Recipient is required.');
      return;
    }
    if (!emailSubject) {
      alert('Subject is required.');
      return;
    }
    
    setWizardStep(5);
    setSendingState('sending');
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
      const ccList = emailCc.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const bccList = emailBcc.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const recipientsList = emailTo.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      const reqBody = {
        compiledReportId: compiledData.id,
        recipients: recipientsList,
        cc: ccList.length > 0 ? ccList : null,
        bcc: bccList.length > 0 ? bccList : null,
        subject: emailSubject,
        body: emailBody,
        format: exportFormat
      };
      
      const res = await fetch(`${API_BASE_URL}/api/reports/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reqBody)
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setSendingState('success');
        setDeliveryDetails({
          compiled_id: data.compiled_id,
          timestamp: new Date().toLocaleTimeString()
        });
        // Refresh history log
        fetchData();
      } else {
        setSendingState('failed');
        setSendErrorMessage(data.detail || 'Email delivery failed. Please verify credentials or settings.');
      }
    } catch (e: any) {
      setSendingState('failed');
      setSendErrorMessage(e.message || 'Connection error during email delivery.');
    }
  };

  // Retry failed email from history log
  const handleRetryHistory = async (reportId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    // Set view to wizard to show status step
    setActiveTab('wizard');
    setWizardStep(5);
    setSendingState('sending');
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/compiled/${reportId}/retry`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSendingState('success');
        setDeliveryDetails({
          compiled_id: reportId,
          timestamp: new Date().toLocaleTimeString()
        });
        fetchData();
      } else {
        setSendingState('failed');
        setSendErrorMessage(data.detail || 'Failed to retry sending this report.');
      }
    } catch (e: any) {
      setSendingState('failed');
      setSendErrorMessage(e.message || 'Connection error during retry.');
    }
  };

  // Reopen past compiled report as draft
  const handleReopenDraft = async (report: CompiledReport) => {
    setActiveTab('wizard');
    setWizardStep(3);
    setReportTitle(report.title);
    setCompiledData(report);
    
    // Reconstruct sections mapping
    const reportIds = report.selected_report_ids ? JSON.parse(report.selected_report_ids) : [];
    const sectionsData = report.sections_data ? JSON.parse(report.sections_data) : [];
    
    const selected = sectionsData.map((s: any) => {
      const original = reports.find(r => r.id === s.report_id);
      return {
        report_id: s.report_id,
        title: s.title,
        notes: s.notes,
        originalReport: original || {
          id: s.report_id,
          title: s.title,
          query: 'Query details unavailable',
          answer: 'Answer details unavailable',
          plot: null,
          sql_query: null,
          created_at: ''
        }
      };
    });
    
    setArrangedSections(selected);
    setSelectedReportIds(reportIds);
    
    // Pre-populate email fields
    setEmailTo(report.recipients || '');
    setEmailCc(report.cc || '');
    setEmailBcc(report.bcc || '');
    setEmailSubject(report.subject || '');
    setEmailBody(report.email_body || '');
    setExportFormat(report.export_format as any || 'PDF');
  };

  const filteredReports = reports.filter(report => {
    const term = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(term) ||
      report.query.toLowerCase().includes(term) ||
      report.answer.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground animate-pulse text-sm">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading Shipping Module...
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-8">
        <div className="max-w-md w-full border border-dashed border-border/60 rounded-2xl bg-card/25 p-8 py-16 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-secondary rounded-full text-muted-foreground mb-4">
            <Plug className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-2">No Database Connected</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6 whitespace-pre-line leading-relaxed">
            Please connect a database to build reports from saved query insights.
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
          
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Ship Reports</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Compile multiple saved query summaries into structured documents, customize sections, and mail them via Gmail OAuth.
              </p>
            </div>
            
            {/* View Switching Tab */}
            <div className="flex bg-secondary/80 p-1.5 rounded-xl border border-border/60 self-start sm:self-center">
              <button
                onClick={() => setActiveTab('wizard')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'wizard'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                New Shipment
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'history'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Shipment History ({history.length})
              </button>
            </div>
          </div>

          {activeTab === 'wizard' ? (
            <div className="space-y-6">
              
              {/* Steps Progress Indicator */}
              <div className="flex items-center justify-between max-w-3xl mx-auto py-2">
                {[
                  { step: 1, label: 'Select' },
                  { step: 2, label: 'Arrange' },
                  { step: 3, label: 'AI summary' },
                  { step: 4, label: 'Mail' },
                  { step: 5, label: 'Status' }
                ].map((s) => (
                  <div key={s.step} className="flex items-center flex-1 last:flex-initial">
                    <div className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        wizardStep === s.step
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
                          : wizardStep > s.step
                          ? 'bg-primary/20 text-primary'
                          : 'bg-secondary text-muted-foreground'
                      }`}>
                        {wizardStep > s.step ? <Check className="h-4 w-4" /> : s.step}
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-2">{s.label}</span>
                    </div>
                    {s.step < 5 && (
                      <div className={`h-0.5 flex-1 mx-2 -mt-4 transition-colors ${
                        wizardStep > s.step ? 'bg-primary/60' : 'bg-border/60'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Wizard Content Blocks */}

              {/* STEP 1: Select Reports */}
              {wizardStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Choose reports to include in the combined shipment. Click cards to select.
                    </div>
                    
                    {/* Search box inside step */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Filter reports..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  {filteredReports.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/25 text-muted-foreground max-w-md mx-auto">
                      <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <h4 className="font-bold text-sm text-foreground mb-1">No Saved Reports Available</h4>
                      <p className="text-xs text-muted-foreground/80 leading-relaxed mb-4">
                        Please query your database in chat and click "Save" to populate templates.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredReports.map((report) => {
                        const isSel = selectedReportIds.includes(report.id);
                        return (
                          <PremiumCard
                            key={report.id}
                            onClick={() => handleToggleSelect(report.id)}
                            className={`p-6 flex flex-col cursor-pointer border transition-all duration-300 ${
                              isSel
                                ? 'border-primary ring-2 ring-primary/10 bg-primary/5'
                                : 'border-border/40 hover:border-primary/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isSel ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                  <FileText className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-sm text-foreground leading-snug">{report.title}</h3>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                    <Calendar className="h-3 w-3" />
                                    <span>{report.created_at}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 pt-0.5">
                                {isSel ? (
                                  <CheckSquare className="h-5 w-5 text-primary" />
                                ) : (
                                  <Square className="h-5 w-5 text-muted-foreground/40" />
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 flex-1 flex flex-col justify-between">
                              <div className="bg-secondary/40 border border-border/20 rounded-lg p-2.5">
                                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">Question</span>
                                <p className="text-xs text-foreground font-medium truncate">{report.query}</p>
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {report.answer}
                              </div>
                            </div>
                          </PremiumCard>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions footer */}
                  <div className="flex justify-end pt-4">
                    <Button
                      size="lg"
                      onClick={handleNextToArrange}
                      disabled={selectedReportIds.length === 0}
                      className="gap-2"
                    >
                      Next: Arrange Sections
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: Arrange order & Edit metadata */}
              {wizardStep === 2 && (
                <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Arrange Report Structure</h3>
                    <p className="text-xs text-muted-foreground">
                      Set section titles, drag or sort their positions, and add optional inline notes.
                    </p>
                  </div>

                  {/* Report Title field */}
                  <div className="bg-card border border-border/40 rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Document Title</label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    {arrangedSections.map((sec, idx) => (
                      <div key={sec.report_id} className="bg-card border border-border/60 hover:border-border rounded-xl p-5 flex flex-col gap-4 shadow-sm transition-all">
                        <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-secondary px-2.5 py-1 rounded text-muted-foreground">{idx + 1}</span>
                            <div className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded font-bold">
                              Saved response
                            </div>
                          </div>
                          
                          {/* Arrange Operations */}
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => moveSection(idx, 'up')}
                              disabled={idx === 0}
                              className="h-7 w-7 rounded-lg text-muted-foreground disabled:opacity-30"
                            >
                              <MoveUp className="h-4.5 w-4.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => moveSection(idx, 'down')}
                              disabled={idx === arrangedSections.length - 1}
                              className="h-7 w-7 rounded-lg text-muted-foreground disabled:opacity-30"
                            >
                              <MoveDown className="h-4.5 w-4.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeSection(sec.report_id)}
                              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Title input & Preview details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Section Title</label>
                            <input
                              type="text"
                              value={sec.title}
                              onChange={(e) => updateSectionTitle(sec.report_id, e.target.value)}
                              className="w-full p-2 rounded-lg border border-border bg-secondary/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
                            />
                          </div>

                          <div className="bg-secondary/20 border border-border/20 rounded-lg p-2.5 text-xs">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Question Preview</span>
                            <span className="text-foreground italic font-medium line-clamp-1">{sec.originalReport.query}</span>
                          </div>
                        </div>

                        {/* Notes insertion */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Add Section Notes / Key Insights (Optional)</label>
                          <textarea
                            rows={2}
                            placeholder="Add brief commentary or takeaways for this section. These will appear inside the generated document section..."
                            value={sec.notes}
                            onChange={(e) => updateSectionNotes(sec.report_id, e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-border bg-secondary/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none transition-all placeholder:text-muted-foreground/60"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <Button
                      variant="ghost"
                      onClick={() => setWizardStep(1)}
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4.5 w-4.5" />
                      Back to Selection
                    </Button>
                    <Button
                      onClick={handleGenerateReport}
                      className="gap-2"
                      disabled={arrangedSections.length === 0}
                    >
                      Next: Generate Combined Report
                      <ArrowRight className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: Generate & Preview Combined Report */}
              {wizardStep === 3 && (
                <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
                  {compilationLoading ? (
                    <div className="border border-border/40 rounded-2xl bg-card p-12 py-24 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="relative h-14 w-14 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <Sparkles className="h-5 w-5 text-primary absolute animate-bounce" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-foreground">AI is Building Your Combined Report</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                          Please wait. The AI is reading selected insights, drafting executive summaries, and organizing recommendations...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-foreground">Combined Report Preview</h3>
                        <div className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded font-bold border border-primary/20">
                          Draft Stored
                        </div>
                      </div>

                      {/* Clean Report Document Mock Preview */}
                      <div className="border border-border/80 rounded-2xl bg-card shadow-sm p-8 md:p-12 space-y-8 max-h-[600px] overflow-y-auto font-sans scrollbar-thin">
                        <div className="text-center border-b border-border/60 pb-8 space-y-2">
                          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{reportTitle}</h1>
                          <div className="flex justify-center gap-6 text-xs text-muted-foreground italic">
                            <span><b>Date:</b> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <span>|</span>
                            <span><b>Prepared by:</b> AskDB</span>
                          </div>
                        </div>

                        {/* Executive Summary */}
                        <div className="space-y-3">
                          <h2 className="text-lg font-bold text-primary pb-1.5 border-b border-border/20">Executive Summary</h2>
                          <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">{compiledData?.executive_summary}</p>
                        </div>

                        {/* Report Sections */}
                        <div className="space-y-6">
                          <h2 className="text-lg font-bold text-primary pb-1.5 border-b border-border/20">Report Sections</h2>
                          {arrangedSections.map((sec, idx) => {
                            const showSql = showSqlSections[sec.report_id] || false;
                            return (
                              <div key={sec.report_id} className="space-y-4 pt-1">
                                <h3 className="text-sm font-bold text-foreground">{idx + 1}. {sec.title}</h3>
                                
                                {/* Question quote */}
                                <div className="bg-secondary/30 border-l-4 border-muted p-3.5 rounded-r-xl">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Original Query</span>
                                  <p className="text-xs text-foreground italic font-medium">"{sec.originalReport.query}"</p>
                                </div>

                                {/* Answer summary */}
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Analysis summary</span>
                                  <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">{sec.originalReport.answer}</p>
                                </div>

                                {/* SQL Toggle */}
                                {sec.originalReport.sql_query && (
                                  <div className="space-y-2">
                                    <button
                                      onClick={() => setShowSqlSections({ ...showSqlSections, [sec.report_id]: !showSql })}
                                      className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary font-bold transition-all"
                                    >
                                      <span>{showSql ? 'Hide SQL Query' : 'Show SQL Query'}</span>
                                      {showSql ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                    </button>
                                    
                                    {showSql && (
                                      <pre className="p-3 bg-muted border border-border/60 rounded-xl font-mono text-[11px] text-secondary-foreground overflow-x-auto whitespace-pre">
                                        {sec.originalReport.sql_query}
                                      </pre>
                                    )}
                                  </div>
                                )}

                                {/* Plot chart */}
                                {sec.originalReport.plot && (
                                  <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Visual Insight</span>
                                    <div className="rounded-xl overflow-hidden border border-border bg-card max-w-lg mx-auto">
                                      <img
                                        src={`data:image/png;base64,${sec.originalReport.plot}`}
                                        alt={sec.title}
                                        className="w-full object-contain max-h-48"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Commentary notes */}
                                {sec.notes && (
                                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-0.5">Section Commentary</span>
                                    <p className="text-xs text-foreground italic">{sec.notes}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Overall Findings */}
                        <div className="space-y-3">
                          <h2 className="text-lg font-bold text-primary pb-1.5 border-b border-border/20">Overall Findings</h2>
                          <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">{compiledData?.overall_findings}</p>
                        </div>

                        {/* Recommendations */}
                        <div className="space-y-3">
                          <h2 className="text-lg font-bold text-primary pb-1.5 border-b border-border/20">Recommendations</h2>
                          <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">{compiledData?.recommendations}</p>
                        </div>
                      </div>

                      {/* Actions footer */}
                      <div className="flex items-center justify-between pt-4">
                        <Button
                          variant="ghost"
                          onClick={() => setWizardStep(2)}
                          className="gap-2"
                        >
                          <ArrowLeft className="h-4.5 w-4.5" />
                          Back to Arrange
                        </Button>
                        <Button
                          onClick={() => setWizardStep(4)}
                          className="gap-2"
                        >
                          Next: Compose Email
                          <ArrowRight className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Compose Email & Export */}
              {wizardStep === 4 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                  
                  {/* Left Column: Email Form */}
                  <div className="lg:col-span-2 space-y-5 bg-card border border-border/40 rounded-2xl p-6 shadow-sm">
                    <div>
                      <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Compose Email Message
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Customize recipients, subject, body, and export options before sending.
                      </p>
                    </div>

                    <div className="space-y-4">
                      
                      {/* Recipients To */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">To (Recipients)</label>
                        <input
                          type="email"
                          placeholder="recipient@example.com (comma separated)"
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-border bg-secondary/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>

                      {/* CC & BCC toggles */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Cc (Optional)</label>
                          <input
                            type="text"
                            placeholder="cc@example.com"
                            value={emailCc}
                            onChange={(e) => setEmailCc(e.target.value)}
                            className="w-full p-2 rounded-lg border border-border bg-secondary/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Bcc (Optional)</label>
                          <input
                            type="text"
                            placeholder="bcc@example.com"
                            value={emailBcc}
                            onChange={(e) => setEmailBcc(e.target.value)}
                            className="w-full p-2 rounded-lg border border-border bg-secondary/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          />
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Subject</label>
                        <input
                          type="text"
                          placeholder="Enter email subject"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-border bg-secondary/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>

                      {/* Body Message */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Body Message</label>
                          
                          {/* AI Assistant copywriter button */}
                          <button
                            type="button"
                            onClick={handleGenerateAiEmail}
                            disabled={emailGenerating}
                            className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold border border-primary/20 hover:bg-primary/25 disabled:opacity-40 transition-colors"
                          >
                            {emailGenerating ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Drafting...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3" />
                                <span>Generate Professional Email</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        <textarea
                          rows={6}
                          placeholder="Write email contents or click 'Generate Professional Email' to let AI write a polished copy..."
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          className="w-full p-3 rounded-lg border border-border bg-secondary/20 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Export, Attachments and Sender status */}
                  <div className="space-y-6">
                    
                    {/* Mailbox Connection Details */}
                    <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Sender mailbox</span>
                      
                      {gmailStatus.connected ? (
                        <div className="space-y-3">
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <div className="truncate">
                                <span className="text-xs font-bold text-foreground block">Gmail OAuth Connected</span>
                                <span className="text-[10px] text-muted-foreground">{gmailStatus.email}</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={handleDisconnectGmail}
                            disabled={disconnecting}
                            className="text-[10px] text-muted-foreground hover:text-destructive hover:underline font-semibold block"
                          >
                            Disconnect account
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2.5">
                            <Lock className="h-4.5 w-4.5 text-yellow-600 mt-0.5 shrink-0" />
                            <div className="text-[10px] text-yellow-800 dark:text-yellow-400 leading-relaxed font-medium">
                              Mailbox not linked. Emails will default to developer dry-run Mock mode (saved locally to disk).
                            </div>
                          </div>
                          <Button
                            onClick={handleConnectGmail}
                            size="sm"
                            className="w-full gap-2 text-xs"
                          >
                            <User className="h-3.5 w-3.5" />
                            Connect Gmail Account
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Export Format configuration */}
                    <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Export settings</span>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-semibold">Select Export Format</label>
                        <div className="grid grid-cols-3 bg-secondary/50 p-1 rounded-xl border border-border/40 gap-1.5">
                          {(['PDF', 'DOCX', 'Markdown'] as const).map((fmt) => (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => setExportFormat(fmt)}
                              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                exportFormat === fmt
                                  ? 'bg-card text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {fmt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Attachment chip preview */}
                    <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Attachment status</span>
                      <div className="border border-border/60 bg-secondary/20 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <Paperclip className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-foreground block truncate">
                              {reportTitle.toLowerCase().replace(/ /g, '_')}.{exportFormat === 'Markdown' ? 'md' : exportFormat.toLowerCase()}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{exportFormat} Document</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trigger Mail Sending buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={handleSendReport}
                        size="lg"
                        className="w-full gap-2 font-bold shadow-md shadow-primary/20"
                      >
                        <Send className="h-4.5 w-4.5" />
                        Send & Ship Report
                      </Button>
                      
                      <Button
                        variant="ghost"
                        onClick={() => setWizardStep(3)}
                        className="w-full text-xs"
                      >
                        Back to Preview
                      </Button>
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 5: Delivery Status Loader / Confirmation */}
              {wizardStep === 5 && (
                <div className="max-w-md mx-auto space-y-6 animate-fade-in">
                  
                  {/* Progress sending state */}
                  {sendingState === 'sending' && (
                    <div className="border border-border/40 rounded-2xl bg-card p-8 py-16 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-foreground">Delivering Analysis Report</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                          Exporting document layout, packing attachments, and uploading via Gmail API.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Success state */}
                  {sendingState === 'success' && (
                    <div className="border border-border/40 rounded-2xl bg-card p-8 py-12 flex flex-col items-center justify-center text-center space-y-5 shadow-sm">
                      <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center animate-bounce">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-foreground">Report Sent Successfully!</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Your email message and the compiled {exportFormat} file was delivered. A delivery log has been saved.
                        </p>
                      </div>

                      {/* Log details */}
                      <div className="w-full bg-secondary/30 border border-border/40 rounded-xl p-3.5 text-left space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Shipment ID:</span>
                          <span className="font-mono text-foreground font-bold truncate max-w-[180px]">{deliveryDetails.compiled_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Timestamp:</span>
                          <span className="text-foreground font-bold">{deliveryDetails.timestamp}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Recipient Address:</span>
                          <span className="text-foreground font-bold truncate max-w-[180px]">{emailTo}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 w-full">
                        <Button
                          variant="secondary"
                          className="flex-1 text-xs"
                          onClick={() => {
                            setActiveTab('history');
                            setWizardStep(1);
                          }}
                        >
                          View Shipment Log
                        </Button>
                        
                        <Button
                          className="flex-1 text-xs"
                          onClick={() => {
                            // Reset selections and return to step 1
                            setSelectedReportIds([]);
                            setEmailTo('');
                            setEmailCc('');
                            setEmailBcc('');
                            setEmailBody('');
                            setWizardStep(1);
                          }}
                        >
                          Start New shipment
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Failed state */}
                  {sendingState === 'failed' && (
                    <div className="border border-border/40 rounded-2xl bg-card p-8 py-12 flex flex-col items-center justify-center text-center space-y-5 shadow-sm">
                      <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8" />
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-foreground">Delivery Failed</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          AskDB encountered an error while attempting to upload and send your message.
                        </p>
                      </div>

                      {/* Error details */}
                      <div className="w-full bg-destructive/5 border border-destructive/10 text-destructive rounded-xl p-3 text-left text-xs leading-relaxed max-h-28 overflow-y-auto scrollbar-thin">
                        <span className="font-bold text-[10px] uppercase tracking-wider block mb-0.5">Error logs</span>
                        <pre className="font-mono text-[10.5px] whitespace-pre-wrap">{sendErrorMessage}</pre>
                      </div>

                      <div className="flex gap-3 w-full">
                        <Button
                          variant="ghost"
                          className="flex-1 text-xs"
                          onClick={() => setWizardStep(4)}
                        >
                          Back to Composer
                        </Button>
                        
                        <Button
                          className="flex-1 text-xs gap-1.5"
                          onClick={handleSendReport}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Retry Sending
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          ) : (
            
            // VIEW: Shipment History list
            <div className="space-y-6 animate-fade-in">
              <div className="text-sm text-muted-foreground">
                Review and monitor previous compiled report shipments and execution statuses.
              </div>

              {history.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/25 text-muted-foreground max-w-md mx-auto">
                  <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <h4 className="font-bold text-sm text-foreground mb-1">No Shipment History</h4>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">
                    You haven't compiled or shipped any combined report campaigns yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => {
                    const isExp = expandedHistoryId === item.id;
                    const statusLower = item.delivery_status.toLowerCase();
                    const statusColors = 
                      statusLower === 'sent'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : statusLower === 'failed'
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : statusLower === 'sending'
                        ? 'bg-primary/10 text-primary border-primary/20 animate-pulse'
                        : 'bg-muted text-muted-foreground border-border';
                        
                    return (
                      <div
                        key={item.id}
                        className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-border/80"
                      >
                        {/* Summary Bar */}
                        <div
                          className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                          onClick={() => setExpandedHistoryId(isExp ? null : item.id)}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-foreground truncate">{item.title}</h3>
                              <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1 shrink-0">
                                  <Clock className="h-3 w-3" />
                                  {item.created_at}
                                </span>
                                <span>•</span>
                                <span className="truncate"><b>Recipients:</b> {item.recipients || 'Draft'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                            <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full ${statusColors}`}>
                              {item.delivery_status}
                            </span>
                            
                            <span className="text-[10px] bg-secondary font-bold border border-border/60 px-2 py-0.5 rounded text-muted-foreground font-mono">
                              {item.export_format || 'PDF'}
                            </span>
                            
                            {isExp ? <ChevronUp className="h-4.5 w-4.5 text-muted-foreground" /> : <ChevronDown className="h-4.5 w-4.5 text-muted-foreground" />}
                          </div>
                        </div>

                        {/* Expanded details dropdown panel */}
                        {isExp && (
                          <div className="border-t border-border/30 bg-secondary/10 p-6 space-y-5 animate-slide-down">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="md:col-span-2 space-y-3.5">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Executive Summary snapshot</span>
                                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.executive_summary}</p>
                                </div>
                                
                                {item.email_body && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Email message content</span>
                                    <p className="text-xs text-muted-foreground italic bg-card p-3 border border-border/30 rounded-xl leading-relaxed whitespace-pre-wrap">{item.email_body}</p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-2 bg-card border border-border/40 rounded-xl p-4 text-xs">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block border-b border-border/20 pb-1.5 mb-1.5">Delivery Audit</span>
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Sender:</span>
                                      <span className="font-bold truncate max-w-[120px]">{item.sender || 'System'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Delivered:</span>
                                      <span className="font-bold">{item.delivery_timestamp || 'N/A'}</span>
                                    </div>
                                    {item.cc && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Cc:</span>
                                        <span className="font-bold truncate max-w-[120px]">{item.cc}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {item.error_message && (
                                  <div className="bg-destructive/5 border border-destructive/10 text-destructive rounded-xl p-3 text-xs">
                                    <span className="font-bold text-[9px] uppercase tracking-wider block mb-1">Execution Error Log</span>
                                    <p className="font-mono text-[10px] leading-relaxed">{item.error_message}</p>
                                  </div>
                                )}

                                {/* Controls */}
                                <div className="flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleReopenDraft(item)}
                                    className="w-full text-xs gap-1.5"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Reopen & Edit Draft
                                  </Button>
                                  
                                  {statusLower === 'failed' && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleRetryHistory(item.id)}
                                      className="w-full text-xs gap-1.5 text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20"
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                      Retry Sending Email
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
