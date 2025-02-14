import clsx from "clsx";
import React, { FC, PropsWithChildren } from "react";

import { LockIcon } from "@quri/ui";

import { EntityNode } from "./EntityInfo";
import { Link } from "./ui/Link";

export type { EntityNode };

export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

export const entityCardBadgeCss = (presentAsLink: boolean) => {
  return clsx(
    "flex items-center",
    presentAsLink &&
      "cursor-pointer hover:text-gray-900 hover:underline select-none"
  );
};

export const EntityCardBadge: FC<
  PropsWithChildren<{ presentAsLink: boolean }>
> = ({ presentAsLink, children }) => (
  <div className={entityCardBadgeCss(presentAsLink)}>{children}</div>
);

export const PrivateBadge: FC = () => (
  <EntityCardBadge presentAsLink={false}>
    <LockIcon className="mr-1" size={10} />
    Private
  </EntityCardBadge>
);

export const UpdatedStatus: FC<{ time: number }> = ({ time }) => (
  <EntityCardBadge presentAsLink={false}>
    <span className="mr-1">{"Updated"}</span>
    <time dateTime={new Date(time).toISOString()}>
      {formatDate(new Date(time))}
    </time>
  </EntityCardBadge>
);

export const keepFirstNLines = (str: string, n: number) =>
  str.split("\n").slice(0, n).join("\n");

const InterspersedMenuItems: React.FC<{
  items: React.ReactNode[];
  interspercedItem: React.ReactNode;
}> = ({ items, interspercedItem }) => {
  const filteredItems = items.filter(Boolean);
  const interspersedItems = filteredItems.reduce(
    (result: React.ReactNode[], item, index) => {
      result.push(item);
      if (index < filteredItems.length - 1) {
        result.push(<div key={index}>{interspercedItem}</div>);
      }
      return result;
    },
    [] as React.ReactNode[]
  );

  return <>{interspersedItems}</>;
};

export const InterspersedMenuItemsWithDots: React.FC<{
  items: React.ReactNode[];
}> = ({ items }) => (
  <InterspersedMenuItems
    items={items}
    interspercedItem={<span className="text-gray-400">{"\u00B7"}</span>}
  />
);

type Props = PropsWithChildren<{
  href: string;
  showOwner: boolean;
  ownerName?: string;
  slug: string;
  menuItems?: React.ReactElement;
}>;

export const EntityCard: FC<Props> = ({
  href,
  showOwner,
  ownerName,
  slug,
  children,
  menuItems,
}) => {
  return (
    <div className="rounded-sm border border-gray-200 py-2 hover:bg-gray-50">
      <div className="flex h-full flex-col">
        <div className="mb-1 px-5">
          <Link
            className="mb-1 font-medium text-gray-900 hover:underline"
            href={href}
          >
            {showOwner ? ownerName + "/" : ""}
            {slug}
          </Link>
        </div>
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-2 px-5 text-xs text-gray-500">
          {menuItems}
        </div>
        {children && (
          <div className={"mt-3 flex-grow px-5 pb-3"}>{children}</div>
        )}
      </div>
    </div>
  );
};
