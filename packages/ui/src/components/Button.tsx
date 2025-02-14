import { clsx } from "clsx";
import { FC, PropsWithChildren } from "react";

type ButtonTheme = "default" | "primary" | "alert";

export type ButtonProps = PropsWithChildren<{
  onClick?: () => void;
  wide?: boolean; // stretch the button horizontally
  theme?: ButtonTheme;
  disabled?: boolean;
  height?: string;
  size?: "small" | "medium";
  // We default to type="button", to avoid form-related bugs.
  // In HTML standard, there's also "reset", but it's rarely useful.
  type?: "submit" | "button";
  // More precise control for the button's layout. Disables padding and flexbox mode.
  noLayout?: boolean;
}>;

// For internal use only, for now (see ButtonWithDropdown).
export const ButtonGroup: FC<PropsWithChildren> = ({ children }) => {
  return <div className="button-group flex items-center">{children}</div>;
};

export const Button: FC<ButtonProps> = ({
  onClick,
  wide,
  theme = "default",
  disabled,
  size = "medium",
  type = "button",
  noLayout = false,
  children,
}) => {
  return (
    <button
      className={clsx(
        "cursor-pointer border text-sm font-medium disabled:cursor-default",
        theme === "primary" && "border-green-900 bg-green-700 text-white",
        theme === "default" && "border-slate-300 bg-slate-100 text-gray-600",
        theme === "alert" && "border-red-600 bg-red-500 text-white",

        disabled
          ? "opacity-60"
          : [
              theme === "primary" &&
                "hover:border-green-800 hover:bg-green-800",
              theme === "default" && "hover:bg-slate-200 hover:text-gray-900",
              theme === "alert" && "hover:bg-red-600",
            ],

        wide && "w-full",
        size === "medium" && "h-8 rounded-md",
        size === "small" && "rounded-xs h-6",
        // This could probably be simplified, but I'm not sure how.
        // Tailwind group-* styles don't allow styling based on parent, only on parent state.
        "[.button-group_&:not(:first-child)]:rounded-l-none",
        "[.button-group_&:not(:first-child)]:border-l-0",
        "[.button-group_&:not(:last-child)]:rounded-r-none"
      )}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {noLayout ? (
        children
      ) : (
        <div
          className={clsx(
            "flex items-center justify-center space-x-1",
            size === "medium" && "px-4",
            size === "small" && "px-3"
          )}
        >
          {children}
        </div>
      )}
    </button>
  );
};
