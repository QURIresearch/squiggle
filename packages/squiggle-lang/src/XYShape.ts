import sortBy from "lodash/sortBy.js";

import { epsilon_float } from "./magicNumbers.js";
import * as E_A from "./utility/E_A.js";
import * as E_A_Floats from "./utility/E_A_Floats.js";
import * as E_A_Sorted from "./utility/E_A_Sorted.js";
import * as Result from "./utility/result.js";

export type XYShape = {
  readonly xs: number[];
  readonly ys: number[];
};

export type XYShapeError =
  | {
      tag: "NotSorted";
      property: string;
    }
  | {
      tag: "IsEmpty";
      property: string;
    }
  | {
      tag: "NotFinite";
      property: string;
      value: number;
    }
  | {
      tag: "DifferentLengths";
      p1Name: string;
      p2Name: string;
      p1Length: number;
      p2Length: number;
    }
  | {
      tag: "MultipleErrors";
      errors: XYShapeError[];
    };

export const XYShapeError = {
  mapErrorArrayToError(errors: XYShapeError[]): XYShapeError | undefined {
    if (errors.length === 0) {
      return undefined;
    } else if (errors.length === 1) {
      return errors[0];
    } else {
      return {
        tag: "MultipleErrors",
        errors,
      };
    }
  },
  toString(t: XYShapeError): string {
    switch (t.tag) {
      case "NotSorted":
        return `${t.property} is not sorted`;
      case "IsEmpty":
        return `${t.property} is empty`;
      case "NotFinite":
        return `${t.property} is not finite. Example value: ${t.value}`;
      case "DifferentLengths":
        return `${t.p1Name} and ${t.p2Name} have different lengths. ${t.p1Name} has length ${t.p1Length} and ${t.p2Name} has length ${t.p2Length}`;
      case "MultipleErrors":
        return `Multiple Errors: ${t.errors
          .map(XYShapeError.toString)
          .map((r) => `[${r}]`)
          .join(", ")}`;
    }
  },
};

export type InterpolationStrategy = "Stepwise" | "Linear";
type ExtrapolationStrategy = "UseZero" | "UseOutermostPoints";

type Interpolator = (shape: XYShape, leftIndex: number, x: number) => number;

const interpolate = (
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  xIntended: number
): number => {
  if (yMin === yMax) {
    return yMin;
  }
  const minProportion = (xMax - xIntended) / (xMax - xMin);
  const maxProportion = (xIntended - xMin) / (xMax - xMin);
  return yMin * minProportion + yMax * maxProportion;
};

// TODO: Make sure that shapes cannot be empty.
const extImp = <T>(value: T | undefined): T => {
  if (value === undefined) {
    throw new Error("Tried to perform an operation on an empty XYShape.");
  }
  return value;
};

