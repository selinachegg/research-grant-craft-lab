'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadDraft, saveDraft } from '@/lib/drafts/store';
import { loadWizardState } from '@/lib/wizard/store';
import { loadLlmConfig, generateDraft } from '@/lib/llm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ---------------------------------------------------------------------------
// Main editor page
// ---------------------------------------------------------------------------

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const draftId = params.draftId as string;
  const urlWizardId = searchParams.get('wizardId');

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled proposal');
  const [schemeId, setSchemeId] = useState('horizon_europe_ria_ia');
  const [createdAt] = useState(new Date().toISOString());
  const [wizardId, setWizardId] = useState<string | null>(urlWizardId);

  const [view, setView] = useState<'split' | 'editor' | 'preview'>('split');
  const [generating, setGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [mockBanner, setMockBanner] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const existing = loadDraft(draftId);
    if (existing) {
      setContent(existing.content);
      setTitle(existing.title);
      setSchemeId(existing.schemeId);
      if (existing.wizardId && !urlWizardId) setWizardId(existing.wizardId);
      return;
    }

    const wid = urlWizardId;
    if (wid) {
      const wizard = loadWizardState(wid);
      setTitle(
        wizard.fullTitle
          ? `${wizard.acronym ? wizard.acronym + ' — ' : ''}${wizard.fullTitle}`
          : 'New proposal',
      );
      setSchemeId(wizard.schemeId);
      handleGenerate(wizard);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  const scheduleSave = useCallback(
    (text: string, titleVal: string) => {
      setSaveStatus('unsaved');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveDraft({
          draftId,
          title: titleVal,
          schemeId,
          content: text,
          wordCount: wordCount(text),
          createdAt,
          updatedAt: new Date().toISOString(),
          wizardId: wizardId ?? undefined,
        });
        setSaveStatus('saved');
      }, 800);
    },
    [draftId, schemeId, createdAt, wizardId],
  );

  function handleContentChange(text: string) {
    setContent(text);
    scheduleSave(text, title);
  }

  async function handleGenerate(wizardOverride?: ReturnType<typeof loadWizardState>) {
    setGenerating(true);
    try {
      const wizard = wizardOverride ?? (wizardId ? loadWizardState(wizardId) : null);
      if (!wizard) {
        alert('No wizard session linked to this draft. Please start a new proposal from the home page.');
        setGenerating(false);
        return;
      }
      const config = loadLlmConfig();
      const result = await generateDraft(wizard, config);
      setContent(result.draftMarkdown);
      scheduleSave(result.draftMarkdown, title);
      if (result.isMock) setMockBanner(true);
    } catch (err) {
      console.error('Generation failed:', err);
      alert(`Draft generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    const blob = new Blob([content], { type: 'text/markdown; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleReview() {
    saveDraft({
      draftId,
      title,
      schemeId,
      content,
      wordCount: wordCount(content),
      createdAt,
      updatedAt: new Date().toISOString(),
      wizardId: wizardId ?? undefined,
    });
    router.push(`/review/${draftId}`);
  }

  const wc = wordCount(content);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mt-8 -mx-4 sm:-mx-6">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-wrap shrink-0">

        {/* Back link */}
        <Link
          href="/"
          className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
          title="All proposals"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Link>

        {/* Title input */}
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave(content, e.target.value);
          }}
          className="flex-1 min-w-0 text-sm font-medium text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 dark:focus:border-slate-600 py-0.5 transition-colors"
          placeholder="Proposal title"
        />

        {/* Status */}
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">
          {wc.toLocaleString()} words ·{' '}
          {saveStatus === 'saved' ? (
            <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
          ) : (
            <span className="text-amber-500 dark:text-amber-400">Saving…</span>
          )}
        </span>

        {/* View toggle */}
        <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shrink-0">
          {(['split', 'editor', 'preview'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-xs capitalize transition-colors ${
                view === v
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={() => handleGenerate()}
          disabled={generating}
          className="btn-secondary py-1 px-3 text-xs shrink-0"
        >
          {generating ? (
            <><SpinnerIcon className="w-3 h-3 animate-spin" /> Generating…</>
          ) : (
            <><SparklesIcon className="w-3 h-3" /> Regenerate</>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="btn-secondary py-1 px-3 text-xs shrink-0"
          title="Download as Markdown"
        >
          <DownloadIcon className="w-3 h-3" />
          <span className="hidden sm:inline">Download</span>
        </button>

        <button
          type="button"
          onClick={handleReview}
          disabled={wc < 50}
          className="btn-primary py-1 px-3 text-xs shrink-0 disabled:opacity-40"
          title={wc < 50 ? 'Add more content before reviewing' : 'Generate reviewer report'}
        >
          Review <ArrowRightIcon className="w-3 h-3" />
        </button>
      </div>

      {/* ── Mock / template mode banner ── */}
      {mockBanner && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between shrink-0">
          <span>
            <strong>Template mode</strong> — your structured grant scaffold is ready.
            Search for{' '}
            <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded font-mono">[FILL IN:</code>
            {' '}to find every cell that needs your input. Amber boxes in the preview are guidance notes.{' '}
            <Link href="/settings" className="underline font-medium">Add an API key</Link> for AI-written drafts.
          </span>
          <button
            type="button"
            onClick={() => setMockBanner(false)}
            className="ml-4 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 shrink-0 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Editor / preview panes ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor pane */}
        {(view === 'editor' || view === 'split') && (
          <div className={`flex flex-col ${view === 'split' ? 'w-1/2 border-r border-slate-200 dark:border-slate-800' : 'w-full'}`}>
            <div className="px-3 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
              Markdown
            </div>
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="flex-1 p-4 text-sm font-mono text-slate-800 dark:text-slate-200 resize-none focus:outline-none bg-white dark:bg-slate-950 leading-relaxed"
              placeholder="Your proposal draft will appear here. Click ✨ Regenerate to generate from wizard answers."
              spellCheck
            />
          </div>
        )}

        {/* Preview pane */}
        {(view === 'preview' || view === 'split') && (
          <div className={`flex flex-col overflow-hidden ${view === 'split' ? 'w-1/2' : 'w-full'}`}>
            <div className="px-3 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center gap-3">
              <span>Preview</span>
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400 dark:bg-amber-600" />
                Amber boxes = sections to complete
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 prose-draft">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 italic text-sm">Nothing to preview yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function ChevronLeftIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.684-2.051a1 1 0 0 1 .632-.632l2.051-.684a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.632-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.184a1 1 0 0 1 .633.632l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.632l.551-.184a1 1 0 0 0 0-1.898l-.551-.183a1 1 0 0 1-.632-.633l-.184-.551Z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
    </svg>
  );
}
