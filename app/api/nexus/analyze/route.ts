import { NextResponse } from "next/server";
import { createConfiguredProvider, ProviderFailure } from "../../../../lib/openai-provider";
import { LocalGuidedProvider } from "../../../../lib/provider";
import { parseProblemInput, SchemaValidationError } from "../../../../lib/validation";

export const runtime = "nodejs";
export const maxDuration = 10;
const localProvider = new LocalGuidedProvider();
const MAX_BODY_BYTES = 24_000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: { code: "INPUT_TOO_LARGE", message: "Keep this request under 24 KB." } }, { status: 413 });
    }
    body = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "The request body was not valid JSON." } }, { status: 400 });
  }

  try {
    const input = parseProblemInput(body);
    const configured = createConfiguredProvider();
    try {
      const problem = await configured.provider.analyzeProblem(input);
      return NextResponse.json({ data: problem, mode: configured.mode, ...(configured.reason ? { notice: configured.reason } : {}) });
    } catch (cause) {
      if (configured.mode === "demo") throw cause;
      const problem = await localProvider.analyzeProblem(input);
      return NextResponse.json({
        data: problem,
        mode: "demo",
        notice: `Live analysis could not be completed (${safeFailure(cause)}). The supplied text was preserved and mapped with the deterministic demo instead.`,
      });
    }
  } catch (cause) {
    if (cause instanceof SchemaValidationError || cause instanceof Error && /Describe the problem|under 3000|no more than|each optional/.test(cause.message)) {
      return NextResponse.json({ error: { code: "INVALID_INPUT", message: cause.message } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: "ANALYSIS_FAILED", message: "Problem analysis could not be completed. Your form text is still on this page; retry or use the deterministic demo." } }, { status: 500 });
  }
}

function safeFailure(cause: unknown): string {
  if (cause instanceof ProviderFailure) {
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
  return "unexpected provider error";
}
