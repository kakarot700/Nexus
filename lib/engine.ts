import {
  EVALUATION_CRITERIA,
  type Constraint,
  type ConstraintCategory,
  type CriterionAssessment,
  type Evaluation,
  type EvaluationCriterion,
  type EvaluationStatus,
  type Problem,
  type ProblemInput,
  type Prototype,
  type Recommendation,
  type Solution,
  type StrategyType,
} from "./types";

export const MAX_PROBLEM_LENGTH = 3_000;
export const MAX_CONTEXT_LINES = 20;
export const MAX_CONTEXT_LINE_LENGTH = 300;

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
  const constraintTexts = lines(input.constraints);
  const groups = [stakeholderNames, goals, constraintTexts];
  if (groups.some((items) => items.length > MAX_CONTEXT_LINES)) {
    throw new Error(`Use no more than ${MAX_CONTEXT_LINES} lines in each optional list.`);
  }
  if (groups.some((items) => items.some((item) => item.length > MAX_CONTEXT_LINE_LENGTH))) {
    throw new Error(`Keep each optional list item under ${MAX_CONTEXT_LINE_LENGTH} characters.`);
  }

  const evidence = [
    { id: "evidence-problem", text: statement, status: "USER_PROVIDED" as const, sourceField: "PROBLEM" as const, sourceQuote: statement },
    ...stakeholderNames.map((text, index) => ({
      id: `evidence-stakeholder-${index + 1}`,
      text,
      status: "USER_PROVIDED" as const,
      sourceField: "STAKEHOLDERS" as const,
      sourceQuote: text,
    })),
    ...goals.map((text, index) => ({
      id: `evidence-goal-${index + 1}`,
      text,
      status: "USER_PROVIDED" as const,
      sourceField: "GOALS" as const,
      sourceQuote: text,
    })),
    ...constraintTexts.map((text, index) => ({
      id: `evidence-constraint-${index + 1}`,
      text,
      status: "USER_PROVIDED" as const,
      sourceField: "CONSTRAINTS" as const,
      sourceQuote: text,
    })),
  ];

  const unknowns: string[] = [];
  if (!stakeholderNames.length) unknowns.push("Who is affected, and what do they need? Needs verification.");
  else unknowns.push("Specific needs of the named people or groups were not supplied. Needs verification.");
  if (!goals.length) unknowns.push("What would a useful outcome look like? Needs verification.");
  if (!constraintTexts.length) unknowns.push("Which constraints must any approach satisfy? Needs verification.");

  const stakeholders = stakeholderNames.map((name, index) => ({
    id: `stakeholder-${index + 1}`,
    name,
    role: "Role not specified",
    needs: [],
    status: "USER_PROVIDED" as const,
    roleStatus: "UNVERIFIED" as const,
    needsStatus: "UNVERIFIED" as const,
    evidenceIds: [`evidence-stakeholder-${index + 1}`],
    needsEvidenceIds: [],
  }));
  const constraints = constraintTexts.map((description, index) => ({
    id: `constraint-${index + 1}`,
    category: categorizeConstraint(description),
    categoryStatus: categorizeConstraint(description) === "OTHER" ? "UNVERIFIED" as const : "DERIVED" as const,
    description,
    source: "USER_PROVIDED" as const,
    status: "USER_PROVIDED" as const,
    evidenceIds: [`evidence-constraint-${index + 1}`],
  }));

  return {
    problem: { statement, context: "" },
    stakeholders,
    goals,
    evidence,
    constraints,
    unknowns,
    assumptions: [],
  };
}

export function categorizeConstraint(text: string): ConstraintCategory {
  const value = text.toLowerCase();
  const categories: Array<[ConstraintCategory, RegExp]> = [
    ["COST", /\b(cost|budget|fund|afford|expensive|price)\b/],
    ["TIME", /\b(time|deadline|schedule|hours?|months?|weeks?|urgent|delay)\b/],
    ["CONNECTIVITY", /\b(connectivity|internet|network|offline|signal|bandwidth|online)\b/],
    ["ACCESSIBILITY", /\b(accessibility|accessible|disab|screen reader|caption|mobility)\b/],
    ["PRIVACY", /\b(privacy|private|confidential|personal data|consent|sensitive)\b/],
    ["RELIABILITY", /\b(reliab|resilien|uptime|failure|backup|consistent)\b/],
    ["GEOGRAPHY", /\b(rural|remote|distance|geograph|location|travel|region)\b/],
    ["INFRASTRUCTURE", /\b(infrastructure|equipment|facility|power|electricity|hardware|building)\b/],
    ["TECHNOLOGY", /\b(technology|device|software|phone|computer|platform|technical)\b/],
    ["USERS", /\b(users?|students?|staff|people|children|participants|population)\b/],
    ["ENVIRONMENT", /\b(environment|climate|weather|energy|waste|sustainab)\b/],
    ["IMPLEMENTATION_COMPLEXITY", /\b(complex|complexity|implement|maintain|integration|training)\b/],
  ];
  return categories.find(([, pattern]) => pattern.test(value))?.[0] ?? "OTHER";
}

