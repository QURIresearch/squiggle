import { FC, PropsWithChildren } from "react";

import {
  SqCompileError,
  SqError,
  SqFrame,
  SqLocation,
  SqRuntimeError,
} from "@quri/squiggle-lang";

import { useViewerContext } from "../SquiggleViewer/ViewerProvider.js";
import { ErrorAlert } from "./Alert.js";

type Props = {
  error: SqError;
};

const LocationLine: FC<{ location: SqLocation }> = ({ location }) => {
  const { externalViewerActions } = useViewerContext();

  const text = `line ${location.start.line}, column ${location.start.column}`;

  return externalViewerActions.show ? (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        externalViewerActions.show?.(location, true);
      }}
      className="text-blue-500 hover:underline"
    >
      {text}
    </a>
  ) : (
    <span>{text}</span>
  );
};

const WithHeader: FC<PropsWithChildren<{ header: string }>> = ({
  header,
  children,
}) => (
  <div>
    <div className="mb-1 text-sm font-medium text-gray-700">{header}</div>
    <div className="ml-1">{children}</div>
  </div>
);

const StackTraceFrame: FC<{ frame: SqFrame }> = ({ frame }) => {
  const location = frame.location();
  const name = frame.name();
  return (
    <>
      <div className="truncate font-mono font-medium text-gray-500">{name}</div>
      <div>{location && <LocationLine location={location} />}</div>
    </>
  );
};

const StackTrace: FC<{ error: SqRuntimeError }> = ({ error }) => {
  const frames = error.getFrameArray();
  return frames.length ? (
    <WithHeader header="Stack Trace">
      <div className="grid grid-cols-[minmax(60px,max-content),1fr] gap-x-4">
        {frames.map((frame, i) => (
          <StackTraceFrame frame={frame} key={i} />
        ))}
      </div>
    </WithHeader>
  ) : null;
};

export const SquiggleErrorAlert: FC<Props> = ({ error }) => {
  function errorName(): string {
    if (error instanceof SqCompileError) {
      return "Compile Error";
    } else if (error instanceof SqRuntimeError) {
      return "Runtime Error";
    } else {
      return "Error";
    }
  }
  return (
    <ErrorAlert heading={errorName()}>
      <div className="space-y-4">
        <div className="whitespace-pre-wrap">{error.toString()}</div>
        {error instanceof SqRuntimeError ? (
          <StackTrace error={error} />
        ) : error instanceof SqCompileError ? (
          <WithHeader header="Location:">
            <LocationLine location={error.location()} />
          </WithHeader>
        ) : null}
      </div>
    </ErrorAlert>
  );
};
