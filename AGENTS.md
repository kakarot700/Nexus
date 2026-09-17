# NEXUS AI DEVELOPMENT CONSTITUTION

NEXUS is an AI problem-solving engine. Its core flow is:

Problem → Evidence → Constraints → Solutions → Evaluation → Prototype → Decision

## Mandatory agent workflow
Before changing code:
1. Read this file.
2. Read relevant docs under docs/, design/, engineering/, and checklists/.
3. Inspect the existing implementation.
4. Reuse existing components and utilities.
5. Plan non-trivial changes before coding.
6. Implement the smallest coherent change.
7. Validate the result, including rendered UI for UI work.

## Product rules
NEXUS must not become a generic chatbot, AI wrapper, SaaS dashboard, social network, AI marketplace, CRUD app, or collection of decorative feature cards.

Every feature must strengthen the core problem-solving flow.

## Design rules
Avoid generic AI aesthetics: purple gradients, excessive glassmorphism, giant rounded cards, decorative statistics, gradient text, glowing AI orbs, robot illustrations, excessive pills, random icons, unnecessary shadows, dashboard sidebars, decorative particles, and meaningless animation.

Use the documented design system instead of inventing visual patterns.

## Engineering rules
Prefer strict TypeScript, cohesive components, explicit domain models, validated boundaries, provider-independent AI logic, graceful failure, semantic HTML, mobile-first implementation, and minimal dependencies.

Avoid unnecessary libraries, duplicated logic, giant components, hidden global state, magic values, speculative abstractions, and unrelated refactors.

## AI safety
Model output is untrusted input. Parse, validate, normalize, sanity-check, then render it.

Evidence states:
- USER_PROVIDED
- DERIVED
- PROPOSED
- UNVERIFIED

Never present an AI assumption as a known fact.

## Mobile
Primary device is a phone. Validate at 360px, 375px, 390px, and 412px. No horizontal scrolling.

## No fake functionality
Never ship controls that only look functional. Provide real behavior or clearly expose the limitation.

## Definition of done
Relevant behavior, loading, empty, error, success, accessibility, responsive behavior, tests, and console state must be checked.

## Uncertainty
Do not invent product decisions. Check the documentation first. If still unspecified, choose the smallest coherent behavior and document the decision.
