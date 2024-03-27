import * as fc from "fast-check";

import { expectErrorToBeBounded, testRun } from "../helpers/helpers.js";
import { testEvalToBe } from "../helpers/reducerHelpers.js";

// via fast-check hint
const toFloat32 = (v: number) => new Float32Array([v])[0];

describe("Mean of mixture is weighted average of means", () => {
  test("mx(normal(a,b), beta(m,s), [x,y])", () => {
    fc.assert(
      fc.asyncProperty(
        // normal mean
        fc.float({ min: toFloat32(0.1), max: 10, noNaN: true }),
        // normal stdev
        fc.float({
          min: toFloat32(1), // low stdev is buggy, https://github.com/quantified-uncertainty/squiggle/issues/1415
          max: 10,
          noNaN: true,
        }),
        // \alpha in beta distribution
        fc.float({
          min: 2, // low a and b values are buggy, https://github.com/quantified-uncertainty/squiggle/issues/1412
          max: 10,
          noNaN: true,
        }),
        // \beta in beta distribution
        fc.float({
          min: 2,
          max: 10,
          noNaN: true,
        }),
        fc.float({ min: toFloat32(1e-7), max: 100, noNaN: true }),
        fc.float({ min: toFloat32(1e-7), max: 100, noNaN: true }),
        async (normalMean, normalStdev, betaA, betaB, x, y) => {
          // normaalize is due to https://github.com/quantified-uncertainty/squiggle/issues/1400 bug
          const squiggleString = `mean(mixture(Sym.normal(${normalMean},${normalStdev}), Sym.beta(${betaA},${betaB}), [${x}, ${y}])->normalize)`;
          const { result } = await testRun(squiggleString);
          const weightDenom = x + y;
          const normalWeight = x / weightDenom;
          const betaWeight = y / weightDenom;
          const betaMean = betaA / (betaA + betaB);
          if (result.tag !== "Number") {
            throw new Error(`Expected number result, got: ${result.tag}`);
          }
          expectErrorToBeBounded(
            result.value,
            normalWeight * normalMean + betaWeight * betaMean,
            // this is a huge allowed error, but it's the highest precision we can achieve because of this bug: https://github.com/quantified-uncertainty/squiggle/issues/1414, even on relatively high \alpha and \beta values
            { epsilon: 0.7 }
          );
        }
      )
    );
  });
});

describe("Discrete", () => {
  // doesn't extrapolate between discrete numbers
  testEvalToBe("mx(3,5) -> inv(0.3)", "3");
  testEvalToBe("mx(3,5) -> inv(0.7)", "5");
  // works on mixed too
  testEvalToBe("mx(3,5,normal(5,2), [1,1,0]) -> inv(0.3)", "3");
  testEvalToBe("mx(3,5,normal(5,2), [1,1,0]) -> inv(0.7)", "5");

  test("sample", async () => {
    for (let i = 0; i < 100; i++) {
      const { result } = await testRun("mx(3,5) -> sample");
      if (result.tag !== "Number") {
        throw new Error(`Expected number result, got: ${result.tag}`);
      }
      expect(result.value === 5 || result.value === 3).toBe(true);
    }
  });
});

describe("MixedSet", () => {
  testEvalToBe(
    "MixedSet.subtract(PointSet.support(mx(Sym.uniform(1, 5), Sym.uniform(10, 30))), PointSet.support(mx(Sym.uniform(3, 8), Sym.uniform(20, 22))))",
    "{points: [], segments: [[0.9999999996,2.9999999995],[9.999999998,19.9999999998],[22.0000000002,30.000000002]]}"
  );
});
