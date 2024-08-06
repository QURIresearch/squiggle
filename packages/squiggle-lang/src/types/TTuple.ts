import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { vArray } from "../value/VArray.js";
import { InputType } from "../value/VInput.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TTuple<const T extends any[]> extends Type<
  [...{ [K in keyof T]: T[K] }]
> {
  constructor(private types: [...{ [K in keyof T]: Type<T[K]> }]) {
    super();
  }

  unpack(v: Value) {
    if (v.type !== "Array" || v.value.length !== this.types.length) {
      return undefined;
    }

    const items = this.types.map((type, index) => type.unpack(v.value[index]));

    if (items.some((item) => item === undefined)) {
      return undefined;
    }

    return items as any;
  }

  pack(values: unknown[]) {
    return vArray(values.map((val, index) => this.types[index].pack(val)));
  }

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "Tuple",
      types: this.types.map((type) => visit.type(type)),
    };
  }

  override display() {
    return `[${this.types.map((type) => type.display()).join(", ")}]`;
  }

  override defaultFormInputCode() {
    return `[${this.types.map((type) => type.defaultFormInputCode()).join(", ")}]`;
  }

  override defaultFormInputType(): InputType {
    return "textArea";
  }
}

export function tTuple<const T extends any[]>(
  ...types: [...{ [K in keyof T]: Type<T[K]> }]
) {
  return new TTuple(types);
}
