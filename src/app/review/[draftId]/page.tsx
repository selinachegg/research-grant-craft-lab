'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadDraft } from '@/lib/drafts/store';
import type { ReviewerReport } from '@/lib/reviewer/types';

// ---------------------------------------------------------------------------
// Reviewer explanation panel
// ---------------------------------------------------------------------------

function ReviewerExplainer() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card p-4 mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <InfoCircleIcon className="w-4 h-4 text-brand-500 shrink-0" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            How does the reviewer work?
          </span>
        </div>
        <ChevronIcon className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-sm text-slate-600 dark:text-slate-400 animate-fade-in">

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">What it is</p>
              <p className="text-xs leading-relaxed">
                A <strong className="text-slate-800 dark:text-slate-200">deterministic heuristic engine</strong> — not an AI model. It applies 22 weighted signal checks to your draft text and maps the results to the official Horizon Europe scoring rubric.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Is it AI?</p>
              <p className="text-xs leading-relaxed">
                <strong className="text-slate-800 dark:text-slate-200">No.</strong> No language model is used for scoring. Every check is a deterministic pattern match — same draft always produces the same score. No API key needed.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">What it checks</p>
              <p className="text-xs leading-relaxed">
                <strong className="text-slate-800 dark:text-slate-200">22 signals</strong> across three Horizon Europe criteria: <em>Excellence</em>, <em>Impact</em>, and <em>Implementation</em>. Each signal checks whether a specific required element is present and well-supported.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Scoring</p>
              <p className="text-xs leading-relaxed">
                Each criterion is scored 0–5 in 0.5-point steps. Pass threshold: <strong className="text-slate-800 dark:text-slate-200">≥ 10.0 total</strong> and <strong className="text-slate-800 dark:text-slate-200">≥ 3.0 per criterion</strong>, matching the HE evaluation convention.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            ⚠ <strong>Limitation:</strong> this tool checks structural completeness, not scientific quality or novelty. It cannot predict whether a real evaluation panel will fund your proposal. Use it as a structural checklist, not a funding predictor.
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton rounded-xl ${className ?? ''}`} style={style} />;
}

function ScoringLoader() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="card p-8 space-y-3">
        {[80, 55, 90, 45, 70, 35, 80, 60].map((w, i) => (
          <Skeleton key={i} style={{ width: `${w}%` }} className="h-4" />
        ))}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
        Analysing your proposal against Horizon Europe criteria…
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score badge
// ---------------------------------------------------------------------------

function ScoreBadge({ score, threshold, max }: { score: number; threshold: number; max: number }) {
  const passed = score >= threshold;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      passed
        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
        : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
    }`}>
      {passed ? '✅' : '❌'} {score} / {max}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------

function SummaryCard({ report }: { report: ReviewerReport }) {
  const passed = report.overallPassed;
  return (
    <div className={`rounded-2xl border-2 p-6 mb-6 ${
      passed
        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
        : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
    }`}>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <p className={`text-xl font-bold ${passed ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'}`}>
            {passed ? '✅ Overall: PASS' : '❌ Overall: BELOW THRESHOLD'}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Total score:{' '}
            <strong className="text-slate-900 dark:text-slate-100">{report.overallScore}</strong>{' '}
            / {report.maxPossibleScore} · Pass threshold: ≥ 10.0 total, ≥ 3.0 per criterion
          </p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-xs text-slate-400 dark:text-slate-500">{report.draftWordCount.toLocaleString()} words</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{report.draftSectionCount} headings detected</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {report.criteria.map((c) => (
          <div key={c.criterionId} className="flex items-center gap-2.5 bg-white/60 dark:bg-slate-900/40 rounded-xl px-3 py-2">
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{c.criterionTitle}</span>
            <ScoreBadge score={c.score} threshold={c.threshold} max={c.maxScore} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Status = 'loading' | 'scoring' | 'done' | 'error';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.draftId as string;

  const [status, setStatus] = useState<Status>('loading');
  const [report, setReport] = useState<ReviewerReport | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function run() {
      const draft = loadDraft(draftId);
      if (!draft) {
        setErrorMsg('Draft not found. It may have been cleared from browser storage.');
        setStatus('error');
        return;
      }
      setDraftTitle(draft.title);
      if (draft.content.trim().length < 50) {
        setErrorMsg('Draft is too short to score (minimum 50 characters). Add more content and try again.');
        setStatus('error');
        return;
      }
      setStatus('scoring');
      try {
        const res = await fetch('/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftContent: draft.content, schemeId: draft.schemeId, draftId: draft.draftId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        setReport(data.report as ReviewerReport);
        setStatus('done');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error generating report.');
        setStatus('error');
      }
    }
    run();
  }, [draftId]);

  function handleDownload() {
    if (!report) return;
    const blob = new Blob([report.markdownReport], { type: 'text/markdown; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviewer_report_${draftId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <Link
            href={`/editor/${draftId}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to editor
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reviewer Report</h1>
          {draftTitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{draftTitle}</p>}
        </div>

        {status === 'done' && report && (
          <button type="button" onClick={handleDownload} className="btn-secondary shrink-0">
            <DownloadIcon className="w-3.5 h-3.5" />
            Download report
          </button>
        )}
      </div>

      {/* Reviewer explainer — always visible so users understand what they're looking at */}
      <ReviewerExplainer />

      {/* Loading */}
      {(status === 'loading' || status === 'scoring') && <ScoringLoader />}

      {/* Error */}
      {status === 'error' && (
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Could not generate report</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{errorMsg}</p>
          <button type="button" onClick={() => router.push(`/editor/${draftId}`)} className="btn-primary">
            Back to editor
          </button>
        </div>
      )}

      {/* Report */}
      {status === 'done' && report && (
        <div className="animate-fade-in">
          <SummaryCard report={report} />

          <div className="rounded-xl px-4 py-3 text-xs mb-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
            ⚠ <strong>Heuristic assessment only.</strong> This report checks for the presence of structural content signals — it does not evaluate scientific quality and cannot predict funding panel outcomes. See{' '}
            <a href="https://github.com/selinachegg/research-grant-craft/blob/main/docs/LIMITATIONS.md" target="_blank" rel="noopener noreferrer" className="underline font-medium">Limitations</a>.
          </div>

          <div className="card p-6 sm:p-8 prose-report">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.markdownReport}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ChevronLeftIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>;
}
function ChevronIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;
}
function DownloadIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>;
}
function XCircleIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" /></svg>;
}
function InfoCircleIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>;
}
