import clsx from "clsx";
import { FC, ReactNode } from "react";

import { ClientArtifact } from "@quri/squiggle-ai";
import { CodeBracketIcon, CommentIcon, Tooltip } from "@quri/ui";

type ArtifactKind = "source" | "prompt" | "code";
type ArtifactIconSize = number;

function getArtifactColor(artifact: ClientArtifact): string {
  if (artifact.kind === "code" && !artifact.ok) {
    return "bg-red-300";
  }
  const ARTIFACT_COLORS: Record<ArtifactKind, string> = {
    source: "bg-blue-400",
    prompt: "bg-slate-400",
    code: "bg-emerald-400",
  };
  return ARTIFACT_COLORS[artifact.kind] || ARTIFACT_COLORS.prompt;
}

function getArtifactIcon(kind: ArtifactKind, size: number): ReactNode {
  switch (kind) {
    case "source":
    case "code":
      return <CodeBracketIcon size={size} />;
    case "prompt":
      return <CommentIcon size={size} />;
    default:
      return null;
  }
}

export const ArtifactIcon: FC<{
  artifact: ClientArtifact;
  size: ArtifactIconSize;
}> = ({ artifact, size }) => {
  const bgColor = getArtifactColor(artifact);

  return (
    <div className={clsx("rounded-full p-0.5 text-white", bgColor)}>
      {getArtifactIcon(artifact.kind, size)}
    </div>
  );
};

export const ArtifactDisplay: FC<{
  name: string;
  artifact: ClientArtifact;
  size: ArtifactIconSize;
  showArtifactName?: boolean;
}> = ({ name, artifact, size, showArtifactName = false }) => {
  const isCodeOrSource = artifact.kind === "source" || artifact.kind === "code";

  return (
    <Tooltip
      render={() => (
        <div className="max-h-80 max-w-md overflow-y-auto rounded-sm border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
          <div className="mb-2 text-lg font-bold text-slate-700">{name}</div>
          {isCodeOrSource ? (
            <pre className="whitespace-pre-wrap">{artifact.value}</pre>
          ) : (
            <div>{artifact.value}</div>
          )}
        </div>
      )}
    >
      <div
        className={clsx(
          "flex cursor-pointer items-center",
          showArtifactName && "gap-1 rounded-full bg-slate-100 px-1 py-0.5"
        )}
      >
        <ArtifactIcon artifact={artifact} size={size} />
        {showArtifactName && (
          <span className="text-sm text-slate-700">{name}</span>
        )}
      </div>
    </Tooltip>
  );
};
