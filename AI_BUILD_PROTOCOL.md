# NEXUS AI BUILD PROTOCOL

You are working on an existing engineered product, not a blank canvas.

## 1. Understand
Before coding:
- read AGENTS.md
- read relevant documentation
- inspect repository structure
- inspect existing implementation
- identify reusable components
- identify constraints

Do not immediately write code.

## 2. Plan
For non-trivial work, state:
- goal
- files to modify
- genuinely new files
- architectural fit
- risks

## 3. Implement
Implement the smallest coherent version.

Do not refactor unrelated code, redesign unrelated screens, add speculative features, replace working libraries without reason, or rewrite the project unnecessarily.

## 4. Validate
Run appropriate typecheck, lint, tests, build, and browser/UI checks. For UI work inspect required mobile widths.

## 5. Self-critique
Ask:
- Did I solve the requested problem?
- Does it look like NEXUS?
- Did I introduce unnecessary complexity?
- What happens when something fails?
- Does it work on a phone?
- Did I turn assumptions into facts?

## 6. Report
Return:
- what changed
- files changed
- validation performed
- issues discovered
- remaining limitations

Never claim a test was run if it was not run.
