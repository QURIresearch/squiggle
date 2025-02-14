"use client";
import { clsx } from "clsx";
import { createContext, ReactNode, useCallback, useContext } from "react";
import { FieldPathByValue, FieldValues, useFormContext } from "react-hook-form";
import Select, {
  components,
  type OptionProps,
  type Props as SelectProps,
  type SingleValueProps,
} from "react-select";
import AsyncSelect from "react-select/async";

import { ControlledFormField } from "../common/ControlledFormField.js";
import { FormFieldLayoutProps } from "../common/FormFieldLayout.js";

type Equal<T1, T2> = T1 extends T2 ? (T2 extends T1 ? true : false) : false;

type OptionValueCodec<TValue, TOption> = {
  optionToFieldValue: (option: TOption) => NonNullable<TValue>;
  // Note that null result is allowed. See the comment below on null `selectValue`.
  fieldValueToOption: (value: NonNullable<TValue>) => TOption | null;
};

/* Useful for when form field's value doesn't match the option.
 * For example, since react-select requires options to be objects (not plain strings),
 * `SelectStringFormField` component uses these.
 * We allow these two props to be optional if and only if TOption and TValue have the same shape.
 */
type OptionValueCodecProps<TValue, TOption> =
  Equal<TOption, NonNullable<TValue>> extends true
    ? Partial<OptionValueCodec<TValue, TOption>>
    : OptionValueCodec<TValue, TOption>;

type SelectFormFieldContextShape<TOption> = {
  renderOption?: (option: TOption) => ReactNode;
};

// `createContext` doesn't play well with generic shapes, and I'm not sure how risky a factory function would be, so this is not strongly typed.
const SelectFormFieldContext = createContext<
  SelectFormFieldContextShape<unknown>
>({
  renderOption: undefined,
});

function OptionComponent<TOption extends object>({
  children,
  ...props
}: OptionProps<TOption>) {
  const { renderOption } = useContext(SelectFormFieldContext);
  return (
    <components.Option {...props}>
      {renderOption ? renderOption(props.data) : children}
    </components.Option>
  );
}

function SingleValueComponent<TOption extends object>({
  children,
  ...props
}: SingleValueProps<TOption, false>) {
  const { renderOption } = useContext(SelectFormFieldContext);
  return (
    <components.SingleValue {...props}>
      {renderOption ? renderOption(props.data) : children}
    </components.SingleValue>
  );
}

export function SelectFormField<
  TValues extends FieldValues,
  TValue = never,
  TOption extends object = NonNullable<TValue>,
  TName extends FieldPathByValue<TValues, TValue> = FieldPathByValue<
    TValues,
    TValue
  >,
