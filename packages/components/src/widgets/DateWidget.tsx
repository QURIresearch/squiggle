import {
  SqBoxedValue,
  SqDateValue,
} from "../../../squiggle-lang/src/public/SqValue/index.js";
import { formatDate } from "../lib/d3/index.js";
import { widgetRegistry } from "./registry.js";

const showDate = (value: SqDateValue, boxed: SqBoxedValue | undefined) => {
  const dateFormat = boxed?.value?.dateFormat();
  if (dateFormat) {
    return formatDate(value.value.toDate(), dateFormat);
  } else {
    return value.value.toString();
  }
};

widgetRegistry.register("Date", {
  Preview: (value, boxed) => showDate(value, boxed),
  Chart: (value, _, boxed) => showDate(value, boxed),
});
