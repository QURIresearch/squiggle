import { ErrorMessage } from "../errors/messages.js";
import {
  frArray,
  frBool,
  frDict,
  frFormInput,
  frNumber,
  frOr,
  frString,
} from "../library/FrType.js";
import { makeFnExample } from "../library/registry/core.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";

const maker = new FnFactory({
  nameSpace: "Input",
  requiresNamespace: true,
});

const convertInputDefault = (
  value: number | string | null
): string | undefined => {
  if (typeof value === "number") {
    return value.toString();
  } else if (typeof value === "string") {
    return value;
  } else {
    return undefined;
  }
};

export const library = [
  maker.make({
    name: "text",
    examples: [
      makeFnExample(`Input.text({ name: "First", default: "John" })`),
      makeFnExample(
        `Input.text({ name: "Number of X in Y", default: '20 to 300' })`
      ),
    ],
    description:
      "Creates a single-line input. This input can be used for all Squiggle types.",
    definitions: [
      makeDefinition(
        [
          frDict({
            name: frString,
            description: { type: frString, optional: true },
            default: { type: frOr(frNumber, frString), optional: true },
          }),
        ],
        frFormInput,
        ([vars]) => {
          return {
            type: "text",
            name: vars.name,
            description: vars.description || undefined,
            default: convertInputDefault(vars.default?.value || null),
          };
        }
      ),
    ],
  }),
  maker.make({
    name: "textArea",
    examples: [
      makeFnExample(`Input.textArea({ name: "people", default: '{
  "John": 20 to 50, 
  "Mary": 30 to 90,
}' })`),
    ],
    description:
      "Creates a multi-line input, sized with the provided input. This input can be used for all Squiggle types.",
    definitions: [
      makeDefinition(
        [
          frDict({
            name: frString,
            description: { type: frString, optional: true },
            default: { type: frOr(frNumber, frString), optional: true },
          }),
        ],
        frFormInput,
        ([vars]) => {
          return {
            type: "textArea",
            name: vars.name,
            description: vars.description || undefined,
            default: convertInputDefault(vars.default?.value || null),
          };
        }
      ),
    ],
  }),
  maker.make({
    name: "checkbox",
    examples: [
      makeFnExample(`Input.checkbox({ name: "IsTrue?", default: true })`),
    ],
    description: "Creates a checkbox input. Used for Squiggle booleans.",
    definitions: [
      makeDefinition(
        [
          frDict({
            name: frString,
            description: { type: frString, optional: true },
            default: { type: frBool, optional: true },
          }),
        ],
        frFormInput,
        ([vars]) => {
          return {
            type: "checkbox",
            name: vars.name,
            description: vars.description || undefined,
            default: vars.default ?? undefined,
          };
        }
      ),
    ],
  }),
  maker.make({
    name: "select",
    examples: [
      makeFnExample(
        `Input.select({ name: "Name", default: "Sue", options: ["John", "Mary", "Sue"] })`
      ),
    ],
    description: "Creates a dropdown input. Used for Squiggle strings.",
    definitions: [
      makeDefinition(
        [
          frDict({
            name: frString,
            options: frArray(frString),
            description: { type: frString, optional: true },
            default: { type: frString, optional: true },
          }),
        ],
        frFormInput,
        ([vars]) => {
          //Throw error if options are empty, if default is not in options, or if options have duplicate
          const isEmpty = () => vars.options.length === 0;
          const defaultNotInOptions = () =>
            vars.default && !vars.options.includes(vars.default as string);
          const hasDuplicates = () =>
            new Set(vars.options).size !== vars.options.length;

          if (isEmpty()) {
            throw ErrorMessage.argumentError("Options cannot be empty");
          } else if (defaultNotInOptions()) {
            throw ErrorMessage.argumentError(
              "Default value must be one of the options provided"
            );
          } else if (hasDuplicates()) {
            throw ErrorMessage.argumentError(
              "Options cannot have duplicate values"
            );
          }
          return {
            type: "select",
            name: vars.name,
            description: vars.description || undefined,
            options: vars.options,
            default: vars.default ?? undefined,
          };
        }
      ),
    ],
  }),
];
