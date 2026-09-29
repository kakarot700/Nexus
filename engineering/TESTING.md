# NEXUS TESTING

## Unit

Test domain logic, input parsing, source/provenance normalization, duplicate/unknown reference removal, distinct strategies, deterministic critic, prototype behavior, and explained evaluation rules.

## Integration

Test same-origin API request validation, provider modes, malformed/unsupported responses, timeout/rate/network failure, bounded safe error copy, per-stage deterministic fallback, and completed-work preservation.

## UI/browser

When browser tooling permits, exercise the primary problem → map → compare/critic → evaluation → user decision → prototype flow at the specified 360/375/390/412px mobile widths and wide desktop. Verify no horizontal overflow, visible focus, touch targets, status announcement, input/error association, and reduced-motion behavior.

Critical cases: valid and empty input; malformed AI output; timeout/provider failure; demo fallback; retry; long text; no/partial solutions; all-unknown/partial evaluation; narrow viewport; mobile keyboard.

Tests must verify behavior, not merely execution. Demo tests must never characterize deterministic fixtures as live model output.
