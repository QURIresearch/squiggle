import { FC, PropsWithChildren } from "react";

export const Card: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="rounded-sm border border-gray-200 bg-white px-5 py-3 hover:bg-gray-50">
      {children}
    </div>
  );
};
