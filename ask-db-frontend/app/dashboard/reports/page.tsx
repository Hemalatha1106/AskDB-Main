'use client';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Plug
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/database/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setIsConnected(data.connected);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [router]);

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

          {/* Clean reports placeholder showing no saved elements */}
          <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/20 text-muted-foreground text-sm max-w-md mx-auto">
            <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
            <h4 className="font-bold text-sm text-foreground mb-1">No Saved Reports</h4>
            <p className="text-xs text-muted-foreground/80 leading-relaxed mb-4">
              You haven't saved any reports yet.
            </p>
            <p className="text-xs text-muted-foreground/60">
              When querying your database in Chats, click the "Save" button on any response card to persist the analysis here.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
