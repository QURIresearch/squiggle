import clsx from "clsx";
import { FC, Fragment, useState } from "react";

import { DropdownButton } from "@/components/ui/DropdownButton";
import { CompassIcon } from "@/relative-values/components/ui/icons/CompassIcon";
import { Item } from "@/relative-values/types";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";

import { ClusterIcon } from "../../common/ClusterIcon";
import { CellBox } from "../CellBox";
import { AxisMenu } from "../GridView/AxisMenu";
import { useFilteredItems, useSortedItems } from "../hooks";
import { RelativeCell } from "../RelativeCell";
import {
  useDefinition,
  useDefinitionClusters,
  useRelativeValuesContext,
} from "../RelativeValuesProvider";
import { ColumnHeader } from "./ColumnHeader";
import { ItemSideBar } from "./sidebar";

type TableProps = {
  model: ModelEvaluator;
  items: Item[];
  showDescriptions: boolean;
  recommendedUnit: Item;
  sidebarItems: [Item, Item] | undefined;
  setSidebarItems: (items: [Item, Item] | undefined) => void;
};

export const ListViewTable: FC<TableProps> = ({
  model,
  items,
  showDescriptions,
  recommendedUnit,
  sidebarItems,
  setSidebarItems,
}) => {
  const { axisConfig } = useRelativeValuesContext();
  const clusters = useDefinitionClusters();

  const uncertaintyPercentiles = model.getParamPercentiles(
    items.map((i) => i.id),
    (r) => r.uncertainty,
    [20, 80]
  );

  const [denominatorItem, setDenominatorItem] = useState(() => {
    return recommendedUnit || items[0];
  });

  const sortedItems = useSortedItems({
    items: items,
    config: axisConfig.rows,
    model: model,
    otherDimensionItems: [denominatorItem],
  });

  const headerRow = (name: string) => (
    <CellBox header>
      <div className="p-1 pt-2 text-sm font-semibold text-slate-600">
        {name}
      </div>
    </CellBox>
  );

  return (
    <div className="mb-10">
      <div className="">
        <div
          className="grid w-full border-b border-r border-gray-200"
          style={{
            gridTemplateColumns: showDescriptions ? "2fr 2fr 1fr" : "3fr 1fr",
          }}
        >
          {headerRow("Name")}
          {showDescriptions && headerRow("Description")}
          <ColumnHeader
            selectedItem={denominatorItem}
            setSelectedItem={setDenominatorItem}
          />
          {sortedItems.map((item) => (
            <Fragment key={item.id}>
              <CellBox>
                <div
                  className="flex cursor-pointer justify-end p-2 text-sm font-bold text-slate-700"
                  onClick={() => setDenominatorItem(item)}
                >
                  <div className="flex-grow text-sm hover:text-slate-900 hover:underline">
                    {item.name}
                  </div>
                  <div
                    onClick={() => setDenominatorItem(item)}
                    className={"cursor-pointer pl-2"}
                  >
                    <CompassIcon
                      className={clsx(
                        "hover:fill-slate-800",
                        item.id === denominatorItem.id
                          ? "fill-slate-500"
                          : "fill-slate-200"
                      )}
                      size={23}
                      viewBox={"0 0 25 25"}
                    />
                  </div>
                </div>

                <div className="flex px-2 pb-3">
                  {item.clusterId !== undefined && item.clusterId !== null ? (
                    <div className="flex items-center gap-1">
                      <div className="flex-none opacity-50">
                        <ClusterIcon
                          cluster={clusters[item.clusterId]}
                          selected={true}
                        />
                      </div>
                      <div className="text-xs font-medium text-slate-400">
                        {clusters[item.clusterId].id}
                      </div>
                    </div>
                  ) : (
                    ""
                  )}
                  <div className="px-3 font-mono text-xs text-slate-400">
                    {item.id}
                  </div>
                </div>
              </CellBox>
              {showDescriptions && (
                <CellBox>
                  <div className="p-3 text-sm text-slate-500">
                    {item.description}
                  </div>
                </CellBox>
              )}
              <div
                className="cursor-pointer"
                onClick={() => {
                  if (!!sidebarItems && sidebarItems[0].id === item.id) {
                    setSidebarItems(undefined);
                  } else {
                    setSidebarItems([item, denominatorItem]);
                  }
                }}
              >
                <RelativeCell
                  id1={item.id}
                  id2={denominatorItem.id}
                  model={model}
                  uncertaintyPercentiles={uncertaintyPercentiles}
                  showRange={true}
                />
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ListView: FC = () => {
  const { evaluator: model } = useRelativeValuesContext();
  const definition = useDefinition();
  const clusters = useDefinitionClusters();

  const showDescriptions = definition.items.some((item) => !!item.description);

  const [sidebarItems, setSidebarItems] = useState<undefined | [Item, Item]>(
    undefined
  );

  const [search, setSearch] = useState("");

  const { axisConfig } = useRelativeValuesContext();

  let itemMatchesString = (item: Item, str: string): boolean => {
    const regexp = new RegExp(search, "i");
    return !!(
      item.name.match(regexp) ||
      item.id.match(regexp) ||
      (item.description && item.description.match(regexp)) ||
      (item.clusterId || "").match(regexp)
    );
  };

  let filteredItems = useFilteredItems({
    items: definition.items,
    config: axisConfig.rows,
  });

  if (search !== "") {
    filteredItems = filteredItems.filter((item) =>
      itemMatchesString(item, search)
    );
  }

  const clusterTable = (clusterId: string) => {
    const clusterItems = filteredItems.filter((i) => i.clusterId === clusterId);
    //It's possible that the recommended unit isn't itself in clusterItems, so we need to make sure it's passed in separately
    const recommendedUnit =
      definition.items.find(
        (item) => item.id === clusters[clusterId].recommendedUnit
      ) || definition.items[0];
    return (
      clusterItems.length > 0 && (
        <ListViewTable
          model={model}
          items={clusterItems}
          showDescriptions={showDescriptions}
          recommendedUnit={recommendedUnit}
          sidebarItems={sidebarItems}
          setSidebarItems={setSidebarItems}
        />
      )
    );
  };

  return (
    <div>
      <div className="mb-2 flex">
        <div className="mr-2">
          <DropdownButton text="Table Settings">
            {() => <AxisMenu axis="rows" sortByAverage={false} />}
          </DropdownButton>
        </div>

        <input
          type="text"
          className="mb-4 rounded-sm border border-gray-200 p-1"
          defaultValue={search}
          placeholder="Filter..."
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      <div className="flex">
        <div className="flex-1">
          {clusters &&
            Object.keys(clusters).map((cluster) => (
              <div key={cluster}>{clusterTable(cluster)}</div>
            ))}
        </div>

        {sidebarItems && (
          <div className="relative w-[500px]">
            <div className="rounded-xs sticky top-4 ml-4 border border-gray-200 bg-slate-50 px-2 py-4">
              <ItemSideBar
                model={model}
                variableName={model.variableName}
                numeratorItem={sidebarItems[0]}
                denominatorItem={sidebarItems[1]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
