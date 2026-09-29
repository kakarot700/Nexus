import assert from "node:assert/strict";
import test from "node:test";
import { POST as analyze } from "../app/api/nexus/analyze/route";
import { POST as generateSolutions } from "../app/api/nexus/solutions/route";
import { POST as runCritic } from "../app/api/nexus/critic/route";
import { LocalGuidedProvider } from "../lib/provider";
import type { Problem, ProblemInput, Solution, SolutionCritique } from "../lib/types";

const input: ProblemInput = {
  statement: "Students have intermittent internet access.",
  stakeholders: "Students",
  constraints: "Intermittent internet connectivity",
};

function request(body: string | unknown): Request {
  return new Request("http://localhost/api/nexus/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function withEnv<T>(values: Record<string, string | undefined>, run: () => Promise<T>): Promise<T> {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try { return await run(); }
  finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("analysis route rejects malformed JSON, invalid user text, and oversized payloads with structured errors", async () => {
  await withEnv({ NEXUS_AI_PROVIDER: "demo", OPENAI_API_KEY: undefined, OPENAI_MODEL: undefined }, async () => {
    const malformed = await analyze(request("{"));
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json() as { error: { code: string } }).error.code, "INVALID_JSON");
    const invalid = await analyze(request({ statement: " " }));
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json() as { error: { code: string } }).error.code, "INVALID_INPUT");
    const tooLarge = await analyze(request({ statement: "x".repeat(24_100) }));
    assert.equal(tooLarge.status, 413);
    assert.equal((await tooLarge.json() as { error: { code: string } }).error.code, "INPUT_TOO_LARGE");
  });
});

test("analysis route defaults to honest deterministic mapping and retains exact supplied evidence", async () => {
  await withEnv({ NEXUS_AI_PROVIDER: "demo", OPENAI_API_KEY: undefined, OPENAI_MODEL: undefined }, async () => {
    const response = await analyze(request(input));
    assert.equal(response.status, 200);
    const envelope = await response.json() as { data: Problem; mode: string; notice?: string };
    assert.equal(envelope.mode, "demo");
    assert.equal(envelope.data.problem.statement, input.statement);
    assert.ok(envelope.data.evidence.some((item) => item.text === input.statement && item.status === "USER_PROVIDED"));
    assert.match(envelope.notice ?? "", /deterministic demo/);
  });
});

test("solution and critic routes validate the real stage data and return five distinct, checked paths", async () => {
  await withEnv({ NEXUS_AI_PROVIDER: "demo", OPENAI_API_KEY: undefined, OPENAI_MODEL: undefined }, async () => {
    const provider = new LocalGuidedProvider();
    const problem = await provider.analyzeProblem(input);
    const solutionResponse = await generateSolutions(request({ input, problem }));
    assert.equal(solutionResponse.status, 200);
    const solutionsEnvelope = await solutionResponse.json() as { data: Solution[]; mode: string };
    assert.equal(solutionsEnvelope.mode, "demo");
    assert.equal(solutionsEnvelope.data.length, 5);
    assert.equal(new Set(solutionsEnvelope.data.map((item) => item.strategyType)).size, 5);
    const criticResponse = await runCritic(request({ input, problem, solutions: solutionsEnvelope.data }));
    assert.equal(criticResponse.status, 200);
    const criticEnvelope = await criticResponse.json() as { data: SolutionCritique[]; mode: string; notice: string };
    assert.equal(criticEnvelope.mode, "demo");
    assert.equal(criticEnvelope.data.length, 5);
    assert.match(criticEnvelope.notice, /deterministic rule-based/);
    assert.ok(criticEnvelope.data.every((critique) => critique.findings.length >= 8));
  });
});

test("analysis route falls back after provider rate limiting without exposing provider diagnostics", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response("private raw provider response", { status: 429 })) as typeof fetch;
  try {
    await withEnv({ NEXUS_AI_PROVIDER: "openai", OPENAI_API_KEY: "unit-test-key", OPENAI_MODEL: "unit-test-model" }, async () => {
      const response = await analyze(request(input));
      assert.equal(response.status, 200);
      const envelope = await response.json() as { data: Problem; mode: string; notice?: string };
      assert.equal(envelope.mode, "demo");
      assert.equal(envelope.data.problem.statement, input.statement);
      assert.match(envelope.notice ?? "", /provider rate limit/);
      assert.doesNotMatch(envelope.notice ?? "", /private raw provider response|unit-test-key/);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
