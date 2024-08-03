import { DateRangeDomain } from "../../domains/DateRangeDomain.js";
import { Domain } from "../../domains/index.js";
import { NumericRangeDomain } from "../../domains/NumberRangeDomain.js";
import { SqDateValue, SqNumberValue } from "./index.js";
import { SqScale } from "./SqScale.js";

export function wrapDomain(value: Domain) {
  switch (value.kind) {
    case "NumericRange":
      return new SqNumericRangeDomain(value);
    case "DateRange":
      return new SqDateRangeDomain(value);
    default:
      throw new Error(`${value satisfies never} has unknown type`);
  }
}

// Domain internals are not exposed yet
abstract class SqAbstractDomain<T extends Domain["kind"]> {
  abstract tag: T;
}

export class SqNumericRangeDomain extends SqAbstractDomain<"NumericRange"> {
  tag = "NumericRange" as const;

  constructor(public _value: NumericRangeDomain) {
    super();
  }

  //A simple alternative to making a Domain object and pass that in.
  static fromMinMax(min: number, max: number) {
    return new this(new NumericRangeDomain(min, max));
  }

  get min() {
    return this._value.min;
  }

  get max() {
    return this._value.max;
  }

  get minValue() {
    return SqNumberValue.create(this._value.min);
  }

  get maxValue() {
    return SqNumberValue.create(this._value.max);
  }

  toDefaultScale() {
    return new SqScale(this._value.toDefaultScale());
  }
}
export class SqDateRangeDomain extends SqAbstractDomain<"DateRange"> {
  tag = "DateRange" as const;

  constructor(public _value: DateRangeDomain) {
    super();
  }

  get min() {
    return this._value.min;
  }

  get max() {
    return this._value.max;
  }

  get minValue() {
    return SqDateValue.create(this._value.min);
  }

  get maxValue() {
    return SqDateValue.create(this._value.max);
  }

  toDefaultScale() {
    return new SqScale(this._value.toDefaultScale());
  }
}

export type SqDomain = ReturnType<typeof wrapDomain>;
