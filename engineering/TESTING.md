# NEXUS TESTING

## Unit
Test domain logic, validation, normalization, and deterministic evaluation rules.

## Integration
Test AI boundary handling, retries, schema validation, and workflow transitions.

## UI/browser
Test the primary flow and important states at mobile and desktop sizes when tooling permits.

Critical cases:
- valid problem
- empty input
- malformed AI output
- timeout
- provider failure
- fallback
- retry
- long text
- no solutions
- partial evaluation
- mobile keyboard
- narrow viewport

Tests must verify behavior, not merely execution.