export const T = {
  length(t: XYShape): number {
    return t.xs.length;
  },
  empty: { xs: [], ys: [] } as XYShape,
  isEmpty(t: XYShape): boolean {
    return T.length(t) === 0;
  },
  minX(t: XYShape) {
    return extImp(t.xs[0]);
  },
  maxX(t: XYShape) {
    return extImp(t.xs[t.xs.length - 1]);
  },
  firstY(t: XYShape) {
    return extImp(t.ys[0]);
  },
  lastY(t: XYShape) {
    return extImp(t.ys[t.ys.length - 1]);
  },
  xTotalRange(t: XYShape) {
    return T.maxX(t) - T.minX(t);
  },
  mapX(t: XYShape, fn: (x: number) => number): XYShape {
    return { xs: t.xs.map(fn), ys: t.ys };
  },
  mapY(t: XYShape, fn: (y: number) => number): XYShape {
    return { xs: t.xs, ys: t.ys.map(fn) };
  },
  mapYResult<E>(
    t: XYShape,
    fn: (y: number) => Result.result<number, E>
  ): Result.result<XYShape, E> {
    const mappedYs: number[] = [];
    for (const y of t.ys) {
      const mappedY = fn(y);
      if (!mappedY.ok) {
        return mappedY;
      }
      mappedYs.push(mappedY.value);
    }
    return Result.Ok({
      xs: t.xs,
      ys: mappedYs,
    });
  },
  square(t: XYShape): XYShape {
    return T.mapX(t, (x) => x ** 2);
  },
  zip({ xs, ys }: XYShape): [number, number][] {
    return E_A.zip(xs, ys);
  },
  fromArray([xs, ys]: [number[], number[]]): XYShape {
    return { xs, ys };
  },
  fromArrays(xs: number[], ys: number[]): XYShape {
    return { xs, ys };
  },
  accumulateYs(p: XYShape, fn: (y1: number, y2: number) => number): XYShape {
    return T.fromArray([p.xs, E_A.accumulate(p.ys, fn)]);
  },
  concat(t1: XYShape, t2: XYShape): XYShape {
    const cxs = [...t1.xs, ...t2.xs];
    const cys = [...t1.ys, ...t2.ys];
    return { xs: cxs, ys: cys };
  },
  isEqual(t1: XYShape, t2: XYShape): boolean {
    return E_A.isEqual(t1.xs, t2.xs) && E_A.isEqual(t1.ys, t2.ys);
  },
  fromZippedArray(pairs: readonly [number, number][]): XYShape {
    return T.fromArray(E_A.unzip(pairs));
  },
  equallyDividedXs(t: XYShape, newLength: number): number[] {
    return E_A_Floats.range(T.minX(t), T.maxX(t), newLength);
  },

  Validator: {
    notSortedError(p: string): XYShapeError {
      return {
        tag: "NotSorted",
        property: p,
      };
    },
    notFiniteError(p: string, exampleValue: number): XYShapeError {
      return {
        tag: "NotFinite",
        property: p,
        value: exampleValue,
      };
    },
    isEmptyError(propertyName: string): XYShapeError {
      return { tag: "IsEmpty", property: propertyName };
    },
    differentLengthsError(t: XYShape): XYShapeError {
      return {
        tag: "DifferentLengths",
        p1Name: "Xs",
        p2Name: "Ys",
        p1Length: t.xs.length,
        p2Length: t.ys.length,
      };
    },

    areXsSorted(t: XYShape): boolean {
      return E_A_Floats.isSorted(t.xs);
    },
    areXsEmpty(t: XYShape): boolean {
      return t.xs.length === 0;
    },
    getNonFiniteXs(t: XYShape): number | undefined {
      return t.xs.find((v) => !Number.isFinite(v));
    },
    getNonFiniteYs(t: XYShape): number | undefined {
      return t.ys.find((v) => !Number.isFinite(v));
    },
    validate(t: XYShape): XYShapeError | undefined {
      const errors: XYShapeError[] = [];
      if (!T.Validator.areXsSorted(t)) {
        errors.push(T.Validator.notSortedError("Xs"));
      }
      if (T.Validator.areXsEmpty(t)) {
        errors.push(T.Validator.isEmptyError("Xs"));
      }
      if (t.xs.length !== t.ys.length) {
        errors.push(T.Validator.differentLengthsError(t));
      }

      const nonFiniteX = T.Validator.getNonFiniteXs(t);
      if (nonFiniteX !== undefined) {
        errors.push(T.Validator.notFiniteError("Xs", nonFiniteX));
      }
      const nonFiniteY = T.Validator.getNonFiniteYs(t);
      if (nonFiniteY !== undefined) {
        errors.push(T.Validator.notFiniteError("Ys", nonFiniteY));
      }

      return XYShapeError.mapErrorArrayToError(errors);
    },
  },

  make(xs: number[], ys: number[]): Result.result<XYShape, XYShapeError> {
    const attempt: XYShape = { xs, ys };
    const maybeError = T.Validator.validate(attempt);
    if (maybeError) {
      return Result.Err(maybeError);
    } else {
      return Result.Ok(attempt);
    }
  },

  makeFromZipped(values: readonly (readonly [number, number])[]) {
    const [xs, ys] = E_A.unzip(values);
    return T.make(xs, ys);
  },

  removeConsecutiveDuplicates(shape: XYShape): XYShape {
    const uniqueXs: number[] = [];
    const uniqueYs: number[] = [];

    let prevX: number | null = null;
    let prevY: number | null = null;

    for (let i = 0; i < shape.xs.length; i++) {
      const currentX = shape.xs[i];
      const currentY = shape.ys[i];

      if (currentX !== prevX || currentY !== prevY) {
        uniqueXs.push(currentX);
        uniqueYs.push(currentY);
        prevX = currentX;
        prevY = currentY;
      }
    }

    return { xs: uniqueXs, ys: uniqueYs };
  },
};

