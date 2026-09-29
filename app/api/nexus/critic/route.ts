import { NextResponse } from "next/server";
import { critiqueSolutions } from "../../../../lib/critic";
import { parseProblemAnalysis, parseProblemInput, parseSolutions, SchemaValidationError } from "../../../../lib/validation";

export const runtime = "nodejs";
export const maxDuration = 10;
const MAX_BODY_BYTES = 100_000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: { code: "INPUT_TOO_LARGE", message: "The critic request exceeded the allowed size." } }, { status: 413 });
    }
    body = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "The request body was not valid JSON." } }, { status: 400 });
  }

  const envelope = asRecord(body);
  if (!envelope) return NextResponse.json({ error: { code: "INVALID_INPUT", message: "A structured problem and its original input are required." } }, { status: 400 });
  try {
    const input = parseProblemInput(envelope.input);
    const problem = parseProblemAnalysis(envelope.problem, input);
    const solutions = parseSolutions({ solutions: envelope.solutions }, problem);
    return NextResponse.json({ data: critiqueSolutions(problem, solutions), mode: "demo", notice: "The critic is a deterministic rule-based challenge pass. Findings are checks to verify, not confirmed defects." });
  } catch (cause) {
    if (cause instanceof SchemaValidationError) {
      return NextResponse.json({ error: { code: "INVALID_STAGE_DATA", message: "The completed stage could not be validated for critic review." } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: "CRITIC_FAILED", message: "The critic could not review this stage. The completed problem and solutions are preserved." } }, { status: 500 });
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
