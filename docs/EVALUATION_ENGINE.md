# NEXUS EVALUATION ENGINE

## Purpose
Turn vague AI judgment into explicit constraint-aware reasoning.

## Criteria
- constraint compatibility
- feasibility
- impact
- accessibility
- implementation complexity
- risk

## Statuses
PASS: evidence supports compatibility.
PARTIAL: some requirements are satisfied or uncertainty remains.
FAIL: a known requirement is violated.
UNKNOWN: insufficient evidence.

Do not fabricate numerical precision. Prefer explicit evidence and explanations.

Expose strengths, weaknesses, failed constraints, unresolved assumptions, and missing information.

## Open decision

The product documents do not define criterion weights or a deterministic rule for
mapping criterion results to `PROMISING`, `NEEDS_WORK`, or `INCOMPATIBLE`. **TODO/question
for the product owner:** should these recommendations be computed from explicit
user-prioritized criteria, use a documented non-weighted rule, or remain qualitative?
Until that policy is decided, show criterion-level results and explanations without
inventing scores, weights, thresholds, rankings, or a deterministic aggregate rule.
