import {
  buildProblem,
  buildPrototype,
  emptyEvaluation,
  generateProposedSolutions,
  type ProblemInput,
} from "./engine";
import type { Evaluation, Problem, Prototype, Solution } from "./types";

/** Provider-independent boundary. Concrete remote providers can be added without coupling them to the UI. */
export interface AIProvider {
  analyzeProblem(input: ProblemInput): Promise<Problem>;
  generateSolutions(problem: Problem): Promise<Solution[]>;
  evaluateSolutions(problem: Problem, solutions: Solution[]): Promise<Evaluation[]>;
  generatePrototype(problem: Problem, solution: Solution): Promise<Prototype>;
}

/**
 * Offline implementation for this static, credential-free build. It makes no model calls;
 * its proposals are generic patterns, and assessments stay UNKNOWN until a person edits them.
 */
export class LocalGuidedProvider implements AIProvider {
  async analyzeProblem(input: ProblemInput): Promise<Problem> {
    return buildProblem(input);
  }

  async generateSolutions(problem: Problem): Promise<Solution[]> {
    return generateProposedSolutions(problem);
  }

  async evaluateSolutions(_problem: Problem, solutions: Solution[]): Promise<Evaluation[]> {
    return solutions.map((solution) => emptyEvaluation(solution.id));
  }

  async generatePrototype(_problem: Problem, solution: Solution): Promise<Prototype> {
    return buildPrototype(solution);
  }
}
