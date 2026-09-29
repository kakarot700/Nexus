import {
  buildProblem,
  buildPrototype,
  emptyEvaluation,
  generateProposedSolutions,
} from "./engine";
import { critiqueSolutions } from "./critic";
import type { Evaluation, Problem, ProblemInput, Prototype, Solution, SolutionCritique } from "./types";

/** Provider-independent application boundary. Concrete providers stay in server-only modules. */
export interface AIProvider {
  analyzeProblem(input: ProblemInput): Promise<Problem>;
  generateSolutions(problem: Problem): Promise<Solution[]>;
  critiqueSolutions(problem: Problem, solutions: Solution[]): Promise<SolutionCritique[]>;
  evaluateSolutions(problem: Problem, solutions: Solution[]): Promise<Evaluation[]>;
  generatePrototype(problem: Problem, solution: Solution): Promise<Prototype>;
}

/** Deterministic fallback. It makes no model calls and never presents proposals as verified results. */
export class LocalGuidedProvider implements AIProvider {
  async analyzeProblem(input: ProblemInput): Promise<Problem> {
    return buildProblem(input);
  }

  async generateSolutions(problem: Problem): Promise<Solution[]> {
    return generateProposedSolutions(problem);
  }

  async critiqueSolutions(problem: Problem, solutions: Solution[]): Promise<SolutionCritique[]> {
    return critiqueSolutions(problem, solutions);
  }

  async evaluateSolutions(_problem: Problem, solutions: Solution[]): Promise<Evaluation[]> {
    return solutions.map((solution) => emptyEvaluation(solution.id));
  }

  async generatePrototype(_problem: Problem, solution: Solution): Promise<Prototype> {
    return buildPrototype(solution);
  }
}
