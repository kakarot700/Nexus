import { NextResponse } from "next/server";
import { createConfiguredProvider, ProviderFailure } from "../../../../lib/openai-provider";
import { generateProposedSolutions } from "../../../../lib/engine";
import { parseProblemAnalysis, parseProblemInput, parseSolutions, SchemaValidationError } from "../../../../lib/validation";

export const runtime = "nodejs";
export const maxDuration = 10;
const MAX_BODY_BYTES = 90_000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: { code: "INPUT_TOO_LARGE", message: "The structured analysis exceeded the allowed request size." } }, { status: 413 });
    }
    body = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "The request body was not valid JSON." } }, { status: 400 });
  }

  const envelope = asRecord(body);
  if (!envelope || !asRecord(envelope.input)) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "The structured analysis and original input are required." } }, { status: 400 });
  }

  try {
    const input = parseProblemInput(envelope.input);
    const problem = parseProblemAnalysis(envelope.problem, input);
    const configured = createConfiguredProvider();
    try {
      const solutions = await configured.provider.generateSolutions(problem);
      const validatedSolutions = parseSolutions({ solutions }, problem);
      return NextResponse.json({
        data: validatedSolutions,
        mode: configured.mode,
        ...(configured.reason ? { notice: configured.reason } : {}),
      });
    } catch (cause) {
      if (configured.mode === "demo") throw cause;
      const solutions = generateProposedSolutions(problem);
      return NextResponse.json({
        data: solutions,
        mode: "demo",
        notice: `Live solution generation could not be completed (${safeFailure(cause)}). The deterministic demo supplied distinct, unverified strategy templates instead.`,
      });
    }
  } catch (cause) {
    if (cause instanceof SchemaValidationError) {
      return NextResponse.json({ error: { code: "INVALID_ANALYSIS", message: "The analysis structure could not be validated. Re-analyze the problem before continuing." } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: "SOLUTIONS_FAILED", message: "Solution paths could not be prepared. The completed problem map is preserved; retry or use deterministic proposals." } }, { status: 500 });
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function safeFailure(cause: unknown): string {
  if (!(cause instanceof ProviderFailure)) return "response validation failed";
  const labels: Record<ProviderFailure["kind"], string> = {
    TIMEOUT: "request timed out",
    RATE_LIMIT: "provider rate limit",
    UNAVAILABLE: "provider unavailable",
    NETWORK: "network error",
    SCHEMA: "response validation failed",
    PROVIDER: "provider request failed",
  };
  return labels[cause.kind];
}
