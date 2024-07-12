import clsx from "clsx";
import { usePathname } from "next/navigation";
import { FC, ReactNode } from "react";

import { IconProps } from "@quri/ui";

import { Link } from "./Link";

type TabDivProps = {
  name: string;
  count?: number;
  icon?: FC<IconProps>;
  selected?: (pathname: string) => boolean;
};

type TabLinkProps = {
  name: string;
  href: string;
  count?: number;
  icon?: FC<IconProps>;
  selected?: (pathname: string, href: string) => boolean;
};

const tabInnerSection = (
  name: string,
  Icon?: FC<IconProps>,
  count?: number
) => (
  <div className="flex items-center rounded-md px-3 py-1.5 group-hover:bg-white">
    {Icon && <Icon className="mr-2 opacity-60" size={16} />}
    {name}
    {count && (
      <span className="ml-2 rounded-full bg-gray-300 px-2 py-0.5 text-center text-xs text-gray-700">
        {count}
      </span>
    )}
  </div>
);

const outerClass = (isSelected: boolean | undefined) =>
  clsx(
    "flex whitespace-nowrap py-2 px-1 text-sm items-center border-b-2 group cursor-pointer",
    isSelected
      ? "border-blue-700 text-gray-900"
      : "text-gray-600 border-transparent"
  );

const TabLink: FC<TabLinkProps> = ({
  name,
  href,
  icon: Icon,
  selected,
  count,
}) => {
  const pathname = usePathname();
  const isSelected = selected ? selected(pathname, href) : pathname === href;

  return (
    <Link href={href} className={outerClass(isSelected)}>
      {tabInnerSection(name, Icon, count)}
    </Link>
  );
};

const TabDiv: FC<TabDivProps> = ({ name, icon: Icon, selected, count }) => {
  const pathname = usePathname();
  const isSelected = selected ? selected(pathname) : false;

  return (
    <div className={outerClass(isSelected)}>
      {tabInnerSection(name, Icon, count)}
    </div>
  );
};

const TabList: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="-mb-px flex">{children}</div>
);

export const EntityTab = {
  Link: TabLink,
  Div: TabDiv,
  List: TabList,
};
