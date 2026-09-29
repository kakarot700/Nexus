import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProblem,
  buildPrototype,
  emptyEvaluation,
  generateProposedSolutions,
  isEvaluationStatus,
  recommendationFor,
  sanitizeReferences,
  updateCriterion,
} from "../lib/engine";
import { EVALUATION_CRITERIA, type CriterionAssessment, type EvaluationCriterion, type EvaluationStatus } from "../lib/types";

function passedCriteria(status: EvaluationStatus = "PASS"): Record<EvaluationCriterion, CriterionAssessment> {
  const criteria = {} as Record<EvaluationCriterion, CriterionAssessment>;
  for (const criterion of EVALUATION_CRITERIA) criteria[criterion] = { status, explanation: "A user supplied reason.", evidenceIds: [], constraintIds: [] };
  return criteria;
}

test("rejects empty input and preserves the supplied problem statement and exact source", () => {
  assert.throws(() => buildProblem({ statement: "  " }), /Describe the problem/);
  const problem = buildProblem({ statement: "  Unclear handoffs delay a process.  " });
  assert.equal(problem.problem.statement, "Unclear handoffs delay a process.");
  assert.deepEqual(problem.evidence[0], {
    id: "evidence-problem", text: "Unclear handoffs delay a process.", status: "USER_PROVIDED",
    sourceField: "PROBLEM", sourceQuote: "Unclear handoffs delay a process.",
  });
});

test("rejects overlong input rather than silently truncating it", () => {
  assert.throws(() => buildProblem({ statement: "x".repeat(3001) }), /under 3000 characters/);
});

test("normalizes optional lists, source links and unresolved role/need information", () => {
  const problem = buildProblem({
    statement: "An unresolved service process.",
    stakeholders: "  Staff who handle handoffs  \nPeople receiving the service\n\n",
    goals: "Make ownership clear\nReduce repeated questions",
    constraints: "No new software\nMust work on paper",
  });
  assert.deepEqual(problem.stakeholders.map((person) => person.name), ["Staff who handle handoffs", "People receiving the service"]);
  assert.ok(problem.stakeholders.every((person) => person.role === "Role not specified" && person.roleStatus === "UNVERIFIED" && person.needsStatus === "UNVERIFIED"));
  assert.deepEqual(problem.goals, ["Make ownership clear", "Reduce repeated questions"]);
  assert.ok(problem.evidence.every((item) => item.status === "USER_PROVIDED" && item.sourceQuote));
  assert.deepEqual(problem.constraints.map((item) => [item.description, item.source, item.status]), [
    ["No new software", "USER_PROVIDED", "USER_PROVIDED"],
    ["Must work on paper", "USER_PROVIDED", "USER_PROVIDED"],
  ]);
  assert.ok(problem.unknowns.some((item) => item.includes("Specific needs")));
  assert.deepEqual(problem.assumptions, []);
});

test("keeps missing context visible as uncertainty rather than inventing it", () => {
  const problem = buildProblem({ statement: "A problem with unspecified context." });
  assert.equal(problem.stakeholders.length, 0);
  assert.equal(problem.goals.length, 0);
  assert.equal(problem.constraints.length, 0);
  assert.equal(problem.unknowns.length, 3);
  assert.ok(problem.unknowns.every((item) => item.includes("Needs verification")));
});

test("generates five structurally different proposal templates tied only to supplied references", () => {
  const problem = buildProblem({ statement: "A locally described challenge.", constraints: "Intermittent internet connectivity\nLimited time" });
  const proposals = generateProposedSolutions(problem);
  assert.equal(proposals.length, 5);
  assert.deepEqual(new Set(proposals.map((item) => item.strategyType)), new Set(["SOFTWARE", "HUMAN_SOFTWARE", "INFRASTRUCTURE", "BEHAVIORAL", "HYBRID"]));
  assert.equal(new Set(proposals.map((item) => item.summary)).size, 5);
  assert.ok(proposals.every((item) => item.evidenceIds.every((id) => problem.evidence.some((source) => source.id === id))));
  assert.ok(proposals.every((item) => item.assumptions.length > 0 && item.risks.length > 0));
  assert.ok(proposals.every((item) => item.constraintResponses.length === problem.constraints.length));
  assert.ok(proposals.every((item) => item.constraintIds.every((id) => problem.constraints.some((constraint) => constraint.id === id))));
  assert.ok(proposals[0].constraintResponses[0].limitation.includes("not evidence"));
});

