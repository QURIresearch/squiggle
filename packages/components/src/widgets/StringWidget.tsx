import { SHORT_STRING_LENGTH } from "../lib/constants.js";
import { MarkdownViewer } from "../lib/MarkdownViewer.js";
import { widgetRegistry } from "./registry.js";
import { truncateStr } from "./utils.js";

widgetRegistry.register("String", {
  Preview: (value) => (
    <div className="overflow-hidden text-ellipsis italic text-slate-400">
      {truncateStr(value.value, SHORT_STRING_LENGTH)}
    </div>
  ),
  Chart: (value) => (
    <div className="my-1 max-w-4xl px-1 py-0.5">
      <MarkdownViewer md={value.value} textColor="prose-stone" textSize="sm" />
    </div>
  ),
});
