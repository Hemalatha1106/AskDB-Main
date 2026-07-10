'use client';
import { API_BASE_URL } from '@/lib/api-config';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState } from 'react';

const supportedDatabases = [
  { id: 'postgresql', name: 'PostgreSQL', icon: '🐘' },
  { id: 'mysql', name: 'MySQL', icon: '🐬' },
  { id: 'sqlserver', name: 'SQL Server', icon: '🔷' },
  { id: 'sqlite', name: 'SQLite', icon: '📦' },
  { id: 'oracle', name: 'Oracle', icon: '🏛️' },
  { id: 'mariadb', name: 'MariaDB', icon: '🌊' },
  { id: 'mongodb', name: 'MongoDB', icon: '🍃' },
];

interface ConnectionWizardProps {
  onConnect?: (config: any) => void;
}

export function ConnectionWizard({ onConnect }: ConnectionWizardProps) {
  const [step, setStep] = useState<'select' | 'form' | 'testing' | 'success'>(
    'select'
  );
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [formData, setFormData] = useState({
    host: '',
    port: '',
    username: '',
    password: '',
    database: '',
    ssl: false,
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>(
    'idle'
  );

  const handleSelectDb = (dbId: string) => {
    setSelectedDb(dbId);
    setStep('form');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setStep('testing');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/database/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          database: selectedDb,
          host: formData.host,
          port: formData.port,
          username: formData.username,
          password: formData.password,
          database_name: formData.database,
          ssl: formData.ssl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Connection failed');
      }

      setTestStatus('success');
      setStep('success');
    } catch (err: any) {
      console.error(err);
      setTestStatus('error');
      setStep('form');
      alert(`Database Connection Failed: ${err.message}`);
    }
  };

  const handleConnect = () => {
    if (onConnect) {
      onConnect({ database: selectedDb, ...formData });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {step === 'select' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Select Your Database</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportedDatabases.map((db) => (
              <PremiumCard
                key={db.id}
                className="p-6 cursor-pointer hover:border-blue-500/40 hover:shadow-md transition-all"
                onClick={() => handleSelectDb(db.id)}
              >
                <div className="text-4xl mb-3">{db.icon}</div>
                <h3 className="font-semibold">{db.name}</h3>
              </PremiumCard>
            ))}
          </div>
        </div>
      )}

      {step === 'form' && (
        <div>
          <Button
            variant="ghost"
            onClick={() => setStep('select')}
            className="mb-6"
          >
            ← Back
          </Button>

          <h2 className="text-2xl font-bold mb-6">
            Connect to{' '}
            {supportedDatabases.find((db) => db.id === selectedDb)?.name}
          </h2>

          <PremiumCard className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Host</label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleInputChange}
                placeholder="localhost"
                className="w-full px-4 py-2 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Port</label>
                <input
                  type="text"
                  name="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  placeholder="5432"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="postgres"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Database Name
              </label>
              <input
                type="text"
                name="database"
                value={formData.database}
                onChange={handleInputChange}
                placeholder="myapp"
                className="w-full px-4 py-2 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ssl"
                name="ssl"
                checked={formData.ssl}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-border cursor-pointer"
              />
              <label htmlFor="ssl" className="text-sm text-muted-foreground cursor-pointer">
                Use SSL connection
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleTestConnection} className="flex-1">
                Test Connection
              </Button>
            </div>
          </PremiumCard>
        </div>
      )}

      {step === 'testing' && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold mb-2">Testing Connection</h2>
          <p className="text-muted-foreground">
            Please wait while we verify your database connection...
          </p>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Connected Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Your database is now connected and ready to use.
          </p>
          <Button onClick={handleConnect} size="lg">
            Start Using AskDB
          </Button>
        </div>
      )}
    </div>
  );
}