const STRATEGY_TEMPLATES: Array<{
  type: StrategyType;
  name: string;
  summary: string;
  mechanism: string[];
  requiredResources: string[];
  benefits: string[];
  risks: string[];
  assumptions: string[];
}> = [
  {
    type: "SOFTWARE",
    name: "A focused digital workflow",
    summary: "Make one defined step easier to notice and complete through a small, purpose-built software interaction.",
    mechanism: ["Choose one action that addresses the stated problem.", "Make the next step and its outcome visible in one digital flow."],
    requiredResources: ["A clearly bounded task", "Someone to test the interaction with affected people", "A supported device and channel"],
    benefits: ["Can make a repeated step consistent", "Can be tested as a narrow interaction before wider investment"],
    risks: ["May exclude people without a suitable device, connection, or accessible interface.", "A digital step may add work rather than remove it."],
    assumptions: ["A digital interaction is acceptable and reachable for the people affected; verify with them."],
  },
  {
    type: "HUMAN_SOFTWARE",
    name: "A human-led handoff with a shared aid",
    summary: "Keep a person responsible for the important handoff and use a simple shared record to prevent the next step from disappearing.",
    mechanism: ["Name who owns the next action and when it changes hands.", "Use an agreed checklist or record to make the handoff visible."],
    requiredResources: ["A willing owner for each handoff", "An accessible place to record the next step", "Agreement on who can see the record"],
    benefits: ["Keeps judgment and support with a person", "Can be trialed with an existing paper or digital tool"],
    risks: ["The process can stall when roles, time, or follow-through are unclear.", "A shared record may expose information to people who do not need it."],
    assumptions: ["People have enough time and authority to take the handoff; confirm capacity rather than assume it."],
  },
  {
    type: "INFRASTRUCTURE",
    name: "Improve the underlying access or resource",
    summary: "Change the availability, location, reliability, or upkeep of a physical or technical resource instead of adding another interface.",
    mechanism: ["Identify the resource or access condition directly tied to the problem.", "Test a repair, placement, reuse, or service arrangement before proposing expansion."],
    requiredResources: ["A clearly identified resource gap", "People who can assess local conditions", "A verified maintenance and ownership plan"],
    benefits: ["Addresses a root condition when access itself is the barrier", "Can improve more than one downstream task"],
    risks: ["The relevant resource or authority may not be available.", "Upkeep, access, and lifecycle cost remain unknown until checked."],
    assumptions: ["A physical or technical resource change is feasible and addresses the stated cause; validate locally."],
  },
  {
    type: "BEHAVIORAL",
    name: "Change a routine or cue",
    summary: "Test a small change in the timing, sequence, or cue for an existing routine before building or buying a new system.",
    mechanism: ["Choose one moment where a different action could be tried.", "Agree a simple observation that would show whether the change helped."],
    requiredResources: ["Agreement from the people involved", "A bounded test", "A way to hear from people affected"],
    benefits: ["Can be explored without new technology", "Creates a low-commitment opportunity to learn"],
    risks: ["A new routine may fade if the underlying conditions stay the same.", "People may be asked to adapt without authority or support."],
    assumptions: ["The people affected can influence the routine and have room to try a change; verify first."],
  },
  {
    type: "HYBRID",
    name: "A low-tech pathway with targeted support",
    summary: "Combine an accessible non-digital route, a clear human support point, and a small tool only where each part adds value.",
    mechanism: ["Keep a usable path when a preferred channel is unavailable.", "Define the human handoff and use a simple tool only to coordinate or record it."],
    requiredResources: ["A workable non-digital path", "A named support role", "A clear boundary for any shared information"],
    benefits: ["Can accommodate different access conditions", "Can test the service mechanism without committing to a full platform"],
    risks: ["Multiple channels can become inconsistent or harder to maintain.", "People may be unclear about which route to use."],
    assumptions: ["The parts can be coordinated without adding an unsustainable workload; test with the people involved."],
  },
];

function responseFor(strategy: StrategyType, constraint: Constraint): { designResponse: string; limitation: string } {
  const description = `“${constraint.description}”`;
  const responses: Record<StrategyType, string> = {
    SOFTWARE: "Use this as a requirement for the digital flow and test it with affected users before relying on the approach.",
    HUMAN_SOFTWARE: "Make this a handoff condition for the people and shared aid; confirm who can meet it and how.",
    INFRASTRUCTURE: "Treat this as a site or resource requirement to verify before selecting equipment or changing access.",
    BEHAVIORAL: "Build this into the boundaries of the routine being tested; check whether people can act within it.",
    HYBRID: "Check that both the supported path and the fallback path respect this condition without conflicting.",
  };
  return {
    designResponse: `${responses[strategy]} Constraint: ${description}`,
    limitation: "This is a proposed design response, not evidence that the constraint is satisfied.",
  };
}

