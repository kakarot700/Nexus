import { sanitizeReferences } from "./engine";
import type { Problem, Solution, SolutionCritique, CritiqueFinding } from "./types";

export function critiqueSolution(problem: Problem, solution: Solution): SolutionCritique {
  const evidenceIds = problem.evidence.map((item) => item.id);
  const constraintIds = problem.constraints.map((item) => item.id);
  const findings: CritiqueFinding[] = [];
  const add = (
    category: CritiqueFinding["category"],
    finding: string,
    status: CritiqueFinding["status"],
    options: { evidenceIds?: string[]; constraintIds?: string[]; source?: CritiqueFinding["source"] } = {},
  ) => findings.push({
    id: `critic-${solution.id}-${findings.length + 1}`,
    category,
    status,
    finding,
    evidenceIds: sanitizeReferences(options.evidenceIds ?? [], evidenceIds),
    constraintIds: sanitizeReferences(options.constraintIds ?? [], constraintIds),
    source: options.source ?? "PROPOSED",
  });

  add("HIDDEN_ASSUMPTION", solution.assumptions.join(" "), "CHECK", { evidenceIds: solution.evidenceIds });
  if (problem.constraints.length) {
    for (const constraint of problem.constraints) {
      const response = solution.constraintResponses.find((item) => item.constraintId === constraint.id);
      add(
        "CONSTRAINT_PRESSURE",
        `${constraint.description}: ${response?.limitation ?? "No proposed response was supplied."} Test this with the affected people before treating it as compatible.`,
        "CHECK",
        { evidenceIds: constraint.evidenceIds, constraintIds: [constraint.id] },
      );
    }
  } else {
    add("CONSTRAINT_PRESSURE", "No constraints were supplied. Cost, time, access, and operating conditions remain untested.", "UNKNOWN");
  }

  add(
    "IMPLEMENTATION_BARRIER",
    `This approach depends on: ${solution.requiredResources.join("; ")}. Availability, authority, and ongoing ownership are not established.`,
    "CHECK",
    { evidenceIds: solution.evidenceIds },
  );
  const exclusionRisk = solution.strategyType === "SOFTWARE"
    ? "People without a suitable device, reliable connection, accessible interface, or preference for digital use could be excluded. The input does not establish who has access."
    : solution.strategyType === "INFRASTRUCTURE"
      ? "People who cannot reach, use, or maintain the changed resource could still be excluded. Local access conditions need checking."
      : solution.strategyType === "HUMAN_SOFTWARE"
        ? "People without access to the assigned support person or shared record could miss the handoff. Confirm a usable alternative."
        : "Check whether people with different access needs or levels of influence can take part in this proposed change.";
  add("EXCLUDED_USERS", exclusionRisk, "UNKNOWN", { evidenceIds: solution.evidenceIds });

  const privacyConstraint = problem.constraints.find((constraint) => constraint.category === "PRIVACY");
  add(
    "PRIVACY",
    privacyConstraint
      ? `Privacy requirement to check: ${privacyConstraint.description}. The proposed mechanism does not establish data minimization, access, or consent.`
      : "Privacy expectations were not supplied. Identify what information, if any, the approach would expose before testing it.",
    "UNKNOWN",
    { constraintIds: privacyConstraint ? [privacyConstraint.id] : [], evidenceIds: privacyConstraint?.evidenceIds ?? [] },
  );

  const accessConstraint = problem.constraints.find((constraint) => constraint.category === "ACCESSIBILITY");
  add(
    "ACCESSIBILITY",
    accessConstraint
      ? `Access requirement to test: ${accessConstraint.description}. No user test or accommodation detail is available yet.`
      : "Accessibility needs were not specified. Check with affected people instead of treating the missing detail as absence of need.",
    "UNKNOWN",
    { constraintIds: accessConstraint ? [accessConstraint.id] : [], evidenceIds: accessConstraint?.evidenceIds ?? [] },
  );
  add("RELIABILITY", solution.risks.join(" "), "CHECK", { evidenceIds: solution.evidenceIds, constraintIds: solution.constraintIds });
  add(
    "UNKNOWN_INFORMATION",
    problem.unknowns.length ? problem.unknowns.join(" ") : "The supplied context has not been independently checked for completeness.",
    "UNKNOWN",
    { evidenceIds: evidenceIds.slice(0, 1) },
  );
  add("DEPENDENCY", `Dependencies to verify: ${solution.requiredResources.join("; ")}.`, "CHECK", { evidenceIds: solution.evidenceIds });
  add("FAILURE_MODE", solution.risks.join(" "), "CHECK", { evidenceIds: solution.evidenceIds, constraintIds: solution.constraintIds });

  return { solutionId: solution.id, findings };
}

export function critiqueSolutions(problem: Problem, solutions: Solution[]): SolutionCritique[] {
  return solutions.map((solution) => critiqueSolution(problem, solution));
}
