# Implementation assumptions

This runnable version uses only the requirements in the context pack. It does not claim to provide a live AI provider, external research, or domain-specific expertise.

## Decision semantics

A `Decision` is the direction the user explicitly selects. A system recommendation is kept separate as an evaluation summary; it never silently selects a direction. The selected direction records the user's rationale and only the evidence and constraints the user chose to cite. This is a local, in-memory working record, not a persisted or submitted decision.

## Overall recommendation

Assessments are qualitative and are entered by the user; all criteria begin as `UNKNOWN`. The rule is:

- `INCOMPATIBLE` if any criterion is `FAIL`.
- `PROMISING` only if all six criteria are `PASS`.
- `NEEDS_WORK` for every other combination, including any `PARTIAL` or `UNKNOWN`.

No weights, scores, or implied probabilities are used. This conservative rule makes uncertainty visible and does not treat missing evidence as success.

## Local guided mode

The workspace maps only text the user supplied. Its three strategy patterns are generic, distinct starting proposals (`PROPOSED`), not AI-generated or validated answers. The user supplies stakeholder names, goals, constraints, explanations, assessments, and source links. Missing information stays unresolved and is labeled as needing verification. The prototype demonstrates one local note-taking interaction; it does not contact people, persist data, or establish that a proposed approach works.

## Runtime choices

Next.js, React, and TypeScript follow the accepted stack decision. The app is statically exportable, needs no account, server, database, API key, or external integration, and uses built-in Node test tooling to avoid an unnecessary test-framework dependency. No external decorative images were added because the design system calls for a structured, editorial instrument and rules out decorative imagery.
