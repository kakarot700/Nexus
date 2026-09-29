# NEXUS

NEXUS turns an ambiguous real-world problem into a structured, evaluated, explainable direction and a small interactive prototype. This repository now contains a runnable, local-first implementation of the context pack requirements.

## Run it

Requirements: Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Next.js. To verify a production static export, run `npm run build`. The generated site is written to `out/` and can be hosted as static files; it needs no server-side environment variables, account, database, or API key.

## What works

- Map the user's problem and optional user-supplied people, goals, and constraints.
- Keep source IDs and `USER_PROVIDED`/`PROPOSED` labels visible; show missing context as needing verification.
- Explore three genuinely distinct, generic solution patterns without presenting them as AI-validated or domain-specific facts.
- Edit qualitative criterion statuses and explanations, optionally linking existing evidence and constraints.
- Apply a disclosed non-weighted rule to produce `PROMISING`, `NEEDS_WORK`, or `INCOMPATIBLE`.
- Record a user-selected direction separately from the recommendation, with the sources the user chose to cite.
- Try a one-interaction prototype sketch and add a note held only for the current page session.
- Follow a source-linked Decision Trail.

## Important limitations

There is no live AI provider, external research, account, server persistence, or data export in this implementation. The approaches are local strategy templates, not model output or advice. Assessments are entered by the user, not independently verified. Refreshing or closing the page clears the working session. See [implementation assumptions](docs/IMPLEMENTATION_ASSUMPTIONS.md) for the exact decision semantics and recommendation rule.

## Validate

```sh
npm run typecheck
npm test
npm run build
```

The automated tests cover user-input normalization, preservation and classification of evidence, distinct proposed strategies, unknown handling, source-reference filtering, prototype limitations, and every branch of the qualitative recommendation rule. The interface uses semantic controls, visible focus, reduced-motion support, and mobile-first layouts.
