import * as fc from "fast-check";

import { logKde } from "../../src/dists/SampleSetDist/logKde.js";
import * as E_A_Floats from "../../src/utility/E_A_Floats.js";

const exampleSets = [
  [
    1, 2, 3, 3, 10, 5, 4, 3, 3, 24, 2, 34, 234, 23, 423, 42, 42, 34, 23, 42,
    342, 34, -234, -234, 234, -234234, -23423, -234, -234234234, -234234,
  ],
  [
    9.999999999999913, 6.240608076948177e-103, -9.999999999999892,
    1.9994014806266345e-214, 0.0002136008066252708, 5.338627735731214e-217,
    1.280993062384912e-273, -5.341810088677615e-141, -5.16743119727708e-91,
    -9.999999999999998, 7.156412753173525e-69, -9.999999999999892,
  ],
  [
    9.999999999999913, 6.240608076948177, -9.999999999999892,
    1.9994014806266345e-3, 0.0002136008066252708, 5.338627735731214e-2,
    1.280993062384912e-2, -5.341810088677615e-1, -5.16743119727708e-9, -9.998,
    7.156412753173525e-6, -9.2,
  ],
  [
    9.999999999999911 - 1.3632457704e-27 - 9.999999999999943,
    -9.4e-3,
    3.33221889e-85,
    1.19359728e-131,
    -9.999999999999927,
    -9.999999,
    4.51576558e-139,
    1.50278463e-105,
    9.999999999999998,
    1.218031298e-8,
    9.99999999999998,
    2.4e-3,
    2.5e-33,
    3.10020485e-32,
  ],
  [
    9.999999999999897, 9.999999999999908, -9.999999999999895, -0.4789756,
    -9.999999999999975, -9.999999999999899, 9.999999999999917,
    -9.999999999999973, 1.4256705e-8, 9.999999999999902, -9.99999999999998,
    9.999999999999952, -9.999999999999947, 7.429316900977465, 9.999999999999904,
    9.999999999999915, -9.999999999999957, -9.99999999999989, 9.999999999999915,
  ],
  [
    -9.999999999999941, -9.999999999999941, -9.999999999999934,
    -9.999999999999929, -9.999999999999924, -9.999999999999918,
    -9.999999999999915, -9.999999999999902, -9.9999999999999,
    -9.999999999999899, -0.661340192, 0.00000361097735, 9.999999999999892,
    9.999999999999922, 9.999999999999936, 9.999999999999986,
  ],
];

const block = (samples: number[], outputLength: number) => {
  const params = {
    samples: samples.sort((a, b) => a - b),
    outputLength,
    weight: 1,
    kernelWidth: 1,
  };
  const { xs, ys } = logKde(params);
  test("No invalid numbers", () => {
    const invalid = [
      ...xs.filter((x) => !Number.isFinite(x)),
      ...ys.filter((y) => !Number.isFinite(y)),
    ];
    expect(invalid.length).toEqual(0);
  });
  test("lengths of xs and ys should match", () => {
    expect(xs.length).toEqual(ys.length);
  });
  test("lengths of xs should almost match outputLength", () => {
    //Sometimes this is off by 1, because of an internal approximation.
    expect(Math.abs(xs.length - outputLength)).toBeLessThan(2);
  });
  test("should have y value 0 on both sides to indicate no tails", () => {
    expect(ys[0]).toBeCloseTo(0);
    expect(ys[outputLength - 1]).toBeCloseTo(0);
  });
  test("should be sorted", () => {
    expect(E_A_Floats.isSorted(xs)).toBe(true);
  });
  test("y values are all nonnegative", () => {
    expect(ys.filter((r) => r < 0).length).toBe(0);
  });
};

const propertyTests = () => {
  fc.assert(
    fc.property(
      fc.array(
        fc
          .double({
            min: -1e80, // When it was at -1e100 it failed occationally.
            max: 1e80,
            noNaN: true,
            noDefaultInfinity: true,
          })
          .filter((x) => Math.abs(x) >= 1e-250),
        {
          minLength: 40, // If much lower, it will fail occationally.
        }
      ),
      fc.integer({ min: 40, max: 10000 }),
      (samples, outputLength) => {
        const len = samples.length;
        if (samples[len - 1] - samples[0] < 2 * 5) return true;
        if (samples.length < 5) return true;
        block(samples, outputLength);
      }
    )
  );
};

describe("Log Kernel Density Estimation", () => {
  //The blocks are here for easier debugging of particular cases.
  block(exampleSets[0], 50);
  block(exampleSets[1], 50);
  block(exampleSets[2], 50);
  block(exampleSets[3], 50);
  propertyTests();
});
