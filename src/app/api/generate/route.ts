/**
 * POST /api/generate
 *
 * Generate an initial proposal draft from wizard state.
 *
 * Request body:
 *   {
 *     wizardState: WizardState,
 *     config: LlmConfig        // endpoint + apiKey + model
 *   }
 *
 * Response:
 *   { draftMarkdown: string, isMock: boolean }
 *
 * Behaviour:
 *   - If config.endpoint or config.apiKey is empty → mock mode (no external call).
 *   - Otherwise → calls the configured OpenAI-compatible endpoint.
 *
 * Errors:
 *   400  Missing or invalid body
 *   502  Upstream LLM API error
 *   500  Internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMockDraft } from '@/lib/llm/mock';
import type { WizardState } from '@/lib/wizard/types';
import type { LlmConfig } from '@/lib/llm/types';

function buildPrompt(state: WizardState): string {
  const objectives = state.objectives
    .filter((o) => o.text.trim())
    .map((o, i) => `O${i + 1}: ${o.text}`)
    .join('\n');

  const partners = state.partners
    .filter((p) => p.name.trim())
    .map(
      (p) =>
        `- ${p.name} (${p.country}, ${p.type}): ${p.role}${p.expertise ? ' — ' + p.expertise : ''}`,
    )
    .join('\n');

  return `You are a senior Horizon Europe proposal consultant. Produce a STRUCTURED GRANT APPLICATION TEMPLATE in Markdown for a Horizon Europe RIA/IA proposal.

---

## RESEARCHER INPUT

**Project acronym:** ${state.acronym || '[not set]'}
**Full title:** ${state.fullTitle || '[not set]'}
**Duration:** ${state.durationMonths} months
**Total budget:** €${state.totalBudgetEuros || '[not specified]'}
**TRL journey:** ${state.currentTrl || '?'} → ${state.targetTrl || '?'}

**Research idea / abstract (primary AI input):**
${state.abstract || '[No abstract provided — all sections will need manual completion]'}

**Stated objectives:**
${objectives || '[None stated]'}

**Gap in state of the art:**
${state.stateOfArtGap || '[Not described]'}

**Consortium partners:**
${partners || '[Not specified]'}

**Key milestones:**
${state.keyMilestones || '[Not specified]'}

---

## OUTPUT RULES

Produce the full Horizon Europe proposal template covering sections 1 (Excellence), 2 (Impact), and 3 (Implementation) with all official sub-sections.

Apply these rules for EVERY paragraph and table cell:

**RULE A — Write content** when you can meaningfully infer it from the abstract or intake data. Prefix AI-drafted sentences with "(AI draft — verify:)" so the researcher knows to check and expand them.

**RULE B — Insert a fill-in cell** when information is missing or must come from the researcher. Use this exact inline format:
\`[FILL IN: specific, actionable guidance on exactly what to write here]\`

**RULE C — Add a guidance blockquote** at the end of each complex sub-section:
> **Guidance:** What evaluators look for in this sub-section and tips for completing it.

Additional rules:
- NEVER skip or leave blank any sub-section. Every sub-section needs either content or a fill-in cell.
- For each objective the researcher stated, keep it and suggest a SMART reformulation in parentheses if useful.
- If no objectives were stated, propose 4–5 based on the abstract and mark each as "(AI suggestion — verify and adjust:)".
- All required Horizon Europe tables must be included: Work Package table, Milestone table, Deliverable list, Risk Register, Budget table. Populate rows with available data; use \`[FILL IN: ...]\` for every unknown cell.
- The Work Package table must cover WP1 Management, plus one WP per major research theme you can identify from the abstract, plus a final WP for Dissemination & Exploitation.
- Write in formal academic English.
- Output ONLY the Markdown proposal. No preamble, no closing remarks outside the document.`;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
  }

  const { wizardState, config } = body as { wizardState: unknown; config: unknown };

  if (!wizardState || typeof wizardState !== 'object') {
    return NextResponse.json({ error: '`wizardState` is required.' }, { status: 400 });
  }

  const llmConfig = (config as LlmConfig | undefined) ?? { endpoint: '', apiKey: '', model: 'gpt-4o' };
  const state = wizardState as WizardState;

  // Mock mode: no endpoint or no key configured
  const isMock = !llmConfig.endpoint || !llmConfig.apiKey;

  if (isMock) {
    const draftMarkdown = generateMockDraft(state);
    return NextResponse.json({ draftMarkdown, isMock: true }, { status: 200 });
  }

  // Live mode: call the configured OpenAI-compatible endpoint
  try {
    const prompt = buildPrompt(state);

    const upstream = await fetch(`${llmConfig.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: llmConfig.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert scientific grant writer. Produce well-structured, accurate Markdown proposal drafts.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('[/api/generate] Upstream error:', upstream.status, errText);
      return NextResponse.json(
        { error: `LLM API returned ${upstream.status}. Check your endpoint and API key.` },
        { status: 502 },
      );
    }

    const data = await upstream.json();
    const draftMarkdown: string =
      data?.choices?.[0]?.message?.content ?? generateMockDraft(state);

    return NextResponse.json({ draftMarkdown, isMock: false }, { status: 200 });
  } catch (err) {
    console.error('[/api/generate] Error calling LLM:', err);
    return NextResponse.json(
      { error: 'Internal error calling LLM. Check server logs.' },
      { status: 500 },
    );
  }
}
