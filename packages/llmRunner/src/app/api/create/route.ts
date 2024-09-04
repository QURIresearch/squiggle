import { LlmConfig, runSquiggleGenerator } from "../../../llmRunner/main";
import {
  CreateRequestBody,
  createRequestBodySchema,
  SquiggleResponse,
} from "../../utils/squiggleTypes";

export const maxDuration = 500;

export async function POST(req: Request) {
  const abortController = new AbortController();

  try {
    const body = await req.json();
    const { prompt, squiggleCode }: CreateRequestBody =
      createRequestBodySchema.parse(body);

    console.log("Inputs", prompt, squiggleCode);

    if (!prompt && !squiggleCode) {
      throw new Error("Prompt or Squiggle code is required");
    }

    // Create a SquiggleGenerator instance
    const llmConfig: LlmConfig = {
      llmName: "Claude-Sonnet",
      priceLimit: 0.3,
      durationLimitMinutes: 4,
      messagesInHistoryToKeep: 4,
    };

    const { totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary } =
      await runSquiggleGenerator({
        input: squiggleCode
          ? { type: "Edit", code: squiggleCode }
          : { type: "Create", prompt: prompt ?? "" },
        llmConfig,
        abortSignal: req.signal,
        openaiApiKey: process.env["OPENROUTER_API_KEY"],
        anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
      });

    const response: SquiggleResponse = [
      {
        code: typeof code === "string" ? code : "",
        isValid,
        totalPrice,
        runTimeMs,
        llmRunCount,
        logSummary,
      },
    ];

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return new Response("Generation stopped", { status: 499 });
    }
    console.error("Error in POST function:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred while processing the request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
