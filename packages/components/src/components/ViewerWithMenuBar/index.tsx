import { forwardRef, useState } from "react";

import {
  isRunning,
  SquiggleProjectRun,
} from "../../lib/hooks/useSquiggleProjectRun.js";
import { defaultViewerTab, ViewerTab } from "../../lib/utility.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleViewerHandle } from "../SquiggleViewer/ViewerProvider.js";
import { Layout } from "./Layout.js";
import { RenderingIndicator } from "./RenderingIndicator.js";
import { RunSeedButton } from "./RunSeedButton.js";
import { ViewerBody } from "./ViewerBody.js";
import { ViewerMenu } from "./ViewerMenu.js";

type Props = {
  squiggleProjectRun: SquiggleProjectRun;
  editor?: CodeEditorHandle;
  playgroundSettings: PartialPlaygroundSettings;
  showMenu?: boolean;
  defaultTab?: ViewerTab;
  seed: string;
  setSeed: (seed: string) => void;
};

/* Wrapper for SquiggleViewer that shows the rendering stats and isRunning state. */
export const ViewerWithMenuBar = forwardRef<SquiggleViewerHandle, Props>(
  function ViewerWithMenuBar(
    {
      squiggleProjectRun,
      playgroundSettings,
      seed,
      setSeed,
      showMenu = true,
      editor,
      defaultTab,
    },
    viewerRef
  ) {
    const [viewerTab, setViewerTab] = useState<ViewerTab>(
      defaultTab ?? defaultViewerTab(squiggleProjectRun.output)
    );

    const { output } = squiggleProjectRun;
    const _isRunning = isRunning(squiggleProjectRun);

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
        indicator={<RenderingIndicator projectRun={squiggleProjectRun} />}
        changeSeedAndRunButton={
          <RunSeedButton isRunning={_isRunning} seed={seed} setSeed={setSeed} />
        }
        viewer={
          <ViewerBody
            viewerTab={viewerTab}
            outputResult={output}
            isRunning={_isRunning}
            playgroundSettings={playgroundSettings}
            ref={viewerRef}
            editor={editor}
          />
        }
      />
    );
  }
);
