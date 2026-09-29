# NEXUS DEPLOYMENT

## Runtime and mode

NEXUS uses Next route handlers and must run as a Node.js server application; do not publish `out/` as a static export. It needs no database, authentication, paid add-on, or custom domain. If the provider variables are absent, deployment runs in the clearly labeled deterministic demo mode.

Optional live generation requires all three server-only variables:

- `NEXUS_AI_PROVIDER=openai`
- `OPENAI_API_KEY=<server secret>`
- `OPENAI_MODEL=<model available to the API account>`

No provider credentials are currently configured for the project environment. Do not use a `NEXT_PUBLIC_` variable for secrets. The documented Chat Completions request, JSON response mode, local runtime validation, 7.5-second request timeout, and deterministic fallback do not assert a model capability beyond the request actually accepted at runtime.

## Verification before release

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and inspect the actual Node server/API responses. Check the primary workflow and the deterministic mode at 360/375/390/412px and desktop widths. The deployed commit must be the commit that passed those checks.

When importing to Vercel, verify the team, GitHub repository, project, and production branch before deployment. For this request only `docs/complete-context-pack` is authorized; do not deploy/merge to `main`, create a PR, change the default branch, modify an unrelated project, add custom domains, or attach paid services. A fresh NEXUS project may use that branch as its production branch only if the existing account/team policy allows it without paid resources or broader branch-policy changes. Stop if the requested branch cannot be deployed and verified under those constraints.
