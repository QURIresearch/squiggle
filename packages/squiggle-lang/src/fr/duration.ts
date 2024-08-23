import { frDuration, frNumber } from "../library/FrType.js";
import { makeFnExample } from "../library/registry/core.js";
import {
  FnFactory,
  makeNumericComparisons,
} from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { SDuration } from "../utility/SDuration.js";
import { unitNameToBuiltinFunctionName } from "./units.js";

const maker = new FnFactory({
  nameSpace: "Duration",
  requiresNamespace: false,
});

const makeNumberToDurationFn = (
  name: string,
  displaySection: string,
  isUnit: boolean,
  fn: (v: number) => SDuration
) =>
  maker.make({
    name,
    examples: [makeFnExample(`Duration.${name}(5)`)],
    definitions: [makeDefinition([frNumber], frDuration, ([t]) => fn(t))],
    isUnit,
    displaySection,
  });

const makeDurationToNumberFn = (
  name: string,
  displaySection: string,
  fn: (v: SDuration) => number
) =>
  maker.make({
    name,
    examples: [makeFnExample(`Duration.${name}(5minutes)`)],
    displaySection,
    definitions: [makeDefinition([frDuration], frNumber, ([t]) => fn(t))],
  });

export const library = [
  makeNumberToDurationFn(
    "fromMinutes",
    "Constructors",
    false,
    SDuration.fromMinutes
  ),
  makeNumberToDurationFn(
    "fromHours",
    "Constructors",
    false,
    SDuration.fromHours
  ),
  makeNumberToDurationFn("fromDays", "Constructors", false, SDuration.fromDays),
  makeNumberToDurationFn(
    "fromYears",
    "Constructors",
    false,
    SDuration.fromYears
  ),
  ...makeNumericComparisons(
    maker,
    (d1, d2) => d1.smaller(d2),
    (d1, d2) => d1.larger(d2),
    (d1, d2) => d1.isEqual(d2),
    frDuration,
    "Comparison"
  ),
  maker.make({
    name: "unaryMinus",
    examples: [makeFnExample("-5minutes")],
    displaySection: "Algebra",
    definitions: [
      makeDefinition([frDuration], frDuration, ([d]) => d.multiply(-1)),
    ],
  }),
  maker.make({
    name: "add",
    examples: [makeFnExample("5minutes + 10minutes")],
    displaySection: "Algebra",
    definitions: [
      makeDefinition([frDuration, frDuration], frDuration, ([d1, d2]) =>
        d1.add(d2)
      ),
    ],
  }),
  maker.make({
    name: "subtract",
    examples: [makeFnExample("5minutes - 10minutes")],
    displaySection: "Algebra",
    definitions: [
      makeDefinition([frDuration, frDuration], frDuration, ([d1, d2]) =>
        d1.subtract(d2)
      ),
    ],
  }),
  maker.make({
    name: "multiply",
    examples: [makeFnExample("5minutes * 10"), makeFnExample("10 * 5minutes")],
    displaySection: "Algebra",
    definitions: [
      makeDefinition([frDuration, frNumber], frDuration, ([d1, d2]) =>
        d1.multiply(d2)
      ),
      makeDefinition([frNumber, frDuration], frDuration, ([d1, d2]) =>
        d2.multiply(d1)
      ),
    ],
  }),
  maker.make({
    name: "divide",
    displaySection: "Algebra",
    examples: [makeFnExample("5minutes / 2minutes")],
    definitions: [
      makeDefinition([frDuration, frDuration], frNumber, ([d1, d2]) =>
        d1.divideBySDuration(d2)
      ),
    ],
  }),
  maker.make({
    name: "divide",
    displaySection: "Algebra",
    examples: [makeFnExample("5minutes / 3")],
    definitions: [
      makeDefinition([frDuration, frNumber], frDuration, ([d1, d2]) =>
        d1.divideByNumber(d2)
      ),
    ],
  }),

  makeDurationToNumberFn("toMinutes", "Conversions", (d) => d.toMinutes()),
  makeDurationToNumberFn("toHours", "Conversions", (d) => d.toHours()),
  makeDurationToNumberFn("toDays", "Conversions", (d) => d.toDays()),
  makeDurationToNumberFn("toYears", "Conversions", (d) => d.toYears()),

  makeNumberToDurationFn(
    unitNameToBuiltinFunctionName("minutes"),
    "Conversions",
    true,
    SDuration.fromMinutes
  ),
  makeNumberToDurationFn(
    unitNameToBuiltinFunctionName("hours"),
    "Conversions",
    true,
    SDuration.fromHours
  ),
  makeNumberToDurationFn(
    unitNameToBuiltinFunctionName("days"),
    "Conversions",
    true,
    SDuration.fromDays
  ),
  makeNumberToDurationFn(
    unitNameToBuiltinFunctionName("years"),
    "Conversions",
    true,
    SDuration.fromYears
  ),
];
