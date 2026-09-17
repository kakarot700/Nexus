# NEXUS COMPONENT RULES

Components represent concepts, not arbitrary boxes.

## Hierarchy
Primitives: Button, Input, Text, Divider, Icon, Tooltip.
Interface: ProblemInput, ConstraintItem, EvidenceBadge, SolutionItem, EvaluationRow.
Product: ProblemMap, SolutionGraph, SolutionComparison, DecisionTrail, PrototypePreview.

Search for an existing component before creating one.

Buttons need clear labels, focus, disabled/loading states where relevant, and adequate touch area.

Loading should communicate actual progress when possible.

Empty states explain what is missing and what to do.

Errors explain what happened, whether work is safe, and what to do next.

Avoid deep card nesting.

A component handling provider calls, business logic, state management, and complex rendering is probably too large.
