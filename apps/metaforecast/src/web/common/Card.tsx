import { FC, PropsWithChildren } from "react";

const CardTitle: FC<PropsWithChildren> = ({ children }) => (
  <div className="text-lg font-medium text-gray-800">{children}</div>
);

interface Props {
  highlightOnHover?: boolean;
  large?: boolean;
}

type CardType = FC<PropsWithChildren<Props>> & {
  Title: typeof CardTitle;
};

export const Card: CardType = ({
  children,
  large = false,
  highlightOnHover = true,
}) => (
  <div
    className={`h-full rounded-md bg-white shadow-sm ${
      highlightOnHover ? "hover:bg-gray-100" : ""
    } ${large ? "p-5 sm:p-10" : "px-4 py-3"}`}
  >
    {children}
  </div>
);

Card.Title = CardTitle;
