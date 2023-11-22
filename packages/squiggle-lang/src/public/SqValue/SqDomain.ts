import { Domain } from "../../value/domain.js";

export function wrapDomain(value: Domain) {
  switch (value.type) {
    case "NumericRange":
      return new SqNumericRangeDomain(value);
    case "DateRange":
      return new SqDateRangeDomain(value);
    default:
      throw new Error(`Unknown type`);
  }
}

// Domain internals are not exposed yet
abstract class SqAbstractDomain<T extends Domain["type"]> {
  abstract tag: T;

  constructor(public _value: Domain) {}

  toString() {
    return this._value.toString();
  }
}

class SqNumericRangeDomain extends SqAbstractDomain<"NumericRange"> {
  tag = "NumericRange" as const;

  get min() {
    return this._value.min;
  }

  get max() {
    return this._value.max;
  }
}
class SqDateRangeDomain extends SqAbstractDomain<"DateRange"> {
  tag = "DateRange" as const;

  get min() {
    return this._value.min;
  }

  get max() {
    return this._value.max;
  }
}

export type SqDomain = ReturnType<typeof wrapDomain>;
