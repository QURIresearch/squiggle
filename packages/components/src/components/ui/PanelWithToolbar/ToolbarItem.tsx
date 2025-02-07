"use client";
import { clsx } from "clsx";
import { ComponentType, FC, ReactElement, ReactNode } from "react";

import { TextTooltip } from "@quri/ui";

type Props = {
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
  iconClasses?: string;
  iconSpin?: boolean;
  onClick?: () => void;
  tooltipText?: string;
  className?: string;
};

export const ToolbarItem: FC<Props> = ({
  icon: Icon,
  iconClasses,
  iconSpin,
  className,
  onClick,
  tooltipText,
  children,
}) => {
  const withTooltip = (jsx: ReactElement) => (
    <TextTooltip text={tooltipText || ""} placement="bottom" offset={5}>
      {jsx}
    </TextTooltip>
  );
  const iconSize = children ? "h-3 w-3" : "h-5 w-5";
  const main = (
    <div
      className={clsx(
        "flex h-full cursor-pointer select-none items-center space-x-1 whitespace-nowrap px-4 text-sm text-slate-600 transition hover:bg-slate-200",
        className
      )}
      onClick={onClick}
    >
      {Icon && (
        <Icon
          className={clsx(
            iconSize,
            "shrink-0 text-slate-400",
            iconClasses,
            iconSpin && "animate-spin"
          )}
        />
      )}
      {children && <div className="flex">{children}</div>}
    </div>
  );

  return tooltipText ? withTooltip(main) : main;
};
