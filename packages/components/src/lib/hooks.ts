import {
  bindings,
  environment,
  jsImports,
  run,
  runPartial,
} from "@quri/squiggle-lang";
import { useEffect, useMemo, useState } from "react";

type SquiggleArgs<T extends ReturnType<typeof run | typeof runPartial>> = {
  code: string;
  bindings?: bindings;
  jsImports?: jsImports;
  environment?: environment;
  onChange?: (expr: Extract<T, { tag: "Ok" }>["value"] | undefined) => void;
};

const useSquiggleAny = <T extends ReturnType<typeof run | typeof runPartial>>(
  args: SquiggleArgs<T>,
  f: (...args: Parameters<typeof run>) => T
) => {
  const result: T = useMemo<T>(
    () => f(args.code, args.bindings, args.environment, args.jsImports),
    [f, args.code, args.bindings, args.environment, args.jsImports]
  );

  const { onChange } = args;

  useEffect(() => {
    onChange?.(result.tag === "Ok" ? result.value : undefined);
  }, [result, onChange]);

  return result;
};

export const useSquigglePartial = (
  args: SquiggleArgs<ReturnType<typeof runPartial>>
) => {
  return useSquiggleAny(args, runPartial);
};

export const useSquiggle = (args: SquiggleArgs<ReturnType<typeof run>>) => {
  return useSquiggleAny(args, run);
};

type ControlledValueArgs<T> = {
  value?: T;
  defaultValue: T;
  onChange?: (x: T) => void;
};
export function useMaybeControlledValue<T>(
  args: ControlledValueArgs<T>
): [T, (x: T) => void] {
  let [uncontrolledValue, setUncontrolledValue] = useState(args.defaultValue);
  let value = args.value ?? uncontrolledValue;
  let onChange = (newValue: T) => {
    if (args.value === undefined) {
      // uncontrolled mode
      setUncontrolledValue(newValue);
    }
    args.onChange?.(newValue);
  };
  return [value, onChange];
}
