import clsx from "clsx";
import { useSession } from "next-auth/react";
import { FC } from "react";

import { TextTooltip, UserIcon } from "@quri/ui";

import { AiWorkflow } from "@/ai/data/loadWorkflows";

import { WorkflowName } from "./WorkflowName";
import { WorkflowStatusIcon } from "./WorkflowStatusIcon";

export const WorkflowSummaryItem: FC<{
  workflow: AiWorkflow;
  onSelect: () => void;
  isSelected: boolean;
  isLast?: boolean;
}> = ({ workflow, onSelect, isSelected, isLast }) => {
  const session = useSession();

  return (
    <div
      className={clsx(
        "w-full border-b border-gray-200 p-2 text-sm",
        isSelected ? "bg-gray-100" : "cursor-pointer hover:bg-slate-50",
        isLast && "border-b-0"
      )}
      onClick={isSelected ? undefined : onSelect}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="shrink-0">
            <WorkflowStatusIcon workflow={workflow.workflow} />
          </div>
          <div className="truncate font-medium">
            <WorkflowName workflow={workflow.workflow} />
          </div>
        </div>
        {session.data?.user?.username &&
          session.data?.user?.username !== workflow.author.username && (
            <TextTooltip text={workflow.author.username}>
              <div className="text-xs text-gray-500">
                <UserIcon className="h-4 w-4 text-gray-500" />
              </div>
            </TextTooltip>
          )}
      </div>
    </div>
  );
};
