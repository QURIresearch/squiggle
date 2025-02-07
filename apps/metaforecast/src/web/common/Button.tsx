import { FC } from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "small" | "normal";
}

export const Button: FC<Props> = ({ children, size = "normal", ...rest }) => {
  const padding = size === "normal" ? "px-5 py-4" : "px-3 py-2";
  return (
    <button
      {...rest}
      className={`cursor-pointer rounded-md bg-blue-500 text-white shadow-sm hover:bg-blue-600 active:bg-gray-700 ${padding}`}
    >
      {children}
    </button>
  );
};
