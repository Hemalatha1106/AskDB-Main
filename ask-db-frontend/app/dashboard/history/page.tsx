'use client';
import { API_BASE_URL } from '@/lib/api-config';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  MessageSquare,
  ArrowRight,
  Search,
  Database,
  Calendar
} from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

export default function QueryHistoryPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchChats = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else if (response.status === 401) {
        localStorage.removeItem('authToken');
        router.push('/auth/login');
      } else {
        console.error('Failed to load query history:', response.status);
      }
    } catch (err) {
      console.error('Error fetching query history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [router]);

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Query History</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Access your past AI natural language database query conversations.
              </p>
            </div>
            
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* History List */}
          {loading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse text-sm">
              Loading query history...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/20 text-muted-foreground text-sm">
              No historical query sessions found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChats.map((chat) => (
                <PremiumCard
                  key={chat.id}
                  className="p-4 hover:border-blue-500/40 hover:shadow-md transition-all border border-border/40 cursor-pointer flex items-center justify-between gap-4"
                  onClick={() => router.push(`/dashboard/chat/${chat.id}`)}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 bg-secondary text-primary rounded-xl shrink-0">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {chat.title}
                      </h4>
                      
                      {/* Subtitle meta */}
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {chat.created_at}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Active Session
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-secondary shrink-0"
                  >
                    <ArrowRight className="h-4.5 w-4.5 text-muted-foreground" />
                  </Button>
                </PremiumCard>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
