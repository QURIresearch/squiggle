import { FC, useState } from "react";

import { Dropdown } from "@quri/ui";

import { Item } from "@/relative-values/types";

import { CellBox } from "../CellBox";
import { Header } from "../Header";
import { useDefinition } from "../RelativeValuesProvider";

const ColumnHeaderContextMenu: FC<{
  setSelectedItem(item: Item): void;
}> = ({ setSelectedItem }) => {
  const { items } = useDefinition();

  const [search, setSearch] = useState("");

  return (
    <div className="w-96 px-4 py-4">
      <input
        type="text"
        className="mb-4 w-full rounded-sm border border-gray-200 p-1"
        defaultValue={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      <div className="max-h-96 overflow-auto">
        <div className="flex flex-col gap-1">
          {items
            .filter((item) => item.name.match(new RegExp(search, "i")))
            .map((item) => (
              <div
                key={item.id}
                className="cursor-pointer rounded-sm p-1 text-xs hover:bg-gray-100"
                onClick={() => setSelectedItem(item)}
              >
                {item.name}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export const ColumnHeader: FC<{
  selectedItem: Item;
  setSelectedItem(item: Item): void;
}> = ({ selectedItem, setSelectedItem }) => {
  return (
    <div className="sticky left-0 top-0 z-10 grid h-full place-items-stretch">
      <Dropdown
        render={({ close }) => (
          <ColumnHeaderContextMenu
            setSelectedItem={(item) => {
              setSelectedItem(item);
              close();
            }}
          />
        )}
        fullHeight
      >
        <CellBox header clickable>
          <div className="pl-1 pt-1 text-sm text-slate-600">
            Estimated value, in terms of
          </div>
          <Header item={selectedItem} />
        </CellBox>
      </Dropdown>
    </div>
  );
};
