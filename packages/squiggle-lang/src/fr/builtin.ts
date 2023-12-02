import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frBool,
  frGeneric,
  frNumber,
  frString,
} from "../library/registry/frTypes.js";
import {
  FnFactory,
  makeNumericComparisons,
} from "../library/registry/helpers.js";
import { vArray, vBool, vString, isEqual } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "", // no namespaced versions
  requiresNamespace: false,
});

export const library = [
  maker.nn2n({ name: "add", fn: (x, y) => x + y }), // infix + (see Reducer/Reducer_Peggy/helpers.ts)
  maker.ss2s({ name: "add", fn: (x, y) => x + y }), // infix + on strings
  maker.nn2n({ name: "subtract", fn: (x, y) => x - y }), // infix -
  maker.nn2n({ name: "multiply", fn: (x, y) => x * y }), // infix *
  maker.nn2n({ name: "divide", fn: (x, y) => x / y }), // infix /
  maker.nn2n({ name: "pow", fn: (x, y) => Math.pow(x, y) }), // infix ^
  ...makeNumericComparisons(
    maker,
    (d1, d2) => d1 < d2,
    (d1, d2) => d1 > d2,
    (d1, d2) => d1 === d2,
    frNumber
  ),
  maker.bb2b({ name: "or", fn: (x, y) => x || y }), // infix ||
  maker.bb2b({ name: "and", fn: (x, y) => x && y }), // infix &&
  maker.n2n({ name: "unaryMinus", fn: (x) => -x }), // unary prefix -
  maker.make({
    name: "not",
    definitions: [
      makeDefinition(
        [frNumber],
        ([x]) => {
          // unary prefix !
          return vBool(x !== 0);
        },
        frBool
      ),
      makeDefinition(
        [frBool],
        ([x]) => {
          // unary prefix !
          return vBool(!x);
        },
        frBool
      ),
    ],
  }),
  maker.make({
    name: "concat",
    definitions: [
      makeDefinition(
        [frString, frString],
        ([a, b]) => {
          return vString(a + b);
        },
        frString
      ),
      makeDefinition(
        [frArray(frAny), frArray(frAny)],
        ([a, b]) => {
          return vArray([...a, ...b]);
        },
        frArray(frAny)
      ),
      makeDefinition(
        [frString, frAny],
        ([a, b]) => {
          return vString(a + b.toString());
        },
        frString
      ),
    ],
  }),
  maker.make({
    name: "add",
    definitions: [
      makeDefinition(
        [frString, frAny],
        ([a, b]) => {
          return vString(a + b.toString());
        },
        frString
      ),
    ],
  }),
  maker.make({
    name: "equal",
    definitions: [
      makeDefinition(
        [frAny, frAny],
        ([a, b]) => {
          return vBool(isEqual(a, b));
        },
        frBool
      ),
    ],
  }),
  maker.make({
    name: "unequal",
    definitions: [
      makeDefinition(
        [frAny, frAny],
        ([a, b]) => {
          return vBool(!isEqual(a, b));
        },
        frBool
      ),
    ],
  }),
  maker.make({
    name: "typeOf",
    definitions: [
      makeDefinition(
        [frAny],
        ([v]) => {
          return vString(v.publicName);
        },
        frString
      ),
    ],
  }),
  maker.make({
    name: "inspect",
    definitions: [
      makeDefinition(
        [frGeneric("A")],
        ([value]) => {
          console.log(value);
          return value;
        },
        frGeneric("A")
      ),
      makeDefinition(
        [frGeneric("A"), frString],
        ([value, label]) => {
          console.log(`${label}: ${value.toString()}`);
          return value;
        },
        frGeneric("A")
      ),
    ],
  }),
];
