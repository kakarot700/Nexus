# NEXUS first vertical slice

Branch `feat/core-flow-first-slice` adds a local-first Next.js workspace: problem, evidence/constraints, user-authored or optional AI-proposed strategies, manual qualitative comparison, selected direction, a simple decision walkthrough, optional generated prototype *outline*, and decision trail. AI outputs are validated at API and client boundaries, labeled proposals, and do not replace independent verification. A generated outline is **not** an executable prototype of the strategy. No saved account, external data verification, automated solution scoring, or production hosting is included.

## Setup and validation

Use Node.js 20 or later. Run `npm install`, `npm run typecheck`, `npm test`, and `npm run build`; run `npm run dev` and check keyboard interaction, local persistence, error states, console, and mobile widths 360, 375, 390, 412px, plus desktop. These commands and browser checks **have not been run** in this environment. Dependency resolution, tests, compilation and rendered behavior remain unverified.

For optional AI, copy `.env.example` to `.env.local` and set `NEXUS_AI_URL`, `NEXUS_AI_MODEL`, and `NEXUS_AI_KEY` for a provider with OpenAI-compatible chat completions and JSON mode. Keep secrets server-side. Without them the manual flow works and AI requests return an explicit unavailable response. User input sent to AI leaves the local browser and is processed by the configured provider. Do not expose an unprotected paid AI endpoint publicly: add authentication, durable rate limits, cost controls and abuse monitoring before production deployment.

## Remaining work

Implement mechanism-specific interactive prototypes, per-criterion evidence-backed evaluations, robust generated-output schema and sanitization checks, accessibility and browser automation, provider retry/fallback, export, production security and deployment validation. Verify official hackathon rules before event-specific claims. Do not call this a finished, tested product until validation and those scope decisions are resolved.
