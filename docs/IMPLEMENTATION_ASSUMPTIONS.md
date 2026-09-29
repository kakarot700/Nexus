# Implementation assumptions

This implementation follows the current context pack. It does not claim external research, expert validation, model capability, facts not present in user input, or any event/hackathon rule.

## Source and analysis

The user's original statement is preserved verbatim. Exact optional field lines create source objects. Local categories use visible deterministic keyword rules; the category is `DERIVED` (and `OTHER` is `UNVERIFIED`) independently from the supplied text. Local mapping does not infer unprovided facts. Optional server model output is normalized and source-checked; ungrounded claims stay `PROPOSED`/`UNVERIFIED` or are dropped.

## Solution and critic

The deterministic demo includes five generic, structurally different strategies: software, human + software, infrastructure, behavioral, and hybrid. They are starting proposals, not AI-generated, validated, or domain-specific answers. Each has explicit resources, risks, assumptions, and a proposal/limitation for supplied constraints. The critic challenges the proposal; findings are checks/unknowns, not confirmed defects.

## Evaluation

Assessments are qualitative, user-entered, and begin `UNKNOWN`; each criterion includes a reason and optional source IDs. The aggregate rule is: any `FAIL` → `INCOMPATIBLE`; all six `PASS` → `PROMISING`; otherwise `NEEDS_WORK`. No weights, numerical scores, or probability are used. This recommendation is separate from a `USER_SELECTED` direction and does not choose for the user.

## Prototype, decision and persistence

The prototype demonstrates a local interaction selected by the chosen strategy (note-taking, intake, access-location, reminder, or offline-pack sketch). It is not a working external service; user notes are cleared on refresh. Decisions and citations remain in page memory only and are not persisted or submitted.

## Provider and runtime

Deterministic demo mode is default and visibly named. An optional server-only OpenAI adapter handles only analysis and solution generation when `NEXUS_AI_PROVIDER`, `OPENAI_API_KEY`, and `OPENAI_MODEL` are all configured. JSON mode does not guarantee schema conformity; validation, sanitization, bounded failure handling, and visible per-stage fallback are always applied. The critic, evaluation, decision, and prototype remain deterministic/user-controlled.