>({
  name,
  options,
  required = false,
  disabled,
  size = "normal",
  renderOption,
  async = false,
  loadOptions,
  getOptionLabel,
  getOptionValue,
  placeholder,
  optionToFieldValue: maybeOptionToFieldValue,
  fieldValueToOption: maybeFieldValueToOption,
  ...layoutProps
}: FormFieldLayoutProps & {
  name: TName;
  required?: boolean;
  disabled?: boolean;
  // This affects only the outer Control height; resizing options with `renderOption` is your responsibility.
  // See SelectStringFormField for a example.
  size?: "normal" | "small";
  renderOption?: (option: TOption) => ReactNode;
} & (
    | {
        async?: false;
        loadOptions?: undefined;
        options: readonly TOption[];
      }
    | {
        async: true;
        loadOptions: (inputValue: string) => Promise<TOption[]>;
        options?: undefined;
      }
  ) &
  Pick<
    SelectProps<TOption, false>,
    "getOptionLabel" | "getOptionValue" | "placeholder"
  > &
  OptionValueCodecProps<TValue, TOption>) {
  const { resetField } = useFormContext<TValues>();

  const SelectComponent = async ? AsyncSelect : Select;

  const fieldValueToOption = useCallback(
    (value: NonNullable<TValue>): TOption | null => {
      if (value === undefined || value === null) {
        return null;
      }
      return (
        // if fieldValueToOption is not set, TValue == TOption
        maybeFieldValueToOption?.(value) ?? (value as unknown as TOption)
      );
    },
    [maybeFieldValueToOption]
  );

  const optionToFieldValue = useCallback(
    (option: TOption): NonNullable<TValue> => {
      return (
        // if optionToFieldValue is not set, TValue == TOption
        maybeOptionToFieldValue?.(option) ??
        (option as unknown as NonNullable<TValue>)
      );
    },
    [maybeOptionToFieldValue]
  );

  return (
    <SelectFormFieldContext.Provider
      value={{
        renderOption: renderOption as
          | ((option: unknown) => ReactNode)
          | undefined,
      }}
    >
      <ControlledFormField<TValues, TValue, TName>
        name={name}
        rules={{ required }}
        {...layoutProps}
      >
        {({ name, value, onChange }) => {
          /* `selectValue` can be null while `value` is not null.
           * This can happen if `fieldValueToOption` looks for an option in a fixed list, but value is not present there anymore.
           * This is bad: it means that the UI will show that nothing is selected, while the underlying form state still contains a value.
           * It might be useful to call `resetField` in that case, but it's risky since it can lead to an infinite loop.
           */
          const selectValue = fieldValueToOption(value);

          const selectOnChange = (option: TOption | null) => {
            if (option) {
              onChange(optionToFieldValue(option));
            } else {
              resetField(name);
            }
          };

          return (
            <SelectComponent<TOption>
              instanceId={name} // important to avoid hydration errors
              name={name}
              components={{
                Option: OptionComponent,
                SingleValue: SingleValueComponent,
              }}
              value={selectValue}
              onChange={selectOnChange}
              options={options}
              loadOptions={loadOptions}
              defaultOptions={async ? true : undefined}
              placeholder={placeholder}
              isDisabled={disabled}
              isClearable={!required}
              getOptionLabel={getOptionLabel}
              getOptionValue={getOptionValue}
              unstyled
              classNames={{
                // based on StyledInput styles
                control: () =>
                  clsx(
                    size === "small" && "h-8",
                    size === "normal" && "h-10",
                    /* react-select sets min-height even in unstyled mode.
                     * We could get rid of `!` modifier with this:
                     * https://github.com/JedWatson/react-select/blob/2f94e8d228ea32dbd0faa1f7685a67b74c70420f/storybook/stories/ClassNamesWithTailwind.stories.tsx#L19
                     * But it would require @emotion/cache dependency and also I'm unsure about performance implications.
                     */
                    "!min-h-0",
                    "bg-white border-slate-300 border rounded-md shadow-xs focus-within:ring-indigo-500 focus-within:border-indigo-500 focus-within:ring-1"
                  ),
                // disable default browser focus style
                input: () => "[&_input:focus]:!ring-transparent",
                placeholder: () =>
                  clsx("text-slate-300", size === "small" && "text-sm"),
                valueContainer: () => "px-3",
                clearIndicator: () =>
                  "text-slate-300 hover:text-slate-500 px-2",
                loadingIndicator: () =>
                  "text-slate-300 hover:text-slate-500 px-2",
                indicatorSeparator: () => "w-px bg-slate-300 my-2",
                dropdownIndicator: () =>
                  "text-slate-300 hover:text-slate-500 px-2",
                menuPortal: () => "!z-[100]",
                // based on Dropdown styles
                menu: () =>
                  "mt-2 rounded-md bg-white shadow-xl border border-slate-300 overflow-hidden",
                menuList: () => "p-1 overflow-auto",
                option: () =>
                  "px-2 py-1.5 rounded-sm hover:bg-blue-100 text-slate-700 hover:text-slate-900",
                loadingMessage: () => "text-slate-500",
                noOptionsMessage: () => "text-slate-400 p-2",
              }}
              menuPortalTarget={
                typeof document === "undefined" ? undefined : document.body
              }
            />
          );
        }}
      </ControlledFormField>
    </SelectFormFieldContext.Provider>
  );
}
