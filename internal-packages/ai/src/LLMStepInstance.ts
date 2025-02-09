import { ArtifactKind, BaseArtifact, makeArtifact } from "./Artifact.js";
import { calculatePriceMultipleCalls } from "./LLMClient/index.js";
import { LLMError } from "./LLMClient/LLMError.js";
import { LlmMetrics, Message } from "./LLMClient/types.js";
import {
  ErrorType,
  ExecuteContext,
  Inputs,
  IOShape,
  LLMStepTemplate,
  OutputKind,
  Outputs,
  StepState,
} from "./LLMStepTemplate.js";
import { LogEntry, Logger, TimestampedLogEntry } from "./Logger.js";
import { LlmId } from "./modelConfigs.js";
import { PromptPair } from "./prompts.js";
import {
  AiDeserializationVisitor,
  AiSerializationVisitor,
} from "./serialization.js";
import { getStepTemplateByName } from "./steps/registry.js";
import { Workflow } from "./workflows/Workflow.js";

export type StepParams<Shape extends IOShape> = {
  id: string;
  sequentialId: number;
  template: LLMStepTemplate<Shape>;
  state: StepState<Shape>;
  inputs: Inputs<Shape>;
  startTime: number;
  conversationMessages: Message[];
  llmMetricsList: LlmMetrics[];
};

class FailError extends Error {
  constructor(
    public type: ErrorType,
    message: string
  ) {
    super(message);
  }
}

export class LLMStepInstance<
  const Shape extends IOShape = IOShape,
  const WorkflowShape extends IOShape = IOShape,
