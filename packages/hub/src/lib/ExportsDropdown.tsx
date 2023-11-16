import React, { FC, useMemo, useState } from "react";
import { PropsWithChildren } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { graphql, useFragment } from "react-relay";

import {
  BarChartIcon,
  BookOpenIcon,
  CalculatorIcon,
  CodeBracketIcon,
  CommentIcon,
  CurlyBracketsIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuHeader,
  HashIcon,
  LineChartIcon,
  ScaleIcon,
  ShareIcon,
  SquareBracketIcon,
  TableCellsIcon,
  TextIcon,
  VariableIcon,
} from "@quri/ui";
import { modelExportRoute, modelForRelativeValuesExportRoute } from "@/routes";
import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";

type ModelExport = {
  title?: string;
  variableName: string;
  variableType: string;
  docstring?: string;
};
type RelativeValuesExport = { slug: string; variableName: string };

const nonRelativeValuesExports = (
  modelExports: ModelExport[],
  relativeValuesExports: RelativeValuesExport[]
) =>
  modelExports.filter(
    (exportItem) =>
      !relativeValuesExports.find(
        ({ variableName: v }) => v === exportItem.variableName
      )
  );

//It's a bit awkward that this here, but it's fairly closely coupled to ExportsDropdown.
export const totalImportLength = (
  modelExports: ModelExport[],
  relativeValuesExports: RelativeValuesExport[]
) =>
  nonRelativeValuesExports(modelExports, relativeValuesExports).length +
  relativeValuesExports.length;

const typeIcon = (type: string) => {
  switch (type) {
    case "Number":
      return HashIcon;
    case "Array":
      return SquareBracketIcon;
    case "Dict":
      return CurlyBracketsIcon;
    case "String":
      return TextIcon;
    case "Lambda":
      return CodeBracketIcon;
    case "TableChart":
      return TableCellsIcon;
    case "Calculator":
      return CalculatorIcon;
    case "Plot":
      return LineChartIcon;
    default:
      return ShareIcon;
  }
};

export const ExportsDropdown: FC<
  PropsWithChildren<{
    modelExports: ModelExport[];
    relativeValuesExports: RelativeValuesExport[];
    owner: string;
    slug: string;
  }>
> = ({ modelExports, relativeValuesExports, owner, slug, children }) => {
  //We remove the relative values exports from the exports list, to not double count them.
  const exports = nonRelativeValuesExports(modelExports, relativeValuesExports);
  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          {exports.length > 0 && (
            <>
              <DropdownMenuHeader>Exports</DropdownMenuHeader>
              {exports.map((exportItem) => (
                <DropdownMenuNextLinkItem
                  key={exportItem.variableName}
                  href={modelExportRoute({
                    owner: owner,
                    slug: slug,
                    variableName: exportItem.variableName,
                  })}
                  title={`${exportItem.title || exportItem.variableName}`}
                  icon={typeIcon(exportItem.variableType)}
                  close={close}
                />
              ))}{" "}
            </>
          )}
          {relativeValuesExports.length > 0 && (
            <>
              <DropdownMenuHeader>Relative Value Functions</DropdownMenuHeader>
              {relativeValuesExports.map((exportItem) => (
                <DropdownMenuNextLinkItem
                  key={exportItem.variableName}
                  href={modelForRelativeValuesExportRoute({
                    owner: owner,
                    slug: slug,
                    variableName: exportItem.variableName,
                  })}
                  title={`${exportItem.variableName}: ${exportItem.slug}`}
                  icon={ScaleIcon}
                  close={close}
                />
              ))}
            </>
          )}
        </DropdownMenu>
      )}
    >
      {children}
    </Dropdown>
  );
};
