'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadLlmConfig, saveLlmConfig } from '@/lib/llm/types';
import type { LlmConfig } from '@/lib/llm/types';

const PROVIDERS = [
  { id: 'openai',      name: 'OpenAI',        endpoint: 'https://api.openai.com/v1',  model: 'gpt-4o',      keyPlaceholder: 'sk-...', keyHint: 'Get your key at platform.openai.com/api-keys', docs: 'https://platform.openai.com/api-keys' },
  { id: 'openai-mini', name: 'GPT-4o mini',   endpoint: 'https://api.openai.com/v1',  model: 'gpt-4o-mini', keyPlaceholder: 'sk-...', keyHint: 'Same key as OpenAI — cheaper, faster', docs: 'https://platform.openai.com/api-keys' },
  { id: 'openrouter',  name: 'OpenRouter',     endpoint: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini', keyPlaceholder: 'sk-or-...', keyHint: 'Get a key at openrouter.ai — access 100+ models', docs: 'https://openrouter.ai/keys' },
  { id: 'ollama',      name: 'Ollama (local)', endpoint: 'http://localhost:11434/v1', model: 'llama3',      keyPlaceholder: 'ollama', keyHint: 'Install Ollama and run: ollama pull llama3', docs: 'https://ollama.com' },
  { id: 'custom',      name: 'Custom',         endpoint: '', model: '', keyPlaceholder: 'your-api-key', keyHint: 'Any OpenAI-compatible endpoint', docs: null },
] as const;

type ProviderId = (typeof PROVIDERS)[number]['id'];

export default function SettingsPage() {
  const [mode, setMode] = useState<'mock' | 'live'>('mock');
  const [providerId, setProviderId] = useState<ProviderId>('openai');
  const [config, setConfig] = useState<LlmConfig>({ endpoint: '', apiKey: '', model: 'gpt-4o' });
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const c = loadLlmConfig();
    if (c.endpoint && c.apiKey) {
      setMode('live');
      setConfig(c);
      const match = PROVIDERS.find((p) => p.endpoint === c.endpoint && p.model === c.model);
      setProviderId(match ? match.id : 'custom');
    }
  }, []);

  function selectProvider(id: ProviderId) {
    setProviderId(id);
    const preset = PROVIDERS.find((p) => p.id === id)!;
    setConfig((prev) => ({
      ...prev,
      endpoint: preset.endpoint || prev.endpoint,
      model: preset.model || prev.model,
    }));
    setTestResult(null);
  }

  function handleSave() {
    saveLlmConfig(mode === 'mock' ? { endpoint: '', apiKey: '', model: 'gpt-4o' } : config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTestResult(null);
  }

  function handleClear() {
    setMode('mock');
    setConfig({ endpoint: '', apiKey: '', model: 'gpt-4o' });
    saveLlmConfig({ endpoint: '', apiKey: '', model: 'gpt-4o' });
    setProviderId('openai');
    setTestResult(null);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wizardState: {
            acronym: 'TEST', fullTitle: 'Connection test', abstract: 'Testing API connection.',
            objectives: [{ id: '1', text: 'Test connection' }],
            currentTrl: '3', targetTrl: '6', stateOfArtGap: 'Testing.',
            partners: [{ id: '1', name: 'Test', country: 'DE', type: 'University', role: 'Lead', expertise: 'Test' }],
            durationMonths: 48, totalBudgetEuros: '1000000', keyMilestones: '',
            schemeId: 'horizon_europe_ria_ia',
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), currentStep: 5,
          },
          config,
        }),
      });
      const data = await res.json();
      if (!res.ok) setTestResult({ ok: false, message: data.error ?? `HTTP ${res.status}` });
      else if (data.isMock) setTestResult({ ok: false, message: 'Reached mock mode — check your endpoint and API key.' });
      else setTestResult({ ok: true, message: 'Connection successful! API is responding correctly.' });
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setTesting(false);
    }
  }

  const selectedProvider = PROVIDERS.find((p) => p.id === providerId)!;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition-colors">
        <ChevronLeftIcon className="w-4 h-4" />
        Home
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">AI generation settings</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Choose how drafts are generated. Settings are saved in your browser only.
      </p>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          {
            key: 'mock' as const,
            icon: '🧪',
            title: 'Template mode',
            desc: 'No API key needed. Generates a structured scaffold from your wizard answers. Works offline. Best for first use.',
          },
          {
            key: 'live' as const,
            icon: '✨',
            title: 'Live AI',
            desc: 'Connect your own API key (OpenAI, OpenRouter, Ollama, or any OpenAI-compatible endpoint) for AI-written drafts.',
          },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => { setMode(m.key); setTestResult(null); }}
            className={`text-left p-5 rounded-2xl border-2 transition-all duration-150 ${
              mode === m.key
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-2">{m.icon}</div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">{m.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{m.desc}</p>
            {mode === m.key && (
              <span className="badge badge-brand mt-3">Active</span>
            )}
          </button>
        ))}
      </div>

      {/* Live mode configuration */}
      {mode === 'live' && (
        <div className="card p-6 space-y-5 mb-6">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Provider configuration</h2>

          {/* Provider presets */}
          <div>
            <label className="field-label">Provider</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProvider(p.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150 ${
                    providerId === p.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {selectedProvider.docs
              ? <p className="field-hint"><a href={selectedProvider.docs} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600 dark:hover:text-slate-300">{selectedProvider.keyHint}</a></p>
              : <p className="field-hint">{selectedProvider.keyHint}</p>
            }
          </div>

          {/* Endpoint */}
          <div>
            <label className="field-label">API endpoint</label>
            <input
              value={config.endpoint}
              onChange={(e) => setConfig((c) => ({ ...c, endpoint: e.target.value }))}
              placeholder="https://api.openai.com/v1"
              className="field-input"
            />
            <p className="field-hint">Must support <code className="font-mono text-xs">/chat/completions</code>.</p>
          </div>

          {/* API Key */}
          <div>
            <label className="field-label">API key</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
              placeholder={selectedProvider.keyPlaceholder}
              autoComplete="off"
              className="field-input"
            />
            <p className="field-hint">Stored in browser localStorage only. Never sent to this project's servers.</p>
          </div>

          {/* Model */}
          <div>
            <label className="field-label">Model</label>
            <input
              value={config.model}
              onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
              placeholder="gpt-4o"
              className="field-input"
            />
            <p className="field-hint">OpenAI: gpt-4o, gpt-4o-mini · Ollama: llama3, mistral</p>
          </div>

          {/* Test connection */}
          <div>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !config.endpoint || !config.apiKey}
              className="btn-secondary"
            >
              {testing ? (
                <><SpinnerIcon className="w-3.5 h-3.5 animate-spin" />Testing…</>
              ) : 'Test connection'}
            </button>
            {testResult && (
              <p className={`mt-2.5 text-sm flex items-center gap-1.5 ${testResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {testResult.ok ? '✅' : '❌'} {testResult.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Privacy notice */}
      {mode === 'live' && (
        <div className="badge-amber rounded-xl px-4 py-3 text-xs mb-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          ⚠ In Live AI mode, your draft text and wizard answers are sent to the configured API endpoint. Review the privacy policy of your chosen provider before entering sensitive content.{' '}
          <Link href="/privacy" className="underline font-medium">Privacy statement</Link>
        </div>
      )}

      {/* Save / reset */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={mode === 'live' && (!config.endpoint || !config.apiKey)}
          className="btn-primary"
        >
          {saved ? '✓ Saved' : 'Save settings'}
        </button>
        <button type="button" onClick={handleClear} className="btn-secondary">
          Reset to template mode
        </button>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
        Settings are saved in your browser's localStorage and apply immediately to new draft generation requests.
      </p>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd"/></svg>;
}
function SpinnerIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"/></svg>;
}
