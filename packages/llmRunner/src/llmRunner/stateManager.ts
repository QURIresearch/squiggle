import chalk from "chalk";

import {
  calculatePriceMultipleCalls,
  LLMClient,
  LlmMetrics,
  LLMName,
  Message,
} from "./LLMClient";
import { LLMStep, State, StateHandler } from "./LLMStep";
import { TimestampedLogEntry } from "./Logger";
import { LlmConfig } from "./squiggleGenerator";

export class StateManager {
  private steps: LLMStep[] = [];
  private stateHandlers: Map<State, StateHandler> = new Map();
  private priceLimit: number;
  private durationLimitMs: number;
  private startTime: number;

  public llmClient: LLMClient;

  constructor(
    public llmConfig: LlmConfig,
    openaiApiKey?: string,
    anthropicApiKey?: string
  ) {
    this.registerDefaultHandlers();
    this.priceLimit = llmConfig.priceLimit;
    this.durationLimitMs = llmConfig.durationLimitMinutes * 1000 * 60;
    this.startTime = Date.now();

    this.llmClient = new LLMClient(
      llmConfig.llmName,
      openaiApiKey,
      anthropicApiKey
    );
  }

  private registerDefaultHandlers() {
    this.registerStateHandler(State.DONE, {
      execute: async (stateExecution) => {
        stateExecution.updateNextState(State.DONE);
      },
    });

    this.registerStateHandler(State.CRITICAL_ERROR, {
      execute: async (step) => {
        step.updateNextState(State.CRITICAL_ERROR);
      },
    });
  }

  registerStateHandler(state: State, handler: StateHandler) {
    this.stateHandlers.set(state, handler);
  }

  private createNewStateExecution(): LLMStep {
    const previousExecution = this.getCurrentStep();
    const currentState = previousExecution?.nextState ?? State.START;
    const initialCodeState = previousExecution?.codeState ?? { type: "noCode" };

    const newExecution = new LLMStep(currentState, initialCodeState, this);
    this.steps.push(newExecution);
    return newExecution;
  }

  async step(): Promise<{
    continueExecution: boolean;
  }> {
    if (Date.now() - this.startTime > this.durationLimitMs) {
      return this.transitionToCriticalError(
        `Duration limit of ${this.durationLimitMs / 1000 / 60} minutes exceeded`
      );
    }

    if (this.priceSoFar() > this.priceLimit) {
      return this.transitionToCriticalError(
        `Price limit of $${this.priceLimit.toFixed(2)} exceeded`
      );
    }

    const stateExecution = this.createNewStateExecution();

    try {
      const handler = this.stateHandlers.get(stateExecution.state);
      if (handler) {
        await handler.execute(stateExecution);
        stateExecution.complete();
      } else {
        throw new Error(
          `No handler registered for state ${State[stateExecution.state]}`
        );
      }
    } catch (error) {
      stateExecution.criticalError(
        error instanceof Error ? error.message : "unknown"
      );
    }

    console.log(
      chalk.cyan(`Finishing state ${State[stateExecution.state]}`),
      stateExecution
    );

    return {
      continueExecution: !this.isProcessComplete(),
    };
  }

  private transitionToCriticalError(reason: string): {
    continueExecution: boolean;
    stateExecution: LLMStep;
  } {
    const stateExecution = this.createNewStateExecution();
    stateExecution.criticalError(reason);

    return {
      continueExecution: false,
      stateExecution,
    };
  }

  getSteps(): LLMStep[] {
    return this.steps;
  }

  getCurrentStep(): LLMStep | undefined {
    return this.steps.at(-1);
  }

  getCurrentState(): State {
    return this.getCurrentStep()?.state ?? State.START;
  }

  getLogs(): TimestampedLogEntry[] {
    return this.steps.flatMap((r) => r.getLogs());
  }

  getConversationMessages(): Message[] {
    return this.steps.flatMap((r) => r.getConversationMessages());
  }

  isProcessComplete(): boolean {
    const currentState = this.getCurrentState();
    return currentState === State.DONE || currentState === State.CRITICAL_ERROR;
  }

  getFinalResult(): {
    isValid: boolean;
    code: string;
    logs: TimestampedLogEntry[];
  } {
    const finalStep = this.getCurrentStep();
    if (!finalStep) {
      throw new Error("No state executions found");
    }

    const isValid = finalStep.nextState === State.DONE;
    const code =
      finalStep.codeState.type === "noCode" ? "" : finalStep.codeState.code;

    return {
      isValid,
      code,
      logs: this.getLogs(),
    };
  }

  llmMetricSummary(): Record<LLMName, LlmMetrics> {
    return this.getSteps().reduce(
      (acc, execution) => {
        execution.llmMetricsList.forEach((metrics) => {
          if (!acc[metrics.llmName]) {
            acc[metrics.llmName] = { ...metrics };
          } else {
            acc[metrics.llmName].apiCalls += metrics.apiCalls;
            acc[metrics.llmName].inputTokens += metrics.inputTokens;
            acc[metrics.llmName].outputTokens += metrics.outputTokens;
          }
        });
        return acc;
      },
      {} as Record<LLMName, LlmMetrics>
    );
  }

  getLlmMetrics(): { totalPrice: number; llmRunCount: number } {
    const metricsSummary = this.llmMetricSummary();
    const totalPrice = calculatePriceMultipleCalls(metricsSummary);
    const llmRunCount = Object.values(metricsSummary).reduce(
      (sum, metrics) => sum + metrics.apiCalls,
      0
    );
    return { totalPrice, llmRunCount };
  }

  private findLastGenerateCodeIndex(): number {
    return this.steps.findLastIndex(
      (execution) => execution.state === State.GENERATE_CODE
    );
  }

  private getMessagesFromSteps(stepIndices: number[]): Message[] {
    return stepIndices.flatMap((index) =>
      this.steps[index].getConversationMessages()
    );
  }

  private priceSoFar(): number {
    const currentMetrics = this.llmMetricSummary();
    return calculatePriceMultipleCalls(currentMetrics);
  }

  getRelevantPreviousConversationMessages(maxRecentSteps = 3): Message[] {
    const getRelevantStepIndexes = (
      lastGenerateCodeIndex: number,
      maxRecentExecutions: number
    ): number[] => {
      const endIndex = this.steps.length - 1;
      const startIndex = Math.max(
        lastGenerateCodeIndex,
        endIndex - maxRecentExecutions + 1
      );
      return [
        lastGenerateCodeIndex,
        ...Array.from(
          { length: endIndex - startIndex + 1 },
          (_, i) => startIndex + i
        ),
      ].filter((index, i, arr) => index >= 0 && arr.indexOf(index) === i);
    };

    const lastGenerateCodeIndex = this.findLastGenerateCodeIndex();
    const relevantIndexes = getRelevantStepIndexes(
      lastGenerateCodeIndex,
      maxRecentSteps
    );
    return this.getMessagesFromSteps(relevantIndexes);
  }
}
