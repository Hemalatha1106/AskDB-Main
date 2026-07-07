'use client';

import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/premium-card';
import { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  Cpu,
  Eye,
  EyeOff,
  Key,
  Trash2,
  CheckCircle,
  HelpCircle,
  Lock,
  Unlock,
  Save,
  Check
} from 'lucide-react';

const modelsByProvider: Record<string, { id: string; name: string }[]> = {
  gemini: [
    { id: 'gemini-3.5-flash', name: 'gemini-3.5-flash (Recommended)' },
    { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash' },
    { id: 'gemini-2.5-pro', name: 'gemini-2.5-pro' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'gpt-4o-mini (Recommended)' },
    { id: 'gpt-4o', name: 'gpt-4o' },
  ],
  anthropic: [
    { id: 'claude-3-5-haiku-latest', name: 'claude-3-5-haiku-latest (Recommended)' },
    { id: 'claude-3-5-sonnet-latest', name: 'claude-3-5-sonnet-latest' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'llama-3.3-70b-versatile (Recommended)' },
    { id: 'llama-3.1-8b-instant', name: 'llama-3.1-8b-instant' },
    { id: 'mixtral-8x7b-32768', name: 'mixtral-8x7b-32768' },
  ],
  fireworks: [
    { id: 'accounts/fireworks/models/llama-v3p1-405b-instruct', name: 'llama-v3p1-405b' },
  ],
};

const providerNames: Record<string, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  groq: 'Groq',
  fireworks: 'Fireworks AI',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'model' | 'appearance' | 'api' | 'danger'>('profile');
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [userName, setUserName] = useState('Hemalatha');
  const [userEmail, setUserEmail] = useState('hemalatha@example.com');
  const [themeState, setThemeState] = useState('light');

  // AI BYOK Settings
  const [provider, setProvider] = useState<string>('gemini');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [selectedAiModel, setSelectedAiModel] = useState<string>('gemini-3.5-flash');
  const [usePersonalKey, setUsePersonalKey] = useState<boolean>(false);
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [loadingAiSettings, setLoadingAiSettings] = useState<boolean>(true);
  const [savingAiSettings, setSavingAiSettings] = useState<boolean>(false);

  const fetchAiSettings = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setLoadingAiSettings(true);
    try {
      const response = await fetch('http://localhost:8000/api/settings/ai', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setProvider(data.settings.provider);
          setSelectedAiModel(data.settings.model);
          setUsePersonalKey(data.settings.use_personal_key);
          setHasKey(data.settings.has_key);
        }
      }
    } catch (e) {
      console.error('Failed to fetch AI Settings:', e);
    } finally {
      setLoadingAiSettings(false);
    }
  };

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
    fetchAiSettings();
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

  // Adjust model when provider changes
  useEffect(() => {
    if (modelsByProvider[provider]) {
      const belongsToProvider = modelsByProvider[provider].some(m => m.id === selectedAiModel);
      if (!belongsToProvider) {
        setSelectedAiModel(modelsByProvider[provider][0].id);
      }
    }
  }, [provider]);

  const handleSaveAiSettings = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    if (usePersonalKey && !apiKey && !hasKey) {
      alert('Please enter an API Key to enable personal AI routing.');
      return;
    }

    setSavingAiSettings(true);
    try {
      const response = await fetch('http://localhost:8000/api/settings/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          provider,
          api_key: apiKey || null,
          model: selectedAiModel,
          use_personal_key: usePersonalKey
        })
      });

      if (response.ok) {
        alert('AI settings saved successfully!');
        setApiKey('');
        fetchAiSettings();
        window.dispatchEvent(new Event('ai-settings-changed'));
      } else {
        const errData = await response.json();
        alert(`Failed to save settings: ${errData.detail || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Failed to save AI settings:', e);
      alert('An error occurred while saving AI settings.');
    } finally {
      setSavingAiSettings(false);
    }
  };

  const handleRemoveAiKey = async () => {
    if (!confirm('Are you sure you want to remove your stored API Key? This will disable custom AI routing and delete your stored credentials.')) {
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/settings/ai', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        alert('Credentials deleted successfully.');
        setApiKey('');
        fetchAiSettings();
        window.dispatchEvent(new Event('ai-settings-changed'));
      }
    } catch (e) {
      console.error('Failed to delete credentials:', e);
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
    <div className="flex-1 overflow-y-auto bg-background animate-fade-in">
      <div className="max-w-4xl mx-auto px-6 py-8 md:px-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">Workspace Settings</h1>
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
            { id: 'api', label: 'AI Settings' },
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
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" /> Bring Your Own API Key (BYOK)
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                Configure your own API keys to query custom LLMs directly. When disabled or missing, AskDB automatically runs requests using the platform's default managed credentials.
              </p>

              {loadingAiSettings ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground animate-pulse text-sm">
                  Loading AI Configuration...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Indicator */}
                  <div className="p-4 rounded-xl border border-border/40 bg-secondary/15 flex items-center gap-2">
                    <CheckCircle className={`h-5 w-5 ${usePersonalKey && hasKey ? 'text-emerald-500' : 'text-primary'}`} />
                    <span className="text-sm font-semibold">
                      {usePersonalKey && hasKey ? (
                        <span className="text-emerald-500">✓ Using your personal {providerNames[provider] || provider} API key</span>
                      ) : (
                        <span className="text-muted-foreground">✓ Using AskDB default AI</span>
                      )}
                    </span>
                  </div>

                  {/* Enable Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">Use my API key</p>
                      <p className="text-xs text-muted-foreground">
                        Toggle to route database natural language queries through your personal key.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePersonalKey}
                        onChange={(e) => setUsePersonalKey(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Settings Form */}
                  <div className={`space-y-4 transition-all duration-300 ${!usePersonalKey ? 'opacity-55' : ''}`}>
                    {/* Provider Select */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        AI Provider
                      </label>
                      <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        disabled={!usePersonalKey}
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="groq">Groq</option>
                        <option value="fireworks">Fireworks AI</option>
                      </select>
                    </div>

                    {/* Model Select */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Model Name
                      </label>
                      <select
                        value={selectedAiModel}
                        onChange={(e) => setSelectedAiModel(e.target.value)}
                        disabled={!usePersonalKey}
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      >
                        {(modelsByProvider[provider] || []).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* API Key Input */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                        <span>API Key</span>
                        {hasKey && (
                          <span className="text-[10px] text-emerald-500 font-bold lowercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            Key Configured
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          disabled={!usePersonalKey}
                          placeholder={hasKey ? '••••••••••••••••••••••••••••••••' : 'Enter API key credentials'}
                          className="w-full pl-4 pr-12 py-2.5 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          disabled={!usePersonalKey}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          {showApiKey ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                    <Button
                      onClick={handleSaveAiSettings}
                      disabled={savingAiSettings}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {savingAiSettings ? 'Saving Settings...' : 'Save AI Configuration'}
                    </Button>

                    {hasKey && (
                      <Button
                        variant="ghost"
                        onClick={handleRemoveAiKey}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove Key
                      </Button>
                    )}
                  </div>
                </div>
              )}
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
