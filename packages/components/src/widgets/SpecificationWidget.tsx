import clsx from "clsx";
import { FC } from "react";

import { SqErrorList, SqSpecification } from "@quri/squiggle-lang";
import { CheckIcon, CubeTransparentIcon, Dropdown, XIcon } from "@quri/ui";

import { SquiggleErrorListAlert } from "../components/ui/SquiggleErrorListAlert.js";
import { SqValueWithContext } from "../lib/utility.js";
import { widgetRegistry } from "./registry.js";

export type SpecificationStatus =
  | { type: "load-error"; error: SqErrorList }
  | { type: "validation-success" }
  | { type: "validation-failure"; error: string };

// Note that this can be slow to run, if ``validate`` is too slow.
function getSpecificationStatus(
  specification: SqSpecification,
  value: SqValueWithContext
): SpecificationStatus {
  const validateValue = specification.validate(value);
  if (!validateValue.ok) {
    return { type: "load-error", error: validateValue.value };
  }
  const possibleErrorMessage =
    validateValue?.ok && validateValue.value.tag === "String"
      ? validateValue.value.value
      : undefined;
  if (possibleErrorMessage) {
    return { type: "validation-failure", error: possibleErrorMessage };
  } else {
    return { type: "validation-success" };
  }
}

const SpecificationDropdownContent: FC<{
  specification: SqSpecification;
  specificationStatus: SpecificationStatus;
}> = ({ specification, specificationStatus }) => {
  const hasError =
    (specificationStatus &&
      specificationStatus.type === "validation-failure") ||
    specificationStatus?.type === "load-error";
  return (
    <div className="px-3 py-2">
      <SpecificationView specification={specification} />
      <div>
        <div className="mb-2 mt-5">
          <div
            className={clsx(
              "rounded-xs inline-flex items-center space-x-2 px-2 py-0.5 text-sm font-medium",
              hasError
                ? "bg-red-100 text-red-900"
                : "bg-green-100 text-green-900"
            )}
          >
            {hasError ? <XIcon size={12} /> : <CheckIcon size={16} />}
            <div>{hasError ? "Checks Failed" : "Checks Passed"}</div>
          </div>
        </div>
        {specificationStatus.type === "load-error" && (
          <div className="text-xs text-red-700">
            <SquiggleErrorListAlert errorList={specificationStatus.error} />
          </div>
        )}
        {specificationStatus.type === "validation-failure" && (
          <div className="text-xs text-red-700">
            {specificationStatus.error}
          </div>
        )}
      </div>
    </div>
  );
};

export const SpecificationDropdown: FC<{ value: SqValueWithContext }> = ({
  value,
}) => {
  const specification = value.tags.specification();
  if (!specification) {
    return null;
  }

  // TODO - memoize
  const specificationStatus = getSpecificationStatus(specification, value);

  return (
    <Dropdown
      render={() => (
        <SpecificationDropdownContent
          specification={specification}
          specificationStatus={specificationStatus}
        />
      )}
    >
      <SpecificationStatusPreview specificationStatus={specificationStatus} />
    </Dropdown>
  );
};

const SpecificationView: FC<{ specification: SqSpecification }> = ({
  specification,
}) => {
  return (
    <div>
      <div className="mb-3 flex items-center space-x-1.5 text-green-800 opacity-80">
        <CubeTransparentIcon className="flex" size={16} />
        <span className="flex text-xs">Specification</span>
      </div>
      <div className="mb-1 font-medium text-green-900">
        {specification.name}
      </div>
      {specification.documentation && (
        <p className="text-sm text-gray-500">{specification.documentation}</p>
      )}
    </div>
  );
};

const SpecificationStatusPreview: FC<{
  specificationStatus: SpecificationStatus;
}> = ({ specificationStatus }) => {
  const hasError =
    specificationStatus.type === "validation-failure" ||
    specificationStatus.type === "load-error";
  return (
    <div
      className={clsx(
        "rounded-xs flex cursor-pointer flex-row items-center space-x-1.5 px-0.5 transition",
        hasError
          ? "bg-red-100 hover:bg-red-300"
          : "bg-green-100 hover:bg-green-300"
      )}
    >
      <CubeTransparentIcon
        size={16}
        className={clsx(
          "opacity-50",
          hasError ? "text-red-900" : "text-green-900"
        )}
      />
      {hasError ? (
        <XIcon size={12} className="text-red-800" />
      ) : (
        <CheckIcon size={16} className="text-green-800" />
      )}
    </div>
  );
};

widgetRegistry.register("Specification", {
  Preview: () => <CubeTransparentIcon className="text-green-700" size={14} />,
  Chart: (value) => (
    <div className="px-2 py-3">
      <SpecificationView specification={value.value} />
    </div>
  ),
});
