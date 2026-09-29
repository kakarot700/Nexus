# NEXUS

NEXUS is a source-aware problem-solving workspace. It keeps the user's wording and evidence visible, compares structurally distinct approaches, challenges each proposal, explains a qualitative evaluation, and records a user-selected direction with its rationale and citations.

## Run locally

Requirements: Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Next.js. For a production-style server build, run `npm run build && npm start`.

## Validate

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The tests cover input/domain validation, provenance normalization, distinct strategies, source-reference integrity, safe provider failures, critic checks, prototype behavior, and qualitative evaluation rules.

## Demo and optional live AI

The default is **deterministic demo mode**, not live AI. It uses local rules to preserve the input, categorize supplied constraints, produce five generic but structurally different strategy templates, run a deterministic critic, and initialize qualitative assessments as `UNKNOWN`. It makes no model request and does not present its proposals as generated or validated answers.

To enable optional live analysis and solution generation, set these variables on the **server only**:

```sh
NEXUS_AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

The configured model must be available to the OpenAI API account and accept the request format. NEXUS uses the official Chat Completions API route and JSON-object response mode, then validates, normalizes, and source-checks every response locally. JSON mode is not schema enforcement. Provider failures, refusals, invalid JSON, invalid schema, or timeouts switch that stage to a visibly disclosed deterministic fallback. The critic, evaluation, decision record, and prototype interaction remain deterministic/user-controlled in either mode. No provider credentials are exposed to the browser; never add a `NEXT_PUBLIC_` prefix. See [.env.example](.env.example), [AI system](docs/AI_SYSTEM.md), and [deployment guide](engineering/DEPLOYMENT.md).

Live mode sends the submitted problem text to the configured AI provider. Provider handling depends on the provider account settings and terms. NEXUS itself has no authentication, database, or session persistence; the current workspace and prototype note exist only in the page session. Hosting platforms can apply their own operational metadata and retention policies.

The API routes are public and have no distributed application-level rate limit. Keep demo mode when no provider quotas are configured; before enabling a live key on a public deployment, configure provider/project usage quotas and upstream throttling.

## Product boundaries

- Direct input keeps `USER_PROVIDED` provenance; derived, proposed, and unverified claims stay labeled. Missing source references are not invented.
- Five local strategy patterns are structurally distinct, not five phrasings of the same app.
- Critic findings are challenges to verify, not confirmed failures.
- Every criterion starts `UNKNOWN`; the user edits qualitative statuses and explanations. The no-weight recommendation rule is documented in [evaluation engine](docs/EVALUATION_ENGINE.md).
- A recommendation never selects for the user. The decision and its evidence/constraint references are kept separately.
- The prototype is one working, strategy-specific local interaction sketch; it is not a deployed service or evidence that an approach works.

## Deployment

NEXUS needs a Node.js server runtime for its same-origin API routes. It is not a static export. Production deployment must be tested against the same commit and should remain in deterministic demo mode unless live provider credentials are intentionally configured. See [deployment requirements](engineering/DEPLOYMENT.md).
