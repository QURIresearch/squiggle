import { SDuration } from "../utility/SDuration.js";
import { BaseValue } from "./BaseValue.js";

export class VDuration extends BaseValue<"Duration", number> {
  readonly type = "Duration";

  override get publicName() {
    return "Time Duration";
  }

  constructor(public value: SDuration) {
    super();
  }

  valueToString() {
    return this.value.toString();
  }

  isEqual(other: VDuration) {
    return this.value.toMs() === other.value.toMs();
  }

  override serializePayload(): number {
    return this.value.toMs();
  }

  static deserialize(value: number): VDuration {
    return new VDuration(SDuration.fromMs(value));
  }
}

export function vDuration(v: SDuration) {
  return new VDuration(v);
}
