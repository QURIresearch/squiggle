import { Meta } from "@content-collections/core";
import { TransformOptions } from "@fumadocs/content-collections/configuration";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import squiggleGrammar from "@quri/squiggle-textmate-grammar/dist/squiggle.tmLanguage.json" with { type: "json" };

export const mdxOptions: TransformOptions = {
  // https://fumadocs.vercel.app/docs/ui/math#add-plugins
  remarkPlugins: [remarkMath],
  rehypeCodeOptions: {
    langs: [
      "javascript",
      "typescript",
      "tsx",
      {
        name: "squiggle",
        ...squiggleGrammar,
      },
    ],
    themes: {
      light: "github-light",
    },
  },
  rehypePlugins: (v) => [rehypeKatex, ...v],
};

export function docTitleFromMeta(meta: Meta) {
  return meta.fileName.replace(/\.mdx?/, "").replace("-", " ");
}
