import { Item } from "@/types";
import { SqLambda } from "@quri/squiggle-lang";
import { FC, Fragment, useCallback, useMemo } from "react";
import { useDashboardContext } from "../../Dashboard/DashboardProvider";
import { DropdownButton } from "../../ui/DropdownButton";
import { Header } from "../Header";
import { useCachedPairs, useFilteredItems, useSortedItems } from "../hooks";
import { RelativeCell } from "../RelativeCell";
import { useViewContext } from "../ViewProvider";
import { AxisMenu } from "./AxisMenu";
import { GridModeControls } from "./GridModeControls";

export const GridView: FC<{
  fn: SqLambda;
}> = ({ fn }) => {
  const { axisConfig, gridMode } = useViewContext();
  const {
    catalog: { items },
  } = useDashboardContext();

  const allPairs = useCachedPairs(fn, items);

  const filteredRowItems = useFilteredItems({
    items: items,
    config: axisConfig.rows,
  });
  const filteredColumnItems = useFilteredItems({
    items: items,
    config: axisConfig.columns,
  });

  const rowItems = useSortedItems({
    items: filteredRowItems,
    config: axisConfig.rows,
    cache: allPairs,
    otherDimensionItems: filteredColumnItems,
  });
  const columnItems = useSortedItems({
    items: filteredColumnItems,
    config: axisConfig.columns,
    cache: allPairs,
    otherDimensionItems: filteredRowItems,
  });

  const idToPosition = useMemo(() => {
    const result: { [k: string]: number } = {};
    for (let i = 0; i < items.length; i++) {
      result[items[i].id] = i;
    }
    return result;
  }, [items]);

  const isHiddenPair = useCallback(
    (rowItem: Item, columnItem: Item) => {
      if (gridMode === "full") {
        return false;
      }
      return idToPosition[rowItem.id] <= idToPosition[columnItem.id];
    },
    [idToPosition, gridMode]
  );

  return (
    <div>
      <div className="flex gap-8 mb-4 items-center">
        <div className="flex gap-2">
          <DropdownButton text="Rows">
            {() => <AxisMenu axis="rows" />}
          </DropdownButton>
          <DropdownButton text="Columns">
            {() => <AxisMenu axis="columns" />}
          </DropdownButton>
        </div>
        <GridModeControls />
      </div>
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `repeat(${columnItems.length + 1}, 180px)`,
        }}
      >
        <div className="sticky bg-white top-0 left-0 z-20" />
        {columnItems.map((item) => (
          <Header key={item.id} item={item} />
        ))}
        {rowItems.map((rowItem) => (
          <Fragment key={rowItem.id}>
            <Header key={0} item={rowItem} />
            {columnItems.map((columnItem) =>
              isHiddenPair(rowItem, columnItem) ? (
                <div key={columnItem.id} className="bg-gray-200" />
              ) : (
                <RelativeCell
                  key={columnItem.id}
                  id1={rowItem.id}
                  id2={columnItem.id}
                  cache={allPairs}
                />
              )
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
