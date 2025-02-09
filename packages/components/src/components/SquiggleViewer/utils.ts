import { SqDict, SqValue, SqValuePath } from "@quri/squiggle-lang";

import { SHORT_STRING_LENGTH } from "../../lib/constants.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { ItemStore, useViewerContext } from "./ViewerProvider.js";

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

export type TraverseCalculatorEdge = (path: SqValuePath) => SqValue | undefined;

export function traverseCalculatorEdge(
  itemStore: ItemStore
): TraverseCalculatorEdge {
  return (calculatorSubPath: SqValuePath) => {
    const calculatorState = itemStore.getCalculator(calculatorSubPath);
    const result = calculatorState?.calculatorResult;
    return result?.ok ? result.value : undefined;
  };
}

// This needs to be a hook because it relies on ItemStore to traverse calculator nodes in path.
export function useGetSubvalueByPath() {
  const { itemStore, rootValue } = useViewerContext();

  return (subValuePath: SqValuePath): SqValue | undefined => {
    return (
      rootValue &&
      rootValue.getSubvalueByPath(
        subValuePath,
        traverseCalculatorEdge(itemStore)
      )
    );
  };
}

export function getValueComment(value: SqValueWithContext): string | undefined {
  // `@doc` is preferred over `/** */`.
  // See also: https://github.com/quantified-uncertainty/squiggle/issues/3320
  const _value = value.tags.doc() || value.context.docstring();
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
  if (path.isRoot() && childrenValues.length < 30) {
    return false;
  } else {
    return true;
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
