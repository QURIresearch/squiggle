"use client";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { clsx } from "clsx";
import {
  createContext,
  FC,
  Fragment,
  PropsWithChildren,
  useContext,
} from "react";

import { IconProps } from "../index.js";

type StyledTabProps = {
  name: string;
  icon?: FC<IconProps>;
};

type StyledTabButtonType = StyledTabProps & {
  isSelected: boolean;
};

type StyledTabTheme = "default" | "primary";

const ThemeContext = createContext<StyledTabTheme>("default");

type ListProps = PropsWithChildren<{
  theme?: StyledTabTheme;
  stretch?: boolean;
}>;

type StyledTabType = FC<StyledTabProps> & {
  TabStyle: string;
  List: FC<ListProps>;
  ListDiv: FC<ListProps>;
  Button: FC<StyledTabButtonType>;
  Group: typeof TabGroup;
  Panels: typeof Tab.Panels;
  Panel: typeof Tab.Panel;
};

const tabStyle =
  "group flex flex-1 rounded-md focus:outline-hidden focus-visible:ring-offset-gray-100 hover:bg-gray-300 mx-px cursor-pointer";

const StyledTabInner: FC<StyledTabButtonType> = ({
  name,
  isSelected,
  icon: Icon,
}) => {
  const theme = useContext(ThemeContext);

  return (
    <span
      className={clsx(
        "flex flex-1 items-center justify-center rounded-md p-1 pl-2.5 pr-2.5 text-sm font-medium",
        isSelected && [
          theme === "default" && "shadow-xs bg-white ring-1 ring-black/5",
          theme === "primary" &&
            "shadow-xs bg-blue-500 text-white ring-1 ring-black/5",
        ]
      )}
    >
      {Icon && (
        <Icon
          className={clsx(
            "-ml-0.5 mr-1.5 h-4 w-4",
            isSelected
              ? [
                  theme === "default" && "text-gray-500",
                  theme === "primary" && "text-white",
                ]
              : "text-gray-400 group-hover:text-gray-600"
          )}
        />
      )}
      <span
        className={clsx(
          isSelected
            ? [
                theme === "default" && "text-gray-900",
                theme === "primary" && "text-white",
              ]
            : "text-gray-600 group-hover:text-gray-900",
          !Icon && "px-1"
        )}
      >
        {name}
      </span>
    </span>
  );
};

//The really annoying thing is that if button isn't in this component, then clicking it won't work.
//So we have to include button here, don't try to move into StyledTabInner
export const StyledTab: StyledTabType = ({ name, icon: Icon }) => (
  <Tab as={Fragment}>
    {({ selected }) => (
      <button className={StyledTab.TabStyle}>
        <StyledTabInner icon={Icon} name={name} isSelected={selected} />
      </button>
    )}
  </Tab>
);

const StyledTabButton: FC<StyledTabButtonType> = (props) => (
  <div className={tabStyle}>
    <StyledTabInner {...props} />
  </div>
);

function tabListStyle(stretch: boolean) {
  return clsx(
    "flex py-0.5 px-0.5 rounded-md bg-gray-100 hover:bg-gray-200",
    stretch ? "w-full" : "w-fit"
  );
}

StyledTab.List = function StyledTabList({
  children,
  theme = "default",
  stretch = false,
}) {
  return (
    <ThemeContext.Provider value={theme}>
      <TabList className={tabListStyle(stretch)}>{children}</TabList>
    </ThemeContext.Provider>
  );
};

StyledTab.ListDiv = function StyledTabListDiv({
  children,
  theme = "default",
  stretch = false,
}) {
  return (
    <ThemeContext.Provider value={theme}>
      <div className={tabListStyle(stretch)}>{children}</div>
    </ThemeContext.Provider>
  );
};

StyledTab.TabStyle = tabStyle;
StyledTab.Group = TabGroup;
StyledTab.Button = StyledTabButton;
StyledTab.Panels = TabPanels;
StyledTab.Panel = TabPanel;
