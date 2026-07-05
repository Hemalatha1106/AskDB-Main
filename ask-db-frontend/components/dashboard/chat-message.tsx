'use client';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState } from 'react';
import {
  Copy,
  RefreshCcw,
  ThumbsUp,
  ThumbsDown,
  FileSpreadsheet,
  FileDown,
  Bookmark,
  Code,
  Info,
  Sparkles
} from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  plot?: string;
  timestamp?: string;
  messageId?: string;
}

export function ChatMessage({ role, content, sql, plot, timestamp, messageId }: ChatMessageProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState('');

  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-md lg:max-w-xl rounded-2xl rounded-tr-none bg-primary text-primary-foreground px-4 py-3 shadow-sm">
          <p className="text-sm">{content}</p>
        </div>
      </div>
    );
  }

  const handleExplainSQL = () => {
    if (showExplanation) {
      setShowExplanation(false);
      return;
    }
    setExplaining(true);
    setTimeout(() => {
      setExplanation(
        `• SELECT extracts target dimension metrics (e.g., aggregate revenue metrics).\n` +
        `• JOIN connects primary schema tables based on matching foreign keys.\n` +
        `• GROUP BY bundles rows by attributes to calculate correct sums.\n` +
        `• ORDER BY and LIMIT sort and filter the final dataset for peak values.`
      );
      setExplaining(false);
      setShowExplanation(true);
    }, 300);
  };

  const handleExportCSV = () => {
    alert("Exporting query results as CSV dataset...");
  };

  const handleExportPDF = () => {
    alert("Generating premium analytics PDF report...");
  };

  const handleSaveReport = async () => {
    if (!messageId) {
      alert("Error: Message ID is missing.");
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert("Error: You must be logged in to save reports.");
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message_id: messageId }),
      });
      if (response.ok) {
        alert("Successfully saved this query analysis to Saved Reports!");
      } else {
        const errData = await response.json();
        alert(`Failed to save report: ${errData.detail || "Server error"}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error saving report: ${e.message}`);
    }
  };

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-md lg:max-w-2xl w-full">
        <PremiumCard className="p-5 border-border/40">
          {/* Main Answer */}
          <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">{content}</p>
          
          {/* SQL Code Block */}
          {sql && (
            <div className="mt-4 mb-4 p-3.5 bg-muted rounded-xl border border-border/60 overflow-x-auto">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/40">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Generated SQL Query</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono font-medium">SQL</span>
              </div>
              <pre className="font-mono text-xs text-foreground/90 whitespace-pre">
                <code>{sql}</code>
              </pre>
            </div>
          )}

          {/* Collapsible SQL Explanation */}
          {showExplanation && (
            <div className="mt-2 mb-4 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-1.5 text-blue-500 font-semibold uppercase tracking-wider text-[10px] mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI SQL Explanation</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{explanation}</p>
            </div>
          )}

          {/* Visualization Image */}
          {plot && (
            <div className="mt-4 mb-4 border border-border/60 rounded-xl overflow-hidden bg-card/50 p-2.5">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                Data Visualization
              </div>
              <img 
                src={`data:image/png;base64,${plot}`} 
                alt="Query Result Visualization" 
                className="w-full h-auto object-contain max-h-[350px] rounded border border-border/40 shadow-sm"
              />
            </div>
          )}

          {/* Professional Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40">
            {/* Standard Response Controls */}
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Copy response">
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Regenerate">
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Helpful">
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Not helpful">
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Premium CSV / PDF / SQL Actions */}
            <div className="flex items-center gap-2">
              {sql && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs px-2.5 border-border/40 hover:bg-secondary/40 flex items-center gap-1.5"
                  onClick={handleExplainSQL}
                  disabled={explaining}
                >
                  <Code className="h-3.5 w-3.5 text-primary" />
                  <span>{showExplanation ? 'Hide Explanation' : 'Explain SQL'}</span>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2.5 border-border/40 hover:bg-secondary/40 flex items-center gap-1.5"
                onClick={handleExportCSV}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                <span>CSV</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2.5 border-border/40 hover:bg-secondary/40 flex items-center gap-1.5"
                onClick={handleExportPDF}
              >
                <FileDown className="h-3.5 w-3.5 text-primary" />
                <span>PDF</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2.5 border-border/40 hover:bg-secondary/40 flex items-center gap-1.5"
                onClick={handleSaveReport}
              >
                <Bookmark className="h-3.5 w-3.5 text-primary" />
                <span>Save</span>
              </Button>
            </div>
          </div>
        </PremiumCard>
        {timestamp && (
          <p className="text-xs text-muted-foreground mt-2 px-1">{timestamp}</p>
        )}
      </div>
    </div>
  );
}
