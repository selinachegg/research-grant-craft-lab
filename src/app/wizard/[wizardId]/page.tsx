'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import type { WizardState, Partner } from '@/lib/wizard/types';
import { WIZARD_STEPS, emptyWizardState } from '@/lib/wizard/types';
import { loadWizardState, saveWizardState, linkWizardToDraft } from '@/lib/wizard/store';
import { CountrySelect } from '@/components/CountrySelect';

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 mb-8 overflow-x-auto pb-1">
      {WIZARD_STEPS.map((step) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <div key={step.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div
              className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-200 ${
                done
                  ? 'bg-brand-600 text-white'
                  : active
                  ? 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              }`}
            >
              {done ? <CheckMiniIcon className="w-3.5 h-3.5" /> : step.id}
            </div>
            <span
              className={`text-xs hidden sm:inline whitespace-nowrap transition-colors ${
                active
                  ? 'text-slate-900 dark:text-slate-100 font-medium'
                  : done
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {step.label}
            </span>
            {step.id < total && (
              <div className={`w-6 h-px mx-1 hidden sm:block transition-colors ${done ? 'bg-brand-300 dark:bg-brand-700' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Project basics
// ---------------------------------------------------------------------------

function Step1({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  const wordCount = state.abstract.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Project basics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Give your proposal an identity. These details anchor the entire document.
        </p>
      </div>

      <div>
        <label className="field-label">Project acronym *</label>
        <input
          value={state.acronym}
          onChange={(e) => update({ acronym: e.target.value })}
          placeholder="e.g. AGRI-ADAPT"
          maxLength={20}
          className="field-input"
        />
        <p className="field-hint">Short, memorable identifier (max 20 chars).</p>
      </div>

      <div>
        <label className="field-label">Full project title *</label>
        <input
          value={state.fullTitle}
          onChange={(e) => update({ fullTitle: e.target.value })}
          placeholder="e.g. Adaptive AI for Climate-Resilient Precision Agriculture"
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label">Abstract / project summary *</label>
        <textarea
          rows={6}
          value={state.abstract}
          onChange={(e) => update({ abstract: e.target.value })}
          placeholder="Describe the problem, your approach, and the expected impact in 3–5 sentences. The AI will use this to draft your proposal."
          className="field-input resize-y"
        />
        <p className="field-hint">
          {wordCount} words
          {wordCount > 0 && wordCount < 30 && ' · Aim for at least 30 words'}
          {wordCount >= 30 && ' · Good length'}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Objectives
// ---------------------------------------------------------------------------

function Step2({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  function updateObjective(id: string, text: string) {
    update({ objectives: state.objectives.map((o) => (o.id === id ? { ...o, text } : o)) });
  }
  function addObjective() {
    update({ objectives: [...state.objectives, { id: uuidv4(), text: '' }] });
  }
  function removeObjective(id: string) {
    if (state.objectives.length <= 1) return;
    update({ objectives: state.objectives.filter((o) => o.id !== id) });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Objectives</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          3–6 SMART objectives. Use the format "To [verb] [measurable outcome] by [timeframe]".
        </p>
      </div>

      <div>
        <label className="field-label">Project objectives *</label>
        <div className="space-y-2 mt-1.5">
          {state.objectives.map((obj, idx) => (
            <div key={obj.id} className="flex gap-2 items-center">
              <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500 w-7 text-right shrink-0">
                O{idx + 1}
              </span>
              <input
                value={obj.text}
                onChange={(e) => updateObjective(obj.id, e.target.value)}
                placeholder="To develop… achieving ≥85 % accuracy by Month 24"
                className="field-input"
              />
              <button
                type="button"
                onClick={() => removeObjective(obj.id)}
                disabled={state.objectives.length <= 1}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-30 transition-colors"
                aria-label="Remove objective"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addObjective}
          disabled={state.objectives.length >= 8}
          className="mt-2.5 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:opacity-40 transition-colors font-medium"
        >
          + Add objective
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Current TRL *</label>
          <select
            value={state.currentTrl}
            onChange={(e) => update({ currentTrl: e.target.value })}
            className="field-input"
          >
            <option value="">Select…</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={String(n)}>TRL {n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Target TRL at project end *</label>
          <select
            value={state.targetTrl}
            onChange={(e) => update({ targetTrl: e.target.value })}
            className="field-input"
          >
            <option value="">Select…</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={String(n)}>TRL {n}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label">Gap in the state of the art *</label>
        <textarea
          rows={3}
          value={state.stateOfArtGap}
          onChange={(e) => update({ stateOfArtGap: e.target.value })}
          placeholder="What specific limitations in existing approaches does this project address? (2–4 sentences)"
          className="field-input resize-y"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Consortium
// ---------------------------------------------------------------------------

const PARTNER_TYPES: Partner['type'][] = [
  'University', 'Research Institute', 'SME', 'NGO', 'Industry', 'Public Body', 'Other',
];

function Step3({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  function updatePartner(id: string, patch: Partial<Partner>) {
    update({ partners: state.partners.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  }
  function addPartner() {
    update({
      partners: [
        ...state.partners,
        { id: uuidv4(), name: '', country: '', type: 'Research Institute', role: '', expertise: '' },
      ],
    });
  }
  function removePartner(id: string) {
    if (state.partners.length <= 1) return;
    update({ partners: state.partners.filter((p) => p.id !== id) });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Consortium</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Add all partner organisations. The first partner is the coordinator.
        </p>
      </div>

      <div className="space-y-4">
        {state.partners.map((partner, idx) => (
          <div key={partner.id} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Partner {idx + 1}{idx === 0 ? ' · Coordinator' : ''}
              </span>
              <button
                type="button"
                onClick={() => removePartner(partner.id)}
                disabled={state.partners.length <= 1}
                className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
              >
                Remove
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="field-label">Organisation name *</label>
                <input
                  value={partner.name}
                  onChange={(e) => updatePartner(partner.id, { name: e.target.value })}
                  placeholder="e.g. Wageningen University & Research"
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Country *</label>
                <CountrySelect
                  value={partner.country}
                  onChange={(code) => updatePartner(partner.id, { country: code })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">Organisation type</label>
                <select
                  value={partner.type}
                  onChange={(e) => updatePartner(partner.id, { type: e.target.value as Partner['type'] })}
                  className="field-input"
                >
                  {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Role in project *</label>
                <input
                  value={partner.role}
                  onChange={(e) => updatePartner(partner.id, { role: e.target.value })}
                  placeholder="e.g. AI development, WP2 lead"
                  className="field-input"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Key expertise</label>
              <input
                value={partner.expertise}
                onChange={(e) => updatePartner(partner.id, { expertise: e.target.value })}
                placeholder="e.g. Agricultural AI, crop modelling, remote sensing"
                className="field-input"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addPartner}
        disabled={state.partners.length >= 10}
        className="btn-secondary"
      >
        + Add partner
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Timeline & budget
// ---------------------------------------------------------------------------

function Step4({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Timeline & budget</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Duration and budget define the project's scope.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Project duration (months) *</label>
          <select
            value={String(state.durationMonths)}
            onChange={(e) => update({ durationMonths: Number(e.target.value) })}
            className="field-input"
          >
            {[24, 36, 42, 48, 60].map((m) => (
              <option key={m} value={String(m)}>{m} months</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Total budget (€) *</label>
          <input
            value={state.totalBudgetEuros}
            onChange={(e) => update({ totalBudgetEuros: e.target.value })}
            placeholder="e.g. 3,800,000"
            className="field-input"
          />
        </div>
      </div>

      <div>
        <label className="field-label">Key milestones</label>
        <textarea
          rows={5}
          value={state.keyMilestones}
          onChange={(e) => update({ keyMilestones: e.target.value })}
          placeholder={`MS1 (M6): Data Management Plan submitted\nMS2 (M24): AI engine validated (go/no-go)\nMS3 (M44): Pilot season KPIs confirmed`}
          className="field-input resize-y font-mono text-xs"
        />
        <p className="field-hint">One milestone per line. Format: MS1 (M6): description</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Scheme selection
// ---------------------------------------------------------------------------

const SCHEMES = [
  {
    id: 'horizon_europe_ria_ia' as const,
    name: 'Horizon Europe RIA / IA',
    description: 'Research and Innovation Action or Innovation Action under Horizon Europe. Evaluated on Excellence, Impact, and Quality & Efficiency of Implementation.',
    region: 'EU',
    badge: 'Active',
  },
];

function Step5({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Select funding scheme</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          The scheme pack determines evaluation criteria, rubric, and section guidance.
        </p>
      </div>

      <div className="space-y-3">
        {SCHEMES.map((scheme) => (
          <label
            key={scheme.id}
            className={`flex gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-150 ${
              state.schemeId === scheme.id
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name="schemeId"
              value={scheme.id}
              checked={state.schemeId === scheme.id}
              onChange={() => update({ schemeId: scheme.id })}
              className="mt-1 accent-brand-600 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{scheme.name}</p>
                <span className="badge badge-brand">{scheme.badge}</span>
                <span className="badge badge-slate">{scheme.region}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{scheme.description}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="rounded-xl px-4 py-3 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
        More scheme packs coming in v1.0. Want to contribute one?{' '}
        <a
          href="https://github.com/selinachegg/research-grant-craft/issues/new?template=new_scheme_pack.yml"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          Open an issue
        </a>
        .
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateStep(state: WizardState, step: number): string[] {
  const errors: string[] = [];
  if (step === 1) {
    if (!state.acronym.trim()) errors.push('Project acronym is required.');
    if (!state.fullTitle.trim()) errors.push('Full project title is required.');
    if (state.abstract.trim().split(/\s+/).filter(Boolean).length < 30)
      errors.push('Abstract should be at least 30 words.');
  }
  if (step === 2) {
    if (state.objectives.filter((o) => o.text.trim()).length < 1)
      errors.push('At least one objective is required.');
    if (!state.currentTrl) errors.push('Current TRL is required.');
    if (!state.targetTrl) errors.push('Target TRL is required.');
    if (!state.stateOfArtGap.trim()) errors.push('State-of-art gap description is required.');
  }
  if (step === 3) {
    if (state.partners.some((p) => !p.name.trim() || !p.country.trim()))
      errors.push('All partners must have a name and country.');
  }
  if (step === 4) {
    if (!state.totalBudgetEuros.trim()) errors.push('Total budget is required.');
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Main wizard page
// ---------------------------------------------------------------------------

export default function WizardPage() {
  const params = useParams();
  const router = useRouter();
  const wizardId = params.wizardId as string;

  const [state, setState] = useState<WizardState>(emptyWizardState);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!wizardId) return;
    setState(loadWizardState(wizardId));
    setLoaded(true);
  }, [wizardId]);

  const update = useCallback(
    (patch: Partial<WizardState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        saveWizardState(wizardId, next);
        return next;
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    },
    [wizardId],
  );

  function goNext() {
    const errs = validateStep(state, state.currentStep);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    if (state.currentStep < WIZARD_STEPS.length) {
      update({ currentStep: state.currentStep + 1 });
    } else {
      const draftId = uuidv4();
      linkWizardToDraft(wizardId, draftId);
      router.push(`/editor/${draftId}?wizardId=${wizardId}`);
    }
  }

  function goBack() {
    setErrors([]);
    if (state.currentStep > 1) update({ currentStep: state.currentStep - 1 });
  }

  if (!loaded) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <div className="space-y-4">
          <div className="skeleton h-8 w-48 rounded-xl" />
          <div className="skeleton h-4 w-64 rounded-lg" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  const step = state.currentStep;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            All proposals
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">New proposal</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">#{wizardId.slice(0, 8)}</p>
        </div>
        {saved && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckMiniIcon className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} total={WIZARD_STEPS.length} />

      {/* Card */}
      <div className="card p-6 sm:p-8">
        {step === 1 && <Step1 state={state} update={update} />}
        {step === 2 && <Step2 state={state} update={update} />}
        {step === 3 && <Step3 state={state} update={update} />}
        {step === 4 && <Step4 state={state} update={update} />}
        {step === 5 && <Step5 state={state} update={update} />}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-5 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
              {errors.map((e) => (
                <li key={e} className="flex items-start gap-1.5">
                  <span className="shrink-0">·</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="btn-secondary disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={goNext}
            className="btn-primary"
          >
            {step < WIZARD_STEPS.length ? (
              <>Continue <ArrowRightIcon className="w-3.5 h-3.5" /></>
            ) : (
              <>Generate draft <SparklesIcon className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">
        Answers saved automatically in your browser · nothing sent to any server
      </p>
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

function CheckMiniIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
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

function SparklesIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.684-2.051a1 1 0 0 1 .632-.632l2.051-.684a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.632-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.184a1 1 0 0 1 .633.632l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.632l.551-.184a1 1 0 0 0 0-1.898l-.551-.183a1 1 0 0 1-.632-.633l-.184-.551Z" />
    </svg>
  );
}
