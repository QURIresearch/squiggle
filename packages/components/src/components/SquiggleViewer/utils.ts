import { SqDict, SqValue, SqValuePath } from "@quri/squiggle-lang";

import { SHORT_STRING_LENGTH } from "../../lib/constants.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { useViewerContext } from "./ViewerProvider.js";

function topLevelName(path: SqValuePath): string {
  return {
    result: "Result",
    bindings: "Variables",
    imports: "Imports",
    exports: "Exports",
  }[path.root];
}

export function pathToDisplayString(path: SqValuePath) {
  return [
    topLevelName(path),
    ...path.edges.map((p) => p.toDisplayString()),
  ].join(".");
}

export function pathToShortName(path: SqValuePath): string {
  //topLevelName is used if its the root path
  return path.lastItem()?.toDisplayString() || topLevelName(path);
}

export function getChildrenValues(value: SqValue): SqValue[] {
  switch (value.tag) {
    case "Array":
      return value.value.getValues();
    case "Dict":
      return value.value.entries().map((a) => a[1]);
    default: {
      return [];
    }
  }
}

// This needs to be a hook because it relies on ItemStore to traverse calculator nodes in path.
export function useGetSubvalueByPath() {
  const { itemStore } = useViewerContext();

  return (
    topValue: SqValue,
    subValuePath: SqValuePath
  ): SqValue | undefined => {
    const { context } = topValue;

    if (!context || !subValuePath.hasPrefix(context.path)) {
      return;
    }

    let currentValue = topValue;
    const subValuePaths = subValuePath.allPrefixPaths({
      includeRoot: false,
    });

    for (const subValuePath of subValuePaths) {
      const pathEdge = subValuePath.lastItem()!; // We know it's not empty, because includeRoot is false.
      const currentTag = currentValue.tag;
      const pathEdgeType = pathEdge.value.type;

      let nextValue: SqValue | undefined;

      if (currentTag === "Array" && pathEdgeType === "index") {
        nextValue = currentValue.value.getValues()[pathEdge.value.value];
      } else if (currentTag === "Dict" && pathEdgeType === "key") {
        nextValue = currentValue.value.get(pathEdge.value.value);
      } else if (
        currentTag === "TableChart" &&
        pathEdgeType === "cellAddress"
      ) {
        // Maybe it would be better to get the environment in a different way.
        const environment = context.project.getEnvironment();
        const item = currentValue.value.item(
          pathEdge.value.value.row,
          pathEdge.value.value.column,
          environment
        );
        if (item.ok) {
          nextValue = item.value;
        } else {
          return;
        }
      } else if (pathEdge.type === "calculator") {
        // The previous path item is the one that is the parent of the calculator result.
        // This is the one that we use in the ViewerContext to store information about the calculator.
        const calculatorState = itemStore.getCalculator(subValuePath);
        const result = calculatorState?.calculatorResult;
        if (!result?.ok) {
          return;
        }
        nextValue = result.value;
      }

      if (!nextValue) {
        return;
      }
      currentValue = nextValue;
    }
    return currentValue;
  };
}

export function getValueComment(value: SqValueWithContext): string | undefined {
  const _value = value.context.docstring() || value.tags.doc();
  return _value && _value.length > 0 ? _value : undefined;
}

const tagsDefaultCollapsed = new Set(["Bool", "Number", "Void", "Input"]);

export function hasExtraContentToShow(v: SqValueWithContext): boolean {
  const contentIsVeryShort =
    tagsDefaultCollapsed.has(v.tag) ||
    (v.tag === "String" && v.value.length <= SHORT_STRING_LENGTH);
  const comment = getValueComment(v);
  const hasLongComment = Boolean(comment && comment.length > 15);
  return !contentIsVeryShort || hasLongComment;
}

// Collapse children and element if desired. Uses crude heuristics.
export const shouldBeginCollapsed = (
  value: SqValueWithContext,
  path: SqValuePath
): boolean => {
  const startOpenState = value.tags.startOpenState();
  if (startOpenState === "open") {
    return false;
  } else if (startOpenState === "closed") {
    return true;
  }
  const childrenValues = getChildrenValues(value);
  if (path.isRoot()) {
    return childrenValues.length > 30;
  } else if (value.tag === "Dist") {
    return true;
  } else {
    return childrenValues.length > 5 || !hasExtraContentToShow(value);
  }
};

//We only hide tagged=hidden values, if they are first-level in Variables.
function isHidden(value: SqValue): boolean {
  const isHidden = value.tags.hidden();
  const path = value.context?.path;
  return Boolean(isHidden === true && path && path.edges.length === 1);
}

export function nonHiddenDictEntries(value: SqDict): [string, SqValue][] {
  return value.entries().filter(([_, v]) => !isHidden(v));
}