const Pairs = {
  first(t: XYShape): [number, number] {
    return [T.minX(t), T.firstY(t)];
  },
  last(t: XYShape) {
    return [T.maxX(t), T.lastY(t)];
  },
  getBy(
    t: XYShape,
    fn: (xy: [number, number]) => boolean
  ): [number, number] | undefined {
    return T.zip(t).find(fn);
  },
  firstAtOrBeforeXValue(
    t: XYShape,
    xValue: number
  ): [number, number] | undefined {
    const firstGreaterIndex = E_A_Sorted.firstGreaterIndex(t.xs, xValue);
    if (firstGreaterIndex === 0) {
      return;
    }
    return [t.xs[firstGreaterIndex - 1], t.ys[firstGreaterIndex - 1]];
  },
};

export const YtoX = {
  linear(t: XYShape, y: number): number {
    const firstHigherIndex = E_A_Sorted.firstGreaterIndex(t.ys, y);
    if (firstHigherIndex === t.ys.length) {
      return T.maxX(t); // FIXME - check if this is correct
    } else if (firstHigherIndex === 0) {
      return T.minX(t); // FIXME
    } else {
      const lowerOrEqualIndex = firstHigherIndex - 1;
      if (t.ys[lowerOrEqualIndex] === y) {
        return t.xs[lowerOrEqualIndex];
      } else {
        // needs interpolation
        return interpolate(
          t.ys[lowerOrEqualIndex],
          t.ys[firstHigherIndex],
          t.xs[lowerOrEqualIndex],
          t.xs[firstHigherIndex],
          y
        );
      }
    }
  },
};

export const XtoY = {
  stepwiseIncremental(t: XYShape, x: number): number | undefined {
    return Pairs.firstAtOrBeforeXValue(t, x)?.[1];
  },

  stepwiseIfAtX(t: XYShape, f: number) {
    return Pairs.getBy(t, ([x]) => x === f)?.[1];
  },
  linear(t: XYShape, x: number): number {
    const firstHigherIndex = E_A_Sorted.firstGreaterIndex(t.xs, x);
    if (firstHigherIndex === t.xs.length) {
      return T.lastY(t); // FIXME - should be 0? https://github.com/quantified-uncertainty/squiggle/issues/1401
    } else if (firstHigherIndex === 0) {
      return T.firstY(t); // FIXME
    } else {
      const lowerOrEqualIndex = firstHigherIndex - 1;
      if (t.xs[lowerOrEqualIndex] === x) {
        return t.ys[lowerOrEqualIndex];
      } else {
        // needs interpolation
        return interpolate(
          t.xs[lowerOrEqualIndex],
          t.xs[firstHigherIndex],
          t.ys[lowerOrEqualIndex],
          t.ys[firstHigherIndex],
          x
        );
      }
    }
  },

  /* Returns a between-points-interpolating function that can be used with PointwiseCombination.combine.
     Interpolation can either be stepwise (using the value on the left) or linear. Extrapolation can be `UseZero or `UseOutermostPoints`. */
  continuousInterpolator(
    interpolation: InterpolationStrategy,
    extrapolation: ExtrapolationStrategy
  ): Interpolator {
    if (interpolation === "Linear" && extrapolation === "UseZero") {
      return (t: XYShape, leftIndex: number, x: number) => {
        if (leftIndex < 0) {
          return 0;
        } else if (leftIndex >= T.length(t) - 1) {
          return 0;
        } else {
          const x1 = t.xs[leftIndex];
          const x2 = t.xs[leftIndex + 1];
          const y1 = t.ys[leftIndex];
          const y2 = t.ys[leftIndex + 1];
          const fraction = (x - x1) / (x2 - x1);
          return y1 * (1 - fraction) + y2 * fraction;
        }
      };
    } else if (
      interpolation === "Linear" &&
      extrapolation === "UseOutermostPoints"
    ) {
      return (t: XYShape, leftIndex: number, x: number) => {
        if (leftIndex < 0) {
          return t.ys[0];
        } else if (leftIndex >= T.length(t) - 1) {
          return t.ys[T.length(t) - 1];
        } else {
          const x1 = t.xs[leftIndex];
          const x2 = t.xs[leftIndex + 1];
          const y1 = t.ys[leftIndex];
          const y2 = t.ys[leftIndex + 1];
          const fraction = (x - x1) / (x2 - x1);
          return y1 * (1 - fraction) + y2 * fraction;
        }
      };
    } else if (interpolation === "Stepwise" && extrapolation === "UseZero") {
      return (t: XYShape, leftIndex: number, _x: number) => {
        if (leftIndex < 0) {
          return 0;
        } else if (leftIndex >= T.length(t) - 1) {
          return 0;
        } else {
          return t.ys[leftIndex];
        }
      };
    } else if (
      interpolation === "Stepwise" &&
      extrapolation === "UseOutermostPoints"
    ) {
      return (t: XYShape, leftIndex: number, _x: number) => {
        if (leftIndex < 0) {
          return t.ys[0];
        } else if (leftIndex >= T.length(t) - 1) {
          return t.ys[T.length(t) - 1];
        } else {
          return t.ys[leftIndex];
        }
      };
    } else {
      throw new Error(
        "Implementation error: invalid interpolation/extrapolation strategy combination"
      ); // should never happen
    }
  },
};

