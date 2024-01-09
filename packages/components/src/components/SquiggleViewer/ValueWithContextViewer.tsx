// make sure all widgets are in registry
import "../../widgets/index.js";

import { clsx } from "clsx";
import { FC, PropsWithChildren, useMemo } from "react";

import { SqValue } from "@quri/squiggle-lang";
import { CommentIcon, TextTooltip } from "@quri/ui";

import { MarkdownViewer } from "../../lib/MarkdownViewer.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { leftWidgetMargin } from "../../widgets/utils.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import { CollapsedIcon, ExpandedIcon } from "./icons.js";
import { SquiggleValueChart } from "./SquiggleValueChart.js";
import { SquiggleValueMenu } from "./SquiggleValueMenu.js";
import { SquiggleValuePreview } from "./SquiggleValuePreview.js";
import {
  getValueComment,
  hasExtraContentToShow,
  pathToShortName,
} from "./utils.js";
import {
  useFocus,
  useMergedSettings,
  useRegisterAsItemViewer,
  useToggleCollapsed,
  useViewerContext,
} from "./ViewerProvider.js";

const CommentIconForValue: FC<{ value: SqValueWithContext }> = ({ value }) => {
  const comment = getValueComment(value);

  return comment ? (
    <div className="ml-3">
      <TextTooltip text={comment} placement="bottom">
        <span>
          <CommentIcon
            size={13}
            className="text-purple-100 group-hover:text-purple-300"
          />
        </span>
      </TextTooltip>
    </div>
  ) : null;
};

type Props = {
  value: SqValueWithContext;
  parentValue?: SqValue;
  collapsible?: boolean;
  header?: "normal" | "large" | "hide";
  size?: "normal" | "large";
};

const WithComment: FC<PropsWithChildren<Props>> = ({ value, children }) => {
  const comment = getValueComment(value);

  if (!comment) {
    return children;
  }

  const tagsWithTopPosition = new Set([
    "Dict",
    "Array",
    "TableChart",
    "Plot",
    "String",
  ]);
  const commentPosition = tagsWithTopPosition.has(value.tag) ? "top" : "bottom";

  const commentEl = (
    <div
      className={clsx(
        "max-w-4xl",
        leftWidgetMargin,
        commentPosition === "bottom" ? "mt-1" : "mb-1"
      )}
    >
      <MarkdownViewer md={comment} textSize="sm" />
    </div>
  );

  return (
    // TODO - can be simplified with flex-col-reverse
    <div>
      {commentPosition === "top" && commentEl}
      {children}
      {commentPosition === "bottom" && commentEl}
    </div>
  );
};

const ValueViewerBody: FC<Props> = ({ value, size = "normal" }) => {
  const { path } = value.context;
  const mergedSettings = useMergedSettings(path);
  const adjustedMergedSettings = useMemo(() => {
    const { chartHeight } = mergedSettings;
    return {
      ...mergedSettings,
      chartHeight: size === "large" ? chartHeight * 4 : chartHeight,
    };
  }, [size, mergedSettings]);

  return (
    <WithComment value={value}>
      <SquiggleValueChart value={value} settings={adjustedMergedSettings} />
    </WithComment>
  );
};

export const ValueWithContextViewer: FC<Props> = ({
  value,
  parentValue,
  ...props
}) => {
  const { tag } = value;
  const { path } = value.context;

  const toggleCollapsed_ = useToggleCollapsed();
  const focus = useFocus();

  const { itemStore } = useViewerContext();
  const itemState = itemStore.getStateOrInitialize(value);

  const isRoot = path.isRoot();
  const taggedName = value.tags.name();

  // root header is always hidden (unless forced, but we probably won't need it)
  const header = props.header ?? (isRoot ? "hide" : "show");
  const collapsible = header === "hide" ? false : props.collapsible ?? true;
  const size = props.size ?? "normal";

  const toggleCollapsed = () => {
    toggleCollapsed_(path);
  };

  const ref = useRegisterAsItemViewer(path);

  // TODO - check that we're not in a situation where `isOpen` is false and `header` is hidden?
  // In that case, the output would look broken (empty).
  const isOpen = !collapsible || !itemState.collapsed;

  const _focus = () => focus(path);

  const triangleToggle = () => {
    const Icon = itemState.collapsed ? CollapsedIcon : ExpandedIcon;
    const _hasExtraContentToShow = hasExtraContentToShow(value);
    // Only show triangle if there is content to show, that's not in the header.
    if (_hasExtraContentToShow) {
      return (
        <div
          className={clsx(
            "w-4 mr-1.5 flex justify-center cursor-pointer hover:!text-stone-600",
            isOpen ? "text-stone-300" : "text-stone-400"
          )}
          onClick={toggleCollapsed}
        >
          <Icon size={13} />
        </div>
      );
    } else {
      return <div className="w-4 mr-1.5" />;
    }
  };

  const headerName = () => {
    const name = pathToShortName(path);

    // We want to show colons after the keys, for dicts/arrays.
    const showColon = header !== "large" && path.items.length > 1;

    const getHeaderColor = () => {
      let color = "text-orange-900";
      const parentTag = parentValue?.tag;
      if (parentTag === "Array") {
        color = "text-stone-400";
      } else if (path.items.length > 1) {
        color = "text-teal-700";
      }
      return color;
    };

    const headerColor = getHeaderColor();

    const headerClasses = () => {
      if (header === "large") {
        return clsx("text-md font-bold ml-1", headerColor);
      } else if (isRoot) {
        return "text-sm text-stone-600 font-semibold";
      } else {
        return clsx("text-sm cursor-pointer hover:underline", headerColor);
      }
    };

    return (
      <div className={clsx("leading-3", showColon || "mr-3")}>
        <span
          className={clsx(!taggedName && "font-mono", headerClasses())}
          onClick={_focus}
        >
          {taggedName || name}
        </span>
        {showColon && <span className="text-gray-400 font-mono">:</span>}
      </div>
    );
  };

  const leftCollapseBorder = () => {
    const isDictOrList = tag === "Dict" || tag === "Array";
    if (isDictOrList) {
      return (
        <div
          className="group w-4 shrink-0 flex justify-center cursor-pointer"
          onClick={toggleCollapsed}
        >
          <div className="w-px bg-stone-100 group-hover:bg-stone-400" />
        </div>
      );
    } else {
      // Non-root leaf elements have unclickable padding to align with dict/list elements.
      return <div className="flex w-4 min-w-[1rem]" />; // min-w-1rem = w-4
    }
  };

  return (
    <ErrorBoundary>
      <div ref={ref}>
        {header !== "hide" && (
          <header
            className={clsx(
              "flex justify-between group pr-0.5",
              header === "large" ? "mb-2" : "hover:bg-stone-100 rounded-sm"
            )}
          >
            <div className="inline-flex items-center">
              {collapsible && triangleToggle()}
              {headerName()}
              {!isOpen && (
                <div className="text-sm text-blue-800 ml-2">
                  <SquiggleValuePreview value={value} />
                </div>
              )}
              {!isOpen && <CommentIconForValue value={value} />}
            </div>
            <div className="inline-flex space-x-1 items-center">
              <SquiggleValueMenu value={value} />
            </div>
          </header>
        )}
        {isOpen && (
          <div
            className={clsx(
              "flex w-full",
              Boolean(getValueComment(value)) && "py-2"
            )}
          >
            {collapsible && leftCollapseBorder()}
            <div className="grow">
              <ValueViewerBody value={value} size={size} />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