export function generateProposedSolutions(problem: Problem): Solution[] {
  const evidenceIds = problem.evidence.map((item) => item.id);
  const constraintIds = problem.constraints.map((item) => item.id);
  return STRATEGY_TEMPLATES.map((template, index) => ({
    id: `solution-${template.type.toLowerCase().replaceAll("_", "-")}`,
    name: template.name,
    strategyType: template.type,
    summary: template.summary,
    mechanism: [...template.mechanism],
    requiredResources: [...template.requiredResources],
    benefits: [...template.benefits],
    risks: [...template.risks],
    assumptions: [...template.assumptions],
    evidenceIds: index === 2 && evidenceIds.length > 1 ? evidenceIds.slice(0, 2) : evidenceIds,
    constraintIds,
    constraintResponses: problem.constraints.map((constraint) => ({
      constraintId: constraint.id,
      ...responseFor(template.type, constraint),
    })),
  }));
}

const CRITERION_EXPLANATIONS: Record<EvaluationCriterion, string> = {
  "Constraint compatibility": "Not assessed. Compare the proposed mechanism against each supplied constraint; a proposed response is not proof of compatibility.",
  Feasibility: "Not assessed. Time, authority, resource availability, and implementation conditions still need verification.",
  Impact: "Not assessed. No outcome has been measured; connect this direction to a user-supplied goal and a way to test it.",
  Accessibility: "Not assessed. Check the route with affected people and any stated access needs; do not infer that an unmentioned need is absent.",
  "Implementation complexity": "Not assessed. Dependencies, ownership, maintenance, and effort are not established by this proposal.",
  Risk: "Not assessed. Review the listed failure modes and unknowns with the people affected; likelihood has not been estimated.",
};

export function emptyEvaluation(solutionId: string): Evaluation {
  const criteria = {} as Record<EvaluationCriterion, CriterionAssessment>;
  for (const criterion of EVALUATION_CRITERIA) {
    criteria[criterion] = {
      status: "UNKNOWN",
      explanation: CRITERION_EXPLANATIONS[criterion],
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
  const interactionByStrategy: Record<StrategyType, Prototype["interaction"]> = {
    SOFTWARE: {
      title: "Try one digital step",
      prompt: "Describe the single step this flow should help someone complete.",
      inputLabel: "Step to test",
      placeholder: "One step, in your own words",
      actionLabel: "Record this test note",
      savedLabel: "Local test note recorded",
    },
    HUMAN_SOFTWARE: {
      title: "Try one human handoff",
      prompt: "Describe the next action and who needs to own the handoff.",
      inputLabel: "Handoff to test",
      placeholder: "Next action and owner, if known",
      actionLabel: "Record this handoff note",
      savedLabel: "Local handoff note recorded",
    },
    INFRASTRUCTURE: {
      title: "Map one access condition",
      prompt: "Describe the resource or access condition to check. Do not include sensitive location details.",
      inputLabel: "Resource condition to check",
      placeholder: "What needs to be available or reliable?",
      actionLabel: "Record this access note",
      savedLabel: "Local access note recorded",
    },
    BEHAVIORAL: {
      title: "Try one routine change",
      prompt: "Describe one cue or small step that people could choose to test.",
      inputLabel: "Routine change to test",
      placeholder: "A cue, moment, or small step",
      actionLabel: "Record this trial note",
      savedLabel: "Local trial note recorded",
    },
    HYBRID: {
      title: "Map one supported pathway",
      prompt: "Describe which part needs a person, a low-tech route, or a simple tool.",
      inputLabel: "Pathway to test",
      placeholder: "One support, route, or handoff",
      actionLabel: "Record this pathway note",
      savedLabel: "Local pathway note recorded",
    },
  };
  const interaction = interactionByStrategy[solution.strategyType];
  return {
    name: `First test · ${solution.name}`,
    purpose: `Explore the proposed mechanism: ${solution.summary}`,
    screens: [
      {
        id: "test-note",
        title: interaction.title,
        purpose: interaction.prompt,
        interactions: [interaction.inputLabel, "Save a note locally in this page session"],
      },
    ],
    coreInteraction: interaction.prompt,
    requiredData: ["The selected proposed direction", "A note supplied by the person trying the interaction"],
    knownLimitations: [
      "This is an interaction sketch, not a working service or evidence that the approach will work.",
      "Notes stay in this page session and are cleared when you refresh or close the page.",
    ],
    interaction,
  };
}

export function isEvaluationStatus(value: string): value is EvaluationStatus {
  return value === "PASS" || value === "PARTIAL" || value === "FAIL" || value === "UNKNOWN";
}

export function isConstraintCategory(value: string): value is ConstraintCategory {
  return [
    "COST", "TIME", "INFRASTRUCTURE", "TECHNOLOGY", "CONNECTIVITY", "GEOGRAPHY",
    "ACCESSIBILITY", "PRIVACY", "RELIABILITY", "USERS", "ENVIRONMENT",
    "IMPLEMENTATION_COMPLEXITY", "OTHER",
  ].includes(value);
}
