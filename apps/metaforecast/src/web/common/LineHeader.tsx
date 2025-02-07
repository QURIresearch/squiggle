import { FC, PropsWithChildren } from "react";

export const LineHeader: FC<PropsWithChildren> = ({ children }) => (
  <h3 className="flex w-full items-center justify-center">
    <span
      aria-hidden="true"
      className="h-0.5 flex-grow rounded-sm bg-gray-300"
    />
    <span className="text-md mx-3 text-center font-medium">{children}</span>
    <span
      aria-hidden="true"
      className="h-0.5 flex-grow rounded-sm bg-gray-300"
    />
  </h3>
);
