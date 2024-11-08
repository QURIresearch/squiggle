import { Code, codeStringToCode } from "../Code.js";
import { LLMStepTemplate } from "../LLMStepTemplate.js";
import { changeFormatPrompt, PromptPair } from "../prompts.js";
import { diffToNewCode } from "../squiggle/processSquiggleCode.js";

function adjustToFeedbackPrompt(
  prompt: string,
  code: Extract<Code, { type: "success" }>
): PromptPair {
  const fullPrompt = `You are an expert in mathematical modeling and validation. Your task is to review the model results and suggest improvements if the outputs don't make logical sense.

<original_prompt>
${prompt}
</original_prompt>

<original_code>
${code.source}
</original_code>

<previous_output>
Variables: "${code.result.bindings}"
Result: "${code.result.result}"
</previous_output>

Please validate the model results with these considerations:
1. **Mathematical Soundness**: Are the calculations logically consistent with the model's assumptions and principles?
2. **Range Check**: Are outputs within reasonable bounds? Not all surprising results are wrong.
3. **Error Cases**: Does the model appropriately handle zeros, negatives, and extreme values?

Remember:
- Only suggest fixes for clear mathematical or logical errors
- If outputs are surprising but mathematically valid, do not adjust the model
- Default to trusting the model unless you find specific flaws

If the model is mathematically sound (most cases), respond with:
<response>
NO_ADJUSTMENT_NEEDED
</response>

If you find genuine mathematical errors, provide:
1. The corrected code
2. A brief explanation (6-20 words) identifying the specific flaw fixed

Focus solely on mathematical correctness, not style or optimization.

${changeFormatPrompt}
`;

  const summarizedPrompt = `Validate mathematical model results for: ${prompt.substring(0, 150)}${prompt.length > 150 ? "..." : ""}. Check for logical consistency and numerical accuracy.`;

  return { fullPrompt, summarizedPrompt };
}

export const adjustToFeedbackStep = new LLMStepTemplate(
  "AdjustToFeedback",
  {
    inputs: {
      prompt: "prompt",
      code: "code",
    },
    outputs: {
      code: "code",
    },
  },
  async (context, { prompt, code }) => {
    if (code.value.type !== "success") {
      throw new Error("Failed to process code in AdjustToFeedback stage");
    }

    const completion = await context.queryLLM(
      adjustToFeedbackPrompt(prompt.value, code.value)
    );

    if (!completion) {
      // failed
      return;
    }

    // handle adjustment response
    const trimmedResponse = completion.trim();
    const noAdjustmentRegex =
      /no\s+adjust(?:ment)?\s+needed|NO_ADJUSTMENT_NEEDED/i;
    const isShortResponse = trimmedResponse.length <= 100;

    if (noAdjustmentRegex.test(trimmedResponse) && isShortResponse) {
      context.log({
        type: "info",
        message: "LLM determined no adjustment is needed",
      });
      return;
    }

    if (
      trimmedResponse.length > 0 &&
      !noAdjustmentRegex.test(trimmedResponse)
    ) {
      const diffResponse = diffToNewCode(completion, code.value);
      if (!diffResponse.ok) {
        context.log({
          type: "error",
          message: "FAIL: " + diffResponse.value,
        });
        // try again
        context.setOutput("code", code);
        return;
      }

      const adjustedCode = await codeStringToCode(diffResponse.value);
      context.setOutput("code", adjustedCode);
      return;
    } else {
      context.log({
        type: "info",
        message: "No adjustments provided, considering process complete",
      });
      return;
    }
  }
);
