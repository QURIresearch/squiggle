import intersection from "lodash/intersection.js";
import last from "lodash/last.js";

import { BaseDist } from "../../dists/BaseDist.js";
import { DistError } from "../../dists/DistError.js";
import { Env } from "../../dists/env.js";
import * as SampleSetDist from "../../dists/SampleSetDist/index.js";
import * as SymbolicDist from "../../dists/SymbolicDist/index.js";
import { PointMass } from "../../dists/SymbolicDist/PointMass.js";
import {
  REArgumentError,
  REDistributionError,
  REOperationError,
  REOther,
} from "../../errors/messages.js";
import {
  OtherOperationError,
  SampleMapNeedsNtoNFunction,
} from "../../operationError.js";
import { Lambda } from "../../reducer/lambda/index.js";
import { Reducer } from "../../reducer/Reducer.js";
import {
  tBool,
  tDist,
  tDistOrNumber,
  tNumber,
  tSampleSetDist,
  tString,
} from "../../types/index.js";
import { Type } from "../../types/Type.js";
import { upTo } from "../../utility/E_A_Floats.js";
import * as Result from "../../utility/result.js";
import { Value } from "../../value/index.js";
import { Input } from "../../value/VInput.js";
import { FRFunction } from "./core.js";
import { FnDefinition, makeDefinition } from "./fnDefinition.js";
import { FnInput, namedInput } from "./fnInput.js";

type SimplifiedArgs = Omit<FRFunction, "nameSpace" | "requiresNamespace"> &
  Partial<Pick<FRFunction, "nameSpace" | "requiresNamespace">>;

type ArgsWithoutDefinitions = Omit<SimplifiedArgs, "definitions">;

export class FnFactory {
  nameSpace: string;
  requiresNamespace: boolean;

  constructor(opts: { nameSpace: string; requiresNamespace: boolean }) {
    this.nameSpace = opts.nameSpace;
    this.requiresNamespace = opts.requiresNamespace;
  }

  make(args: SimplifiedArgs): FRFunction {
    return {
      nameSpace: this.nameSpace,
      requiresNamespace: this.requiresNamespace,
      ...args,
      isUnit: args.isUnit ?? false,
    };
  }

  n2n({
    fn,
    ...args
  }: ArgsWithoutDefinitions & { fn: (x: number) => number }): FRFunction {
    return this.make({
      ...args,
      definitions: [makeDefinition([tNumber], tNumber, ([x]) => fn(x))],
    });
  }

  nn2n({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: number, y: number) => number;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition([tNumber, tNumber], tNumber, ([x, y]) => fn(x, y)),
      ],
    });
  }

  nn2b({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: number, y: number) => boolean;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition([tNumber, tNumber], tBool, ([x, y]) => fn(x, y)),
      ],
    });
  }

  bb2b({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: boolean, y: boolean) => boolean;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition([tBool, tBool], tBool, ([x, y]) => fn(x, y)),
      ],
    });
  }

  ss2b({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: string, y: string) => boolean;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition([tString, tString], tBool, ([x, y]) => fn(x, y)),
      ],
    });
  }

  ss2s({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: string, y: string) => string;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition([tString, tString], tString, ([x, y]) => fn(x, y)),
      ],
    });
  }

  d2s({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (dist: BaseDist, env: Env) => string;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition([tDist], tString, ([dist], { environment }) =>
          fn(dist, environment)
        ),
      ],
    });
  }

  dn2s({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (dist: BaseDist, n: number, env: Env) => string;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition(
          [tDist, tNumber],
          tString,
          ([dist, n], { environment }) => fn(dist, n, environment)
        ),
      ],
    });
  }

  d2n({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: BaseDist, reducer: Reducer) => number;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition([tDist], tNumber, ([x], reducer) => fn(x, reducer)),
      ],
    });
  }

  d2b({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: BaseDist, env: Env) => boolean;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition([tDist], tBool, ([x], { environment }) =>
          fn(x, environment)
        ),
      ],
    });
  }

  d2d({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (dist: BaseDist, reducer: Reducer) => BaseDist;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition([tDist], tDist, ([dist], reducer) => fn(dist, reducer)),
      ],
    });
  }

  dn2d({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (dist: BaseDist, n: number, reducer: Reducer) => BaseDist;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition([tDist, tNumber], tDist, ([dist, n], reducer) =>
          fn(dist, n, reducer)
        ),
      ],
    });
  }

  dn2n({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (dist: BaseDist, n: number, env: Env) => number;
  }): FRFunction {
    return this.make({
      ...args,
      definitions: [
        makeDefinition(
          [tDist, tNumber],
          tNumber,
          ([dist, n], { environment }) => fn(dist, n, environment)
        ),
      ],
    });
  }

  fromDefinition(name: string, def: FnDefinition) {
    return this.make({
      name,
      definitions: [def],
    });
  }
}

