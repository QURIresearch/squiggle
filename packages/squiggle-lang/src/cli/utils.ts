import { promises as fs } from "fs";
import isFinite from "lodash/isFinite.js";
import path from "path";

import { Env } from "../dist/env.js";
import { SqLinker } from "../public/SqLinker.js";
import { SqProject } from "../public/SqProject/index.js";
import { deserializeValue, serializeValue } from "../value/serialize.js";
import { bold, red } from "./colors.js";

export async function measure(callback: () => Promise<void>) {
  const t1 = new Date();
  await callback();
  const t2 = new Date();

  return (t2.getTime() - t1.getTime()) / 1000;
}

export type OutputMode = "NONE" | "RESULT_OR_BINDINGS" | "RESULT_AND_BINDINGS";

export type RunArgs = {
  src: string;
  filename?: string;
  output: OutputMode;
  measure?: boolean;
  sampleCount?: string | number;
  seed?: string;
};

const EVAL_SOURCE_ID = "[eval]";

const linker: SqLinker = {
  resolve: (name, fromId) => {
    if (!name.startsWith("./") && !name.startsWith("../")) {
      throw new Error("Only relative paths in imports are allowed");
    }
    const dir =
      fromId === EVAL_SOURCE_ID ? process.cwd() : path.dirname(fromId);
    return path.resolve(dir, name);
  },
  loadSource: async (importId: string) => {
    return await fs.readFile(importId, "utf-8");
  },
};

async function _run(args: {
  src: string;
  filename?: string;
  environment?: Env;
}) {
  const project = SqProject.create({ linker });
  if (args.environment) {
    project.setEnvironment(args.environment);
  }
  const filename = args.filename ? path.resolve(args.filename) : EVAL_SOURCE_ID;

  project.setSource(filename, args.src);

  const time = await measure(async () => await project.run(filename));
  const output = project.getOutput(filename);

  return { output, time };
}

export async function run(args: RunArgs) {
  let environment: Env | undefined;
  if (args.sampleCount && isFinite(Number(args.sampleCount))) {
    environment = {
      sampleCount: Number(args.sampleCount),
      xyPointLength: Number(args.sampleCount),
      seed: args.seed || "default-seed",
    };
  }

  const { output, time } = await _run({
    src: args.src,
    filename: args.filename,
    environment,
  });

  // Prints a section consisting of multiple lines; prints an extra "\n" if a section was printed before.
  let isFirstSection = true;
  const printLines = (...lines: string[]) => {
    if (!isFirstSection) {
      console.log();
    }
    isFirstSection = false;
    lines.forEach((line) => console.log(line));
  };

  if (!output.ok) {
    printLines(red("Error:"), output.value.toStringWithDetails());
  } else {
    switch (args.output) {
      case "RESULT_OR_BINDINGS":
        if (output.value.result.tag === "Void") {
          printLines(output.value.bindings.toString());
        } else {
          console.log(
            JSON.stringify(serializeValue(output.value.result._value), null, 2)
          );
          output.value.result._value = deserializeValue(
            serializeValue(output.value.result._value)
          ) as any;

          printLines(output.value.result.toString());
        }
        break;
      case "RESULT_AND_BINDINGS":
        printLines(bold("Result:"), output.value.result.toString());
        printLines(bold("Bindings:"), output.value.bindings.toString());
        break;
      case "NONE":
      // do nothing
    }
  }

  if (args.measure) {
    printLines(`${bold("Time:")} ${time}s`);
  }
}
