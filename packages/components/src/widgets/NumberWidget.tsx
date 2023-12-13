import { clsx } from "clsx";
import * as d3 from "d3";

import { SqNumberValue } from "@quri/squiggle-lang";

import { SqBoxedValue } from "../../../squiggle-lang/src/public/SqValue/index.js";
import { NumberShower } from "../components/NumberShower.js";
import { widgetRegistry } from "./registry.js";
import { leftWidgetMargin } from "./utils.js";

const insideValue = (value: SqNumberValue, boxed: SqBoxedValue | undefined) => {
  const numberFormat = boxed && boxed.value.numberFormat();
  if (numberFormat) {
    return d3.format(numberFormat)(value.value);
  } else {
    return <NumberShower precision={4} number={value.value} />;
  }
};

widgetRegistry.register("Number", {
  Preview: (value, boxed) => insideValue(value, boxed),
  Chart: (value, _, boxed) => (
    <div className={clsx("font-semibold text-indigo-800", leftWidgetMargin)}>
      {insideValue(value, boxed)}
    </div>
  ),
});