export const XsConversion = {
  _replaceWithXs(newXs: number[], t: XYShape): XYShape {
    const newYs = newXs.map((x) => XtoY.linear(t, x));
    return { xs: newXs, ys: newYs };
  },

  equallyDivideXByMass(integral: XYShape, newLength: number): number[] {
    return E_A_Floats.range(0, 1, newLength).map((y) =>
      YtoX.linear(integral, y)
    );
  },

  proportionEquallyOverX(t: XYShape, newLength: number): XYShape {
    return XsConversion._replaceWithXs(T.equallyDividedXs(t, newLength), t);
  },
  proportionByProbabilityMass(
    t: XYShape,
    newLength: number,
    integral: XYShape
  ): XYShape {
    return XsConversion._replaceWithXs(
      XsConversion.equallyDivideXByMass(integral, newLength),
      t
    ); // creates a new set of xs at evenly spaced percentiles // linearly interpolates new ys for the new xs
  },
};

type Zipped = [number, number][];
export const Zipped = {
  sortByY(t: Zipped) {
    return sortBy(t, [([x, y]) => y]);
  },
  sortByX(t: Zipped) {
    return sortBy(t, [([x, y]) => x]);
  },
  filterByX(t: Zipped, testFn: (x: number) => boolean) {
    return t.filter(([x]) => testFn(x));
  },
};

