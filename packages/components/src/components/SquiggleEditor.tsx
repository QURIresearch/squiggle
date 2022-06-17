import * as React from "react";
import * as ReactDOM from "react-dom";
import { SquiggleChart } from "./SquiggleChart";
import { CodeEditor } from "./CodeEditor";
import type {
  squiggleExpression,
  environment,
  bindings,
  jsImports,
} from "@quri/squiggle-lang";
import {
  runPartial,
  errorValueToString,
  defaultImports,
  defaultBindings,
} from "@quri/squiggle-lang";
import { ErrorAlert } from "./Alert";
import { SquiggleContainer } from "./SquiggleContainer";

export interface SquiggleEditorProps {
  /** The input string for squiggle */
  initialSquiggleString?: string;
  /** If the output requires monte carlo sampling, the amount of samples */
  environment?: environment;
  /** If the result is a function, where the function starts */
  diagramStart?: number;
  /** If the result is a function, where the function ends */
  diagramStop?: number;
  /** If the result is a function, how many points along the function it samples */
  diagramCount?: number;
  /** when the environment changes. Used again for notebook magic*/
  onChange?(expr: squiggleExpression): void;
  /** The width of the element */
  width?: number;
  /** Previous variable declarations */
  bindings?: bindings;
  /** JS Imports */
  jsImports?: jsImports;
  /** Whether to show detail about types of the returns, default false */
  showTypes?: boolean;
  /** Whether to give users access to graph controls */
  showControls?: boolean;
  /** Whether to show a summary table */
  showSummary?: boolean;
}

export let SquiggleEditor: React.FC<SquiggleEditorProps> = ({
  initialSquiggleString = "",
  width,
  environment,
  diagramStart = 0,
  diagramStop = 10,
  diagramCount = 20,
  onChange,
  bindings = defaultBindings,
  jsImports = defaultImports,
  showTypes = false,
  showControls = false,
  showSummary = false,
}: SquiggleEditorProps) => {
  const [expression, setExpression] = React.useState(initialSquiggleString);
  const chartSettings = {
    start: diagramStart,
    stop: diagramStop,
    count: diagramCount,
  };
  return (
    <SquiggleContainer>
      <div>
        <div className="border border-grey-200 p-2 m-4">
          <CodeEditor
            value={expression}
            onChange={setExpression}
            oneLine={true}
            showGutter={false}
            height={20}
          />
        </div>
        <SquiggleChart
          width={width}
          environment={environment}
          squiggleString={expression}
          chartSettings={chartSettings}
          onChange={onChange}
          bindings={bindings}
          jsImports={jsImports}
          showTypes={showTypes}
          showControls={showControls}
          showSummary={showSummary}
        />
      </div>
    </SquiggleContainer>
  );
};

export function renderSquiggleEditorToDom(props: SquiggleEditorProps) {
  let parent = document.createElement("div");
  ReactDOM.render(
    <SquiggleEditor
      {...props}
      onChange={(expr) => {
        // Typescript complains on two levels here.
        //  - Div elements don't have a value property
        //  - Even if it did (like it was an input element), it would have to
        //    be a string
        //
        //  Which are reasonable in most web contexts.
        //
        //  However we're using observable, neither of those things have to be
        //  true there. div elements can contain the value property, and can have
        //  the value be any datatype they wish.
        //
        //  This is here to get the 'viewof' part of:
        //  viewof env = cell('normal(0,1)')
        //  to work
        // @ts-ignore
        parent.value = expr;

        parent.dispatchEvent(new CustomEvent("input"));
        if (props.onChange) props.onChange(expr);
      }}
    />,
    parent
  );
  return parent;
}

export interface SquigglePartialProps {
  /** The input string for squiggle */
  initialSquiggleString?: string;
  /** If the output requires monte carlo sampling, the amount of samples */
  environment?: environment;
  /** If the result is a function, where the function starts */
  diagramStart?: number;
  /** If the result is a function, where the function ends */
  diagramStop?: number;
  /** If the result is a function, how many points along the function it samples */
  diagramCount?: number;
  /** when the environment changes. Used again for notebook magic*/
  onChange?(expr: bindings): void;
  /** Previously declared variables */
  bindings?: bindings;
  /** Variables imported from js */
  jsImports?: jsImports;
  /** Whether to give users access to graph controls */
  showControls?: boolean;
}

export let SquigglePartial: React.FC<SquigglePartialProps> = ({
  initialSquiggleString = "",
  onChange,
  bindings = defaultBindings,
  environment,
  jsImports = defaultImports,
}: SquigglePartialProps) => {
  const [expression, setExpression] = React.useState(initialSquiggleString);
  const [error, setError] = React.useState<string | null>(null);

  const runSquiggleAndUpdateBindings = () => {
    const squiggleResult = runPartial(
      expression,
      bindings,
      environment,
      jsImports
    );
    if (squiggleResult.tag === "Ok") {
      if (onChange) onChange(squiggleResult.value);
      setError(null);
    } else {
      setError(errorValueToString(squiggleResult.value));
    }
  };

  React.useEffect(runSquiggleAndUpdateBindings, [expression]);

  return (
    <SquiggleContainer>
      <div>
        <div className="border border-grey-200 p-2 m-4">
          <CodeEditor
            value={expression}
            onChange={setExpression}
            oneLine={true}
            showGutter={false}
            height={20}
          />
        </div>
        {error !== null ? (
          <ErrorAlert heading="Error">{error}</ErrorAlert>
        ) : null}
      </div>
    </SquiggleContainer>
  );
};

export function renderSquigglePartialToDom(props: SquigglePartialProps) {
  let parent = document.createElement("div");
  ReactDOM.render(
    <SquigglePartial
      {...props}
      onChange={(bindings) => {
        // @ts-ignore
        parent.value = bindings;

        parent.dispatchEvent(new CustomEvent("input"));
        if (props.onChange) props.onChange(bindings);
      }}
    />,
    parent
  );
  return parent;
}
