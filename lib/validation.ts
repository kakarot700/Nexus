import { buildProblem, categorizeConstraint, isConstraintCategory, MAX_CONTEXT_LINE_LENGTH, MAX_CONTEXT_LINES, MAX_PROBLEM_LENGTH, sanitizeReferences } from "./engine";
import {
  type Constraint,
  type ConstraintResponse,
  type Evidence,
  type EvidenceStatus,
  type Problem,
  type ProblemInput,
  type Stakeholder,
  type Solution,
  type StrategyType,
} from "./types";

export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

type RecordValue = Record<string, unknown>;
const STRATEGIES: StrategyType[] = ["SOFTWARE", "HUMAN_SOFTWARE", "INFRASTRUCTURE", "BEHAVIORAL", "HYBRID"];
const STATUSES: EvidenceStatus[] = ["USER_PROVIDED", "DERIVED", "PROPOSED", "UNVERIFIED"];

function record(value: unknown, label: string): RecordValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new SchemaValidationError(`${label} must be an object.`);
  return value as RecordValue;
}

function text(value: unknown, label: string, maxLength = 1_000, allowEmpty = false): string {
  if (typeof value !== "string") throw new SchemaValidationError(`${label} must be text.`);
  const normalized = value.trim();
  if (!allowEmpty && !normalized) throw new SchemaValidationError(`${label} cannot be empty.`);
  if (normalized.length > maxLength) throw new SchemaValidationError(`${label} is too long.`);
  return normalized;
}

function stringList(value: unknown, label: string, maxItems = 20, maxLength = 500): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new SchemaValidationError(`${label} must be a list with at most ${maxItems} items.`);
  return value.map((item, index) => text(item, `${label}[${index}]`, maxLength));
}

function id(value: unknown, label: string): string {
  const normalized = text(value, label, 80);
  if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) throw new SchemaValidationError(`${label} has an invalid format.`);
  return normalized;
}

function status(value: unknown, label: string): EvidenceStatus {
  if (typeof value !== "string" || !STATUSES.includes(value as EvidenceStatus)) throw new SchemaValidationError(`${label} is not a supported evidence status.`);
  return value as EvidenceStatus;
}

function uniqueIds(items: Array<{ id: string }>, label: string): void {
  if (new Set(items.map((item) => item.id)).size !== items.length) throw new SchemaValidationError(`${label} contains duplicate IDs.`);
}

function sourceFields(input: ProblemInput): Array<{ field: NonNullable<Evidence["sourceField"]>; text: string }> {
  const groups: Array<{ field: NonNullable<Evidence["sourceField"]>; value: string | undefined }> = [
    { field: "PROBLEM", value: input.statement },
    { field: "STAKEHOLDERS", value: input.stakeholders },
    { field: "GOALS", value: input.goals },
    { field: "CONSTRAINTS", value: input.constraints },
  ];
  return groups.flatMap(({ field, value }) => (value ?? "").split("\n").map((part) => part.trim()).filter(Boolean).map((text) => ({ field, text })));
}

function exactSource(textValue: string, fields: Array<{ field: NonNullable<Evidence["sourceField"]>; text: string }>): { field: NonNullable<Evidence["sourceField"]>; text: string } | undefined {
  const needle = textValue.trim();
  if (needle.length < 4) return undefined;
  return fields.find((source) => source.text.toLocaleLowerCase().includes(needle.toLocaleLowerCase()));
}

export function parseProblemInput(value: unknown): ProblemInput {
  const body = record(value, "Request body");
  const statement = text(body.statement, "Problem description", MAX_PROBLEM_LENGTH);
  const optional = (key: "stakeholders" | "goals" | "constraints"): string | undefined => {
    const raw = body[key];
    if (raw === undefined) return undefined;
    const content = text(raw, key, MAX_CONTEXT_LINES * (MAX_CONTEXT_LINE_LENGTH + 1), true);
    const entries = content.split("\n").map((entry) => entry.trim()).filter(Boolean);
    if (entries.length > MAX_CONTEXT_LINES || entries.some((entry) => entry.length > MAX_CONTEXT_LINE_LENGTH)) {
      throw new SchemaValidationError(`${key} must have at most ${MAX_CONTEXT_LINES} lines of ${MAX_CONTEXT_LINE_LENGTH} characters each.`);
    }
    return content;
  };
  return { statement, stakeholders: optional("stakeholders"), goals: optional("goals"), constraints: optional("constraints") };
}

