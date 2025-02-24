import { createMDXSource } from "@fumadocs/content-collections";
import { loader } from "fumadocs-core/source";

import { allApiDocs, allDocs, allMetas } from "@quri/content";

function injectStringAfter(list: string[], target: string, str: string) {
  const index = list.indexOf(target);
  if (index === -1) {
    throw new Error(`String ${target} not found in list`);
  }
  return [...list.slice(0, index + 1), str, ...list.slice(index + 1)];
}

const mdxSource = createMDXSource(
  [
    ...allDocs,
    ...allApiDocs.map((doc) => ({
      ...doc,
      _meta: {
        ...doc._meta,
        filePath: `Api/${doc._meta.filePath}`,
        directory: "Api",
        path: `Api/${doc._meta.path}`,
      },
    })),
  ],
  [
    ...allMetas.map((doc) =>
      doc._meta.directory === "."
        ? {
            ...doc,
            pages: injectStringAfter(doc.pages ?? [], "Guides", "Api"),
          }
        : doc
    ),
    {
      title: "API",
      pages: allApiDocs.map((doc) => doc.title),
      _meta: {
        filePath: "Api/meta.json",
        fileName: "meta.json",
        directory: "Api",
        extension: "json",
        path: "Api/meta",
      },
    },
  ]
);

export const source = loader({
  baseUrl: "/docs",
  source: mdxSource,
});
