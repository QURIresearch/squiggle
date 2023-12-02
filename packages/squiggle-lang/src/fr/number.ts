import { REArgumentError } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frDict,
  frDomain,
  frNumber,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import * as E_A_Floats from "../utility/E_A_Floats.js";
import { NumericRangeDomain } from "../value/domain.js";
import { vArray, vDomain, vNumber } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Number",
  requiresNamespace: false,
});

const assertIsNotEmpty = (arr: readonly number[]) => {
  if (arr.length === 0) {
    throw new REArgumentError("List is empty");
  }
};

function makeNumberArrayToNumberDefinition(
  fn: (arr: number[]) => number,
  throwIfEmpty = true
) {
  return makeDefinition(
    [frArray(frNumber)],
    ([arr]) => {
      throwIfEmpty && assertIsNotEmpty(arr);
      return vNumber(fn(arr));
    },
    frNumber
  );
}

function makeNumberArrayToNumberArrayDefinition(
  fn: (arr: number[]) => number[],
  throwIfEmpty = true
) {
  return makeDefinition(
    [frArray(frNumber)],
    ([arr]) => {
      throwIfEmpty && assertIsNotEmpty(arr);
      return vArray(fn(arr).map(vNumber));
    },
    frArray(frNumber)
  );
}

export const library = [
  maker.n2n({
    name: "floor",
    output: "Number",
    examples: [`floor(3.5)`],
    fn: Math.floor,
  }),
  maker.n2n({
    name: "ceil",
    output: "Number",
    examples: ["ceil(3.5)"],
    fn: Math.ceil,
  }),
  maker.n2n({
    name: "abs",
    output: "Number",
    description: "absolute value",
    examples: [`abs(3.5)`],
    fn: Math.abs,
  }),
  maker.n2n({
    name: "exp",
    output: "Number",
    description: "exponent",
    examples: [`exp(3.5)`],
    fn: Math.exp,
  }),
  maker.n2n({
    name: "log",
    output: "Number",
    examples: [`log(3.5)`],
    fn: Math.log,
  }),
  maker.n2n({
    name: "log10",
    output: "Number",
    examples: [`log10(3.5)`],
    fn: Math.log10,
  }),
  maker.n2n({
    name: "log2",
    output: "Number",
    examples: [`log2(3.5)`],
    fn: Math.log2,
  }),
  maker.n2n({
    name: "round",
    output: "Number",
    examples: [`round(3.5)`],
    fn: Math.round,
  }),
  maker.make({
    name: "sum",
    output: "Number",
    examples: [`sum([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.sum(arr), false),
    ],
  }),
  maker.make({
    name: "product",
    output: "Number",
    examples: [`product([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition(
        (arr) => E_A_Floats.product(arr),
        false
      ),
    ],
  }),
  maker.make({
    name: "min",
    output: "Number",
    examples: [`min([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => Math.min(...arr)),
      makeDefinition(
        [frNumber, frNumber],
        ([a, b]) => {
          return vNumber(Math.min(a, b));
        },
        frNumber
      ),
    ],
  }),
  maker.make({
    name: "max",
    output: "Number",
    examples: [`max([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => Math.max(...arr)),
      makeDefinition(
        [frNumber, frNumber],
        ([a, b]) => {
          return vNumber(Math.max(a, b));
        },
        frNumber
      ),
    ],
  }),
  maker.make({
    name: "mean",
    output: "Number",
    examples: [`mean([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.mean(arr)),
    ],
  }),
  maker.make({
    name: "quantile",
    output: "Number",
    examples: [`quantile([1,5,10,40,2,4], 0.3)`],
    definitions: [
      makeDefinition(
        [frArray(frNumber), frNumber],
        ([arr, i]) => {
          assertIsNotEmpty(arr);
          return vNumber(E_A_Floats.quantile(arr, i));
        },
        frNumber
      ),
    ],
  }),
  maker.make({
    name: "median",
    output: "Number",
    examples: [`median([1,5,10,40,2,4])`],
    definitions: [
      makeDefinition(
        [frArray(frNumber)],
        ([arr]) => {
          assertIsNotEmpty(arr);
          return vNumber(E_A_Floats.quantile(arr, 0.5));
        },
        frNumber
      ),
    ],
  }),
  maker.make({
    name: "geomean",
    description: "geometric mean",
    output: "Number",
    examples: [`geomean([3,5,2])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.geomean(arr)),
    ],
  }),
  maker.make({
    name: "stdev",
    description: "standard deviation",
    output: "Number",
    examples: [`stdev([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.stdev(arr)),
    ],
  }),
  maker.make({
    name: "variance",
    output: "Number",
    examples: [`variance([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberDefinition((arr) => E_A_Floats.variance(arr)),
    ],
  }),
  maker.make({
    name: "sort",
    output: "Array",
    examples: [`sort([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberArrayDefinition(
        (arr) => E_A_Floats.sort(arr),
        false
      ),
    ],
  }),
  maker.make({
    name: "cumsum",
    output: "Array",
    description: "cumulative sum",
    examples: [`cumsum([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberArrayDefinition(E_A_Floats.cumSum, false),
    ],
  }),
  maker.make({
    name: "cumprod",
    description: "cumulative product",
    output: "Array",
    examples: [`cumprod([3,5,2,3,5])`],
    definitions: [
      makeNumberArrayToNumberArrayDefinition(E_A_Floats.cumProd, false),
    ],
  }),
  maker.make({
    name: "diff",
    output: "Array",
    examples: [`diff([3,5,2,3,5])`],
    definitions: [makeNumberArrayToNumberArrayDefinition(E_A_Floats.diff)],
  }),
  maker.make({
    name: "rangeDomain",
    requiresNamespace: true,
    output: "Domain",
    examples: ["Number.rangeDomain({ min: 5, max: 10 })"],
    definitions: [
      makeDefinition(
        [frDict(["min", frNumber], ["max", frNumber])],
        ([{ min, max }]) => {
          return vDomain(new NumericRangeDomain(min, max));
        },
        frDomain
      ),
    ],
  }),
];