export function parseProblemAnalysis(value: unknown, input: ProblemInput): Problem {
  const root = record(value, "Problem analysis");
  const rawProblem = record(root.problem, "problem");
  text(rawProblem.statement, "problem.statement", MAX_PROBLEM_LENGTH);
  const rawContext = text(rawProblem.context, "problem.context", 2_000, true);
  if (!Array.isArray(root.evidence) || root.evidence.length > 60) throw new SchemaValidationError("evidence must contain no more than 60 items.");
  const inputSources = sourceFields(input);
  const validEvidence: Evidence[] = root.evidence.map((value, index) => {
    const item = record(value, `evidence[${index}]`);
    const itemId = id(item.id, `evidence[${index}].id`);
    const itemText = text(item.text, `evidence[${index}].text`, 1_000);
    const requestedStatus = status(item.status, `evidence[${index}].status`);
    const source = exactSource(typeof item.sourceQuote === "string" ? item.sourceQuote : itemText, inputSources);
    const directMatch = exactSource(itemText, inputSources);
    let safeStatus: EvidenceStatus = requestedStatus;
    if (requestedStatus === "USER_PROVIDED" && !directMatch) safeStatus = "UNVERIFIED";
    if (requestedStatus === "DERIVED" && !source) safeStatus = "UNVERIFIED";
    return {
      id: itemId,
      text: itemText,
      status: safeStatus,
      sourceField: source?.field ?? directMatch?.field,
      sourceQuote: source?.text ?? directMatch?.text,
    };
  });
  uniqueIds(validEvidence, "evidence");

  const base = buildProblem(input);
  const mergedEvidence = [...base.evidence];
  for (const item of validEvidence) {
    const existing = mergedEvidence.find((source) => source.id === item.id);
    if (!existing) mergedEvidence.push(item);
    else if (existing.text !== item.text) throw new SchemaValidationError(`evidence ID ${item.id} conflicts with supplied input.`);
  }
  const evidenceIds = mergedEvidence.map((item) => item.id);

  if (!Array.isArray(root.stakeholders) || root.stakeholders.length > 20) throw new SchemaValidationError("stakeholders must contain at most 20 items.");
  const stakeholders: Stakeholder[] = root.stakeholders.map((value, index) => {
    const item = record(value, `stakeholders[${index}]`);
    const name = text(item.name, `stakeholders[${index}].name`, 200);
    const source = exactSource(name, [
      ...inputSources.filter((sourceItem) => sourceItem.field === "STAKEHOLDERS"),
      ...inputSources.filter((sourceItem) => sourceItem.field !== "STAKEHOLDERS"),
    ]);
    if (item.evidenceIds !== undefined) stringList(item.evidenceIds, `stakeholders[${index}].evidenceIds`, 20, 80);
    const suppliedEvidence = source ? base.evidence.find((sourceItem) => sourceItem.sourceField === source.field && sourceItem.text.toLocaleLowerCase() === source.text.toLocaleLowerCase()) : undefined;
    return {
      id: id(item.id, `stakeholders[${index}].id`),
      name,
      role: text(item.role, `stakeholders[${index}].role`, 200),
      needs: stringList(item.needs, `stakeholders[${index}].needs`, 10, 300),
      status: source ? "USER_PROVIDED" as const : "PROPOSED" as const,
      roleStatus: "PROPOSED" as const,
      needsStatus: "PROPOSED" as const,
      evidenceIds: suppliedEvidence ? [suppliedEvidence.id] : [],
      needsEvidenceIds: [],
    };
  });
  uniqueIds(stakeholders, "stakeholders");
  for (const person of base.stakeholders) {
    if (!stakeholders.some((item) => item.name.toLocaleLowerCase() === person.name.toLocaleLowerCase())) stakeholders.push(person);
  }

  if (!Array.isArray(root.goals) || root.goals.length > 30) throw new SchemaValidationError("goals must contain at most 30 items.");
  const requestedGoals = stringList(root.goals, "goals", 30, 300);
  const inputGoals = new Set((input.goals ?? "").split("\n").map((goal) => goal.trim().toLocaleLowerCase()).filter(Boolean));
  const goals = [...base.goals];
  const proposalAssumptions: string[] = [];
  for (const goal of requestedGoals) {
    if (inputGoals.has(goal.toLocaleLowerCase()) && !goals.some((existing) => existing.toLocaleLowerCase() === goal.toLocaleLowerCase())) goals.push(goal);
    else if (!inputGoals.has(goal.toLocaleLowerCase()) && !goals.some((existing) => existing.toLocaleLowerCase() === goal.toLocaleLowerCase())) {
      proposalAssumptions.push(`Possible goal proposed by the model; needs verification: ${goal}`);
    }
  }

  if (!Array.isArray(root.constraints) || root.constraints.length > 30) throw new SchemaValidationError("constraints must contain at most 30 items.");
  const constraints: Constraint[] = root.constraints.map((value, index) => {
    const item = record(value, `constraints[${index}]`);
    const description = text(item.description, `constraints[${index}].description`, 300);
    const inputMatch = exactSource(description, inputSources);
    const directConstraint = base.constraints.find((constraint) => constraint.description.toLocaleLowerCase() === description.toLocaleLowerCase());
    const refs = Array.isArray(item.evidenceIds) ? stringList(item.evidenceIds, `constraints[${index}].evidenceIds`, 20, 80) : [];
    const safeRefs = sanitizeReferences(refs, evidenceIds);
    const isUserProvided = Boolean(inputMatch);
    const safeSource = isUserProvided ? "USER_PROVIDED" : "DERIVED";
    const safeStatus: EvidenceStatus = isUserProvided ? "USER_PROVIDED" : safeRefs.length ? "DERIVED" : "UNVERIFIED";
    const modelCategory = typeof item.category === "string" && isConstraintCategory(item.category) ? item.category : undefined;
    const category = directConstraint?.category ?? modelCategory ?? categorizeConstraint(description);
    const categoryStatus: EvidenceStatus = directConstraint?.categoryStatus
      ?? (isUserProvided ? (category === "OTHER" ? "UNVERIFIED" : "DERIVED") : modelCategory ? "PROPOSED" : "UNVERIFIED");
    return {
      id: id(item.id, `constraints[${index}].id`),
      category,
      categoryStatus,
      description,
      source: safeSource,
      status: safeStatus,
      evidenceIds: safeRefs.length ? safeRefs : inputMatch ? ["evidence-problem"] : [],
    };
  });
  uniqueIds(constraints, "constraints");
  for (const constraint of base.constraints) {
    if (!constraints.some((item) => item.description.toLocaleLowerCase() === constraint.description.toLocaleLowerCase())) constraints.push(constraint);
  }

  const unknowns = stringList(root.unknowns, "unknowns", 30, 500);
  const assumptions = stringList(root.assumptions, "assumptions", 30, 500);
  const contextSource = exactSource(rawContext, inputSources);
  const context = contextSource ? rawContext : "";
  return {
    problem: { statement: base.problem.statement, context },
    stakeholders,
    goals,
    evidence: [...mergedEvidence, ...proposalAssumptions.map((suggestion, index) => ({
      id: `evidence-proposed-goal-${index + 1}`,
      text: suggestion,
      status: "PROPOSED" as const,
    }))],
    constraints,
    unknowns: [...new Set([...base.unknowns, ...unknowns])],
    assumptions: [...new Set([...assumptions, ...proposalAssumptions])],
  };
}

