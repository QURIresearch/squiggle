import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/solid/esm/index.js";
import { clsx } from "clsx";
import { Children, ComponentProps, FC, ReactElement, ReactNode } from "react";

export const Alert: FC<{
  heading: string;
  backgroundColor: string;
  headingColor: string;
  bodyColor: string;
  icon: (props: ComponentProps<"svg">) => ReactElement;
  iconColor: string;
  children?: ReactNode;
}> = ({
  heading = "Error",
  backgroundColor,
  headingColor,
  bodyColor,
  icon: Icon,
  iconColor,
  children,
}) => {
  return (
    <div
      className={clsx("rounded-xs px-2 py-1.5", backgroundColor)}
      role="status"
    >
      <div className="flex">
        <Icon
          className={clsx("ml-1 mt-1 h-4 w-4 shrink-0", iconColor)}
          aria-hidden="true"
        />
        <div className="ml-3 grow">
          <header className={clsx("text-sm font-medium", headingColor)}>
            {heading}
          </header>
          {children && Children.count(children) ? (
            <div className={clsx("mt-1 text-sm", bodyColor)}>{children}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const ErrorAlert: FC<{
  heading: string;
  children?: ReactNode;
}> = (props) => (
  <Alert
    {...props}
    backgroundColor="bg-red-50"
    headingColor="text-red-900"
    bodyColor="text-slate-700"
    icon={XCircleIcon}
    iconColor="text-red-400"
  />
);

export const MessageAlert: FC<{
  heading: string;
  children?: ReactNode;
}> = (props) => (
  <Alert
    {...props}
    backgroundColor="bg-slate-50"
    headingColor="text-slate-700"
    bodyColor="text-slate-600"
    icon={InformationCircleIcon}
    iconColor="text-slate-400"
  />
);

export const SuccessAlert: FC<{
  heading: string;
  children?: ReactNode;
}> = (props) => (
  <Alert
    {...props}
    backgroundColor="bg-green-50"
    headingColor="text-green-800"
    bodyColor="text-green-700"
    icon={CheckCircleIcon}
    iconColor="text-green-400"
  />
);
