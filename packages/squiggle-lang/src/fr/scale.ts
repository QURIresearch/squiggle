import { REArgumentError, REOther } from "../errors/messages.js";
import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  checkNumericTickFormat,
  FnFactory,
} from "../library/registry/helpers.js";
import { tDate, tDict, tNumber, tScale, tString } from "../types/index.js";
import { SDate } from "../utility/SDate.js";

const maker = new FnFactory({
  nameSpace: "Scale",
  requiresNamespace: true,
});

const commonDict = tDict(
  { key: "min", type: tNumber, optional: true },
  { key: "max", type: tNumber, optional: true },
  { key: "tickFormat", type: tString, optional: true },
  { key: "title", type: tString, optional: true }
);

const dateDict = tDict(
  { key: "min", type: tDate, optional: true },
  { key: "max", type: tDate, optional: true },
  { key: "tickFormat", type: tString, optional: true },
  { key: "title", type: tString, optional: true }
);

function checkMinMax(min: number | null, max: number | null) {
  if (min !== null && max !== null && max <= min) {
    throw new REArgumentError(
      `Max must be greater than min, got: min=${min}, max=${max}`
    );
  }
}

function checkMinMaxDates(min: SDate | null, max: SDate | null) {
  if (!!min && !!max && max.toMs() <= min.toMs()) {
    throw new REArgumentError(
      `Max must be greater than min, got: min=${min.toString()}, max=${max.toString()}`
    );
  }
}

export const library = [
  maker.make({
    name: "linear",
    examples: [makeFnExample(`Scale.linear({ min: 3, max: 10 })`)],
    displaySection: "Numeric Scales",
    definitions: [
      makeDefinition(
        [commonDict],
        tScale,
        ([{ min, max, tickFormat, title }]) => {
          checkMinMax(min, max);
          checkNumericTickFormat(tickFormat);
          return {
            method: { type: "linear" },
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], tScale, () => {
        return { method: { type: "linear" } };
      }),
    ],
  }),
  maker.make({
    name: "log",
    examples: [makeFnExample(`Scale.log({ min: 1, max: 100 })`)],
    displaySection: "Numeric Scales",
    definitions: [
      makeDefinition(
        [commonDict],
        tScale,
        ([{ min, max, tickFormat, title }]) => {
          if (min !== null && min <= 0) {
            throw new REOther(`Min must be over 0 for log scale, got: ${min}`);
          }
          checkMinMax(min, max);
          checkNumericTickFormat(tickFormat);
          return {
            method: { type: "log" },
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], tScale, () => {
        return { method: { type: "log" } };
      }),
    ],
  }),
  maker.make({
    name: "symlog",
    examples: [makeFnExample(`Scale.symlog({ min: -10, max: 10 })`)],
    displaySection: "Numeric Scales",
    description: `Symmetric log scale. Useful for plotting data that includes zero or negative values.

The function accepts an additional \`constant\` parameter, used as follows: \`Scale.symlog({constant: 0.1})\`. This parameter allows you to allocate more pixel space to data with lower or higher absolute values. By adjusting this constant, you effectively control the scale's focus, shifting it between smaller and larger values. For more detailed information on this parameter, refer to the [D3 Documentation](https://d3js.org/d3-scale/symlog).
    
The default value for \`constant\` is \`${0.0001}\`.`, // I tried to set this to the default value in the code, but this gave webpack in the Website.
    definitions: [
      makeDefinition(
        [
          tDict(
            { key: "min", type: tNumber, optional: true },
            { key: "max", type: tNumber, optional: true },
            { key: "tickFormat", type: tString, optional: true },
            { key: "title", type: tString, optional: true },
            { key: "constant", type: tNumber, optional: true }
          ),
        ],
        tScale,
        ([{ min, max, tickFormat, title, constant }]) => {
          checkMinMax(min, max);
          checkNumericTickFormat(tickFormat);
          if (constant !== null && constant === 0) {
            throw new REOther(`Symlog scale constant cannot be 0.`);
          }

          return {
            method: { type: "symlog", constant: constant ?? undefined },
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], tScale, () => {
        return { method: { type: "symlog" } };
      }),
    ],
  }),
  maker.make({
    name: "power",
    examples: [
      makeFnExample(`Scale.power({ min: 1, max: 100, exponent: 0.1 })`),
    ],
    displaySection: "Numeric Scales",
    description: `Power scale. Accepts an extra \`exponent\` parameter, like, \`Scale.power({exponent: 2, min: 0, max: 100})\`.

The default value for \`exponent\` is \`${0.1}\`.`,
    definitions: [
      makeDefinition(
        [
          tDict(
            { key: "min", type: tNumber, optional: true },
            { key: "max", type: tNumber, optional: true },
            { key: "tickFormat", type: tString, optional: true },
            { key: "title", type: tString, optional: true },
            { key: "exponent", type: tNumber, optional: true }
          ),
        ],
        tScale,
        ([{ min, max, tickFormat, title, exponent }]) => {
          checkMinMax(min, max);
          checkNumericTickFormat(tickFormat);
          if (exponent !== null && exponent <= 0) {
            throw new REOther(`Power Scale exponent must be over 0.`);
          }

          return {
            method: { type: "power", exponent: exponent ?? undefined },
            min: min ?? undefined,
            max: max ?? undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], tScale, () => {
        return { method: { type: "power" } };
      }),
    ],
  }),
  maker.make({
    name: "date",
    displaySection: "Date Scales",
    examples: [
      makeFnExample("Scale.date({ min: Date(2022), max: Date(2025) })"),
    ],
    description: "Only works on Date values. Is a linear scale under the hood.",
    definitions: [
      makeDefinition(
        [dateDict],
        tScale,
        ([{ min, max, tickFormat, title }]) => {
          checkMinMaxDates(min, max);
          // We don't check the tick format, because the format is much more complicated for dates.
          return {
            format: { type: "date" },
            min: min ? min.toMs() : undefined,
            max: max ? max.toMs() : undefined,
            tickFormat: tickFormat ?? undefined,
            title: title ?? undefined,
          };
        }
      ),
      makeDefinition([], tScale, () => {
        return { method: { type: "date" } };
      }),
    ],
  }),
];
