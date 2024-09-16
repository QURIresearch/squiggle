import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import { LLMName, MODEL_CONFIGS } from "./modelConfigs";
import { squiggleSystemContent } from "./prompts";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

function convertToClaudeMessages(history: Message[]): Anthropic.MessageParam[] {
  return history
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role as Exclude<Message["role"], "system">,
      content: msg.content,
    }));
}

function extractTextContent(content: Anthropic.ContentBlock[]): string {
  return content
    .filter(
      (block): block is Extract<Anthropic.ContentBlock, { type: "text" }> =>
        block.type === "text"
    )
    .map((block) => block.text)
    .join("\n");
}

interface StandardizedChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  content: string;
  role: "assistant";
  finish_reason: string | null;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function convertClaudeToStandardFormat(
  claudeResponse: Anthropic.Message
): StandardizedChatCompletion {
  return {
    id: claudeResponse.id,
    object: "chat.completion",
    created: Date.now(),
    model: claudeResponse.model,
    content: extractTextContent(claudeResponse.content),
    role: "assistant",
    finish_reason: claudeResponse.stop_reason || null,
    usage: {
      prompt_tokens: claudeResponse.usage.input_tokens,
      completion_tokens: claudeResponse.usage.output_tokens,
      total_tokens:
        claudeResponse.usage.input_tokens + claudeResponse.usage.output_tokens,
    },
  };
}

function convertOpenAIToStandardFormat(
  openAIResponse: OpenAI.Chat.Completions.ChatCompletion
): StandardizedChatCompletion {
  const choice = openAIResponse.choices[0];
  return {
    id: openAIResponse.id,
    object: openAIResponse.object,
    created: openAIResponse.created,
    model: openAIResponse.model,
    content: choice.message.content || "",
    role: "assistant",
    finish_reason: choice.finish_reason || null,
    usage: openAIResponse.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

export interface LlmMetrics {
  apiCalls: number;
  inputTokens: number;
  outputTokens: number;
  llmName: LLMName;
}

export function calculatePriceMultipleCalls(
  metrics: Partial<Record<LLMName, LlmMetrics>>
): number {
  let totalCost = 0;

  for (const [llmName, { inputTokens, outputTokens }] of Object.entries(
    metrics
  )) {
    const modelConfig = MODEL_CONFIGS[llmName as LLMName];

    if (!modelConfig) {
      console.warn(`No pricing information found for LLM: ${llmName}`);
      continue;
    }

    const inputCost = inputTokens * modelConfig.inputRate;
    const outputCost = outputTokens * modelConfig.outputRate;
    totalCost += inputCost + outputCost;
  }

  return totalCost;
}

function compressAssistantMessages(messages: Message[]): Message[] {
  return messages.reduce((acc, current, index, array) => {
    if (current.role !== "assistant") {
      acc.push(current);
    } else if (index === 0 || array[index - 1].role !== "assistant") {
      acc.push(current);
    } else {
      acc[acc.length - 1].content += "\n\n" + current.content;
    }
    return acc;
  }, [] as Message[]);
}

// Wrapper around OpenAI and Anthropic clients; injects Squiggle context into the conversation.
export class LLMClient {
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;

  constructor(
    public llmName: LLMName,
    openaiApiKey?: string,
    anthropicApiKey?: string
  ) {
    if (openaiApiKey) {
      this.openaiClient = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openaiApiKey,
      });
    }

    if (anthropicApiKey) {
      this.anthropicClient = new Anthropic({
        apiKey: anthropicApiKey,
      });
    }
  }

  getOpenAIClient(): OpenAI {
    if (!this.openaiClient) {
      throw new Error("OpenAI client is not initialized");
    }
    return this.openaiClient;
  }

  getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      throw new Error("Anthropic client is not initialized");
    }
    return this.anthropicClient;
  }

  async run(
    conversationHistory: Message[]
  ): Promise<StandardizedChatCompletion> {
    const selectedModelConfig = MODEL_CONFIGS[this.llmName];

    try {
      if (selectedModelConfig.provider === "anthropic") {
        const anthropicClient = this.getAnthropicClient();
        const compressedMessages =
          compressAssistantMessages(conversationHistory);
        const claudeMessages = convertToClaudeMessages(compressedMessages);

        if (claudeMessages.length === 0) {
          throw new Error("At least one message is required");
        }

        const completion =
          await anthropicClient.beta.promptCaching.messages.create({
            max_tokens: selectedModelConfig.maxTokens,
            messages: claudeMessages,
            model: selectedModelConfig.model,
            system: [
              {
                text: squiggleSystemContent,
                type: "text",
                cache_control: { type: "ephemeral" },
              },
            ],
          });

        return convertClaudeToStandardFormat(completion);
      } else {
        // Use OpenAI (OpenRouter)
        const openaiClient = this.getOpenAIClient();
        const completion = await openaiClient.chat.completions.create({
          model: selectedModelConfig.model,
          messages: [
            { role: "system", content: squiggleSystemContent },
            ...conversationHistory,
          ],
        });

        return convertOpenAIToStandardFormat(completion);
      }
    } catch (error) {
      console.error("Error in API call:", error);
      throw error;
    }
  }
}
