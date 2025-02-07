import { clsx } from "clsx";
import { FC, PropsWithChildren } from "react";

import {
  FnDefinition,
  type FnDocumentation as FnDocumentationType,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

import { SQUIGGLE_DOCS_URL } from "../../lib/constants.js";
import { MarkdownViewer } from "../../lib/MarkdownViewer.js";
import { SquiggleEditor } from "../SquiggleEditor.js";

type Size = "small" | "normal";

const Section: FC<PropsWithChildren> = ({ children }) => (
  <div className={clsx("py-2")}>{children}</div>
);

//I'm not sure if this is worth it here. Much of the input data is hidden from us at this point. It might be better to just go back to strings, or to formally parse it after having it as a string.
const StyleDefinition: FC<{ fullName: string; def: FnDefinition }> = ({
  fullName,
  def,
}) => {
  const primaryColor = "text-slate-900";
  const secondaryColor = "text-slate-400";
  const inputs = def.signature.inputs.map((t, index) => (
    <span key={index}>
      <span className={primaryColor}>{t.type.toString()}</span>
      {t.optional ? <span className={primaryColor}>?</span> : ""}
      {index !== def.signature.inputs.length - 1 && (
        <span className={secondaryColor}>, </span>
      )}
    </span>
  ));
  const output = def.signature.output.toString();
  return (
    <div>
      <span className="text-slate-500">{fullName}</span>
      <span className={secondaryColor}>(</span>
      <span className={clsx(primaryColor, "ml-0.5 mr-0.5")}>{inputs}</span>
      <span className={secondaryColor}>)</span>
      {output ? (
        <>
          <span className={secondaryColor}>{" => "}</span>{" "}
          <span className={primaryColor}>{output}</span>
        </>
      ) : (
        ""
      )}
    </div>
  );
};

export const FnDocumentation: FC<{
  documentation: FnDocumentationType;
  showNameAndDescription?: boolean;
  size?: Size;
}> = ({ documentation, showNameAndDescription = true, size = "small" }) => {
  const {
    name,
    nameSpace,
    requiresNamespace,
    isUnit,
    shorthand,
    isExperimental,
    description,
    definitions,
    examples,
    versionAdded,
  } = documentation;
  const textSize = size === "small" ? "text-xs" : "text-sm";
  const fullName = `${nameSpace ? nameSpace + "." : ""}${name}`;
  const tagCss = clsx(
    "font-medium py-0.5 rounded-sm",
    textSize,
    size === "small" ? "px-1.5" : "px-2.5"
  );

  return (
    <>
      {showNameAndDescription && (
        <Section>
          <div className="flex flex-nowrap items-end justify-between gap-2 py-0.5">
            <a
              href={`${SQUIGGLE_DOCS_URL}/${nameSpace}#${name}`}
              target="_blank"
              rel="noreferrer"
              className={clsx(
                "leading-none text-blue-500 hover:underline",
                size === "small" ? "text-sm" : "text-md"
              )}
            >
              {fullName}
            </a>
            <div
              className={clsx("italic leading-none text-slate-500", textSize)}
            >
              Stdlib
            </div>
          </div>
        </Section>
      )}
      {(isUnit ||
        shorthand ||
        isExperimental ||
        !requiresNamespace ||
        versionAdded) && (
        <Section>
          <div className="flex gap-3">
            {isUnit && (
              <div className={clsx("bg-yellow-100 text-yellow-800", tagCss)}>
                Unit
              </div>
            )}
            {shorthand && (
              <div className={clsx("bg-orange-100 text-gray-500", tagCss)}>
                {`${shorthand.type}:  `}
                <span className="ml-2 font-mono text-orange-800">
                  {shorthand.symbol}
                </span>
              </div>
            )}
            {isExperimental && (
              <div className={clsx("bg-red-100 text-red-800", tagCss)}>
                Experimental
              </div>
            )}
            {!requiresNamespace && (
              <div className={clsx("bg-purple-50 text-slate-600", tagCss)}>
                {`Namespace optional`}
              </div>
            )}
            {versionAdded && (
              <div className={clsx("bg-purple-50 text-slate-600", tagCss)}>
                v{versionAdded}
              </div>
            )}
          </div>
        </Section>
      )}

      {description && showNameAndDescription ? (
        <Section>
          <MarkdownViewer
            md={description}
            textColor="prose-slate"
            textSize={size === "small" ? "xs" : "sm"}
          />
        </Section>
      ) : null}
      {definitions ? (
        <Section>
          <header className={clsx("mb-2 font-medium text-slate-600", textSize)}>
            Signatures
          </header>
          <div
            className={clsx(
              "space-y-2 rounded-md bg-slate-100 p-2 font-mono text-slate-600",
              textSize
            )}
          >
            {definitions
              .filter((def) => !def.deprecated)
              .map((def, id) => (
                <StyleDefinition fullName={fullName} def={def} key={id} />
              ))}
          </div>
        </Section>
      ) : null}
      {examples?.length ? (
        <Section>
          <header className={clsx("mb-2 font-medium text-slate-600", textSize)}>
            Examples
          </header>

          {examples &&
            examples.map(({ text, isInteractive }, i) =>
              isInteractive ? (
                <div className="pb-4 pt-2" key={i}>
                  <SquiggleEditor
                    defaultCode={text}
                    editorFontSize={size === "small" ? 12 : 13}
                    chartHeight={size === "small" ? 30 : 40}
                  />
                </div>
              ) : (
                <MarkdownViewer
                  backgroundColor="bg-slate-100"
                  className="max-width-[200px]"
                  key={i}
                  md={`\`\`\`squiggle\n${text}\n\`\`\``}
                  textSize="sm"
                />
              )
            )}
        </Section>
      ) : null}
    </>
  );
};

//Fails silently
export const FnDocumentationFromName: FC<{
  functionName: string;
  showNameAndDescription?: boolean;
  size?: Size;
}> = ({ functionName, showNameAndDescription = true, size }) => {
  const docs = getFunctionDocumentation(functionName);
  return docs ? (
    <FnDocumentation
      documentation={docs}
      showNameAndDescription={showNameAndDescription}
      size={size}
    />
  ) : null;
};
