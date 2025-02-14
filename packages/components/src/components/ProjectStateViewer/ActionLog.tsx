import { FC, useEffect, useRef, useState } from "react";

import {
  ProjectAction,
  ProjectEventListener,
  SqProject,
} from "@quri/squiggle-lang";
import { Tooltip } from "@quri/ui";

const ActionDetails: FC<{ action: ProjectAction }> = ({ action }) => {
  switch (action.type) {
    case "loadImports":
      return <div>{action.payload}</div>;
    case "buildOutputIfPossible":
      return <div>{action.payload.hash}</div>;
    case "loadModule":
      return <div>{action.payload.name}</div>;
    default:
      return null;
  }
};

export const ActionLog: FC<{ project: SqProject }> = ({ project }) => {
  const [actionLog, setActionLog] = useState<ProjectAction[]>([]);

  useEffect(() => {
    const listener: ProjectEventListener<"action"> = (event) => {
      setActionLog((log) => [...log, event.data]);
    };
    project.addEventListener("action", listener);
    return () => project.removeEventListener("action", listener);
  });

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo(0, ref.current.scrollHeight);
  }, [actionLog]);

  return (
    <details>
      <summary className="cursor-pointer text-sm font-medium text-slate-700">
        Action log
      </summary>
      <div className="max-h-24 overflow-y-auto p-2 text-xs" ref={ref}>
        {actionLog.map((action, index) => (
          <div key={index} className="flex">
            <div className="cursor-pointer px-1 hover:bg-slate-100">
              <Tooltip
                render={() => (
                  <div className="max-w-64 whitespace-pre-wrap break-all rounded-sm border border-gray-200 bg-white px-2 py-1 text-xs shadow-md">
                    {JSON.stringify(action, null, 2)}
                  </div>
                )}
              >
                <div className="flex gap-1">
                  <div className="text-slate-500">{action.type}</div>
                  <ActionDetails action={action} />
                </div>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
};
