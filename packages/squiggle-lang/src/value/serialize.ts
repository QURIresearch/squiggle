import { SquiggleDeserializationVisitor } from "../serialization/squiggle.js";
import { SerializedValue, Value } from "./index.js";
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

export function deserializeValue(
  node: SerializedValue,
  visit: SquiggleDeserializationVisitor
): Value {
  switch (node.type) {
    case "Bool":
      return VBool.deserialize(node.payload);
    case "Array":
      return VArray.deserialize(node.payload, visit);
    case "Date":
      return VDate.deserialize(node.payload);
    case "Number":
      return VNumber.deserialize(node.payload);
    case "Lambda":
      return VLambda.deserialize(node.payload, visit);
    case "Calculator":
      return VCalculator.deserialize(node.payload, visit);
    case "Void":
      return VVoid.deserialize();
    case "String":
      return VString.deserialize(node.payload);
    case "Dict":
      return VDict.deserialize(node.payload, visit);
    case "Input":
      return VInput.deserialize(node.payload);
    case "Dist":
      return VDist.deserialize(node.payload);
    case "Duration":
      return VDuration.deserialize(node.payload);
    case "Plot":
      return VPlot.deserialize(node.payload, visit);
    case "Scale":
      return VScale.deserialize(node.payload);
    case "TableChart":
      return VTableChart.deserialize(node.payload, visit);
    case "Domain":
      return VDomain.deserialize(node.payload);
    case "Specification":
      return VSpecification.deserialize(node.payload, visit);
    default:
      throw new Error(`Can't deserialize node ${node satisfies never}`);
  }
}
