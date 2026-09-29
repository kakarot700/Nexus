# NEXUS SECURITY

- Treat all browser input and provider output as untrusted. Validate request JSON/body size, text lengths, list counts, enums, strategy diversity, IDs, and reference integrity on the server.
- Preserve exact user text. Do not upgrade an ungrounded claim to `USER_PROVIDED`, a validated fact, or a successful evaluation.
- Render plain text through React's escaped text handling; never render model HTML or execute model-generated code.
- Keep keys server-only. `lib/openai-provider.ts` imports `server-only`; only the server entry point and route handlers import it. Never use `NEXT_PUBLIC_` prefixes or expose credentials through API response bodies, status copy, client bundles, logs, examples, screenshots, or Git history.
- Keep `.env*` ignored except the placeholder `.env.example`. Do not commit `.env`, Vercel/Wrangler metadata, claim tokens, generated screenshots, test artifacts, or temporary files.
- Bound provider calls, map provider errors to short safe messages, and do not include raw response bodies, stack traces, request text, or tokens in user-visible errors.
- The API routes are public and have no authentication or distributed application-level rate limit. Deterministic demo mode makes no provider requests; before enabling live credentials on a public deployment, configure provider/project usage quotas and appropriate upstream throttling. An in-memory per-instance limit would not be a global guarantee.
- Do not add authentication or persistent storage unless an explicit product requirement is approved. NEXUS keeps current work in page memory only; hosting/provider retention policies are separate.
