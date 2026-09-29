# NEXUS AI SYSTEM

## Logical pipeline

Problem Interpreter → Constraint Extractor → Solution Generator → Critic → Evaluation Engine → Prototype Agent → Explanation Layer. These are distinct responsibilities, not a promise of a different model per stage.

## Runtime modes

`NEXUS_AI_PROVIDER=demo` (the default) uses `LocalGuidedProvider`: deterministic problem mapping from submitted fields, a rules-based constraint category suggestion, five distinct strategy templates, a challenge pass, conservative initial assessments, and a local prototype interaction. The UI labels this mode as a deterministic demo, not live AI.

Optional `NEXUS_AI_PROVIDER=openai` enables server-only OpenAI calls for analysis and solution proposals when both `OPENAI_API_KEY` and `OPENAI_MODEL` exist. The adapter uses the documented Chat Completions route. It requests JSON-object output as a serialization aid—not a model-enforced schema—and parses, validates, normalizes provenance, bounds list and text sizes, and sanitizes all references before display. Provider capability cannot be inferred from a model name; unsupported requests become a safe, visibly disclosed fallback.

## Problem Interpreter and constraints

Keep the original user problem statement. Optional people, goals, and constraints remain individually traceable to their supplied text. Names, roles, needs, context, evidence, inferred constraints, unknowns, assumptions, and categories must be labeled according to source and uncertainty. A category derived by deterministic keyword rules is `DERIVED`, not a direct user fact. Never create counts, statistics, policy claims, or numerical constraints.

## Distinct solution paths

Offer 3–5 genuinely different paths using `SOFTWARE`, `HUMAN_SOFTWARE`, `INFRASTRUCTURE`, `BEHAVIORAL`, or `HYBRID`. Each contains a mechanism, required resources, benefits, risks, assumptions, source references, and an explicit proposed response and limitation for each supplied constraint. A model response that reuses strategy types is rejected.

## Critic and evaluation

The deterministic critic checks assumptions, constraint pressure, implementation barriers, possible exclusion, reliability, privacy, accessibility, unknowns, dependencies, and failure modes. A finding is a prompt to verify; it is not a validated defect. Evaluation is deterministic and qualitative. All criterion values begin `UNKNOWN`; the user edits each status and reason. See [the evaluation rules](EVALUATION_ENGINE.md).

## Provider contract and fallback

The provider interface covers analysis, generation, critique, evaluation, and prototype construction. API routes validate request bodies. Secrets are server-side only. The browser calls same-origin routes and keeps completed stages/input if a request fails; the same deterministic methods can complete locally when the API is unreachable. Each generated stage reports whether live AI or fallback was used. No provider response is rendered as trusted HTML.

No API key or live provider is configured for this repository by default.
