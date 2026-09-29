# NEXUS ARCHITECTURE

## Stack and runtime

- Next.js, React, and TypeScript.
- Server-rendered entry point plus same-origin Next route handlers; **not** a static export.
- Local Node.js built-in tests; no database, accounts, external image assets, or front-end provider SDK.

## Layers

Presentation: accessible responsive screens, provenance views, interaction state.
Application: the page-session workflow, stage progress, preserved input, retry/fallback, user assessment and decision actions.
Domain: typed `Problem`, `Evidence`, `Constraint`, `Solution`, `SolutionCritique`, `Evaluation`, `Decision`, `DecisionTrailStep`, and `Prototype` values; pure engine, critic, parser, and validation modules.
AI boundary: server-only optional OpenAI adapter, local deterministic provider, validated route handlers. Live calls are confined to analysis and solution generation; critic/evaluation/decision/prototype are deterministic or user-controlled.

The UI calls `/api/nexus/analyze`, `/api/nexus/solutions`, and `/api/nexus/critic`. Provider credentials stay in `lib/openai-provider.ts` on the server, guarded with the `server-only` marker. Provider selection is controlled by server environment variables; the browser cannot select a provider or transmit a key. Every model response is parsed and normalized before entering domain/UI state.

## Workflow and failures

`INPUT → ANALYZING → SOLUTIONS → CRITIC → EVALUATION → USER DECISION → PROTOTYPE`. Each route uses explicit parsing and a bounded execution/timeout. Completed data remains in page memory if a later stage fails. Each generative stage keeps its own live/deterministic mode so mixed responses are disclosed accurately.

## State and complexity

All workspace content is held in React state for the current page session. There is no API-side database or session persistence. Do not add identity, storage, retrieval, external integrations, or a second model per logical stage without a real product requirement.
