import { FC } from "react";
import { FaDiscord, FaGithub, FaRss } from "react-icons/fa";

const linkClasses = "items-center flex hover:text-gray-900";

export const Footer: FC = () => {
  const externalLinkSection = (
    <div className="flex flex-col space-y-2">
      <a
        href="https://github.com/quantified-uncertainty/squiggle"
        className={linkClasses}
      >
        <FaGithub size="1em" className="mr-2" />
        Github
      </a>
      <a href="https://discord.gg/nsTnQTgtG6" className={linkClasses}>
        <FaDiscord size="1em" className="mr-2" />
        Discord
      </a>
      <a href="https://quri.substack.com/t/squiggle" className={linkClasses}>
        <FaRss size="1em" className="mr-2" />
        Newsletter
      </a>
    </div>
  );
  return (
    <div className="bg-gray-100">
      <hr />
      <div className="mx-auto flex max-w-[90rem] justify-center px-8 py-12 text-gray-600 md:justify-start">
        <div className="mx-auto mt-auto flex flex-1">
          <div className="px-3 pb-4">{externalLinkSection}</div>
        </div>
      </div>
    </div>
  );
};