export function unwrapDistResult<T>(result: Result.result<T, DistError>): T {
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return result.value;
}

export function doNumberLambdaCall(
  lambda: Lambda,
  args: Value[],
  reducer: Reducer
): number {
  const value = reducer.call(lambda, args);
  if (value.type === "Number") {
    return value.value;
  }
  throw new REOperationError(new SampleMapNeedsNtoNFunction());
}

export function doBinaryLambdaCall(
  args: Value[],
  lambda: Lambda,
  reducer: Reducer
): boolean {
  const value = reducer.call(lambda, args);
  if (value.type === "Bool") {
    return value.value;
  }
  throw new REOther("Expected function to return a boolean value");
}

export const parseDistFromDistOrNumber = (d: number | BaseDist): BaseDist =>
  typeof d === "number" ? Result.getExt(PointMass.make(d)) : d;

export function makeSampleSet(d: BaseDist, reducer: Reducer) {
  const result = SampleSetDist.SampleSetDist.fromDist(
    d,
    reducer.environment,
    reducer.rng
  );
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return result.value;
}

export function twoVarSample(
  v1: BaseDist | number,
  v2: BaseDist | number,
  reducer: Reducer,
  fn: (
    v1: number,
    v2: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
): SampleSetDist.SampleSetDist {
  const sampleFn = (a: number, b: number) =>
    Result.fmap2(
      fn(a, b),
      (d) => d.sample(reducer.rng),
      (e) => new OtherOperationError(e)
    );

  if (v1 instanceof BaseDist && v2 instanceof BaseDist) {
    const s1 = makeSampleSet(v1, reducer);
    const s2 = makeSampleSet(v2, reducer);
    return unwrapDistResult(
      SampleSetDist.map2({
        fn: sampleFn,
        dist1: s1,
        dist2: s2,
      })
    );
  } else if (v1 instanceof BaseDist && typeof v2 === "number") {
    const s1 = makeSampleSet(v1, reducer);
    return unwrapDistResult(s1.samplesMap((a) => sampleFn(a, v2)));
  } else if (typeof v1 === "number" && v2 instanceof BaseDist) {
    const s2 = makeSampleSet(v2, reducer);
    return unwrapDistResult(s2.samplesMap((a) => sampleFn(v1, a)));
  } else if (typeof v1 === "number" && typeof v2 === "number") {
    const result = fn(v1, v2);
    if (!result.ok) {
      throw new REOther(result.value);
    }
    return makeSampleSet(result.value, reducer);
  }
  throw new REOther("Impossible branch");
}

export function makeTwoArgsSamplesetDist(
  fn: (
    v1: number,
    v2: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>,
  name1: string,
  name2: string
) {
  return makeDefinition(
    [namedInput(name1, tDistOrNumber), namedInput(name2, tDistOrNumber)],
    tSampleSetDist,
    ([v1, v2], reducer) => twoVarSample(v1, v2, reducer, fn)
  );
}

export function makeOneArgSamplesetDist(
  fn: (v: number) => Result.result<SymbolicDist.SymbolicDist, string>,
  name: string
) {
  return makeDefinition(
    [namedInput(name, tDistOrNumber)],
    tSampleSetDist,
    ([v], reducer) => {
      const sampleFn = (a: number) =>
        Result.fmap2(
          fn(a),
          (d) => d.sample(reducer.rng),
          (e) => new OtherOperationError(e)
        );

      if (v instanceof BaseDist) {
        const s = makeSampleSet(v, reducer);
        return unwrapDistResult(s.samplesMap(sampleFn));
      } else if (typeof v === "number") {
        const result = fn(v);
        if (!result.ok) {
          throw new REOther(result.value);
        }
        return makeSampleSet(result.value, reducer);
      }
      throw new REOther("Impossible branch");
    }
  );
}

function createComparisonDefinition<T>(
  fnFactory: FnFactory,
  opName: string,
  comparisonFunction: (d1: T, d2: T) => boolean,
  frType: Type<T>,
  displaySection?: string
): FRFunction {
  return fnFactory.make({
    name: opName,
    displaySection,
    definitions: [
      makeDefinition([frType, frType], tBool, ([d1, d2]) =>
        comparisonFunction(d1, d2)
      ),
    ],
  });
}

export function makeNumericComparisons<T>(
  fnFactory: FnFactory,
  smaller: (d1: T, d2: T) => boolean,
  larger: (d1: T, d2: T) => boolean,
  isEqual: (d1: T, d2: T) => boolean,
  frType: Type<T>,
  displaySection?: string
): FRFunction[] {
  return [
    createComparisonDefinition(
      fnFactory,
      "smaller",
      smaller,
      frType,
      displaySection
    ),
    createComparisonDefinition(
      fnFactory,
      "larger",
      larger,
      frType,
      displaySection
    ),
    createComparisonDefinition(
      fnFactory,
      "smallerEq",
      (d1, d2) => smaller(d1, d2) || isEqual(d1, d2),
      frType,
      displaySection
    ),
    createComparisonDefinition(
      fnFactory,
      "largerEq",
      (d1, d2) => larger(d1, d2) || isEqual(d1, d2),
      frType,
      displaySection
    ),
  ];
}

// In cases where we have a function that takes a lambda as an argument, and it's possible we could use n to m arguments, we want to choose the largest number of arguments that matches the lambda.
export const chooseLambdaParamLength = (
  inputOptions: number[],
  lambda: Lambda
): number | undefined => {
  const _overlap = intersection(inputOptions, lambda.parameterCounts());
  return last(_overlap);
};

// A helper to check if a list of frTypes would match inputs of a given length.
// Non-trivial because of optional arguments.
export const fnInputsMatchesLengths = (
  inputs: FnInput<any>[],
  lengths: number[]
): boolean => {
  const min = inputs.filter((i) => !i.optional).length;
  const max = inputs.length;
  return intersection(upTo(min, max), lengths).length > 0;
};

export const frTypeToInput = (frType: Type<any>, name: string): Input => {
  const type = frType.defaultFormInputType() || "text";
  switch (type) {
    case "text":
      return {
        name,
        type,
        typeName: frType.display(),
        default: frType.defaultFormInputCode(),
      };
    case "textArea":
      return {
        name,
        type,
        typeName: frType.display(),
        default: frType.defaultFormInputCode(),
      };
    case "checkbox":
      return {
        name,
        type,
        typeName: frType.display(),
        default: frType.defaultFormInputCode() === "true" ? true : false,
      };
    case "select":
      return {
        name,
        type,
        typeName: frType.display(),
        default: frType.defaultFormInputCode(),
        options: [],
      };
  }
};
// Regex taken from d3-format.
// https://github.com/d3/d3-format/blob/f3cb31091df80a08f25afd4a7af2dcb3a6cd5eef/src/formatSpecifier.js#L1C65-L2C85
const d3TickFormatRegex =
  /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

export function checkNumericTickFormat(tickFormat: string | null) {
  if (tickFormat && !d3TickFormatRegex.test(tickFormat)) {
    throw new REArgumentError(`Tick format [${tickFormat}] is invalid.`);
  }
}
