import { clsx } from "clsx";
import { forwardRef, InputHTMLAttributes } from "react";

export function getInputClassName(
  size: "small" | "normal",
  inputWidth: `w-${number}` | "w-full" = "w-full"
) {
  return clsx(
    "form-input block rounded-md border-slate-300 text-sm shadow-xs placeholder:text-slate-300 focus:border-indigo-500 focus:ring-indigo-500 active:border-indigo-500 active:ring-indigo-500 disabled:text-slate-400",
    size === "normal" ? "h-10" : "h-8",
    inputWidth
  );
}

type Size = "small" | "normal";

export type StyledInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type" | "size"
> & {
  size?: Size;
};

export const StyledInput = forwardRef<HTMLInputElement, StyledInputProps>(
  function StyledInput({ size = "normal", ...props }, ref) {
    return (
      <input
        ref={ref}
        type="text" // type="number" should never be used, it's broken in various browsers.
        {...props}
        className={getInputClassName(size)}
      />
    );
  }
);
