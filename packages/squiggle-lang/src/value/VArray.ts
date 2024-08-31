import isInteger from "lodash/isInteger.js";

import { ErrorMessage } from "../errors/messages.js";
import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { BaseValue } from "./BaseValue.js";
import { isEqual, Value } from "./index.js";
import { Indexable } from "./mixins.js";

// list of value ids
type SerializedArray = number[];

export class VArray
  extends BaseValue<"Array", SerializedArray>
  implements Indexable
{
  readonly type = "Array";

  override get publicName() {
    return "List";
  }

  constructor(public value: readonly Value[]) {
    super();
  }

  valueToString() {
    return "[" + this.value.map((v) => v.toString()).join(",") + "]";
  }

  get(key: Value) {
    if (key.type === "Number") {
      if (!isInteger(key.value)) {
        throw ErrorMessage.arrayIndexNotFoundError(
          "Array index must be an integer",
          key.value
        );
      }
      const index = key.value | 0;
      if (index >= 0 && index < this.value.length) {
        return this.value[index];
      } else {
        throw ErrorMessage.arrayIndexNotFoundError(
          "Array index not found",
          index
        );
      }
    }

    throw ErrorMessage.otherError("Can't access non-numerical key on an array");
  }

  isEqual(other: VArray) {
    if (this.value.length !== other.value.length) {
      return false;
    }

    for (let i = 0; i < this.value.length; i++) {
      const _isEqual = isEqual(this.value[i], other.value[i]);
      if (!_isEqual) {
        return false;
      }
    }
    return true;
  }

  override serializePayload(
    visit: SquiggleSerializationVisitor
  ): SerializedArray {
    return this.value.map((element) => visit.value(element));
  }

  static deserialize(
    serializedValue: SerializedArray,
    visit: SquiggleDeserializationVisitor
  ): VArray {
    return new VArray(serializedValue.map((value) => visit.value(value)));
  }
}
export const vArray = (v: readonly Value[]) => new VArray(v);
