import { FC } from "react";

export const ClusterIcon: FC<{
  cluster: { color: string };
  selected?: boolean;
}> = ({ cluster, selected = true }) => {
  return (
    <div
      className="rounded-xs h-2 w-2"
      style={
        selected
          ? { backgroundColor: cluster.color }
          : { border: `1px solid ${cluster.color}` }
      }
    />
  );
};
