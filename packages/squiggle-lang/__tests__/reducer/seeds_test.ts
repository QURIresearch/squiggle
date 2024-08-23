import { run } from "../../src/index.js";

const SAMPLE_COUNT = 100;

async function getSamplesForSeed(seed?: string | undefined) {
  const { result: output } = await run("2 to 3", {
    environment: {
      sampleCount: SAMPLE_COUNT,
      xyPointLength: 100,
      seed: seed || "default",
    },
  });
  if (!output.ok) {
    throw new Error("Run failed");
  }

  const samples = output.value.result.asJS();
  if (!Array.isArray(samples)) {
    throw new Error("Expected an array");
  }
  return samples as number[];
}

describe("seeds", () => {
  // we use Math.random() for now, so this should fail
  test("Sample sets with identical seeds are identical", async () => {
    const samples = await getSamplesForSeed("test");
    expect(samples.length).toEqual(SAMPLE_COUNT);

    const samples2 = await getSamplesForSeed("test");
    expect(samples).toEqual(samples2);
  });

  test("Sample sets with different seeds are different", async () => {
    const samples = await getSamplesForSeed("test");
    expect(samples.length).toEqual(SAMPLE_COUNT);

    const samples2 = await getSamplesForSeed("test2");
    expect(samples).not.toEqual(samples2);
  });
});
