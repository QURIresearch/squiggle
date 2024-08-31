import { ErrorMessage } from "../errors/messages.js";
import { BaseValue } from "./BaseValue.js";
// Specific value classes
import { VArray } from "./VArray.js";
import { VBool } from "./VBool.js";
import { VCalculator } from "./VCalculator.js";
import { VDate } from "./VDate.js";
import { VDict } from "./VDict.js";
import { VDist } from "./VDist.js";
import { VDomain } from "./VDomain.js";
import { VDuration } from "./VDuration.js";
import { VInput } from "./VInput.js";
import { VLambda } from "./vLambda.js";
import { VNumber } from "./VNumber.js";
import { VPlot } from "./VPlot.js";
import { VScale } from "./VScale.js";
import { VSpecification } from "./VSpecification.js";
import { VString } from "./VString.js";
import { VTableChart } from "./VTableChart.js";
import { VVoid } from "./VVoid.js";

// re-exports for convenience
export { vArray } from "./VArray.js";
export { vBool } from "./VBool.js";
export { vCalculator } from "./VCalculator.js";
export { vDate } from "./VDate.js";
export { vDict } from "./VDict.js";
export { vDist } from "./VDist.js";
export { vDomain } from "./VDomain.js";
export { vDuration } from "./VDuration.js";
export { vInput } from "./VInput.js";
export { vLambda } from "./vLambda.js";
export { vNumber } from "./VNumber.js";
export { vPlot } from "./VPlot.js";
export { vScale } from "./VScale.js";
export { vString } from "./VString.js";
export { vTableChart } from "./VTableChart.js";
export { vVoid } from "./VVoid.js";

export type Value =
  | VArray
  | VBool
  | VDate
  | VDist
  | VLambda
  | VNumber
  | VString
  | VDict
  | VDuration
  | VPlot
  | VTableChart
  | VCalculator
  | VScale
  | VInput
  | VDomain
  | VSpecification
  | VVoid;

type SerializedPayload<V> = V extends BaseValue<string, infer B> ? B : never;

export type SerializedValue = {
  [k in Value["type"]]: {
    type: k;
    payload: SerializedPayload<Extract<Value, { type: k }>>;
    tags?: number;
  };
}[Value["type"]];

export function isEqual(a: Value, b: Value): boolean {
  if (a.type !== b.type) {
    return false;
  }
  switch (a.type) {
    case "Bool":
    case "Number":
    case "String":
    case "Dist":
    case "Date":
    case "Duration":
    case "Scale":
    case "Domain":
    case "Array":
    case "Specification":
    case "Dict":
      return a.isEqual(b as any);
    case "Void":
      return true;
  }

  if (a.toString() !== b.toString()) {
    return false;
  }
  throw ErrorMessage.otherError("Equal not implemented for these inputs");
}

const _isUniqableType = (t: Value) => "isEqual" in t;

export function uniq(array: readonly Value[]): Value[] {
  const uniqueArray: Value[] = [];

  for (const item of array) {
    if (!_isUniqableType(item)) {
      throw ErrorMessage.otherError(
        `Can't apply uniq() to element with type ${item.type}`
      );
    }
    if (!uniqueArray.some((existingItem) => isEqual(existingItem, item))) {
      uniqueArray.push(item);
    }
  }

  return uniqueArray;
}

export function uniqBy(
  array: readonly Value[],
  fn: (e: Value) => Value
): Value[] {
  const seen: Value[] = [];
  const uniqueArray: Value[] = [];

  for (const item of array) {
    const computed = fn(item);
    if (!_isUniqableType(computed)) {
      throw ErrorMessage.otherError(
        `Can't apply uniq() to element with type ${computed.type}`
      );
    }
    if (!seen.some((existingItem) => isEqual(existingItem, computed))) {
      seen.push(computed);
      uniqueArray.push(item);
    }
  }

  return uniqueArray;
}
