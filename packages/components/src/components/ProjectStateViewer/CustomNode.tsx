import clsx from "clsx";
import { FC } from "react";
import { Handle, NodeProps, Position } from "reactflow";

import { Tooltip } from "@quri/ui";

import { NodeData } from "./types.js";

export const CustomNode: FC<NodeProps<NodeData>> = ({ data }) => {
  const body = (
    <div
      className={clsx(
        "relative w-40 rounded-sm border border-slate-800 p-2.5 text-xs",
        data.className
      )}
    >
      {data.noTargetHandle || (
        <Handle type="target" position={Position.Top} isConnectable={false} />
      )}
      <div>{data.label}</div>
      {data.noSourceHandle || (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={false}
        />
      )}
    </div>
  );
  const tooltip = data.tooltip;
  if (tooltip) {
    return (
      <Tooltip
        render={() => (
          <div className="max-w-80 rounded-sm border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
            {tooltip()}
          </div>
        )}
      >
        {body}
      </Tooltip>
    );
  } else {
    return body;
  }
};
