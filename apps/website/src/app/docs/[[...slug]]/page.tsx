import { MDXContent } from "@content-collections/mdx/react";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FnDocumentationFromName } from "@quri/squiggle-components";

import { source } from "@/app/source";

import { DemoProjectStateViewer } from "../../../components/DemoProjectStateViewer";
import { DocsSquigglePlayground } from "../../../components/DocsSquigglePlayground";
import { SquiggleEditor } from "../../../components/SquiggleEditor";

function docsPathToGitHub(path: string) {
  return {
    owner: "quantified-uncertainty",
    repo: "squiggle",
    sha: "main",
    path: `internal-packages/content/content/docs/${path}`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc}
      editOnGithub={docsPathToGitHub(page.file.path)}
      // lastUpdate={page.data.lastModified}
      // full={page.data.full}
    >
      <DocsTitle>{page.data.title || page.file.name}</DocsTitle>
      {page.data.description && (
        <DocsDescription>{page.data.description}</DocsDescription>
      )}
      <DocsBody>
        <MDXContent
          code={MDX}
          components={{
            /*
             * Default components includes `Callout` but not `Tabs` or `Accordions`.
             * See https://fumadocs.vercel.app/docs/ui/components for the full list of components.
             */
            ...defaultMdxComponents,
            img: (props) => {
              if (props.width) {
                return defaultMdxComponents.img(props);
              }
              // SVG badges in Tooling.md have no width, so we need to render them as img.
              // Fumadocs would automatically upgrade them to next/image.
              return <img {...props} alt={props.alt ?? ""} />;
            },
            // Tooling.md has SVG images that remark-image in the default fumadocs/content-collections configuration can't handle.
            // https://fumadocs.vercel.app/docs/ui/mdx/codeblock#usage
            pre: ({ ref: _ref, ...props }) => (
              <CodeBlock {...props}>
                <Pre>{props.children}</Pre>
              </CodeBlock>
            ),
            FnDocumentationFromName,
            SquiggleEditor,
            SquigglePlayground: DocsSquigglePlayground,
            DemoProjectStateViewer,
            Tabs,
            Tab,
            Accordions,
            Accordion,
          }}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) notFound();

  return {
    title: `${page.data.title} | Squiggle`,
    description: page.data.description,
    openGraph: {
      title: `${page.data.title} | Squiggle`,
      description: page.data.description,
    },
  } satisfies Metadata;
}
