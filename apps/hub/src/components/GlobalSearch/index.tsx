"use client";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { FC, useRef } from "react";
import {
  components,
  DropdownIndicatorProps,
  SelectInstance,
} from "react-select";
import AsyncSelect from "react-select/async";

import { SearchIcon, useGlobalShortcut } from "@quri/ui";

import { SearchResultItem, searchResultSchema } from "@/app/api/search/schema";

import { SearchResult } from "./SearchResult";

export type SearchOption =
  | {
      type: "ok";
      item: SearchResultItem;
    }
  | {
      type: "error";
      message: string;
    };

const DropdownIndicator = (props: DropdownIndicatorProps<SearchOption>) => {
  return (
    <components.DropdownIndicator {...props}>
      <SearchIcon />
    </components.DropdownIndicator>
  );
};

export const GlobalSearch: FC = () => {
  const router = useRouter();

  const loadOptions = async (text: string): Promise<SearchOption[]> => {
    try {
      const result = await fetch(
        `/api/search?${new URLSearchParams({ query: text })}`
      ).then((r) => r.json());

      const parsed = searchResultSchema.parse(result);
      return parsed.map((item) => ({
        type: "ok",
        item,
      }));
    } catch (e) {
      return [
        {
          type: "error",
          message: String(e),
        },
      ];
    }
  };

  // https://github.com/JedWatson/react-select/discussions/4669#discussioncomment-1994888
  const ref = useRef<SelectInstance<SearchOption> | null>(null);

  useGlobalShortcut(
    {
      metaKey: true,
      key: "k",
    },
    () => {
      ref.current?.focus();
    }
  );

  return (
    <AsyncSelect<SearchOption>
      ref={ref}
      unstyled
      instanceId="GlobalSearch"
      loadOptions={loadOptions}
      components={{
        Option: SearchResult,
        DropdownIndicator,
      }}
      isOptionDisabled={(option) => option.type === "error"}
      closeMenuOnSelect
      openMenuOnClick={false}
      placeholder="Search..."
      getOptionValue={(option) =>
        option.type === "error" ? "error" : option.item.id
      }
      getOptionLabel={(option) =>
        option.type === "error" ? "error" : option.item.id
      }
      onKeyDown={(event) => {
        event.key === "Escape" && ref.current?.blur();
      }}
      onChange={(option) => {
        if (option?.type === "ok") {
          router.push(option.item.link);
        }
      }}
      controlShouldRenderValue={false}
      classNames={{
        // copy-pasted and simplified from SelectFormField
        control: () =>
          "min-w-[16em] max-w-[12em] !min-h-0 h-8 cursor-pointer bg-slate-900  transition-colors border-slate-900 border rounded-md shadow-xs focus-within:ring-indigo-500 focus-within:ring-1",
        // disable default browser focus style
        input: () => "[&_input:focus]:!ring-transparent text-white",
        placeholder: () => "text-slate-400 text-sm font-light",
        valueContainer: () => "px-3",
        clearIndicator: () => "text-slate-300 hover:text-slate-500 px-2",
        loadingIndicator: () => "text-slate-300 hover:text-slate-500 px-2",
        indicatorSeparator: () => "hidden",
        dropdownIndicator: () => "text-slate-300 hover:text-slate-500 px-2",
        menuPortal: () => "!z-[100]",
        // based on Dropdown styles
        menu: () =>
          "mt-2 min-w-[26em] rounded-md bg-white shadow-xl border border-slate-300 overflow-hidden",
        menuList: () => "p-1 overflow-auto",
        option: ({ isDisabled, isFocused }) =>
          clsx(
            "px-3 py-1.5 rounded-sm text-white",
            isFocused && "bg-blue-100",
            !isDisabled && "rounded-sm hover:bg-blue-100 hover:text-slate-100"
          ),
        loadingMessage: () => "text-slate-500",
        noOptionsMessage: () => "text-slate-400 p-2",
      }}
    />
  );
};
