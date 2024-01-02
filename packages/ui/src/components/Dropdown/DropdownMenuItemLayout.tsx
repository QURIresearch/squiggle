import { clsx } from "clsx";
import { FC, ReactNode } from "react";

import { IconProps } from "../../icons/Icon.js";
import { RefreshIcon } from "../../icons/RefreshIcon.js";

export type ItemLayoutProps = {
  icon?: FC<IconProps>;
  title: string | ReactNode; // if title is JSX, you should consider text color in normal and hovered state
  acting?: boolean;
};

const iconDisplay = (icon?: FC<IconProps>, acting?: boolean) => {
  if (!icon) return null;
  const Icon = acting ? RefreshIcon : icon;
  return (
    <Icon
      size={14}
      className={clsx(
        "text-slate-400 group-hover:text-slate-900",
        acting && "animate-spin"
      )}
    />
  );
};

export const DropdownMenuItemLayout: FC<ItemLayoutProps> = ({
  title,
  icon,
  acting,
}) => {
  return (
    <div className="m-1 rounded px-2 py-1.5 flex items-center gap-2 group hover:bg-blue-100 transition-colors duration-75 cursor-pointer">
      {iconDisplay(icon, acting)}
      <div className="text-slate-700 group-hover:text-slate-900 text-sm font-medium flex-1">
        {title}
      </div>
    </div>
  );
};
