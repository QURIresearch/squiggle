import { FC } from "react";
import { FaRegClipboard } from "react-icons/fa";

export const CopyText: FC<{
  text: string;
  displayText: string;
}> = ({ text, displayText }) => (
  <div
    className="flex cursor-pointer items-center justify-center space-x-3 rounded-sm border border-blue-400 bg-transparent p-4 text-sm font-medium text-blue-400 hover:border-transparent hover:bg-blue-300 hover:text-white"
    onClick={(e) => {
      e.preventDefault();
      navigator.clipboard.writeText(text);
    }}
  >
    <span>{displayText}</span>
    <FaRegClipboard />
  </div>
);
