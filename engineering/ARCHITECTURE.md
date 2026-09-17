# NEXUS ARCHITECTURE

Preferred stack:
- Next.js
- TypeScript
- React
- Tailwind CSS
- Vercel-compatible deployment
- runtime schema validation
- AI provider abstraction

## Layers
Presentation: screens, components, interaction, accessibility, responsive layout.
Application: workflows, orchestration, state transitions, user actions.
Domain: Problem, Evidence, Constraint, Solution, Evaluation, Decision, Prototype.
AI: providers, prompts, structured outputs, retries, fallback, streaming.

The UI must not directly own provider-specific logic.

## AI interface
```ts
interface AIProvider {
  analyzeProblem(input: string): Promise<ProblemAnalysis>;
  generateSolutions(input: ProblemAnalysis): Promise<Solution[]>;
  evaluateSolutions(problem: ProblemAnalysis, solutions: Solution[]): Promise<Evaluation[]>;
  generatePrototype(problem: ProblemAnalysis, solution: Solution): Promise<Prototype>;
}
```

## Workflow state
```ts
type NexusStage =
  | "INPUT" | "ANALYZING" | "CONSTRAINTS" | "SOLUTIONS"
  | "EVALUATING" | "PROTOTYPE" | "COMPLETE" | "ERROR";
```

Do not add a database unless a real requirement needs one.

Complexity must earn its place.
