import { FC, memo } from "react";

import { SqValuePath } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { useSimulator } from "../lib/hooks/useSimulator.js";
import {
  ProjectExecutionProps,
  StandaloneExecutionProps,
} from "../lib/utility.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { ExternalViewerActions } from "./SquiggleViewer/ViewerProvider.js";
import { ViewerWithMenuBar } from "./ViewerWithMenuBar/index.js";

// TODO: Right now, rootPathOverride is only used for Export pages on Squiggle Hub. When this happens, we don't want to show the header menu. This combination is awkward, but this interface is annoying to change, given it being in Versioned Components. Consider changing later.

export type SquiggleChartProps = {
  code: string;
  rootPathOverride?: SqValuePath; // Note: This should be static. We don't support rootPathOverride to change once set. Used for Export pages on Squiggle Hub.
  externalViewerActions?: ExternalViewerActions;
} & (StandaloneExecutionProps | ProjectExecutionProps) &
  // `environment` is passed through StandaloneExecutionProps; this way we guarantee that it's not compatible with `project` prop
  Omit<PartialPlaygroundSettings, "environment">;

export const SquiggleChart: FC<SquiggleChartProps> = memo(
  function SquiggleChart({
    code,
    project,
    environment,
    rootPathOverride,
    externalViewerActions,
    ...settings
  }) {
    // We go through runnerState to bump executionId on code changes;
    // This is important, for example, in VS Code extension.
    // TODO: maybe `useRunnerState` could be merged with `useSquiggle`, but it does some extra stuff (autorun mode).

    const { simulation } = useSimulator({
      code,
      setup: project ? { type: "project", project } : { type: "standalone" },
      environment,
    });

    if (!simulation) {
      return <RefreshIcon className="animate-spin" />;
    }

    return (
      <ViewerWithMenuBar
        simulation={simulation}
        playgroundSettings={settings}
        showMenu={!rootPathOverride}
        randomizeSeed={undefined}
        externalViewerActions={externalViewerActions}
        defaultTab={
          rootPathOverride
            ? {
                tag: "CustomVisibleRootPath",
                visibleRootPath: rootPathOverride,
              }
            : undefined
        }
      />
    );
  }
);
