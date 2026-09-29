import {
  EVALUATION_CRITERIA,
  type CriterionAssessment,
  type Evaluation,
  type EvaluationCriterion,
  type EvaluationStatus,
  type Problem,
  type Prototype,
  type Recommendation,
  type Solution,
} from "./types";

export const MAX_PROBLEM_LENGTH = 3_000;
const MAX_LIST_ITEMS = 20;

export interface ProblemInput {
  statement: string;
  stakeholders?: string;
  goals?: string;
  constraints?: string;
}

function lines(value: string | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildProblem(input: ProblemInput): Problem {
  const statement = input.statement.trim();
  if (!statement) throw new Error("Describe the problem before mapping it.");
  if (statement.length > MAX_PROBLEM_LENGTH) {
    throw new Error(`Keep the problem description under ${MAX_PROBLEM_LENGTH} characters.`);
  }

  const stakeholderNames = lines(input.stakeholders);
  const goals = lines(input.goals);
  const constraints = lines(input.constraints);
  if ([stakeholderNames, goals, constraints].some((items) => items.length > MAX_LIST_ITEMS)) {
    throw new Error(`Use no more than ${MAX_LIST_ITEMS} lines in each optional list.`);
  }
  const evidence = [
    { id: "evidence-problem", text: statement, status: "USER_PROVIDED" as const },
    ...stakeholderNames.map((text, index) => ({
      id: `evidence-stakeholder-${index + 1}`,
      text,
      status: "USER_PROVIDED" as const,
    })),
    ...goals.map((text, index) => ({
      id: `evidence-goal-${index + 1}`,
      text,
      status: "USER_PROVIDED" as const,
    })),
  ];

  const unknowns: string[] = [];
  if (!stakeholderNames.length) unknowns.push("Who is affected, and what do they need? Needs verification.");
  if (!goals.length) unknowns.push("What would a useful outcome look like? Needs verification.");
  if (!constraints.length) unknowns.push("Which constraints must any approach satisfy? Needs verification.");

  return {
    statement,
    stakeholders: stakeholderNames.map((name, index) => ({
      id: `stakeholder-${index + 1}`,
      name,
      role: "Role not specified",
    })),
    goals,
    evidence,
    constraints: constraints.map((description, index) => ({
      id: `constraint-${index + 1}`,
      category: "User-stated",
      description,
      source: "USER_PROVIDED",
    })),
    unknowns,
    assumptions: [],
  };
}

export function generateProposedSolutions(problem: Problem): Solution[] {
  const sourceIds = [problem.evidence[0].id];
  return [
    {
      id: "solution-software",
      name: "A lightweight digital touchpoint",
      strategyType: "SOFTWARE",
      summary: "Use a small digital flow to make one useful next step easier to notice and complete.",
      mechanism: ["Choose one action the approach should support.", "Offer a clear prompt and a way to record whether that action happened."],
      requiredResources: ["A clearly defined action", "A person willing to review what the touchpoint records"],
      benefits: ["Can make a process repeatable", "Creates a simple way to notice where a step stalls"],
      risks: ["Could exclude people who cannot or do not want to use the chosen device or channel."],
      assumptions: ["A digital interaction would be acceptable to the people affected; verify before adopting."],
      evidenceIds: sourceIds,
    },
    {
      id: "solution-human-software",
      name: "A human-led, tool-supported workflow",
      strategyType: "HUMAN_SOFTWARE",
      summary: "Pair a named human handoff with a simple shared way to keep the next step visible.",
      mechanism: ["Agree who owns the next action.", "Use a shared checklist or lightweight record to make handoffs visible."],
      requiredResources: ["A willing owner for each handoff", "An agreed, accessible place to record progress"],
      benefits: ["Keeps a person in the loop", "Can be tested with an existing tool before building anything"],
      risks: ["The process may stall if responsibility or follow-through is unclear."],
      assumptions: ["People have enough time and authority to take the agreed handoff; verify with them."],
      evidenceIds: sourceIds,
    },
    {
      id: "solution-behavioral",
      name: "A change to the routine",
      strategyType: "BEHAVIORAL",
      summary: "Try a small change to the sequence, cue, or shared routine before adding a new system.",
      mechanism: ["Identify one moment when a different action could be tried.", "Run a bounded test and ask the people involved what changed."],
      requiredResources: ["Agreement from the people involved", "A simple, observable sign that the test helped or did not help"],
      benefits: ["Can be explored without building new software", "Makes it possible to learn before committing to a larger change"],
      risks: ["A routine change may not last if the underlying conditions remain unchanged."],
      assumptions: ["The people affected can influence the routine; verify who needs to be involved."],
      evidenceIds: sourceIds,
    },
  ];
}

export function emptyEvaluation(solutionId: string): Evaluation {
  const criteria = {} as Record<EvaluationCriterion, CriterionAssessment>;
  for (const criterion of EVALUATION_CRITERIA) {
    criteria[criterion] = {
      status: "UNKNOWN",
      explanation: "Not assessed yet. Add a reason and link any sources you considered.",
      evidenceIds: [],
      constraintIds: [],
    };
  }
  return summarizeEvaluation(solutionId, criteria);
}

export function recommendationFor(criteria: Record<EvaluationCriterion, CriterionAssessment>): Recommendation {
  const statuses = EVALUATION_CRITERIA.map((criterion) => criteria[criterion].status);
  if (statuses.includes("FAIL")) return "INCOMPATIBLE";
  if (statuses.every((status) => status === "PASS")) return "PROMISING";
  return "NEEDS_WORK";
}

export function summarizeEvaluation(
  solutionId: string,
  criteria: Record<EvaluationCriterion, CriterionAssessment>,
): Evaluation {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const unknowns: string[] = [];
  for (const criterion of EVALUATION_CRITERIA) {
    const assessment = criteria[criterion];
    if (assessment.status === "PASS") strengths.push(criterion);
    if (assessment.status === "PARTIAL" || assessment.status === "FAIL") weaknesses.push(criterion);
    if (assessment.status === "PARTIAL" || assessment.status === "UNKNOWN") unknowns.push(criterion);
  }
  return {
    solutionId,
    criteria,
    strengths,
    weaknesses,
    unknowns,
    recommendation: recommendationFor(criteria),
  };
}

export function updateCriterion(
  evaluation: Evaluation,
  criterion: EvaluationCriterion,
  patch: Partial<CriterionAssessment>,
): Evaluation {
  const criteria = {
    ...evaluation.criteria,
    [criterion]: { ...evaluation.criteria[criterion], ...patch },
  };
  return summarizeEvaluation(evaluation.solutionId, criteria);
}

export function sanitizeReferences(ids: string[], validIds: string[]): string[] {
  const valid = new Set(validIds);
  return [...new Set(ids)].filter((id) => valid.has(id));
}

export function buildPrototype(solution: Solution): Prototype {
  return {
    name: `First test · ${solution.name}`,
    purpose: `Explore the proposed mechanism: ${solution.summary}`,
    screens: [
      {
        id: "test-note",
        title: "Record one observation",
        purpose: "Capture what happened when someone considered this proposed direction.",
        interactions: ["Enter a short observation", "Save it in this browser session"],
      },
    ],
    coreInteraction: "Record a short observation against the selected direction.",
    requiredData: ["The selected approach", "A note supplied by the person trying the prototype"],
    knownLimitations: [
      "This is an interaction sketch, not a working service or evidence that the approach will work.",
      "Notes stay in memory and are not saved after this page is refreshed.",
    ],
  };
}

export function isEvaluationStatus(value: string): value is EvaluationStatus {
  return value === "PASS" || value === "PARTIAL" || value === "FAIL" || value === "UNKNOWN";
}
