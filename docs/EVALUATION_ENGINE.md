# NEXUS EVALUATION ENGINE

## Criteria and statuses

The user reviews six criteria: constraint compatibility, feasibility, impact, accessibility, implementation complexity, and risk.

| Status | Meaning |
|---|---|
| `PASS` | The user's cited evidence supports the criterion. |
| `PARTIAL` | Some requirements are addressed or uncertainty remains. |
| `FAIL` | A known requirement is violated. |
| `UNKNOWN` | Evidence is insufficient; missing information is not treated as success. |

Every criterion begins `UNKNOWN` with a specific next-check explanation. The user can change a status, write the reason, and cite existing evidence and constraints. The critic's prompts and solution proposals do not change evaluation statuses.

## Aggregate recommendation

This implementation uses the already documented conservative, non-weighted policy:

- Any criterion `FAIL` → `INCOMPATIBLE`.
- All six criteria `PASS` → `PROMISING`.
- Every other combination, including any `PARTIAL` or `UNKNOWN` → `NEEDS_WORK`.

The rule computes only from the six status values supplied by the user. It does not add points, weights, thresholds, estimated probability, rankings, or independent validation. The recommendation is visibly separate from the user's selected direction and rationale.

## Explanations and sources

Every criterion has a reason and may cite only existing evidence and constraint IDs. The trail resolves these IDs to the actual text and provenance. `PASS` is not independently verified by the system; it records the user's qualitative assessment. Do not fabricate precision or present a proposed response as proof of compatibility.
