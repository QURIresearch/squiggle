import { Value } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { TLambda } from "./TLambda.js";

// This type is a hack. It's used to create assert definitions that are used to guard against ambiguous function calls.
// TODO: analyze the definitions for ambiguity directly in `fnDefinition.ts` code.
export class TLambdaNand extends TLambda {
  constructor(public paramLengths: number[]) {
    super();
  }

  override unpack(v: Value) {
    const counts = v.type === "Lambda" && v.value.parameterCounts();
    return counts && this.paramLengths.every((p) => counts.includes(p))
      ? v.value
      : undefined;
  }

  override serialize(): SerializedType {
    return {
      kind: "LambdaNand",
      paramLengths: this.paramLengths,
    };
  }
}

export function tLambdaNand(paramLengths: number[]) {
  return new TLambdaNand(paramLengths);
}
