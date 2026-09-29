import assert from "node:assert/strict";
import test from "node:test";
import { buildProblem, generateProposedSolutions } from "../lib/engine";
import { parseProblemAnalysis, parseProblemInput, parseSolutions, SchemaValidationError } from "../lib/validation";
import type { ProblemInput } from "../lib/types";

const input: ProblemInput = {
  statement: "Rural students face intermittent internet.",
  stakeholders: "Students",
  goals: "Learn reliably",
  constraints: "Intermittent internet connectivity",
};

function rawAnalysis() {
  return {
    problem: { statement: "A model-rewritten claim.", context: "Rural students" },
    stakeholders: [
      { id: "person-1", name: "Students", role: "Remote learners", needs: ["Predictable access"], evidenceIds: ["does-not-exist"] },
      { id: "person-2", name: "National Ministry", role: "Regulator", needs: ["New legislation"], evidenceIds: ["evidence-problem"] },
    ],
    goals: ["Learn reliably", "Raise examination scores"],
    evidence: [
      { id: "evidence-problem", text: input.statement, status: "USER_PROVIDED" },
      { id: "invented-stat", text: "A million students are affected.", status: "USER_PROVIDED", sourceQuote: "A million students are affected." },
      { id: "unsupported-derived", text: "Internet access causes this outcome.", status: "DERIVED", sourceQuote: "No such source quote" },
      { id: "proposed-observation", text: "Explore offline study materials.", status: "PROPOSED" },
    ],
    constraints: [
      { id: "constraint-connectivity", category: "COST", description: "Intermittent internet connectivity", source: "USER_PROVIDED", evidenceIds: ["evidence-constraint-1"] },
      { id: "constraint-fictional", category: "COST", description: "A $1 million funding limit", source: "USER_PROVIDED", evidenceIds: ["missing"] },
    ],
    unknowns: ["Actual access conditions need verification."],
    assumptions: ["A local partner may be available."],
  };
}

test("request parser bounds user content and rejects invalid types before provider use", () => {
  assert.throws(() => parseProblemInput({ statement: " " }), SchemaValidationError);
  assert.throws(() => parseProblemInput({ statement: "x".repeat(3_001) }), SchemaValidationError);
  assert.throws(() => parseProblemInput({ statement: "A problem", goals: "x".repeat(6_021) }), SchemaValidationError);
  assert.throws(() => parseProblemInput({ statement: "A problem", constraints: Array.from({ length: 21 }, (_, i) => `Line ${i}`).join("\n") }), SchemaValidationError);
  assert.throws(() => parseProblemInput({ statement: ["not", "text"] }), SchemaValidationError);
});

test("analysis keeps the exact input, labels unsupported claims, preserves directly supplied context, and drops invalid links", () => {
  const problem = parseProblemAnalysis(rawAnalysis(), input);
  assert.equal(problem.problem.statement, input.statement);
  assert.equal(problem.problem.context, "Rural students");
  assert.equal(problem.stakeholders.find((person) => person.name === "Students")?.status, "USER_PROVIDED");
  assert.deepEqual(problem.stakeholders.find((person) => person.name === "Students")?.evidenceIds, ["evidence-stakeholder-1"]);
  const proposedPerson = problem.stakeholders.find((person) => person.name === "National Ministry");
  assert.equal(proposedPerson?.status, "PROPOSED");
  assert.deepEqual(proposedPerson?.evidenceIds, []);
  assert.equal(proposedPerson?.needsStatus, "PROPOSED");
  assert.deepEqual(problem.goals, ["Learn reliably"]);
  assert.ok(problem.assumptions.some((item) => item.includes("Raise examination scores") && item.includes("verification")));
  assert.ok(problem.evidence.some((item) => item.id === "invented-stat" && item.status === "UNVERIFIED"));
  assert.ok(problem.evidence.some((item) => item.id === "unsupported-derived" && item.status === "UNVERIFIED"));
  const directConstraint = problem.constraints.find((item) => item.description === "Intermittent internet connectivity");
  assert.equal(directConstraint?.source, "USER_PROVIDED");
  assert.equal(directConstraint?.status, "USER_PROVIDED");
  assert.equal(directConstraint?.category, "CONNECTIVITY");
  assert.equal(directConstraint?.categoryStatus, "DERIVED");
  const falseConstraint = problem.constraints.find((item) => item.description === "A $1 million funding limit");
  assert.equal(falseConstraint?.status, "UNVERIFIED");
  assert.equal(falseConstraint?.source, "DERIVED");
  assert.deepEqual(falseConstraint?.evidenceIds, []);
  assert.ok(problem.evidence.some((item) => item.id === "evidence-constraint-1"));
});

test("unsupported model summaries are not promoted into direct context", () => {
  const raw = rawAnalysis();
  raw.problem.context = "Exact internet speed is 500 Mbps.";
  const problem = parseProblemAnalysis(raw, input);
  assert.equal(problem.problem.context, "");
});

test("rejects malformed, duplicate, or oversized analysis objects", () => {
  const duplicate = rawAnalysis();
  duplicate.evidence.push({ id: "evidence-problem", text: "duplicate ID", status: "PROPOSED" });
  assert.throws(() => parseProblemAnalysis(duplicate, input), /duplicate IDs/);
  const invalidStatus = rawAnalysis();
  invalidStatus.evidence[0].status = "FACT";
  assert.throws(() => parseProblemAnalysis(invalidStatus, input), /evidence status/);
  const tooLarge = rawAnalysis();
  tooLarge.unknowns = Array.from({ length: 31 }, () => "unknown");
  assert.throws(() => parseProblemAnalysis(tooLarge, input), /at most 30/);
});

test("rejects duplicate or too few solution strategies and normalizes unresolved references", () => {
  const problem = buildProblem(input);
  const valid = generateProposedSolutions(problem);
  assert.throws(() => parseSolutions({ solutions: valid.slice(0, 2) }, problem), /3 to 5/);
  const duplicate = valid.map((solution, index) => index === 1 ? { ...solution, strategyType: valid[0].strategyType } : solution);
  assert.throws(() => parseSolutions({ solutions: duplicate }, problem), /genuinely different/);
  const altered = valid.map((solution, index) => index === 0 ? { ...solution, evidenceIds: ["missing"], constraintIds: ["bad"], constraintResponses: [] } : solution);
  const normalized = parseSolutions({ solutions: altered }, problem);
  assert.deepEqual(normalized[0].evidenceIds, []);
  assert.deepEqual(normalized[0].constraintIds, []);
  assert.equal(normalized[0].constraintResponses[0].constraintId, problem.constraints[0].id);
  assert.match(normalized[0].constraintResponses[0].limitation, /unresolved/);
});

test("rejects malformed field types and duplicate solution IDs", () => {
  const problem = buildProblem(input);
  const valid = generateProposedSolutions(problem);
  const invalidField = valid.map((solution, index) => index === 0 ? { ...solution, risks: [123] } : solution);
  assert.throws(() => parseSolutions({ solutions: invalidField }, problem), /must be text/);
  const duplicateId = valid.map((solution, index) => index === 0 ? { ...solution, id: valid[1].id } : solution);
  assert.throws(() => parseSolutions({ solutions: duplicateId }, problem), /duplicate IDs/);
});
