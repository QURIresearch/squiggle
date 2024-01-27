import { result, SqError, SqValue } from "@quri/squiggle-lang";

import { SqOutputResult } from "../../../squiggle-lang/src/public/types.js";
import { SquiggleOutput } from "./hooks/useSquiggle.js";

export function flattenResult<a, b>(x: result<a, b>[]): result<a[], b> {
  if (x.length === 0) {
    return { ok: true, value: [] };
  } else {
    if (!x[0].ok) {
      return x[0];
    }
    const rest = flattenResult(x.splice(1));
    if (!rest.ok) {
      return rest;
    }
    return { ok: true, value: [x[0].value].concat(rest.value) };
  }
}

export function resultBind<a, b, c>(
  x: result<a, b>,
  fn: (y: a) => result<c, b>
): result<c, b> {
  if (x.ok) {
    return fn(x.value);
  } else {
    return x;
  }
}

export function all(arr: boolean[]): boolean {
  return arr.reduce((x, y) => x && y, true);
}

export function some(arr: boolean[]): boolean {
  return arr.reduce((x, y) => x || y, false);
}

export function getErrors(result: SquiggleOutput["output"]): SqError[] {
  if (!result.ok) {
    return [result.value];
  } else {
    return [];
  }
}

export function unwrapOrFailure<a, b>(x: result<a, b>): a {
  if (x.ok) {
    return x.value;
  } else {
    throw Error("FAILURE TO UNWRAP");
  }
}

export function isMac() {
  // Browser-only. Defaults to `false` when `window` is not available.

  // TODO - support https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/platform
  // when it will become available in modern browsers.
  // Note: MacIntel is valid even for ARM macs.
  return (
    typeof window !== "undefined" && window.navigator.platform === "MacIntel"
  );
}

export function modKey() {
  // Matches Codemirror; https://codemirror.net/docs/ref/#view.KeyBinding
  return isMac() ? "Cmd" : "Ctrl";
}

export function altKey() {
  return isMac() ? "Option" : "Alt";
}

//This is important to make sure that canvas elements properly stretch
export const canvasClasses = "w-full";

// Function by supersan on Stack Overflow.
// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
// Takes in a string like "#333999"
export function adjustColorBrightness(color: string, amount: number) {
  return (
    "#" +
    color
      .replace(/^#/, "")
      .replace(/../g, (color) =>
        (
          "0" +
          Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)
        ).substr(-2)
      )
  );
}

// Ensures that the SqValue has a "context" parameter, which would otherwise be optional.
export type SqValueWithContext = SqValue & Required<Pick<SqValue, "context">>;

export function valueHasContext(value: SqValue): value is SqValueWithContext {
  return !!value.context;
}

export type ViewerMode = "Imports" | "Exports" | "Variables" | "Result" | "AST";

export function defaultMode(outputResult: SqOutputResult | undefined) {
  if (!outputResult || !outputResult.ok) {
    return "Variables";
  }

  const output = outputResult.value;
  if (output.result.tag !== "Void") {
    return "Result";
  }
  if (!output.exports.isEmpty()) {
    return "Exports";
  }
  return "Variables";
}
