# NEXUS FEATURE SPECIFICATION

## P0
- problem input
- problem analysis
- stakeholder extraction
- evidence classification
- constraint extraction
- multiple solution generation
- critique
- constraint-aware evaluation
- Solution Graph
- Decision Trail
- prototype vertical slice

## P1
- streaming progress
- retry/fallback
- export/shareable result
- accessibility
- mobile optimization
- resilient errors

## P2
Only after P0 is stable:
- saved sessions
- comparison history
- richer prototype generation
- additional providers

## Avoid
Auth, profiles, social feeds, chat, payments, notifications, admin dashboards, analytics dashboards, model marketplaces, and large integration collections unless a real requirement makes one essential.

## Feature gate
Before adding a feature ask:
- Which pipeline stage does it improve?
- What user problem does it solve?
- Can the outcome be achieved more simply?
- Is added complexity justified?