export const PointwiseCombination = {
  // t1 and t2 are interpolator functions from XYShape.XtoY.
  combine<E>(
    interpolator: Interpolator,
    fn: (a: number, b: number) => Result.result<number, E>,
    t1: XYShape,
    t2: XYShape
  ): Result.result<XYShape, E> {
    // This function combines two xyShapes by looping through both of them simultaneously.
    // It always moves on to the next smallest x, whether that's in the first or second input's xs,
    // and interpolates the value on the other side, thus accumulating xs and ys.
    // This is written in raw JS because this can still be a bottleneck, and using refs for the i and j indices is quite painful.
    const t1n = t1.xs.length;
    const t2n = t2.xs.length;
    const outX: number[] = [];
    const outY: number[] = [];

    // The loop below would fail if we don't have any points in one of the shapes.
    if (!t1n) {
      return Result.Ok(t2);
    }

    if (!t2n) {
      return Result.Ok(t1);
    }

    // Next index that we want to consume.
    // Possible range of values: [0..n+2], where:
    // - `n` signifies "we consumed all points"
    // - `n+1` signifies "we consumed all points _and_ one more "last x + epsilon" point for extrapolations when shapes don't overlap.
    // - `n+2` signifies "we consumed all points _and_ "last x + epsilon" point _and_ "first x of another shape - epsilon".
    // See https://github.com/quantified-uncertainty/squiggle/issues/1400#issuecomment-1666998578 for details why this might be important.
    let i1 = 0,
      i2 = 0;

    while (i1 < t1n || i2 < t2n) {
      let x, y1, y2;

      // First four cases here are for adding two additional points when shapes don't overlap.
      // TODO - in rare cases, last point of the first shape + epsilon could be larger than the first point of the second, which will cause "Xs is not sorted" error later.
      if (i1 > 0 && i1 === t1n && i2 === 0) {
        // Extrapolating after final point; second shape hasn't started yet.
        // Note the exact `i1 === t1n` check.
        x = t1.xs[i1 - 1] + Number.EPSILON * t1.xs[i1 - 1]; // just using Number.EPSILON is not enough; see https://stackoverflow.com/a/72185420
        y1 = interpolator(t1, t1n, x);
        y2 = interpolator(t2, -1, x);
        i1++;
      } else if (i1 === t1n + 1 && i2 === 0) {
        x = t2.xs[0] - Number.EPSILON * t2.xs[0];
        y1 = interpolator(t1, t1n, x);
        y2 = interpolator(t2, -1, x);
        i1++;
      } else if (i2 > 0 && i2 === t2n && i1 === 0) {
        x = t2.xs[i2 - 1] + Number.EPSILON * t2.xs[i2 - 1];
        y1 = interpolator(t1, -1, x);
        y2 = interpolator(t2, t2n, x);
        i2++;
      } else if (i2 === t2n + 1 && i1 === 0) {
        x = t1.xs[0] - Number.EPSILON * t1.xs[0];
        y1 = interpolator(t1, -1, x);
        y2 = interpolator(t2, t2n, x);
        i2++;
      } else if (i2 >= t2n || (i1 < t1n && t1.xs[i1] < t2.xs[i2])) {
        // If i1 has to catch up to i2, or if i2 is already done.
        x = t1.xs[i1];
        y1 = t1.ys[i1];
        y2 = interpolator(t2, i2 - 1, x);
        i1++;
      } else if (i1 >= t1n || (i2 < t2n && t1.xs[i1] > t2.xs[i2])) {
        // If i2 has to catch up to i1, or if i1 is already done.
        x = t2.xs[i2];
        y1 = interpolator(t1, i1 - 1, x);
        y2 = t2.ys[i2];
        i2++;
      } else if (i1 < t1n && i2 < t2n && t1.xs[i1] === t2.xs[i2]) {
        // If they happen to be equal, move both ahead.
        x = t1.xs[i1];
        y1 = t1.ys[i1];
        y2 = t2.ys[i2];
        i1++;
        i2++;
      } else {
        throw new Error(`PointwiseCombination error: ${i1}, ${i2}`);
      }

      outX.push(x);

      // Here I check whether the operation was a success. If it was
      // keep going. Otherwise, stop and throw the error back to user
      const newY = fn(y1, y2);
      if (!newY.ok) {
        return newY;
      }
      outY.push(newY.value);
    }

    return Result.Ok({ xs: outX, ys: outY });
  },

  combineDiscrete<E>(
    fn: (a: number, b: number) => Result.result<number, E>,
    t1: XYShape,
    t2: XYShape
  ): Result.result<XYShape, E> {
    let i1 = 0,
      i2 = 0;
    const xs1 = t1.xs,
      xs2 = t2.xs;
    const ys1 = t1.ys,
      ys2 = t2.ys;
    const len1 = xs1.length,
      len2 = xs2.length;

    const xs: number[] = [];
    const ys: number[] = [];
    while (i1 < len1 || i2 < len2) {
      let x: number, y1: number, y2: number;
      if (i2 === len2 || (i1 < len1 && xs1[i1] < xs2[i2])) {
        // take from xs1
        x = xs1[i1];
        y1 = ys1[i1];
        y2 = 0;
        i1++;
      } else if (i1 < len1 && xs1[i1] === xs2[i2]) {
        // combine
        x = xs1[i1];
        y1 = ys1[i1];
        y2 = ys2[i2];
        i1++;
        i2++;
      } else {
        // take from xs2
        x = xs2[i2];
        y1 = 0;
        y2 = ys2[i2];
        i2++;
      }
      const result = fn(y1, y2);
      if (!result.ok) {
        return result; // combiner function has failed
      }
      xs.push(x);
      ys.push(result.value);
    }

    return Result.Ok({ xs, ys });
  },

  addCombine(interpolator: Interpolator, t1: XYShape, t2: XYShape): XYShape {
    const result = PointwiseCombination.combine(
      interpolator,
      (a, b) => Result.Ok(a + b),
      t1,
      t2
    );
    if (!result.ok) {
      throw new Error("Add operation should never fail");
    }
    return result.value;
  },
};

export const Range = {
  integrateWithTriangles({ xs, ys }: XYShape) {
    const length = xs.length;
    const cumulativeY: number[] = new Array(length).fill(0);
    for (let x = 0; x <= length - 2; x++) {
      cumulativeY[x + 1] =
        (xs[x + 1] - xs[x]) * ((ys[x] + ys[x + 1]) / 2) + cumulativeY[x]; // dx // (1/2) * (avgY)
    }
    return { xs, ys: cumulativeY };
  },

  stepwiseToLinear({ xs, ys }: XYShape): XYShape {
    // adds points at the bottom of each step.
    const length = xs.length;
    const newXs: number[] = new Array(2 * length);
    const newYs: number[] = new Array(2 * length);

    newXs[0] = xs[0] - epsilon_float;
    newYs[0] = 0;
    newXs[1] = xs[0];
    newYs[1] = ys[0];

    for (let i = 1; i <= length - 1; i++) {
      newXs[i * 2] = xs[i] - epsilon_float;
      newYs[i * 2] = ys[i - 1];
      newXs[i * 2 + 1] = xs[i];
      newYs[i * 2 + 1] = ys[i];
    }

    return { xs: newXs, ys: newYs };
  },
};

