'use client';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Database,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Table,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';

interface Connection {
  id: number;
  dialect: string;
  host: string;
  port: number | null;
  username: string;
  database_name: string;
  ssl: boolean;
  is_active: boolean;
}

interface ColumnSchema {
  name: string;
  type: string;
  key?: string;
}

interface TableSchema {
  table: string;
  description: string;
  row_count: number;
  columns: ColumnSchema[];
}

const dialectIcons: Record<string, any> = {
  postgresql: Database,
  mysql: Database,
  sqlite: Database,
};

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [schemaTree, setSchemaTree] = useState<TableSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Tree view state: stores list of expanded table names
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  const fetchSchemaTree = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/database/schema', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSchemaTree(data.tables || []);
          // Auto expand first table if any are loaded
          if (data.tables && data.tables.length > 0) {
            setExpandedTables(prev => {
              if (Object.keys(prev).length === 0) {
                return { [data.tables[0].table]: true };
              }
              return prev;
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch schema tree data', e);
    }
  };

  const fetchConnections = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/database/connections', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      } else if (response.status === 401) {
        localStorage.removeItem('authToken');
        router.push('/auth/login');
      } else {
        console.error('Failed to fetch connections:', response.status);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      await fetchConnections();
      await fetchSchemaTree();
    };
    initData();
  }, [router]);

  const handleMakeActive = async (connId: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    setActionLoading(connId);
    try {
      const response = await fetch(`http://localhost:8000/api/database/connections/${connId}/active`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchConnections();
        await fetchSchemaTree();
        window.dispatchEvent(new Event('storage'));
      } else {
        alert('Failed to set active connection');
      }
    } catch (err) {
      console.error('Error setting active connection:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (connId: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/database/connections/${connId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchConnections();
        await fetchSchemaTree();
        window.dispatchEvent(new Event('storage'));
      } else {
        alert('Failed to delete connection');
      }
    } catch (err) {
      console.error('Error deleting connection:', err);
    }
  };

  const activeConnection = connections.find(c => c.is_active);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground animate-pulse text-sm">
        Loading connection manager...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Database Connections</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your credentials, select active connections, and explore indexed schemas.
              </p>
            </div>
            
            <Button size="lg" asChild className="gap-2 self-start sm:self-auto">
              <Link href="/database/connect">
                <Plus className="h-5 w-5" />
                <span>Connect Database</span>
              </Link>
            </Button>
          </div>

          {/* Connections Grid */}
          {connections.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/20 text-muted-foreground text-sm max-w-md mx-auto">
              <Database className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-foreground mb-1">No Connected Databases</h4>
              <p className="text-xs text-muted-foreground/80 leading-relaxed mb-6">
                You haven't configured any database credentials yet. Connect a database to sync schemas and query with AI.
              </p>
              <Button asChild>
                <Link href="/database/connect">Connect Database</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {connections.map((conn) => {
                const Icon = dialectIcons[conn.dialect.toLowerCase()] || Database;
                return (
                  <PremiumCard
                    key={conn.id}
                    className={`p-6 flex flex-col justify-between hover:shadow-md transition-all border ${
                      conn.is_active ? 'border-blue-500 bg-blue-500/5' : 'border-border/40'
                    }`}
                  >
                    <div>
                      {/* Top bar info */}
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${conn.is_active ? 'bg-blue-500/10 text-blue-500' : 'bg-secondary text-muted-foreground'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-foreground leading-tight">
                              {conn.database_name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                              Dialect: {conn.dialect} | User: {conn.username}
                            </p>
                          </div>
                        </div>

                        {conn.is_active && (
                          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        )}
                      </div>

                      {/* Connection details */}
                      <div className="bg-card border border-border/20 rounded-xl p-4.5 space-y-2 mb-6 font-mono text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Host:</span>
                          <span className="text-foreground font-semibold">{conn.host}</span>
                        </div>
                        {conn.port && (
                          <div className="flex justify-between">
                            <span>Port:</span>
                            <span className="text-foreground font-semibold">{conn.port}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>SSL Mode:</span>
                          <span className="text-foreground font-semibold">{conn.ssl ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom actions */}
                    <div className="flex items-center gap-3 pt-2 border-t border-border/20 mt-2">
                      {conn.is_active ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 cursor-default opacity-85"
                          disabled
                        >
                          Active Workspace
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-border/45 hover:border-blue-500/40 hover:text-blue-500 flex items-center justify-center gap-1.5"
                          onClick={() => handleMakeActive(conn.id)}
                          disabled={actionLoading !== null}
                        >
                          <RefreshCw className="h-3.5 w-3.5 animate-none" />
                          {actionLoading === conn.id ? 'Connecting...' : 'Make Active'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive p-2"
                        onClick={() => handleDelete(conn.id)}
                        disabled={actionLoading !== null}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </PremiumCard>
                );
              })}
            </div>
          )}

          {/* Data Explorer Section */}
          {activeConnection && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Data Explorer</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Explore active schema structures, columns types, and vector embedding states.
                </p>
              </div>

              <PremiumCard className="p-6 border-border/40">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase border-b border-border/40 pb-3 mb-4">
                  <Database className="h-4 w-4 text-primary" />
                  <span>{activeConnection.database_name} Schema Tree</span>
                </div>

                {schemaTree.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-4 bg-secondary/15 rounded-xl border border-dashed border-border/30 text-center">
                    No tables parsed yet in this connection schema index.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schemaTree.map((table) => {
                      const isExpanded = !!expandedTables[table.table];
                      return (
                        <div key={table.table} className="border border-border/20 rounded-xl overflow-hidden bg-secondary/15">
                          
                          {/* Table Row Header */}
                          <div
                            onClick={() => toggleTable(table.table)}
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                              <Table className="h-4 w-4 text-blue-500" />
                              <span className="font-bold text-sm text-foreground">{table.table}</span>
                              <span className="text-xs text-muted-foreground">({table.row_count.toLocaleString()} rows)</span>
                            </div>
                            
                            <span className="text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Embeddings Ready
                            </span>
                          </div>

                          {/* Columns Details */}
                          {isExpanded && (
                            <div className="px-6 pb-4 pt-1 border-t border-border/10 space-y-4">
                              {/* Description */}
                              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border/20">
                                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                <p>{table.description}</p>
                              </div>

                              {/* Columns Table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                                      <th className="pb-2 font-medium">Column Name</th>
                                      <th className="pb-2 font-medium">Type</th>
                                      <th className="pb-2 font-medium text-right">Key</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/20">
                                    {table.columns.map((col) => {
                                      const isPk = col.key === "PRIMARY KEY";
                                      const isFk = col.key === "FOREIGN KEY";
                                      return (
                                        <tr key={col.name} className="hover:bg-secondary/20">
                                          <td className="py-2 font-mono font-medium text-foreground">{col.name}</td>
                                          <td className="py-2 text-muted-foreground font-mono">{col.type}</td>
                                          <td className="py-2 text-right">
                                            {isPk && <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded font-mono font-semibold">PK</span>}
                                            {isFk && <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 px-1.5 py-0.5 rounded font-mono font-semibold">FK</span>}
                                            {!isPk && !isFk && <span className="text-muted-foreground/40">-</span>}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </PremiumCard>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
