"use client";
import { clsx } from "clsx";
import { FC, ReactElement } from "react";

import {
  CheckIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuHeader,
  XIcon,
} from "@quri/ui";

import { CloseDropdownOnInvariantChange } from "@/components/ui/CloseDropdownOnInvariantChange";
import { RelativeValuesDefinitionFullDTO } from "@/relative-values/data/full";
import { RelativeValuesExportFullDTO } from "@/relative-values/data/fullExport";

import { BuildRelativeValuesCacheAction } from "./BuildRelativeValuesCacheAction";
import { ClearRelativeValuesCacheAction } from "./ClearRelativeValuesCacheAction";

export const CacheMenu: FC<{
  relativeValuesExport: RelativeValuesExportFullDTO;
  definitionRevision: RelativeValuesDefinitionFullDTO["currentRevision"];
  isEditable: boolean;
}> = ({ relativeValuesExport, definitionRevision, isEditable }) => {
  const isEmpty = relativeValuesExport.cache.length === 0;

  const fullyCached =
    !isEmpty &&
    relativeValuesExport.cache.length >=
      definitionRevision.items.length * definitionRevision.items.length;

  const internals = (
    <div
      className={clsx(
        "rounded-xs flex items-center px-2 py-1 text-sm text-gray-500",
        isEditable && "cursor-pointer hover:bg-slate-200"
      )}
    >
      {fullyCached ? (
        <>
          <CheckIcon className="text-gray-600" />
          Cached
        </>
      ) : (
        <>
          <XIcon size={12} className="mr-1" />
          Not Cached
        </>
      )}
    </div>
  );

  const withDropdown = (internals: ReactElement) => (
    <Dropdown
      render={() => {
        return (
          <DropdownMenu>
            <CloseDropdownOnInvariantChange
              invariant={relativeValuesExport.cache.length}
            />
            <DropdownMenuHeader>
              {isEmpty
                ? "Not cached"
                : `${relativeValuesExport.cache.length}/${
                    definitionRevision.items.length *
                    definitionRevision.items.length
                  } pairs cached`}
            </DropdownMenuHeader>
            {!fullyCached && (
              <BuildRelativeValuesCacheAction
                relativeValuesExport={relativeValuesExport}
              />
            )}
            {isEmpty ? null : (
              <ClearRelativeValuesCacheAction
                relativeValuesExport={relativeValuesExport}
              />
            )}
          </DropdownMenu>
        );
      }}
    >
      {internals}
    </Dropdown>
  );

  return isEditable ? withDropdown(internals) : internals;
};