export const Analysis = {
  getVarianceDangerously<T>(
    t: T,
    mean: (t: T) => number,
    getMeanOfSquares: (t: T) => number
  ): number {
    const meanSquared = mean(t) ** 2;
    const meanOfSquares = getMeanOfSquares(t);
    return meanOfSquares - meanSquared;
  },
};

type XYShapeSubset = {
  points: [number, number][];
  segments: XYShape[];
};

type ComparisonType =
  | "greaterThan"
  | "lesserThan"
  | "equals"
  | "greaterThanOrEqual"
  | "lessThanOrEqual";

/**
  This function extracts a subset of the input shape that satisfies the comparison condition with the threshold.
  It uses linear interpolation to find the exact points where the condition is satisfied.
  Right now, we only use the `greaterThan` comparison type, for getting the Support of continuous distributions, but we can improve this in the future.
  It assumes the shape uses linear interpolation.
  Note that if you want to use the result as a distribution, you will have to combine the segments somehow. They don't have surrounding points at 0 yet, so you can't just add them together.
*/
export const extractSubsetThatSatisfiesThreshold = (
  shape: XYShape,
  comparisonType: ComparisonType,
  threshold: number
): XYShapeSubset => {
  const comparisonIsSatisfied = (y: number, threshold: number): boolean => {
    switch (comparisonType) {
      case "greaterThan":
        return y > threshold;
      case "lesserThan":
        return y < threshold;
      case "equals":
        return Math.abs(y - threshold) < Number.EPSILON;
      case "greaterThanOrEqual":
        return y >= threshold;
      case "lessThanOrEqual":
        return y <= threshold;
    }
  };

  const points: [number, number][] = [];
  let segments: XYShape[] = [];

  let currentSegment: XYShape | null = null;

  //Assumes linear interpolation
  function interpolateXAtThreshold(
    x1: number,
    x2: number,
    y1: number,
    y2: number
  ) {
    return x1 + ((threshold - y1) * (x2 - x1)) / (y2 - y1);
  }

  T.zip(shape).forEach(([x1, y1], i) => {
    if (i === shape.xs.length - 1) {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      return;
    }

    const x2 = shape.xs[i + 1];
    const y2 = shape.ys[i + 1];

    if (
      comparisonIsSatisfied(y1, threshold) &&
      comparisonIsSatisfied(y2, threshold)
    ) {
      if (!currentSegment) {
        currentSegment = { xs: [x1], ys: [y1] };
      }
      currentSegment.xs.push(x2);
      currentSegment.ys.push(y2);
    } else if (
      !comparisonIsSatisfied(y1, threshold) &&
      comparisonIsSatisfied(y2, threshold)
    ) {
      const x = interpolateXAtThreshold(x1, x2, y1, y2);
      if (!currentSegment) {
        currentSegment = { xs: [x], ys: [threshold] };
      }
      currentSegment.xs.push(x2);
      currentSegment.ys.push(y2);
    } else if (
      comparisonIsSatisfied(y1, threshold) &&
      !comparisonIsSatisfied(y2, threshold)
    ) {
      const x = interpolateXAtThreshold(x1, x2, y1, y2);
      if (currentSegment) {
        currentSegment.xs.push(x);
        currentSegment.ys.push(threshold);
        segments.push(currentSegment);
        currentSegment = null;
      }
    } else if (currentSegment) {
      segments.push(currentSegment);
      currentSegment = null;
    }

    if (
      comparisonType === "equals" &&
      y1 !== y2 &&
      ((y1 < threshold && y2 > threshold) || (y1 > threshold && y2 < threshold))
    ) {
      const x = interpolateXAtThreshold(x1, x2, y1, y2);
      points.push([x, threshold]);
    }
  });

  segments = segments.map(T.removeConsecutiveDuplicates);
  segments.forEach((segment) => {
    if (T.length(segment) === 1) {
      points.push([segment.xs[0], segment.ys[0]]);
    }
  });
  segments = segments.filter((segment) => T.length(segment) > 1);

  return {
    points: sortBy(points, ([x]) => x),
    segments,
  };
};