export function parseSolutions(value: unknown, problem: Problem): Solution[] {
  const root = record(value, "Solution response");
  const rawSolutions = root.solutions;
  if (!Array.isArray(rawSolutions) || rawSolutions.length < 3 || rawSolutions.length > 5) {
    throw new SchemaValidationError("The provider must return 3 to 5 distinct solution paths.");
  }
  const validEvidenceIds = problem.evidence.map((item) => item.id);
  const validConstraintIds = problem.constraints.map((item) => item.id);
  const solutions: Solution[] = rawSolutions.map((value, index) => {
    const item = record(value, `solutions[${index}]`);
    const strategyType = item.strategyType;
    if (typeof strategyType !== "string" || !STRATEGIES.includes(strategyType as StrategyType)) {
      throw new SchemaValidationError(`solutions[${index}].strategyType is not supported.`);
    }
    const rawResponses = item.constraintResponses;
    if (!Array.isArray(rawResponses) || rawResponses.length > 30) throw new SchemaValidationError(`solutions[${index}].constraintResponses must be a list.`);
    const responsesById = new Map<string, ConstraintResponse>();
    for (const [responseIndex, responseValue] of rawResponses.entries()) {
      const response = record(responseValue, `solutions[${index}].constraintResponses[${responseIndex}]`);
      const constraintId = id(response.constraintId, "constraint response ID");
      if (!validConstraintIds.includes(constraintId) || responsesById.has(constraintId)) continue;
      responsesById.set(constraintId, {
        constraintId,
        designResponse: text(response.designResponse, "constraint response", 500),
        limitation: text(response.limitation, "constraint response limitation", 500),
      });
    }
    const constraints = problem.constraints.map((constraint) => responsesById.get(constraint.id) ?? {
      constraintId: constraint.id,
      designResponse: "No response was returned for this supplied constraint; review it before comparing the approach.",
      limitation: "This missing response is unresolved; no compatibility is implied.",
    });
    const rawEvidence = stringList(item.evidenceIds, `solutions[${index}].evidenceIds`, 60, 80);
    const rawConstraints = stringList(item.constraintIds, `solutions[${index}].constraintIds`, 30, 80);
    return {
      id: id(item.id, `solutions[${index}].id`),
      name: text(item.name, `solutions[${index}].name`, 120),
      strategyType: strategyType as StrategyType,
      summary: text(item.summary, `solutions[${index}].summary`, 700),
      mechanism: stringList(item.mechanism, `solutions[${index}].mechanism`, 10, 500),
      requiredResources: stringList(item.requiredResources, `solutions[${index}].requiredResources`, 15, 300),
      benefits: stringList(item.benefits, `solutions[${index}].benefits`, 15, 300),
      risks: stringList(item.risks, `solutions[${index}].risks`, 15, 300),
      assumptions: stringList(item.assumptions, `solutions[${index}].assumptions`, 15, 300),
      evidenceIds: sanitizeReferences(rawEvidence, validEvidenceIds),
      constraintIds: sanitizeReferences(rawConstraints, validConstraintIds),
      constraintResponses: constraints,
    };
  });
  uniqueIds(solutions, "solutions");
  if (new Set(solutions.map((solution) => solution.strategyType)).size !== solutions.length) {
    throw new SchemaValidationError("Solution paths must use genuinely different strategy types.");
  }
  return solutions;
}
