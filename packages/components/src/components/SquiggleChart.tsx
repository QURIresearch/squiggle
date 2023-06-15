import * as React from "react";

import { RefreshIcon } from "@quri/ui";

import { SquiggleArgs, useSquiggle } from "../lib/hooks/useSquiggle.js";
import { getValueToRender } from "../lib/utility.js";
import { SquiggleViewer, SquiggleViewerProps } from "./SquiggleViewer/index.js";

type Props = SquiggleArgs & Omit<SquiggleViewerProps, "result">;

export const SquiggleChart: React.FC<Props> = React.memo((props) => {
  // TODO - split props into useSquiggle args and SquiggleViewer args would be cleaner
  // (but `useSquiggle` props are union-typed and are hard to extract for that reason)
  const [resultAndBindings] = useSquiggle(props);

  if (!resultAndBindings) {
    return <RefreshIcon className="animate-spin" />;
  }

  const valueToRender = getValueToRender(resultAndBindings);

  return <SquiggleViewer {...props} result={valueToRender} />;
});
