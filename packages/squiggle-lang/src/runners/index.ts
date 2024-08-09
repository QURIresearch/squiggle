import { EmbeddedRunner } from "./EmbeddedRunner.js";
import { EmbeddedWithSerializationRunner } from "./EmbeddedWithSerializationRunner.js";
import { PoolRunner, RunnerPool } from "./PoolRunner.js";
import { WebWorkerRunner } from "./WebWorkerRunner.js";

export {
  EmbeddedRunner,
  EmbeddedWithSerializationRunner,
  PoolRunner,
  RunnerPool,
  WebWorkerRunner,
};
export { WithCacheLoaderRunner } from "./WithCacheLoaderRunner.js";

// We intentionally don't support `node-worker` here; it breaks webpack, see the
// comment in `./NodeWorkerRunner.ts` for details.
export const allRunnerNames = [
  "web-worker",
  "embedded",
  "embedded-with-serialization",
] as const;

export type RunnerName = (typeof allRunnerNames)[number];

export function runnerByName(name: RunnerName, threads: number = 1) {
  const makeRunner = () => {
    switch (name) {
      case "web-worker":
        return new WebWorkerRunner();
      case "embedded":
        return new EmbeddedRunner();
      case "embedded-with-serialization":
        return new EmbeddedWithSerializationRunner();
      default:
        throw new Error(`Unknown runner: ${name satisfies never}`);
    }
  };

  if (threads === 1) {
    return makeRunner();
  } else {
    return new PoolRunner(
      new RunnerPool({
        makeRunner,
        maxThreads: threads,
      })
    );
  }
}

export const defaultRunnerName = "embedded" as const satisfies RunnerName;

export function getDefaultRunner() {
  // `process` can be undefined in Storybook environment; @types/node in squiggle-lang is a lie.
  const envRunner =
    typeof process === "undefined"
      ? undefined
      : process.env["SQUIGGLE_DEFAULT_RUNNER"];
  const defaultRunner = envRunner ?? defaultRunnerName;

  if (!(allRunnerNames as readonly string[]).includes(defaultRunner)) {
    throw new Error("Unknown runner: " + defaultRunner);
  }
  return runnerByName(defaultRunner as RunnerName);
}
