'use client';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState } from 'react';

const allConversations = [
  {
    id: '1',
    title: 'User Growth Analysis',
    database: 'PostgreSQL',
    lastModified: '2 hours ago',
    preview: 'SELECT * FROM users WHERE created_at > NOW() - INTERVAL...',
  },
  {
    id: '2',
    title: 'Revenue Trends 2024',
    database: 'MySQL',
    lastModified: '5 hours ago',
    preview: 'SELECT DATE(created_at) as date, SUM(amount) as...',
  },
  {
    id: '3',
    title: 'Database Performance',
    database: 'PostgreSQL',
    lastModified: '1 day ago',
    preview: 'EXPLAIN ANALYZE SELECT * FROM large_table WHERE...',
  },
  {
    id: '4',
    title: 'Customer Segmentation',
    database: 'SQL Server',
    lastModified: '3 days ago',
    preview: 'WITH customer_segments AS (SELECT customer_id...',
  },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [databaseFilter, setDatabaseFilter] = useState('all');

  const filteredConversations = allConversations.filter((conv) => {
    const matchesSearch =
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDb =
      databaseFilter === 'all' || conv.database === databaseFilter;
    return matchesSearch && matchesDb;
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search Conversations</h1>
          <p className="text-muted-foreground">
            Find past queries and conversations
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border/40 bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          <div className="flex gap-2 flex-wrap">
            {['all', 'PostgreSQL', 'MySQL', 'SQL Server'].map((db) => (
              <button
                key={db}
                onClick={() =>
                  setDatabaseFilter(db === 'all' ? 'all' : db)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  databaseFilter === db || (db === 'all' && databaseFilter === 'all')
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-foreground hover:bg-secondary/70'
                }`}
              >
                {db}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {filteredConversations.length > 0 ? (
          <div className="space-y-4">
            {filteredConversations.map((conv) => (
              <PremiumCard
                key={conv.id}
                className="p-6 hover:border-blue-500/40 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{conv.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {conv.preview}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>📁 {conv.database}</span>
                      <span>⏰ {conv.lastModified}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Open
                  </Button>
                </div>
              </PremiumCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No conversations found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