test("starts every assessment as UNKNOWN with a criterion-specific rationale", () => {
  const evaluation = emptyEvaluation("solution-1");
  assert.ok(EVALUATION_CRITERIA.every((criterion) => evaluation.criteria[criterion].status === "UNKNOWN"));
  assert.ok(EVALUATION_CRITERIA.every((criterion) => evaluation.criteria[criterion].explanation.length > 40));
  assert.equal(evaluation.recommendation, "NEEDS_WORK");
});

test("recommendation follows the documented qualitative rule without weights or scores", () => {
  assert.equal(recommendationFor(passedCriteria()), "PROMISING");
  const partial = passedCriteria();
  partial["Risk"] = { ...partial["Risk"], status: "PARTIAL" };
  assert.equal(recommendationFor(partial), "NEEDS_WORK");
  partial["Risk"] = { ...partial["Risk"], status: "UNKNOWN" };
  assert.equal(recommendationFor(partial), "NEEDS_WORK");
});

test("one FAIL yields INCOMPATIBLE even when every other criterion passes", () => {
  const criteria = passedCriteria();
  criteria["Constraint compatibility"] = { ...criteria["Constraint compatibility"], status: "FAIL" };
  assert.equal(recommendationFor(criteria), "INCOMPATIBLE");
});

test("updates one assessment immutably and refreshes strengths, weaknesses, and unknowns", () => {
  const original = emptyEvaluation("solution-1");
  const updated = updateCriterion(original, "Feasibility", { status: "PARTIAL", explanation: "One more check is needed.", evidenceIds: ["evidence-problem"] });
  assert.equal(original.criteria.Feasibility.status, "UNKNOWN");
  assert.equal(updated.criteria.Feasibility.status, "PARTIAL");
  assert.equal(updated.criteria.Feasibility.explanation, "One more check is needed.");
  assert.deepEqual(updated.criteria.Feasibility.evidenceIds, ["evidence-problem"]);
  assert.ok(updated.weaknesses.includes("Feasibility"));
  assert.ok(updated.unknowns.includes("Feasibility"));
  assert.equal(updated.recommendation, "NEEDS_WORK");
});

test("source sanitizer deduplicates references and drops unresolved IDs", () => {
  assert.deepEqual(sanitizeReferences(["evidence-problem", "missing", "constraint-1", "evidence-problem"], ["evidence-problem", "constraint-1"]), ["evidence-problem", "constraint-1"]);
});

test("prototype exposes a useful strategy-specific interaction and honest limits", () => {
  const solution = generateProposedSolutions(buildProblem({ statement: "A supplied test problem." }))[1];
  const prototype = buildPrototype(solution);
  assert.equal(prototype.screens.length, 1);
  assert.equal(prototype.screens[0].id, "test-note");
  assert.match(prototype.coreInteraction, /handoff/i);
  assert.ok(prototype.knownLimitations.some((item) => item.includes("not a working service")));
  assert.ok(prototype.knownLimitations.some((item) => item.includes("cleared when you refresh")));
});

test("accepts only declared qualitative status labels", () => {
  for (const status of ["PASS", "PARTIAL", "FAIL", "UNKNOWN"]) assert.equal(isEvaluationStatus(status), true);
  assert.equal(isEvaluationStatus("SUCCESS"), false);
});

test("rejects oversized optional lists rather than dropping source context", () => {
  const tooMany = Array.from({ length: 21 }, (_, index) => `Constraint ${index + 1}`).join("\n");
  assert.throws(() => buildProblem({ statement: "A supplied problem.", constraints: tooMany }), /no more than 20 lines/);
});

test("local provider completes all documented stages without pretending unknowns are assessments", async () => {
  const { LocalGuidedProvider } = await import("../lib/provider");
  const provider = new LocalGuidedProvider();
  const problem = await provider.analyzeProblem({ statement: "A user-described challenge." });
  const solutions = await provider.generateSolutions(problem);
  const critiques = await provider.critiqueSolutions(problem, solutions);
  const evaluations = await provider.evaluateSolutions(problem, solutions);
  const prototype = await provider.generatePrototype(problem, solutions[0]);
  assert.equal(solutions.length, 5);
  assert.equal(critiques.length, 5);
  assert.ok(critiques.every((critique) => critique.findings.length >= 8));
  assert.equal(evaluations.length, 5);
  assert.ok(evaluations.every((evaluation) => evaluation.recommendation === "NEEDS_WORK"));
  assert.ok(evaluations.every((evaluation) => EVALUATION_CRITERIA.every((criterion) => evaluation.criteria[criterion].status === "UNKNOWN")));
  assert.equal(prototype.screens.length, 1);
});
