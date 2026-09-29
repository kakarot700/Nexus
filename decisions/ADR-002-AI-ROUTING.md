# ADR-002: AI ROUTING

## Decision

Provider access stays behind a provider interface. Deterministic demo mode is the default. An optional, server-only OpenAI Chat Completions adapter is implemented for analysis and solution generation only when explicit server environment variables are set. Other providers remain future work until there is a validated adapter and credential source.

## Reason

This preserves provider-independent domain/UI code while making the project runnable without a key, model choice, unsupported capability assumption, database, or paid dependency.

## Requirements

- structured domain objects and runtime output validation
- preserve direct wording, uncertainty, and resolvable source IDs
- safe bounded request/timeout and disclosed deterministic fallback
- keep keys server-only; never serialize them to the browser
- report each generative stage accurately when live and deterministic output are mixed
- do not call deterministic templates or rules live AI

## Status

Accepted; implementation details recorded in [AI System](../docs/AI_SYSTEM.md), [schemas](../docs/AI_SCHEMAS.md), and [deployment requirements](../engineering/DEPLOYMENT.md).
