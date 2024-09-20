import { z } from "zod";

import { type SquiggleWorkflowInput } from "./workflows/squiggleWorkflow.js";

// Protocol for streaming workflow changes between server and client.

// SerializedArtifact type

const commonArtifactFields = {
  id: z.string(),
  createdBy: z.string().optional(),
};

const artifactSchema = z.discriminatedUnion("kind", [
  z.object({
    ...commonArtifactFields,
    kind: z.literal("prompt"),
    value: z.string(),
  }),
  z.object({
    ...commonArtifactFields,
    kind: z.literal("source"),
    value: z.string(),
  }),
  z.object({
    ...commonArtifactFields,
    kind: z.literal("code"),
    value: z.string(),
    ok: z.boolean(),
  }),
]);

export type SerializedArtifact = z.infer<typeof artifactSchema>;

// SerializedStep type

const stepStateSchema = z.enum(["PENDING", "DONE", "FAILED"]);

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export type SerializedMessage = z.infer<typeof messageSchema>;

const stepSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: stepStateSchema,
  inputs: z.record(z.string(), artifactSchema),
  outputs: z.record(z.string(), artifactSchema),
  messages: z.array(messageSchema),
});

export type SerializedStep = z.infer<typeof stepSchema>;

// SquiggleWorkflowResult type

export const workflowResultSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
  isValid: z.boolean(),
  totalPrice: z.number(),
  runTimeMs: z.number(),
  llmRunCount: z.number(),
  logSummary: z.string(), // markdown
});

export type WorkflowResult = z.infer<typeof workflowResultSchema>;

// Messages that incrementally update the SerializedWorkflow

const stepAddedSchema = stepSchema.omit({
  state: true,
  outputs: true,
  messages: true,
});

const stepUpdatedSchema = stepSchema.partial().required({
  id: true,
  messages: true,
  outputs: true,
});

export const workflowMessageSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("finalResult"),
    content: workflowResultSchema,
  }),
  z.object({
    kind: z.literal("stepAdded"),
    content: stepAddedSchema,
  }),
  z.object({
    kind: z.literal("stepUpdated"),
    content: stepUpdatedSchema,
  }),
]);

export type SquiggleWorkflowMessage = z.infer<typeof workflowMessageSchema>;

// Client-side representation of a workflow

export type SerializedWorkflow = {
  id: string;
  timestamp: Date;
  input: SquiggleWorkflowInput;
  steps: SerializedStep[];
  currentStep?: string;
} & (
  | { status: "loading"; result?: undefined }
  | { status: "finished"; result: WorkflowResult }
  | { status: "error"; result: string }
);
