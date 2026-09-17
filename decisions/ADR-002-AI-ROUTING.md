# ADR-002: AI ROUTING

Decision: AI provider access is abstracted behind a provider interface.

Reason: switch between available free, sponsor, and fallback providers without rewriting the product.

Requirements:
- provider-independent domain models
- schema validation
- retry
- graceful fallback
- observable failure state

Status: Accepted
