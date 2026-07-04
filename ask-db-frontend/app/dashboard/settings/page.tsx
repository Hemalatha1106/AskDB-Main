'use client';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  Cpu,
  Eye,
  Key,
  Trash2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'model' | 'appearance' | 'api' | 'danger'>('profile');
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [userName, setUserName] = useState('Hemalatha');
  const [userEmail, setUserEmail] = useState('hemalatha@example.com');
  const [themeState, setThemeState] = useState('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'light';
      setThemeState(savedTheme);
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj.email) {
          setUserEmail(userObj.email);
          const prefix = userObj.email.split('@')[0];
          setUserName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    const isDark = newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const models = [
    { id: 'gemini', name: 'Google Gemini 1.5 Pro', desc: 'Default active engine. Highly accurate schema understanding and prompt token capacity.', quality: 'Exceptional', speed: 'Ultra Fast' },
    { id: 'claude', name: 'Anthropic Claude 3.5 Sonnet', desc: 'Excellent SQL synthesis, highly robust queries on complex nested joins.', quality: 'Advanced', speed: 'Moderate' },
    { id: 'gpt', name: 'OpenAI GPT-4o', desc: 'Industry standard for SQL, great structured database translation.', quality: 'Excellent', speed: 'Fast' },
    { id: 'deepseek', name: 'DeepSeek R1 Reasoning', desc: 'Thinking engine with deep reasoning loops, ideal for optimizing queries.', quality: 'High Reason', speed: 'Deliberate' },
    { id: 'llama', name: 'Meta Llama 3.1 70B', desc: 'Open-weights utility model optimized for low latency simple queries.', quality: 'Good', speed: 'Very Fast' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8 md:px-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Workspace Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your analytics settings, toggle AI models, and customize API credentials.
          </p>
        </div>

        {/* Tabs Row */}
        <div className="flex gap-2 mb-8 border-b border-border/40 overflow-x-auto">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'model', label: 'AI Model' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'api', label: 'API Keys' },
            { id: 'danger', label: 'Danger Zone' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Tabs */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <PremiumCard className="p-6 border-border/40">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Profile Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary/30 text-sm opacity-80 cursor-default"
                  />
                </div>
                <Button className="w-full mt-4" onClick={() => alert('Profile updated successfully!')}>
                  Save Profile Changes
                </Button>
              </div>
            </PremiumCard>
          </div>
        )}

        {activeTab === 'model' && (
          <div className="space-y-6">
            <PremiumCard className="p-6 border-border/40">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" /> AI Model Selection
              </h2>
              <p className="text-xs text-muted-foreground mb-6">
                Choose the Large Language Model that powers SQL generation and schema parsing in your workspace.
              </p>
              
              <div className="space-y-4">
                {models.map((model) => {
                  const isSelected = selectedModel === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                        isSelected
                          ? 'bg-primary/5 border-primary shadow-sm'
                          : 'border-border/40 hover:border-border/80 bg-card'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {model.name}
                          </span>
                          {isSelected && (
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {model.desc}
                        </p>
                        
                        {/* Meta tags */}
                        <div className="flex items-center gap-3 pt-2 text-[10px] text-muted-foreground font-semibold">
                          <span>Quality: <strong className="text-foreground">{model.quality}</strong></span>
                          <span>•</span>
                          <span>Response Speed: <strong className="text-foreground">{model.speed}</strong></span>
                        </div>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border/60'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </PremiumCard>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <PremiumCard className="p-6 border-border/40">
              <h2 className="text-lg font-bold mb-6">Interface Theme</h2>
              <div className="space-y-4">
                {[
                  { id: 'light', label: 'Light Mode' },
                  { id: 'dark', label: 'Dark Mode' },
                  { id: 'system', label: 'System Preferences' },
                ].map((theme) => (
                  <label key={theme.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-secondary/40">
                    <input
                      type="radio"
                      name="theme"
                      checked={themeState === theme.id}
                      onChange={() => handleThemeChange(theme.id)}
                      className="w-4.5 h-4.5"
                    />
                    <span className="text-sm font-semibold text-foreground">{theme.label}</span>
                  </label>
                ))}
              </div>
            </PremiumCard>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <PremiumCard className="p-6 border-border/40">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" /> API Keys
                </h2>
                <Button size="sm" onClick={() => alert('New API key generated!')}>Create API Key</Button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border/40 bg-secondary/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm">Production Key</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        sk_live_...48acfe
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => alert('API Key copied to clipboard!')}>
                        Copy
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="space-y-6">
            <PremiumCard className="p-6 border-destructive/20 bg-destructive/5">
              <h2 className="text-lg font-bold mb-2 text-destructive">Danger Zone</h2>
              <p className="text-xs text-muted-foreground mb-6">
                Irreversible actions that will permanently delete your database schemas, chats, and workspaces.
              </p>
              <div className="space-y-4">
                <Button variant="destructive" size="lg" className="w-full" onClick={() => alert('Account deletion requested.')}>
                  Delete Workspace Account
                </Button>
              </div>
            </PremiumCard>
          </div>
        )}
      </div>
    </div>
  );
}
