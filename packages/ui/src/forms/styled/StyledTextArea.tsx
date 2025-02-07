import { clsx } from "clsx";
import { forwardRef } from "react";
import TextareaAutosize, {
  TextareaAutosizeProps,
} from "react-textarea-autosize";

export type StyledTextAreaProps = Omit<
  TextareaAutosizeProps,
  "className" | "style"
>;

export const StyledTextArea = forwardRef<
  HTMLTextAreaElement,
  StyledTextAreaProps
>(function StyledTextArea(props, ref) {
  return (
    <TextareaAutosize
      ref={ref}
      {...props}
      className={clsx(
        "form-input shadow-xs block w-full rounded-md border-slate-300 text-sm placeholder:text-slate-300 focus:border-indigo-500 focus:ring-indigo-500 active:border-indigo-500 active:ring-indigo-500"
        // disabled && "text-slate-400"
      )}
    />
  );
});
