import "server-only";

import {
  buildPrototype,
  emptyEvaluation,
} from "./engine";
import { critiqueSolutions } from "./critic";
import { parseProblemAnalysis, parseSolutions, SchemaValidationError } from "./validation";
import { LocalGuidedProvider, type AIProvider } from "./provider";
import type { Evaluation, Problem, ProblemInput, Prototype, Solution, SolutionCritique } from "./types";

const CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 7_500;
const MAX_RESPONSE_CHARS = 80_000;

export type ProviderFailureKind = "TIMEOUT" | "RATE_LIMIT" | "UNAVAILABLE" | "NETWORK" | "SCHEMA" | "PROVIDER";

export class ProviderFailure extends Error {
  constructor(readonly kind: ProviderFailureKind, message: string) {
    super(message);
    this.name = "ProviderFailure";
  }
}

interface OpenAICompletionEnvelope {
  choices?: Array<{ message?: { content?: unknown; refusal?: unknown }; finish_reason?: unknown }>;
  error?: unknown;
}

export class OpenAIProvider implements AIProvider {
  constructor(
    private readonly apiKey = process.env.OPENAI_API_KEY ?? "",
    private readonly model = process.env.OPENAI_MODEL ?? "",
    private readonly request: typeof fetch = fetch,
  ) {
    if (!apiKey.trim() || !model.trim()) throw new ProviderFailure("UNAVAILABLE", "The live provider is not configured.");
  }

  async analyzeProblem(input: ProblemInput): Promise<Problem> {
    const inputJson = JSON.stringify(input);
    const response = await this.complete(
      "Interpret the user's problem using the NEXUS ProblemAnalysis schema. Return only a JSON object. Never add facts, statistics, policies, locations, or constraints not present in the supplied input. Use evidence statuses USER_PROVIDED only for exact supplied text. Use DERIVED only when evidenceIds point to existing input evidence, and surface unresolved information in unknowns. Keep solution recommendations out of analysis.",
      `Return an object with problem {statement, context}, stakeholders [{id,name,role,needs,evidenceIds}], goals [string], evidence [{id,text,status,sourceQuote?}], constraints [{id,category,description,source,status?,evidenceIds}], unknowns [string], assumptions [string]. Strategy categories may only use COST, TIME, INFRASTRUCTURE, TECHNOLOGY, CONNECTIVITY, GEOGRAPHY, ACCESSIBILITY, PRIVACY, RELIABILITY, USERS, ENVIRONMENT, IMPLEMENTATION_COMPLEXITY, OTHER. Direct quotes are encouraged for sourceQuote. Input JSON: ${inputJson}`,
    );
    try {
      return parseProblemAnalysis(response, input);
    } catch (cause) {
      if (cause instanceof SchemaValidationError) throw new ProviderFailure("SCHEMA", "The provider response did not match the required problem-analysis schema.");
      throw cause;
    }
  }

  async generateSolutions(problem: Problem): Promise<Solution[]> {
    const response = await this.complete(
      "Generate 3 to 5 genuinely different NEXUS solution paths. Use distinct strategy types from SOFTWARE, HUMAN_SOFTWARE, INFRASTRUCTURE, BEHAVIORAL, HYBRID; do not paraphrase one product into multiple options. All claims are proposals, not facts. Explicitly respond to each supplied constraint and state the limitation of each response. Cite only IDs present in the supplied analysis. Return only JSON.",
      `Return {solutions:[{id,name,strategyType,summary,mechanism,requiredResources,benefits,risks,assumptions,evidenceIds,constraintIds,constraintResponses:[{constraintId,designResponse,limitation}]}]}. Provide 3 to 5 paths with unique strategy types. Do not include evaluation scores or claim verification. Analysis JSON: ${JSON.stringify(problem)}`,
    );
    try {
      return parseSolutions(response, problem);
    } catch (cause) {
      if (cause instanceof SchemaValidationError) throw new ProviderFailure("SCHEMA", "The provider response did not meet the distinct-solution schema.");
      throw cause;
    }
  }

  async critiqueSolutions(problem: Problem, solutions: Solution[]): Promise<SolutionCritique[]> {
    return critiqueSolutions(problem, solutions);
  }

  async evaluateSolutions(_problem: Problem, solutions: Solution[]): Promise<Evaluation[]> {
    return solutions.map((solution) => emptyEvaluation(solution.id));
  }

  async generatePrototype(_problem: Problem, solution: Solution): Promise<Prototype> {
    return buildPrototype(solution);
  }

  private async complete(instructions: string, userContent: string): Promise<unknown> {
    let response: Response;
    try {
      response = await this.request(CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: `${instructions} Output valid JSON. No Markdown fences.` },
            { role: "user", content: userContent },
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 4_000,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (cause) {
      if (cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError")) {
        throw new ProviderFailure("TIMEOUT", "The live provider did not respond before the request timed out.");
      }
      throw new ProviderFailure("NETWORK", "The live provider could not be reached.");
    }

    if (response.status === 429) throw new ProviderFailure("RATE_LIMIT", "The live provider is rate-limited or unavailable right now.");
    if (response.status >= 500) throw new ProviderFailure("UNAVAILABLE", "The live provider is temporarily unavailable.");
    if (!response.ok) throw new ProviderFailure("PROVIDER", "The live provider rejected the request. Check its model and account configuration.");

    let envelope: OpenAICompletionEnvelope;
    try {
      const raw = await response.text();
      if (raw.length > MAX_RESPONSE_CHARS) throw new ProviderFailure("SCHEMA", "The provider response exceeded the allowed size.");
      envelope = JSON.parse(raw) as OpenAICompletionEnvelope;
    } catch (cause) {
      if (cause instanceof ProviderFailure) throw cause;
      throw new ProviderFailure("SCHEMA", "The live provider returned an unreadable response.");
    }

    const choice = envelope.choices?.[0];
    if (choice?.message?.refusal) throw new ProviderFailure("PROVIDER", "The live provider declined this request.");
    if (choice?.finish_reason !== "stop" || typeof choice.message?.content !== "string") {
      throw new ProviderFailure("SCHEMA", "The live provider did not return a complete JSON response.");
    }
    try {
      return JSON.parse(choice.message.content) as unknown;
    } catch {
      throw new ProviderFailure("SCHEMA", "The live provider response was not valid JSON.");
    }
  }
}

export function providerConfiguration(): { mode: "openai" | "demo"; reason?: string } {
  if (process.env.NEXUS_AI_PROVIDER !== "openai") return { mode: "demo", reason: "Live AI is off; deterministic demo mode is active." };
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
    return { mode: "demo", reason: "Live AI is selected but missing OPENAI_API_KEY or OPENAI_MODEL; deterministic demo mode is active." };
  }
  return { mode: "openai" };
}

export function createConfiguredProvider(): { provider: AIProvider; mode: "openai" | "demo"; reason?: string } {
  const configuration = providerConfiguration();
  if (configuration.mode === "demo") return { provider: new LocalGuidedProvider(), ...configuration };
  return { provider: new OpenAIProvider(), mode: "openai" };
}
