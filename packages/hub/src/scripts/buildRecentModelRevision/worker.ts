import { VariableRevisionInput } from "@/graphql/types/VariableRevision";
import { prisma } from "@/prisma";
import { runSquiggle } from "@/server/runSquiggle";

export type WorkerRunMessage = {
  type: "run";
  data: {
    code: string;
    seed: string;
  };
};

export type WorkerOutput = {
  errors: string;
  variableRevisions: VariableRevisionInput[];
};

export async function runSquiggleCode(
  code: string,
  seed: string
): Promise<WorkerOutput> {
  const { result } = await runSquiggle(code, seed);

  let variableRevisions: VariableRevisionInput[] = [];

  if (result.ok) {
    // I Imagine it would be nice to move this out of this worker file, but this would require exporting a lot more information. It seems wise to instead wait for the Serialization PR to go in and then refactor this.
    variableRevisions = result.value.exports.entries().map((e) => ({
      variableName: e[0],
      variableType: e[1].tag,
      title: e[1].tags.name() ? e[1].tags.name() : e[1].title() || "",
      docstring: e[1].tags.doc() || "",
    }));
  }

  return {
    errors: result.ok ? "" : result.value.toString(),
    variableRevisions,
  };
}

process.on("message", async (message: WorkerRunMessage) => {
  if (message.type === "run") {
    try {
      const { code, seed } = message.data;
      const buildOutput = await runSquiggleCode(code, seed);
      process?.send?.({
        type: "result",
        data: buildOutput,
      });
    } catch (error) {
      console.error("An error occurred in the worker process:", error);
      process?.send?.({
        type: "result",
        data: {
          errors: "An unknown error occurred in the worker process.",
        },
      });
    } finally {
      await prisma.$disconnect();
      process.exit(0);
    }
  }
});
