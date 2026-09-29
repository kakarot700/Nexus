# NEXUS AI AND DOMAIN SCHEMAS

All external model output is untrusted. Apply `parse → validate → normalize → sanity-check → render` on the server before it reaches the UI.

## Provenance

```ts
type EvidenceStatus = "USER_PROVIDED" | "DERIVED" | "PROPOSED" | "UNVERIFIED";
type StrategyType = "SOFTWARE" | "HUMAN_SOFTWARE" | "INFRASTRUCTURE" | "BEHAVIORAL" | "HYBRID";
```

`USER_PROVIDED` is reserved for text traceable to current user input. A `DERIVED` item must cite source evidence and remains an inference. `PROPOSED` stays a suggestion; `UNVERIFIED` remains unresolved. The normalized domain retains `sourceField` and `sourceQuote` when available, and IDs must resolve to existing objects.

## Problem

`ProblemInput` accepts a required problem statement plus optional newline-delimited stakeholder names, goals, and constraints. The API bounds request size and line lengths.

`Problem` contains `{ problem: { statement, context }, stakeholders, goals, evidence, constraints, unknowns, assumptions }`. Stakeholders preserve the provenance of their name, role, and needs separately. Constraints preserve text source/status, categorical label, category status, and evidence references. The original problem statement is never replaced by model paraphrase. Unsupported context/claims are dropped or demoted rather than promoted to user fact.

## Solution

Each `Solution` contains `id`, `name`, unique `strategyType`, `summary`, `mechanism`, `requiredResources`, `benefits`, `risks`, `assumptions`, valid `evidenceIds`/`constraintIds`, and `constraintResponses` with a proposed response and limitation. A response needs 3–5 items using distinct strategy types. Missing constraint responses are rendered as unresolved; unresolved references are removed. No model evaluation score is accepted.

## Evaluation and decision

`Evaluation` has one qualitative `CriterionAssessment` per declared criterion: `status`, `explanation`, `evidenceIds`, and `constraintIds`. No numeric score is used. The deterministic aggregate rule is in [EVALUATION_ENGINE.md](EVALUATION_ENGINE.md).

`Decision` means only a direction the user explicitly selected. `selectionKind` must be `USER_SELECTED`; user rationale and only chosen source references are stored in page memory. This is not a system recommendation, external submission, or persisted record.

## Critic, graph and prototype

`SolutionCritique` contains typed challenge findings and valid source references. Critic suggestions are `PROPOSED` or `DERIVED`, never automatically factual. `DecisionTrailStep` resolves the evidence and constraint IDs back to their actual descriptions and displays residual uncertainty. The rendered prototype is a trusted, statically implemented interaction profile, not executable model-generated code.
