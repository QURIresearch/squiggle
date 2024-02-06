import { forwardRef, useState } from "react";

import { useGlobalShortcut } from "@quri/ui";

import { isSimulating, Simulation } from "../../lib/hooks/useSimulator.js";
import { defaultViewerTab, ViewerTab } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/ViewerProvider.js";
import { Layout } from "./Layout.js";
import { SimulatingIndicator } from "./SimulatingIndicator.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  simulation: Simulation;
  editor?: CodeEditorHandle;
  playgroundSettings: PartialPlaygroundSettings;
  showMenu?: boolean;
  defaultTab?: ViewerTab;
};

const tabs = ["Imports", "Variables", "Exports", "Result", "AST"] as const;

function nextTab(
  tab: ViewerTab,
  direction: "backwards" | "forwards"
): ViewerTab {
  if (typeof tab === "object" && tab.tag === "CustomResultPath") {
    return "Variables";
  }
  const index = tabs.indexOf(tab as (typeof tabs)[number]);
  if (direction === "forwards" && index >= 0 && index < tabs.length - 1) {
    return tabs[index + 1];
  } else if (direction === "backwards" && index > 0) {
    return tabs[index - 1];
  } else {
    return tab;
  }
}

/* Wrapper for SquiggleViewer that shows the rendering stats and isSimulating state. */
export const ViewerWithMenuBar = forwardRef<SquiggleViewerHandle, Props>(
  function ViewerWithMenuBar(
    {
      simulation: simulation,
      playgroundSettings,
      showMenu = true,
      editor,
      defaultTab,
    },
    viewerRef
  ) {
    const [viewerTab, setViewerTab] = useState<ViewerTab>(
      defaultTab ?? defaultViewerTab(simulation.output)
    );

    const { output } = simulation;

    useGlobalShortcut(
      {
        metaKey: true,
        key: "PageDown",
      },
      () => setViewerTab(nextTab(viewerTab, "forwards"))
    );
    useGlobalShortcut(
      {
        metaKey: true,
        key: "PageUp",
      },
      () => setViewerTab(nextTab(viewerTab, "backwards"))
    );

    return (
      <Layout
        menu={
          showMenu ? (
            <ViewerMenu
              viewerTab={viewerTab}
              setViewerTab={setViewerTab}
              outputResult={output}
            />
          ) : (
            <div />
          ) // Important not to be null, so that it stays on the right.
        }
        indicator={<SimulatingIndicator simulation={simulation} />}
        viewer={
          <ViewerBody
            viewerTab={viewerTab}
            outputResult={output}
            isSimulating={isSimulating(simulation)}
            playgroundSettings={playgroundSettings}
            ref={viewerRef}
            editor={editor}
          />
        }
      />
    );
  }
);
