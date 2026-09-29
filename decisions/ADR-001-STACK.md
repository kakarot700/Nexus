# ADR-001: STACK

## Decision

Use TypeScript, React, and Next.js with Vercel-compatible Node.js deployment. The Next.js page/server layer exposes small same-origin route handlers for validated analysis, solution generation, and criticism requests.

## Reason

The stack supports rapid iteration, strong component composition, responsive UI, server-only optional provider credentials, and straightforward deployment.

## Constraint

Avoid infrastructure that does not directly improve the core workflow. The routes do not imply persistent storage, authentication, external model use, or non-demo AI by default. This is not a static export.

## Status

Accepted.
