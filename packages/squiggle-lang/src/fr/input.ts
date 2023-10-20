import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frArray,
  frBool,
  frDict,
  frNumberOrString,
  frOptional,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vInput } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Input",
  requiresNamespace: true,
});

const convertFieldDefault = (value: number | string | null): string => {
  if (typeof value === "number") {
    return value.toString();
  } else if (typeof value === "string") {
    return value;
  } else {
    return "";
  }
};

export const library = [
  maker.make({
    name: "text",
    output: "Input",
    examples: [`Input.text({ name: "First", default: "John" })`],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["description", frOptional(frString)],
            ["default", frOptional(frNumberOrString)]
          ),
        ],
        ([vars]) => {
          return vInput({
            type: "text",
            name: vars.name,
            description: vars.description || "",
            default: convertFieldDefault(vars.default),
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "textArea",
    output: "Input",
    examples: [`Input.textArea({ name: "First", default: "John" })`],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["description", frOptional(frString)],
            ["default", frOptional(frNumberOrString)]
          ),
        ],
        ([vars]) => {
          return vInput({
            type: "textArea",
            name: vars.name,
            description: vars.description || "",
            default: convertFieldDefault(vars.default),
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "checkbox",
    output: "Input",
    examples: [`Input.checkbox({ name: "First", default: true })`],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["description", frOptional(frString)],
            ["default", frOptional(frBool)]
          ),
        ],
        ([vars]) => {
          return vInput({
            type: "checkbox",
            name: vars.name,
            description: vars.description || "",
            default: vars.default ?? false,
          });
        }
      ),
    ],
  }),
  maker.make({
    name: "select",
    output: "Input",
    examples: [
      `Input.select({ name: "First", default: "John", options: ["Mary", "Sue"] })`,
    ],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["name", frString],
            ["description", frOptional(frString)],
            ["options", frArray(frString)],
            ["default", frOptional(frString)]
          ),
        ],
        ([vars]) => {
          return vInput({
            type: "select",
            name: vars.name,
            description: vars.description || "",
            options: vars.options,
            default: vars.default ?? vars.options[0],
          });
        }
      ),
    ],
  }),
];
