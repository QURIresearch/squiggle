import { Env } from "../../dists/env.js";
import * as Result from "../../utility/result.js";
import { Calculator } from "../../value/VCalculator.js";
import { SqErrorList, SqOtherError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValuePathEdge } from "../SqValuePath.js";
import { SqValue, wrapValue } from "./index.js";
import { SqInput, wrapInput } from "./SqInput.js";
import { SqLambda } from "./SqLambda.js";

export class SqCalculator {
  constructor(
    private _value: Calculator,
    public context?: SqValueContext
  ) {}

  run(_arguments: SqValue[], env: Env): Result.result<SqValue, SqErrorList> {
    const sqLambda = new SqLambda(this._value.fn, undefined);
    const response = sqLambda.call(_arguments, env);

    const newContext = this.context?.extend(SqValuePathEdge.fromCalculator());

    if (!newContext) {
      return Result.Err(
        new SqErrorList([
          new SqOtherError("Context creation for calculator failed."),
        ])
      );
    } else if (!response.ok) {
      return response;
    } else {
      return Result.Ok(wrapValue(response.value._value, newContext));
    }
  }

  get title(): string | undefined {
    return this._value.title;
  }

  get description(): string | undefined {
    return this._value.description;
  }

  get autorun(): boolean {
    return this._value.autorun;
  }

  get sampleCount(): number | undefined {
    return this._value.sampleCount;
  }

  // This function is used to determine if a calculator has changed.
  // It's obviously not perfect - it doesn't capture changes within the calculator function, but this would be much more complicated.

  get hashString(): string {
    const rowData = JSON.stringify(this._value.inputs);
    const paramData = this._value.fn.toString() || "";
    return (
      rowData +
      paramData +
      this._value.description +
      this._value.title +
      this._value.autorun +
      this._value.sampleCount
    );
  }

  get inputs(): SqInput[] {
    return this._value.inputs.map(wrapInput);
  }
}
