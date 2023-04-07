import React from "react";

import { SqLocation } from "@quri/squiggle-lang";

import { CodeEditor } from "./CodeEditor.js";
import { SquiggleContainer } from "./SquiggleContainer.js";
import { useMaybeControlledValue } from "../lib/hooks/index.js";
import { useSquiggle, SquiggleArgs } from "../lib/hooks/useSquiggle.js";
import { SquiggleViewer, SquiggleViewerProps } from "./SquiggleViewer/index.js";
import { getErrorLocations, getValueToRender } from "../lib/utility.js";

export type SquiggleEditorProps = SquiggleArgs & {
  defaultCode?: string;
  onCodeChange?: (code: string) => void;
  hideViewer?: boolean;
} & Omit<SquiggleViewerProps, "result">;

export const SquiggleEditor: React.FC<SquiggleEditorProps> = (props) => {
  const [code, setCode] = useMaybeControlledValue({
    value: props.code,
    defaultValue: props.defaultCode ?? "",
    onChange: props.onCodeChange,
  });

  const resultAndBindings = useSquiggle({ ...props, code });
  const valueToRender = getValueToRender(resultAndBindings);
  const errorLocations = getErrorLocations(resultAndBindings.result);

  return (
    <SquiggleContainer>
      <div
        className="border border-grey-200 p-2 m-4"
        data-testid="squiggle-editor"
      >
        <CodeEditor
          value={code}
          onChange={setCode}
          oneLine={true}
          showGutter={false}
          errorLocations={errorLocations}
          project={resultAndBindings.project}
        />
      </div>
      {props.hideViewer ? null : (
        <SquiggleViewer result={valueToRender} {...props} />
      )}
    </SquiggleContainer>
  );
};
