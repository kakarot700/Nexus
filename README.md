# NEXUS

NEXUS is a structured problem-solving workspace: Problem → Evidence → Constraints → Solutions → Evaluation → Prototype → Decision. This branch contains an initial Next.js application alongside the product, design and engineering source-of-truth documents. It is a work in progress, not a finished product.

## Run locally

Requires Node.js 20 or later.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Drafts are stored in your browser's localStorage. The manual flow does not require a key.

Optional AI exploration and prototype **outline** require a trusted OpenAI-compatible chat completions endpoint with JSON mode. Copy `.env.example` to `.env.local`, set `NEXUS_AI_URL`, `NEXUS_AI_MODEL` and `NEXUS_AI_KEY`, then restart the server. Never commit `.env.local` or expose an unprotected paid AI endpoint. Inputs submitted to AI are sent to that provider. Generated content is a proposal, not verified evidence.

## Check

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

CI also runs these checks on pull requests. Read [IMPLEMENTATION.md](IMPLEMENTATION.md) for scope, validation caveats, production safeguards and remaining work. The generated prototype outline is not an executable implementation of a selected strategy.

## Development rules

Read [AGENTS.md](AGENTS.md), [AI_BUILD_PROTOCOL.md](AI_BUILD_PROTOCOL.md) and the relevant documentation before editing. Follow the source-of-truth hierarchy: official hackathon rules, product requirements, design system, architecture decisions, engineering standards, then task-specific instructions. Inspect existing implementation, make the smallest coherent change, and report validation honestly.