> {
  public id: StepParams<Shape>["id"];
  public sequentialId: StepParams<Shape>["sequentialId"];
  public readonly template: StepParams<Shape>["template"];

  // must be public for `instanceOf` type guard to work
  private _state: StepParams<Shape>["state"];

  public readonly inputs: StepParams<Shape>["inputs"];

  // This is the moment step was _created_, not when it was run.
  // But it shouldn't matter, for now; workflows run steps immediately.
  public startTime: StepParams<Shape>["startTime"];

  private conversationMessages: StepParams<Shape>["conversationMessages"];
  public llmMetricsList: StepParams<Shape>["llmMetricsList"];

  // These two fields are not serialized
  private logger: Logger;
  public workflow: Workflow<WorkflowShape>;

  private constructor(
    params: StepParams<Shape> & {
      workflow: Workflow<WorkflowShape>;
    }
  ) {
    this.id = params.id;
    this.sequentialId = params.sequentialId;

    this.llmMetricsList = params.llmMetricsList;
    this.conversationMessages = params.conversationMessages;

    this.startTime = params.startTime;
    this._state = params.state;

    this.template = params.template;
    this.inputs = params.inputs;

    this.workflow = params.workflow;
    this.logger = new Logger();
  }

  // Create a new, PENDING step instance
  static create<Shape extends IOShape, WorkflowShape extends IOShape>(params: {
    template: LLMStepInstance<Shape>["template"];
    inputs: LLMStepInstance<Shape>["inputs"];
    workflow: Workflow<WorkflowShape>;
  }): LLMStepInstance<Shape, WorkflowShape> {
    return new LLMStepInstance<Shape, WorkflowShape>({
      id: crypto.randomUUID(),
      sequentialId: params.workflow.getStepCount(),
      conversationMessages: [],
      llmMetricsList: [],
      startTime: Date.now(),
      state: { kind: "PENDING" },
      ...params,
    });
  }

  instanceOf<TemplateShape extends IOShape>(
    template: LLMStepTemplate<TemplateShape>
  ): this is LLMStepInstance<TemplateShape, WorkflowShape> {
    return this.template.name === template.name;
  }

  getLogs(): TimestampedLogEntry[] {
    return this.logger.logs;
  }

  getConversationMessages(): Message[] {
    return this.conversationMessages;
  }

  // Runs the PENDING step; its state will be updated to DONE or FAILED.
  async run() {
    if (this._state.kind !== "PENDING") {
      return;
    }

    this.log({
      type: "info",
      message: `Step "${this.template.name}" started`,
    });

    const limits = this.workflow.checkResourceLimits();
    if (limits) {
      this.fail("CRITICAL", limits);
      return;
    }

    // Prepare the execution context, which will be passed to the step implementation.
    const executeContext: ExecuteContext = {
      log: (log) => this.log(log),
      queryLLM: (promptPair) => this.queryLLM(promptPair),
      fail: (errorType, message) => {
        // `context.fail` throws instead of proxying to `this.fail`. This allows
        // us to simplify the return signature of step implementations -
        // `context.fail` is `never`, so we don't need to return anything.
        throw new FailError(errorType, message);
      },
    };

    // Run the step implementation; catch all errors and turn them into FAILED states.
    try {
      const result = await this.template.execute(executeContext, this.inputs);

      const outputs = {} as Outputs<Shape>; // will be filled in below

      // This code is unfortunately full of `as any`, caused by `Object.keys` limitations in TypeScript.
      Object.keys(result).forEach((key: keyof typeof result) => {
        const value = result[key];
        if (value instanceof BaseArtifact) {
          // already existing artifact - probably passed through from another step
          outputs[key] = value as any;
        } else if (!value) {
          outputs[key] = undefined as any;
        } else {
          const outputKind = this.template.shape.outputs[key] as OutputKind;
          const artifactKind = outputKind.endsWith("?")
            ? (outputKind.slice(0, -1) as ArtifactKind)
            : (outputKind as ArtifactKind);

          outputs[key] = makeArtifact(artifactKind, value as any, this) as any;
        }
      });

      this._state = {
        kind: "DONE",
        durationMs: this.calculateDuration(),
        outputs,
      };
    } catch (error) {
      if (error instanceof FailError) {
        this.fail(error.type, error.message);
      } else {
        this.fail(
          // Steps are responsible for handling their own errors.
          // If the step throws anything other than a FailError, we assume it's an error in step implementation.
          "CRITICAL",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    const completionMessage = `Step "${this.template.name}" completed with status: ${this._state.kind}${
      this._state.kind !== "PENDING" && `, in ${this._state.durationMs / 1000}s`
    }`;

    this.log({
      type: "info",
      message: completionMessage,
    });
  }

  getState() {
    return this._state;
  }

  getDuration() {
    return this._state.kind === "PENDING" ? 0 : this._state.durationMs;
  }

  getInputs() {
    return this.inputs;
  }

  getTotalCost() {
    const totalCost = calculatePriceMultipleCalls(
      this.llmMetricsList.reduce(
        (acc, metrics) => {
          acc[metrics.llmId] = metrics;
          return acc;
        },
        {} as Record<LlmId, LlmMetrics>
      )
    );

    return totalCost;
  }

  isGenerationStep() {
    const stepHasCodeInput = Object.values(this.template.shape.inputs).some(
      (kind) => kind === "source" || kind === "code"
    );

    const stepHasCodeOutput = Object.values(this.template.shape.outputs).some(
      (kind) => kind === "source" || kind === "code"
    );

    return !stepHasCodeInput && stepHasCodeOutput;
  }

  isDone() {
    return this._state.kind === "DONE";
  }

  getPreviousStep() {
    const steps = this.workflow.getSteps();
    const index = steps.indexOf(this as LLMStepInstance<any, WorkflowShape>);
    if (index < 1) {
      // first step or not found
      return undefined;
    }
    return steps[index - 1];
  }

  // private methods

  private log(log: LogEntry): void {
    this.logger.log(log, {
      workflowId: this.workflow.id,
      stepIndex: this.sequentialId,
    });
  }

  private fail(errorType: ErrorType, message: string) {
    this.log({ type: "error", message });
    this._state = {
      kind: "FAILED",
      durationMs: this.calculateDuration(),
      errorType,
      message,
    };
  }

  private calculateDuration() {
    return Date.now() - this.startTime;
  }

  private addConversationMessage(message: Message): void {
    this.conversationMessages.push(message);
  }

  private async queryLLM(promptPair: PromptPair): Promise<string> {
    try {
      const messagesToSend: Message[] = [
        ...this.workflow.getRelevantPreviousConversationMessages(
          this.workflow.llmConfig.messagesInHistoryToKeep
        ),
        {
          role: "user",
          content: promptPair.fullPrompt,
        },
      ];
      const completion = await this.workflow.llmClient.run(messagesToSend);

      this.log({
        type: "llmResponse",
        response: completion,
        content: completion.content,
        messages: messagesToSend,
        prompt: promptPair.fullPrompt,
      });

      this.llmMetricsList.push({
        apiCalls: 1,
        inputTokens: completion?.usage?.prompt_tokens ?? 0,
        outputTokens: completion?.usage?.completion_tokens ?? 0,
        llmId: this.workflow.llmConfig.llmId,
      });

      if (!completion?.content) {
        throw new FailError(
          "CRITICAL",
          "Received an empty response from the API"
        );
      } else {
        this.addConversationMessage({
          role: "user",
          content: promptPair.summarizedPrompt,
        });

        this.addConversationMessage({
          role: "assistant",
          content: completion?.content ?? "no response",
        });
      }

      return completion.content;
    } catch (error) {
      if (error instanceof LLMError) {
        if (error.kind === "timeout") {
          // retry timeouts
          throw new FailError("MINOR", error.message);
        } else {
          // fail the workflow on all other LLM errors
          throw new FailError("CRITICAL", error.message);
        }
      } else {
        // LLMClient shouldn't throw anything other than LLMError.
        throw new FailError(
          "CRITICAL",
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  // Serialization/deserialization

  // StepParams don't contain the workflow reference, to to avoid circular dependencies
  toParams(): StepParams<Shape> {
    return {
      id: this.id,
      sequentialId: this.sequentialId,
      template: this.template,
      state: this._state,
      inputs: this.inputs,
      startTime: this.startTime,
      conversationMessages: this.conversationMessages,
      llmMetricsList: this.llmMetricsList,
    };
  }

  static fromParams(
    params: StepParams<any>,
    workflow: Workflow<any>
  ): LLMStepInstance<any, any> {
    return new LLMStepInstance({ ...params, workflow });
  }

  static deserialize(
    {
      templateName,
      inputIds,
      outputIds: legacyOutputIds,
      state: serializedState,
      ...params
    }: SerializedStep,
    visitor: AiDeserializationVisitor
  ): StepParams<any> {
    const template: LLMStepTemplate<any> = getStepTemplateByName(templateName);
    const inputs = Object.fromEntries(
      Object.entries(inputIds).map(([name, inputId]) => [
        name,
        visitor.artifact(inputId),
      ])
    );

    let state: StepState<any>;

    if (serializedState.kind === "DONE") {
      const { outputIds, ...serializedStateWithoutOutputs } = serializedState;
      state = {
        ...serializedStateWithoutOutputs,
        outputs: Object.fromEntries(
          Object.entries(legacyOutputIds ?? outputIds).map(
            ([name, outputId]) => [name, visitor.artifact(outputId)]
          )
        ),
      };
    } else {
      state = serializedState;
    }

    return {
      ...params,
      template,
      inputs,
      state,
    };
  }
}

export function serializeStepParams(
  params: StepParams<IOShape>,
  visitor: AiSerializationVisitor
): SerializedStep {
  let serializedState: SerializedState<IOShape>;
  if (params.state.kind === "DONE") {
    const { outputs, ...stateWithoutOutputs } = params.state;
    serializedState = {
      ...stateWithoutOutputs,
      outputIds: Object.fromEntries(
        Object.entries(outputs)
          .map(([key, output]) =>
            output ? [key, visitor.artifact(output)] : undefined
          )
          .filter((x) => x !== undefined)
      ),
    };
  } else {
    serializedState = params.state;
  }

  return {
    id: params.id,
    sequentialId: params.sequentialId,
    templateName: params.template.name,
    state: serializedState,
    startTime: params.startTime,
    conversationMessages: params.conversationMessages,
    llmMetricsList: params.llmMetricsList,
    inputIds: Object.fromEntries(
      Object.entries(params.inputs).map(([key, input]) => [
        key,
        visitor.artifact(input),
      ])
    ),
  };
}

type SerializedState<Shape extends IOShape> =
  | (Omit<Extract<StepState<Shape>, { kind: "DONE" }>, "outputs"> & {
      outputIds: Record<string, number>;
    })
  | Exclude<StepState<Shape>, { kind: "DONE" }>;

export type SerializedStep = Omit<
  StepParams<IOShape>,
  "inputs" | "outputs" | "template" | "state"
> & {
  templateName: string;
  inputIds: Record<string, number>;
  // Legacy - in the modern format we store outputs on SerializedState, but we still support this field for old workflows.
  // Can be removed if we deserialize and serialize again all workflows in the existing database.
  outputIds?: Record<string, number>;
  state: SerializedState<IOShape>;
};
