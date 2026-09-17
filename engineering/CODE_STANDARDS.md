# NEXUS CODE STANDARDS

Use strict TypeScript. Avoid `any` except at documented external boundaries.

Keep components cohesive. Separate rendering from domain logic and provider calls.

Use descriptive names such as ProblemInput, ConstraintList, SolutionGraph, EvaluationPanel, DecisionTrail.

Prefer small composable functions.

Never silently swallow errors.

Comments explain why, not obvious mechanics.

Remove unused imports, debug logs, dead code, abandoned experiments, and commented-out implementations before completion.

Follow the repository's formatter, linter, and conventions.
