import clsx from "clsx";
import { Element } from "hast";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Node, Parent } from "unist";
import { visitParents } from "unist-util-visit-parents";

import { SqLinker, SqProject } from "@quri/squiggle-lang";

import { SquiggleEditor } from "../components/SquiggleEditor.js";
import { SquigglePlayground } from "../components/SquigglePlayground/index.js";
import { CodeSyntaxHighlighter } from "./CodeSyntaxHighlighter.js";

// Adds `inline` property to `code` elements, to distinguish between inline and block code snippets.
function rehypeInlineCodeProperty() {
  return function (tree: Node) {
    visitParents(tree, "element", function (node: Node, parents: Parent[]) {
      const element = node as Element;
      if (element.tagName === "code") {
        const lastParent = parents[parents.length - 1] as Element;
        if (!element.properties) element.properties = {};
        //It should be a string, because it can't be a boolean.
        element.properties["inline"] = String(
          !(lastParent && lastParent.tagName === "pre")
        );
      }
    });
  };
}

type MarkdownViewerProps = {
  md: string;
  textSize: "sm" | "xs";
  textColor?: "prose-stone" | "prose-slate";
  className?: string;
  backgroundColor?: string;
  linker?: SqLinker;
};

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  md,
  className,
  textColor = "prose-stone",
  textSize,
  backgroundColor = "bg-slate-50",
  linker,
}) => {
  return (
    /*
     * Note: don't try to replace react-markdown with remark-react if you need
     * more flexibility, it doesn't work as of Oct 2024;
     * see https://github.com/remarkjs/react-remark/issues/54.
     */
    <ReactMarkdown
      className={clsx(
        "prose",
        className,
        textColor,
        textSize === "sm" ? "text-sm" : "text-xs"
      )}
      rehypePlugins={[rehypeInlineCodeProperty]}
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children }) => <React.Fragment>{children}</React.Fragment>,
        code({ node, className, children, ...rest }) {
          const isInline =
            node && (node as Element).properties["inline"] === "true";

          if (isInline) {
            return (
              <code
                {...rest}
                className="not-prose border-black/4 bg-black/3 rounded-xs break-words border px-1 py-0.5 font-mono text-[.9em]"
              >
                {children}
              </code>
            );
          }

          const match = /language-(\w+)/.exec(className || "");

          // Turn special code blocks into Squiggle components.
          if (match && match[1] === "squigglePlayground") {
            const numLinesInText = String(children).match(/\n/g)?.length || 0;
            const linesToShow = Math.min(Math.max(numLinesInText, 4), 30);
            const height = 31 + linesToShow * (textSize === "sm" ? 20 : 18);
            return (
              <div className="pb-4 pt-2">
                <SquigglePlayground
                  defaultCode={String(children).replace(/\n$/, "")}
                  height={height}
                  linker={linker}
                />
              </div>
            );
          } else if (match && match[1] === "squiggleEditor") {
            return (
              <div className="pb-4 pt-2">
                <SquiggleEditor
                  project={linker ? new SqProject({ linker }) : undefined}
                  defaultCode={String(children).replace(/\n$/, "")}
                  editorFontSize={textSize === "sm" ? 13 : 12}
                />
              </div>
            );
          }

          return (
            <div
              className={clsx(
                "not-prose my-6 overflow-hidden rounded-sm p-4 text-[10.7px] [&_pre]:!overflow-x-auto",
                backgroundColor
              )}
            >
              <CodeSyntaxHighlighter
                {...rest}
                language={match ? match[1] : "text"}
              >
                {String(children).replace(/\n$/, "")}
              </CodeSyntaxHighlighter>
            </div>
          );
        },
      }}
    >
      {md}
    </ReactMarkdown>
  );
};
