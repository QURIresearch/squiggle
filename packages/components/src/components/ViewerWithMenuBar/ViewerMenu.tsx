import clsx from "clsx";
import { FC } from "react";

import { SqModuleOutput } from "@quri/squiggle-lang";
import {
  Button,
  CodeBracketIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuHeader,
  PuzzleIcon,
  TriangleIcon,
} from "@quri/ui";

import { SelectableViewerTab, ViewerTab } from "../../lib/utility.js";

const MenuItemTitle: FC<{ title: string; type: string | null }> = ({
  title,
  type,
}) => {
  const isEmpty = type === null;
  return (
    <div className="flex justify-between">
      <span className={clsx(isEmpty && "text-slate-400")}>{title}</span>
      {isEmpty ? (
        <span className="text-slate-300">Empty</span>
      ) : (
        <span className="text-blue-800">{type}</span>
      )}
    </div>
  );
};

function viewerTabTitle(mode: ViewerTab): string {
  if (typeof mode === "object" && mode.tag === "CustomVisibleRootPath") {
    return "Custom Path"; // Not used yet, as header is not shown yet when this mode is used.
  } else {
    return mode as string;
  }
}

type Props = {
  viewerTab: ViewerTab;
  setViewerTab: (viewerTab: ViewerTab) => void;
  outputResult: SqModuleOutput["result"];
  shownTabs: SelectableViewerTab[];
};

export const ViewerMenu: FC<Props> = ({
  viewerTab,
  setViewerTab,
  outputResult,
  shownTabs,
}) => {
  const hasResult = outputResult.ok && outputResult.value.result.tag !== "Void";
  const variablesCount = outputResult.ok
    ? outputResult.value.bindings.size()
    : 0;
  const importsCount = outputResult.ok ? outputResult.value.imports.size() : 0;
  const exportsCount = outputResult.ok ? outputResult.value.exports.size() : 0;

  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          {shownTabs.map((tab) => {
            const getType = () => {
              switch (tab) {
                case "Imports":
                  return importsCount ? `{}${importsCount}` : null;
                case "Variables":
                  return variablesCount ? `{}${variablesCount}` : null;
                case "Exports":
                  return exportsCount ? `{}${exportsCount}` : null;
                case "Result":
                  return hasResult ? "" : null;
                default:
                  return null;
              }
            };
            return (
              tab !== "AST" && (
                <DropdownMenuActionItem
                  key={tab}
                  icon={CodeBracketIcon}
                  title={<MenuItemTitle title={tab} type={getType()} />}
                  onClick={() => {
                    setViewerTab(tab);
                    close();
                  }}
                />
              )
            );
          })}
          <DropdownMenuHeader>Debugging</DropdownMenuHeader>
          <DropdownMenuActionItem
            icon={CodeBracketIcon}
            title={<MenuItemTitle title="AST" type="" />}
            onClick={() => {
              setViewerTab("AST");
              close();
            }}
          />
          <DropdownMenuActionItem
            icon={PuzzleIcon}
            title={<MenuItemTitle title="Dependency Graph" type="" />}
            onClick={() => {
              setViewerTab("Dependency Graph");
              close();
            }}
          />
        </DropdownMenu>
      )}
    >
      <Button size="small">
        <div className="flex items-center space-x-1.5">
          <span>{viewerTabTitle(viewerTab)}</span>
          <TriangleIcon className="rotate-180 text-slate-400" size={10} />
        </div>
      </Button>
    </Dropdown>
  );
};
