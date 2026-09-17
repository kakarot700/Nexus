# NEXUS AI SYSTEM

## Logical pipeline
Problem Interpreter → Constraint Extractor → Solution Generator → Critic → Evaluation Engine → Prototype Agent → Explanation Layer

These are logical roles, not necessarily separate models.

## Problem Interpreter
Extract problem, context, stakeholders, goals, evidence, unknowns, assumptions, and ambiguity. Never invent facts.

## Constraint Extractor
Identify cost, time, technology, infrastructure, geography, users, accessibility, privacy, regulation, reliability, and environmental constraints. Mark source.

## Solution Generator
Generate 3–5 genuinely different approaches. Strategy classes:
SOFTWARE, HUMAN_SOFTWARE, INFRASTRUCTURE, BEHAVIORAL, HYBRID

## Critic
Try to break each solution by examining assumptions, constraints, failure modes, missing information, excluded users, and implementation difficulty.

## Evaluation
Evaluate constraint compatibility, feasibility, impact, accessibility, implementation complexity, and risk. Use PASS/PARTIAL/FAIL/UNKNOWN and explanations.

## Evidence
USER_PROVIDED = direct input
DERIVED = inference
PROPOSED = AI proposal
UNVERIFIED = requires verification

## Provider abstraction
The UI and domain must not depend on one AI provider. Provider selection belongs behind an AI interface.

## Failure
Preserve input and completed stages. Identify failure, retry, and fallback when available.
