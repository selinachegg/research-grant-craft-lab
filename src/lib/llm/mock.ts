/**
 * mock.ts — Mock LLM adapter.
 *
 * Returns a structured grant application template built from the wizard state.
 * Every section either uses provided data or shows a clearly labelled
 * [FILL IN: ...] cell so the researcher knows exactly what to write.
 * No network calls are made.
 */

import type { WizardState } from '@/lib/wizard/types';

/** Extract the first meaningful sentence from the abstract for use as intro text. */
function firstSentence(text: string): string {
  const s = text.trim().split(/(?<=[.!?])\s+/)[0] ?? text.trim();
  return s.length > 10 ? s : text.trim();
}

export function generateMockDraft(state: WizardState): string {
  const acronym = state.acronym || 'PROJECT';
  const title = state.fullTitle || 'Untitled Project';
  const duration = state.durationMonths || 48;
  const mid = Math.round(duration / 2);
  const coordinator = state.partners[0]?.name || '[FILL IN: Coordinator organisation name]';

  // Abstract-derived intro (use what we have, otherwise a fill-in)
  const hasAbstract = state.abstract.trim().split(/\s+/).filter(Boolean).length >= 15;
  const projectIntro = hasAbstract
    ? `(AI draft — verify:) ${firstSentence(state.abstract)}`
    : `[FILL IN: Write 1–2 sentences summarising the core research challenge and why it matters now]`;

  // Objectives
  const filledObjectives = state.objectives.filter((o) => o.text.trim());
  const objectiveLines =
    filledObjectives.length > 0
      ? filledObjectives
          .map(
            (o, i) =>
              `- **O${i + 1}:** ${o.text.trim()}`,
          )
          .join('\n')
      : `- **O1 (suggested — verify:):** To develop [FILL IN: core technology/method] achieving [FILL IN: measurable target, e.g. ≥85% accuracy] by Month ${mid}.
- **O2:** [FILL IN: "To validate … by Month X"]
- **O3:** [FILL IN: "To demonstrate … at [FILL IN: pilot site/scale] by Month ${duration - 4}"]
- **O4:** [FILL IN: "To exploit/disseminate … reaching [FILL IN: audience/KPI] by Month ${duration}"]`;

  // TRL
  const trlLine =
    state.currentTrl && state.targetTrl
      ? `The technology is currently at TRL ${state.currentTrl}. ${acronym} targets TRL ${state.targetTrl} by Month ${duration}.`
      : `Current TRL: [FILL IN: select TRL 1–9]. Target TRL at project end: [FILL IN: select TRL 1–9] by Month ${duration}.`;

  // State-of-art gap
  const sotaGap = state.stateOfArtGap.trim()
    ? state.stateOfArtGap.trim()
    : `[FILL IN: Describe 2–4 specific limitations of existing approaches that this project addresses. Be concrete — name technologies, papers, or methods that fall short and explain why.]`;

  // Consortium table
  const filledPartners = state.partners.filter((p) => p.name.trim());
  const partnerRows =
    filledPartners.length > 0
      ? filledPartners
          .map(
            (p) =>
              `| ${p.name} | ${p.country || '[CC]'} | ${p.type} | ${p.expertise || p.role || '[FILL IN: expertise]'} | [FILL IN: PM count] |`,
          )
          .join('\n')
      : `| [FILL IN: Organisation name] | [CC] | [Type] | [FILL IN: key expertise] | [FILL IN: PM] |
| [FILL IN: Partner 2] | [CC] | [Type] | [FILL IN: key expertise] | [FILL IN: PM] |`;

  // Milestones
  const milestoneLines = state.keyMilestones.trim()
    ? state.keyMilestones
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => `| ${l.trim()} | [FILL IN: linked deliverable] | [FILL IN: lead partner] |`)
        .join('\n')
    : `| MS1 (M6) | Data Management Plan submitted (D1.1) | ${coordinator} |
| MS2 (M${mid}) | [FILL IN: key technical go/no-go milestone] | [FILL IN: WP lead partner] |
| MS3 (M${duration - 4}) | Pilot validation and KPI confirmation | [FILL IN: pilot lead partner] |
| MS4 (M${duration}) | Final report and exploitation plan | ${coordinator} |`;

  // Budget
  const budgetLine = state.totalBudgetEuros
    ? `€${state.totalBudgetEuros} total across ${duration} months.`
    : `[FILL IN: Total budget in €] across ${duration} months.`;

  return `# ${title} (${acronym})

> **Template mode** — This document is your structured grant application template.
> Search for every \`[FILL IN: ...]\` marker and replace it with your content.
> Sections marked *(AI draft — verify:)* were inferred from your abstract — please check and expand them.

---

## 1. Excellence

### 1.1 Objectives and Ambition

${projectIntro}

${
  hasAbstract
    ? `(AI draft — verify:) ${acronym} addresses the gap described in the call by [FILL IN: connect your approach to the specific call topic and expected outcomes].`
    : `[FILL IN: State the problem your project solves, why it is important now, and how it connects to the Horizon Europe call topic.]`
}

${trlLine}

**Specific objectives of ${acronym}:**

${objectiveLines}

**Gap in the state of the art:**

${sotaGap}

> **Guidance:** Evaluators check that objectives are SMART (Specific, Measurable, Achievable, Relevant, Time-bound) and that the TRL jump is realistic. Quote 3–5 key references to anchor the state-of-art gap.

### 1.2 Methodology

[FILL IN: Describe your overall research approach in 1–2 sentences. What is the core scientific/technical strategy?]

**Primary methods:**

- [FILL IN: Method 1 — e.g., "Federated machine learning across partner datasets"]
- [FILL IN: Method 2 — e.g., "Large-scale field trials at X pilot sites across Y countries"]
- [FILL IN: Method 3 — e.g., "Co-design workshops with end-user communities"]

**Why this methodology?** We considered the following alternatives:

- [FILL IN: Alternative A] — not selected because [FILL IN: reason, e.g., too costly / insufficient coverage / lacks transferability]
- [FILL IN: Alternative B] — not selected because [FILL IN: reason]

**Validation and success criteria:**

[FILL IN: State measurable success criteria for each objective, e.g., "O1 will be validated by achieving ≥X% on benchmark Y, independently verified by Partner Z at Month M."]

> **Guidance:** Reviewers expect a clear causal chain from methods → results → objectives. Explain *why* your methodology is the best fit, not just *what* you will do. Include a brief discussion of risks and how the methodology handles uncertainty.

### 1.3 Beyond the State of the Art

Current approaches are limited by:

1. ${
  state.stateOfArtGap.trim()
    ? state.stateOfArtGap.split(/[.!?]/)[0].trim() + '.'
    : '[FILL IN: Limitation 1 — be specific, cite evidence]'
}
2. [FILL IN: Limitation 2 — describe a second critical gap]
3. [FILL IN: Limitation 3 — optional, but strengthens the case]

${acronym} advances beyond these limitations through:

- [FILL IN: Innovation 1 — concrete technical novelty, e.g., "the first application of X to Y"]
- [FILL IN: Innovation 2 — methodological or process innovation]
- [FILL IN: Innovation 3 — system-level or cross-sector novelty]

> **Guidance:** Be specific. Avoid vague claims like "novel approach". Name the exact prior art you go beyond and explain the scientific leap.

---

## 2. Impact

### 2.1 Expected Outcomes and Impacts

${
  hasAbstract
    ? `(AI draft — verify:) ${acronym} contributes to the call's expected outcomes by [FILL IN: explicitly map your results to the call's listed "Expected Outcomes" — copy the call text and explain how each is addressed].`
    : `[FILL IN: Explain how your project addresses each "Expected Outcome" listed in the call text. Copy each outcome and write 2–3 sentences connecting it to a specific result of your project.]`
}

**Impact KPIs:**

| Indicator | Baseline | Target | Verification point |
|-----------|----------|--------|--------------------|
| [FILL IN: KPI 1, e.g., model accuracy] | [FILL IN: current benchmark] | [FILL IN: target value] | Month ${mid} |
| [FILL IN: KPI 2, e.g., pilot site coverage] | 0 | [FILL IN: target, e.g., 5 countries] | Month ${duration - 4} |
| Open-access publications | 0 | ≥ [FILL IN: number] | Month ${duration} |
| [FILL IN: KPI 4 — economic/societal] | [FILL IN: baseline] | [FILL IN: target] | Month ${duration} |

**Primary beneficiary groups:**

- [FILL IN: Beneficiary group 1 — who, how many, how they benefit, by when]
- [FILL IN: Beneficiary group 2]
- [FILL IN: Beneficiary group 3 — include policy or societal level if applicable]

> **Guidance:** KPIs must be measurable and verifiable. Distinguish between *outputs* (papers, datasets, tools) and *outcomes* (behaviour change, policy uptake, market adoption). Reviewers reward specificity.

### 2.2 Pathway to Impact

**Short-term (during project, M1–M${duration}):**
[FILL IN: List tangible outputs and who will immediately use them — e.g., open datasets, validated tools, pilot site results, trained cohort]

**Medium-term (1–3 years after project):**
[FILL IN: Describe uptake pathway — who takes over, what investment is needed, what market or policy channel is used]

**Long-term (3–10 years):**
[FILL IN: Describe systemic/market impact — scale, economic value, societal change]

**IP and exploitation strategy:**
[FILL IN: State which components are open (licence type) and which are protected (patent, trade secret). Name the partner responsible for commercialisation.]

> **Guidance:** Reviewers look for a realistic, evidenced pathway — not aspirational statements. Reference existing markets, policy frameworks, or stakeholder commitments where possible.

### 2.3 Communication, Dissemination and Exploitation

**Target journals:** [FILL IN: name 2–3 high-impact journals in your field]
**Conferences:** [FILL IN: name 2–3 key conferences, include one policy-facing event]
**Open access:** All peer-reviewed publications will be made immediately open access per HE Article 17 MGA.
**Open data:** All datasets deposited in Zenodo under CC BY 4.0, following FAIR principles, within 6 months of collection.

**Exploitation actions:**

| Action | Lead partner | Target audience | Timeline |
|--------|-------------|-----------------|---------|
| [FILL IN: e.g., Spin-out / licensing] | [FILL IN: partner] | [FILL IN: sector/market] | M[FILL IN] |
| [FILL IN: e.g., Policy brief] | [FILL IN: partner] | [FILL IN: DG / national ministry] | M[FILL IN] |
| [FILL IN: e.g., Open-source release] | [FILL IN: partner] | [FILL IN: community] | M[FILL IN] |

### 2.4 Open Science Practices

- **FAIR data:** All datasets will be assigned a DOI and deposited in Zenodo under CC BY 4.0 within [FILL IN: X months] of collection.
- **Open access:** Mandatory for all publications per HE Article 17.
- **Open source:** [FILL IN: Specify which software components are open-sourced, under which licence (e.g., MIT, Apache 2.0), and on which platform (GitHub, GitLab).]
- **DMP:** Data Management Plan (D1.1) delivered by Month 6 using the EC template.
- **Citizen science / co-design:** [FILL IN: If applicable — describe involvement of end users or citizens in research design or validation; otherwise state "N/A".]

---

## 3. Implementation

### 3.1 Work Plan and Work Packages

| WP | Title | Lead | Start | End | Person-months |
|----|-------|------|-------|-----|--------------|
| WP1 | Project Management & Ethics | ${coordinator} | M1 | M${duration} | [FILL IN: PM] |
| WP2 | [FILL IN: Research/Data WP title] | [FILL IN: lead partner] | M1 | M${mid} | [FILL IN: PM] |
| WP3 | [FILL IN: Development/Technology WP title] | [FILL IN: lead partner] | M${Math.round(duration / 4)} | M${Math.round((3 * duration) / 4)} | [FILL IN: PM] |
| WP4 | [FILL IN: Validation/Pilot WP title] | [FILL IN: lead partner] | M${mid} | M${duration - 4} | [FILL IN: PM] |
| WP5 | Dissemination, Exploitation & Communication | [FILL IN: lead partner] | M1 | M${duration} | [FILL IN: PM] |

**Milestones:**

| Milestone | Description / linked deliverable | Lead partner |
|-----------|----------------------------------|-------------|
${milestoneLines}

**Deliverables:**

| ID | Title | Lead | Type | Month |
|----|-------|------|------|-------|
| D1.1 | Data Management Plan | ${coordinator} | Report | 6 |
| D1.2 | Ethics and data protection framework | ${coordinator} | Report | 3 |
| D2.1 | [FILL IN: WP2 first deliverable] | [FILL IN: partner] | [FILL IN: Report/Dataset/Software] | [FILL IN: M] |
| D3.1 | [FILL IN: WP3 first deliverable] | [FILL IN: partner] | [FILL IN: type] | [FILL IN: M] |
| D4.1 | [FILL IN: Pilot results report] | [FILL IN: partner] | Report | ${duration - 4} |
| D5.1 | Exploitation and Communication Plan | [FILL IN: partner] | Report | 6 |
| D5.2 | Final Exploitation Report | [FILL IN: partner] | Report | ${duration} |

**Gantt overview:**

\`\`\`
WP1  M1 ────────────────────────────────────── M${duration}
WP2  M1 ───────────── M${mid}
WP3       M${Math.round(duration / 4)} ──────────── M${Math.round((3 * duration) / 4)}
WP4                   M${mid} ──────── M${duration - 4}
WP5  M1 ────────────────────────────────────── M${duration}
\`\`\`

Critical path: [FILL IN: Identify the sequence of WPs/tasks where delay propagates to the project end date]

> **Guidance:** Each WP should have a clear scientific/technical purpose, a single lead partner, and a coherent set of tasks. Avoid too many small WPs (5–6 is typical for a 48-month RIA). Ensure every partner has a lead role in at least one WP.

### 3.2 Management Structure and Procedures

${acronym} is coordinated by **${coordinator}**.

**Governance bodies:**

| Body | Composition | Meetings | Remit |
|------|-------------|----------|-------|
| Project Coordinator (PC) | ${coordinator} | Continuous | Day-to-day management, EC interface |
| Steering Committee (SC) | One representative per partner | Quarterly | Strategic decisions, go/no-go at milestones |
| WP Leaders (WPL) | Lead per WP | Monthly | Technical management and reporting |
| External Advisory Board (EAB) | [FILL IN: 3–4 independent experts] | Bi-annual | Scientific quality, exploitation guidance |

**Decision-making:** SC decisions by simple majority. Deadlock resolved by PC casting vote.
**Conflict resolution:** Disputes escalated to SC within 30 days; unresolved disputes follow the MGA dispute procedure.
**Ethics:** [FILL IN: Summarise ethics self-assessment findings. If human participants, personal data, or dual-use research is involved, explain the safeguards.]

**Risk register:**

| ID | Risk description | Category | Likelihood | Impact | Mitigation | Owner |
|----|-----------------|----------|-----------|--------|-----------|-------|
| R1 | [FILL IN: Key technical risk, e.g., "Algorithm does not generalise across datasets"] | Technical | M | H | [FILL IN: mitigation, e.g., "Benchmark on 3 independent datasets from M6"] | [FILL IN: WP lead] |
| R2 | Partner withdrawal or reduced capacity | Consortium | L | H | Knowledge documented from M6; tasks redistributable | ${coordinator} |
| R3 | [FILL IN: External risk, e.g., "Regulatory change affecting data access"] | External | L | M | [FILL IN: mitigation] | [FILL IN: partner] |
| R4 | [FILL IN: Budget risk, e.g., "Equipment cost overrun"] | Financial | L | M | Contingency reserve of [FILL IN: X]% held by coordinator | ${coordinator} |

### 3.3 Consortium as a Whole

| Partner | Country | Type | Key expertise | WP lead |
|---------|---------|------|--------------|---------|
${partnerRows}

**Complementarity:** [FILL IN: Explain in 3–5 sentences why each partner was selected, what unique expertise they bring, and how the consortium covers all required competences without duplication.]

**Third-country partners:** [FILL IN: If any partner is from a non-associated third country, justify their inclusion and confirm no EU funding flows to them (or confirm associated status). Otherwise write "Not applicable."]

### 3.4 Resources and Costs

**Total budget:** ${budgetLine}

| Partner | Personnel (€) | Equipment (€) | Travel (€) | Other direct (€) | Indirect (€) | Total (€) |
|---------|--------------|--------------|-----------|-----------------|-------------|----------|
| ${filledPartners[0]?.name || '[Partner 1]'} | [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] |
${
  filledPartners.length > 1
    ? filledPartners
        .slice(1)
        .map(
          (p) =>
            `| ${p.name} | [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] |`,
        )
        .join('\n')
    : `| [FILL IN: Partner 2] | [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] | [FILL IN] |`
}
| **Total** | **[FILL IN]** | **[FILL IN]** | **[FILL IN]** | **[FILL IN]** | **[FILL IN]** | **${state.totalBudgetEuros ? '€' + state.totalBudgetEuros : '[FILL IN: total €]'}** |

**Person-months justification:**
[FILL IN: State total person-months and explain how they are distributed across WPs. Format: "WP2: X PM (Partner A Y PM, Partner B Z PM) to [describe the task scope]."]

**Equipment:**
[FILL IN: List major equipment items (>€15 000 each) with cost, necessity, and partner. If no major equipment, state "No major equipment items are foreseen."]

**Value for money:**
[FILL IN: Explain why the budget is proportionate to the ambition — reference the TRL uplift, number of pilot sites, size of datasets, or breadth of dissemination to justify the scale.]

> **Guidance:** The budget must be fully justified. Reviewers flag any items not clearly linked to a WP task. Personnel costs are typically 60–75% of total in an RIA. Overhead (indirect costs) is a flat 25% of eligible direct costs.
`;
}
