import { clsx } from "clsx";
import {
  CSSProperties,
  FC,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DraggableCore,
  DraggableEvent,
  DraggableEventHandler,
} from "react-draggable";

import { useInitialNonzeroWidth } from "../../lib/hooks/useInitialNonzeroWidth.js";

const minConstraint = 20;

type Props = {
  renderLeft(): ReactNode;
  renderRight(): ReactNode;
  height?: CSSProperties["height"];
};

export const ResizableTwoPanelLayout: FC<Props> = ({
  renderLeft,
  renderRight,
  height,
}) => {
  const { ref: containerRef, width: initialNonzeroWidth } =
    useInitialNonzeroWidth();
  const [width, setWidth] = useState<number | undefined>();

  useEffect(() => {
    initialNonzeroWidth && setWidth(initialNonzeroWidth / 2);
  }, [initialNonzeroWidth]);

  // Most of the following code is adapted and simplified from https://github.com/react-grid-layout/react-resizable/blob/master/lib/Resizable.js.
  const slack = useRef<number>(0);

  // Clamp width within provided constraints
  const runConstraint = (width: number): number => {
    const oldW = width;

    // Add slack to the values used to calculate bound position. This will ensure that if
    // we start removing slack, the element won't react to it right away until it's been
    // completely removed.
    width += slack.current;
    width = Math.max(minConstraint, width);

    // If the width or height changed, we must have introduced some slack. Record it for the next iteration.
    slack.current = slack.current + (oldW - width);

    return width;
  };

  const resizeHandler = (
    handlerName: "onResize" | "onResizeStart" | "onResizeStop"
  ): DraggableEventHandler => {
    return (e: DraggableEvent, { deltaX }) => {
      if (width === undefined) {
        return;
      }

      const newWidth = runConstraint(width + deltaX);

      if (newWidth !== width) {
        if ("persist" in e) {
          e.persist();
        }
      }

      if (handlerName === "onResizeStop") {
        slack.current = 0;
      }
    };
  };

  const handleRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex items-stretch" ref={containerRef} style={{ height }}>
      <div className={clsx("relative", !width && "w-1/2")} style={{ width }}>
        {renderLeft()}
        <DraggableCore
          nodeRef={handleRef}
          onStop={resizeHandler("onResizeStop")}
          onStart={resizeHandler("onResizeStart")}
          onDrag={resizeHandler("onResize")}
        >
          <div
            ref={handleRef}
            className="absolute top-0 h-full cursor-ew-resize border-l border-slate-300 transition hover:border-blue-500"
            style={{ width: 5, right: -5 }}
          />
        </DraggableCore>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        {renderRight()}
      </div>
    </div>
  );
};
