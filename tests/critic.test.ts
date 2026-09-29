import assert from "node:assert/strict";
import test from "node:test";
import { buildProblem, generateProposedSolutions } from "../lib/engine";
import { critiqueSolution } from "../lib/critic";
import type { CritiqueCategory } from "../lib/types";

const EXPECTED_CATEGORIES: CritiqueCategory[] = [
  "HIDDEN_ASSUMPTION", "CONSTRAINT_PRESSURE", "IMPLEMENTATION_BARRIER", "EXCLUDED_USERS",
  "RELIABILITY", "PRIVACY", "ACCESSIBILITY", "UNKNOWN_INFORMATION", "DEPENDENCY", "FAILURE_MODE",
];

test("critic challenges a proposal across the documented categories with resolvable, uncertain references", () => {
  const problem = buildProblem({
    statement: "A user-described service challenge.",
    constraints: "Keep personal information private\nAccessible to screen-reader users",
  });
  const solution = generateProposedSolutions(problem)[0];
  const critique = critiqueSolution(problem, solution);
  const categories = new Set(critique.findings.map((finding) => finding.category));
  assert.ok(EXPECTED_CATEGORIES.every((category) => categories.has(category)));
  assert.ok(critique.findings.every((finding) => ["CHECK", "UNKNOWN"].includes(finding.status)));
  assert.ok(critique.findings.every((finding) => finding.source === "PROPOSED" || finding.source === "DERIVED"));
  assert.ok(critique.findings.every((finding) => finding.evidenceIds.every((id) => problem.evidence.some((item) => item.id === id))));
  assert.ok(critique.findings.every((finding) => finding.constraintIds.every((id) => problem.constraints.some((item) => item.id === id))));
  assert.match(critique.findings.find((finding) => finding.category === "PRIVACY")?.finding ?? "", /not establish/);
  assert.match(critique.findings.find((finding) => finding.category === "ACCESSIBILITY")?.finding ?? "", /No user test/);
});

test("missing constraints and access/privacy inputs remain unknown rather than being treated as safe", () => {
  const problem = buildProblem({ statement: "A problem without further detail." });
  const solution = generateProposedSolutions(problem)[0];
  const critique = critiqueSolution(problem, solution);
  assert.ok(critique.findings.some((finding) => finding.category === "CONSTRAINT_PRESSURE" && finding.status === "UNKNOWN"));
  assert.ok(critique.findings.some((finding) => finding.category === "PRIVACY" && finding.status === "UNKNOWN"));
  assert.ok(critique.findings.some((finding) => finding.category === "ACCESSIBILITY" && finding.status === "UNKNOWN"));
  assert.ok(critique.findings.some((finding) => finding.category === "EXCLUDED_USERS" && finding.finding.includes("could")));
});
