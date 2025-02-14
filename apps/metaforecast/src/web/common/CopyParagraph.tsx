import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { Button } from "./Button";

// https://stackoverflow.com/questions/39501289/in-reactjs-how-to-copy-text-to-clipboard

export const CopyParagraph: React.FC<{ text: string; buttonText: string }> = ({
  text,
  buttonText: initialButtonText,
}) => {
  const [buttonText, setButtonText] = useState(initialButtonText);
  const handleButton = () => {
    setButtonText("Copied");
    setTimeout(async () => {
      setButtonText(initialButtonText);
    }, 2000);
  };
  return (
    <div className="flex flex-col items-stretch">
      <p
        className="cursor-pointer rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-700 shadow-sm"
        onClick={(e) => {
          e.preventDefault();
          navigator.clipboard.writeText(text);
        }}
      >
        {text}
      </p>
      <CopyToClipboard text={text} onCopy={handleButton}>
        <Button size="small">{buttonText}</Button>
      </CopyToClipboard>
    </div>
  );
};
