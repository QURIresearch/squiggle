"use client";
import { HexColorInput, HexColorPicker } from "react-colorful";

import { DropdownMenu } from "../../components/Dropdown/DropdownMenu.js";
import { Dropdown } from "../../components/Dropdown/index.js";

type Props = {
  value: string;
  onChange: (newValue: string) => void;
};

export function StyledColorInput({ value, onChange }: Props) {
  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <div className="flex flex-col items-center p-2" onDoubleClick={close}>
            <HexColorPicker color={value} onChange={onChange} />
            <HexColorInput
              color={value}
              onChange={onChange}
              prefixed
              className="mt-1 w-20 border border-gray-300 bg-slate-100 px-1 py-0 text-sm outline-indigo-500"
            />
          </div>
        </DropdownMenu>
      )}
    >
      <div className="h-10 w-10 rounded-sm border border-slate-200 p-1">
        <div
          style={{ backgroundColor: value }}
          className="h-full w-full rounded-sm"
        />
      </div>
    </Dropdown>
  );
}
