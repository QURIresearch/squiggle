"use client";
import { FC, useRef } from "react";

import { useUncontrolledCode } from "../lib/hooks/index.js";
import { usePlaygroundSettings } from "../lib/hooks/usePlaygroundSettings.js";
import { useSimulator } from "../lib/hooks/useSimulator.js";
import {
  ProjectExecutionProps,
  StandaloneExecutionProps,
} from "../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "./CodeEditor/index.js";
import { PartialPlaygroundSettings } from "./PlaygroundSettings.js";
import { useExternalViewerActionsForEditor } from "./SquiggleViewer/ViewerProvider.js";
import { ViewerWithMenuBar } from "./ViewerWithMenuBar/index.js";

export type SquiggleEditorProps = {
  defaultCode?: string;
  onCodeChange?(code: string): void;
  editorFontSize?: number;
  editorHeight?: number | "100%"; // 100% makes sense only if you have a parent with a height.
  // environment comes from StandaloneExecutionProps
} & (StandaloneExecutionProps | ProjectExecutionProps) &
  Omit<PartialPlaygroundSettings, "environment">;

export const SquiggleEditor: FC<SquiggleEditorProps> = ({
  defaultCode: propsDefaultCode,
  onCodeChange,
  project: propsProject,
  environment,
  editorFontSize,
  editorHeight,
  ...defaultSettings
}) => {
  const { settings, randomizeSeed } = usePlaygroundSettings({
    defaultSettings: {
      ...defaultSettings,
      ...{ environment },
    },
  });

  const { code, setCode, defaultCode } = useUncontrolledCode({
    defaultCode: propsDefaultCode,
    onCodeChange,
  });

  const { simulation, project, sourceId, runSimulation } = useSimulator({
    code,
    setup: propsProject
      ? { type: "project", project: propsProject }
      : { type: "standalone" },
    environment: settings.environment,
  });

  const editorRef = useRef<CodeEditorHandle>(null);

  const externalViewerActions = useExternalViewerActionsForEditor(
    editorRef.current
  );

  return (
    <div>
      <div
        className="rounded-xs border border-slate-300 bg-slate-50 p-2"
        data-testid="squiggle-editor"
      >
        <CodeEditor
          ref={editorRef}
          defaultValue={defaultCode ?? ""}
          onChange={setCode}
          fontSize={editorFontSize}
          height={editorHeight}
          showGutter={false}
          project={project}
          simulation={simulation}
          sourceId={sourceId}
          onSubmit={runSimulation}
        />
      </div>
      {!simulation ? null : (
        <ViewerWithMenuBar
          simulation={simulation}
          externalViewerActions={externalViewerActions}
          playgroundSettings={settings}
          xPadding={0}
          randomizeSeed={randomizeSeed}
        />
      )}
    </div>
  );
};
