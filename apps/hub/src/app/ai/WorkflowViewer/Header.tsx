import { FC, ReactNode } from "react";

import { ClientWorkflow } from "@quri/squiggle-ai";

import { ArtifactList } from "./ArtifactList";

// Common header for all workflow states
export const Header: FC<{
  renderLeft: () => ReactNode;
  renderRight: () => ReactNode;
  workflow: ClientWorkflow;
}> = ({ renderLeft, renderRight, workflow }) => {
  return (
    <div className="flex items-center justify-between rounded-sm bg-gray-100 p-2">
      <div className="flex items-center gap-3">
        <ArtifactList artifacts={workflow.inputs} />
        {renderLeft()}
      </div>
      <div className="flex gap-2">{renderRight()}</div>
    </div>
  );
};
