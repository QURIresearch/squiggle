import { EditorView, repositionTooltips } from "@codemirror/view";
import { FC, PropsWithChildren, useEffect } from "react";

export const TooltipBox: FC<PropsWithChildren<{ view: EditorView }>> = ({
  view,
  children,
}) => {
  useEffect(() => {
    // https://codemirror.net/docs/ref/#view.repositionTooltips needs to be called on each render.
    repositionTooltips(view);
  });

  return (
    <div className="h-full overflow-y-auto rounded-sm border border-gray-200 shadow-lg">
      {children}
    </div>
  );
};
