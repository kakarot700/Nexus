import assert from "node:assert/strict";
import test from "node:test";
import { buildProblem, generateProposedSolutions } from "../lib/engine";
import { OpenAIProvider, ProviderFailure, providerConfiguration } from "../lib/openai-provider";

function completion(content: unknown, finishReason = "stop", status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content: typeof content === "string" ? content : JSON.stringify(content) }, finish_reason: finishReason }] }), { status });
}

function withEnvironment(values: Record<string, string | undefined>, run: () => void) {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try { run(); }
  finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("provider sends its credential only to the official server-side Chat Completions endpoint and validates analysis JSON", async () => {
  let observedUrl = "";
  let observedAuthorization = "";
  let body: Record<string, unknown> = {};
  const provider = new OpenAIProvider("unit-test-secret", "account-model", async (url, init) => {
    observedUrl = String(url);
    observedAuthorization = new Headers(init?.headers).get("authorization") ?? "";
    body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return completion({
      problem: { statement: "Model rewrite must not replace the source.", context: "" },
      stakeholders: [], goals: [], evidence: [], constraints: [], unknowns: ["Needs field verification."], assumptions: [],
    });
  });
  const input = { statement: "A source description the user supplied." };
  const result = await provider.analyzeProblem(input);
  assert.equal(observedUrl, "https://api.openai.com/v1/chat/completions");
  assert.equal(observedAuthorization, "Bearer unit-test-secret");
  assert.equal(body.response_format && (body.response_format as { type: string }).type, "json_object");
  assert.equal(result.problem.statement, input.statement);
  assert.deepEqual(result.stakeholders, []);
  assert.equal(result.evidence[0].status, "USER_PROVIDED");
});

test("provider output is validated and references are reduced to known domain objects", async () => {
  const problem = buildProblem({ statement: "A short supplied challenge.", constraints: "Intermittent internet" });
  const proposals = generateProposedSolutions(problem).map((solution) => ({
    ...solution,
    evidenceIds: [...solution.evidenceIds, "invented-source"],
    constraintIds: [...solution.constraintIds, "invented-constraint"],
  }));
  const provider = new OpenAIProvider("unit-test-secret", "account-model", async () => completion({ solutions: proposals }));
  const result = await provider.generateSolutions(problem);
  assert.equal(result.length, 5);
  assert.ok(result.every((solution) => solution.evidenceIds.every((id) => problem.evidence.some((item) => item.id === id))));
  assert.ok(result.every((solution) => solution.constraintIds.every((id) => problem.constraints.some((item) => item.id === id))));
});

test("provider failure messages never disclose credential text or raw provider error bodies", async () => {
  const provider = new OpenAIProvider("do-not-print-this-token", "account-model", async () => new Response("private provider diagnostics", { status: 429 }));
  await assert.rejects(provider.analyzeProblem({ statement: "A test problem." }), (error: unknown) => {
    assert.ok(error instanceof ProviderFailure);
    assert.equal(error.kind, "RATE_LIMIT");
    assert.equal(error.message.includes("do-not-print-this-token"), false);
    assert.equal(error.message.includes("private provider diagnostics"), false);
    return true;
  });
});

test("incomplete or malformed model responses fail closed for the route-level deterministic fallback", async () => {
  const incomplete = new OpenAIProvider("test-key", "account-model", async () => completion({ partial: true }, "length"));
  await assert.rejects(incomplete.analyzeProblem({ statement: "A test problem." }), (error: unknown) => error instanceof ProviderFailure && error.kind === "SCHEMA");
  const malformed = new OpenAIProvider("test-key", "account-model", async () => new Response("not json", { status: 200 }));
  await assert.rejects(malformed.analyzeProblem({ statement: "A test problem." }), (error: unknown) => error instanceof ProviderFailure && error.kind === "SCHEMA");
});

test("configuration stays in deterministic demo mode unless provider, key and model are all present", () => {
  withEnvironment({ NEXUS_AI_PROVIDER: undefined, OPENAI_API_KEY: undefined, OPENAI_MODEL: undefined }, () => {
    assert.deepEqual(providerConfiguration(), { mode: "demo", reason: "Live AI is off; deterministic demo mode is active." });
  });
  withEnvironment({ NEXUS_AI_PROVIDER: "openai", OPENAI_API_KEY: undefined, OPENAI_MODEL: undefined }, () => {
    const configuration = providerConfiguration();
    assert.equal(configuration.mode, "demo");
    assert.match(configuration.reason ?? "", /OPENAI_API_KEY or OPENAI_MODEL/);
  });
  withEnvironment({ NEXUS_AI_PROVIDER: "openai", OPENAI_API_KEY: "test-key", OPENAI_MODEL: "test-model" }, () => {
    assert.deepEqual(providerConfiguration(), { mode: "openai" });
  });
});

test("network timeout failures are classified and bounded for deterministic fallback", async () => {
  const provider = new OpenAIProvider("test-key", "account-model", async () => { throw new DOMException("timeout", "TimeoutError"); });
  await assert.rejects(provider.analyzeProblem({ statement: "A test problem." }), (error: unknown) => error instanceof ProviderFailure && error.kind === "TIMEOUT");
});
