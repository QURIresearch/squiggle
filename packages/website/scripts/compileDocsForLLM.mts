#!/usr/bin/env node
import fs from "fs";
import { glob } from "glob";

import { FnDocumentation } from "@quri/squiggle-lang";

import { modulePages } from "../templates.mjs";
import { generateModuleContent } from "./generateModuleContent.mjs";

const readFile = (fileName: string) => {
  return fs.readFileSync(fileName, "utf-8");
};

function moduleItemToJson({
  name,
  description,
  nameSpace,
  requiresNamespace,
  examples,
  signatures,
  shorthand,
  isUnit,
}: FnDocumentation) {
  return JSON.stringify(
    {
      name,
      description,
      nameSpace,
      requiresNamespace,
      examples,
      signatures,
      shorthand,
      isUnit,
    },
    null,
    2
  );
}

function moduleItemToCompressedFormat({
  name,
  description,
  nameSpace,
  signatures,
  shorthand,
  examples,
}: FnDocumentation): string {
  // Function signature line
  const sigLine = `${nameSpace ? nameSpace + "." : ""}${name}${shorthand ? " " + shorthand.symbol : ""}: ${signatures.join(", ")}`;

  // Description
  const descLine = description ? `\n${description}` : "";

  // Examples
  let exampleLines = "";
  if (examples && Array.isArray(examples) && examples.length > 0) {
    exampleLines = "\n" + examples.map((e) => e.text).join("\n");
  }

  return `${sigLine}${descLine}${exampleLines}\n`;
}

function convertSquiggleEditorTags(input: string): string {
  // Replace opening tags and everything up to the closing />
  let result = input.replace(
    /<SquiggleEditor[\s\S]*?defaultCode=\{`([\s\S]*?)`\}\s*\/>/g,
    (match, codeContent) => {
      return "```squiggle\n" + codeContent.trim() + "\n```";
    }
  );

  return result;
}

function removeHeaderLines(content: string): string {
  // Split the content into lines
  const lines = content.split("\n");

  // Find the index of the first title (line starting with '#')
  const firstTitleIndex = lines.findIndex((line) =>
    line.trim().startsWith("#")
  );

  // If a title is found, remove everything before it
  if (firstTitleIndex !== -1) {
    return lines.slice(firstTitleIndex).join("\n");
  }

  // If no title is found, return the original content
  return content;
}

const allDocumentationItems = () => {
  return modulePages
    .map((page) => generateModuleContent(page, moduleItemToCompressedFormat))
    .join("\n\n\n");
};

const promptPageRaw = readFile("./public/llms/prompt.txt");
const documentationBundlePage = async () => {
  const targetFilename = "./public/llms/documentationBundle.txt";

  const header = `# Squiggle Documentation, One Page
This file is auto-generated from the documentation files in the Squiggle repository. It includes our Peggy Grammar. It is meant to be given to an LLM. It is not meant to be read by humans.
--- \n\n
`;

  const getGrammarContent = async () => {
    const grammarFiles = await glob("../squiggle-lang/src/**/*.peggy");
    return readFile(grammarFiles[0]);
  };

  const getGuideContent = async () => {
    const documentationFiles = await glob("./src/pages/docs/Guides/*.{md,mdx}");
    return Promise.all(
      documentationFiles.map(async (filePath) => {
        const content = readFile(filePath);
        const withoutHeaders = removeHeaderLines(content);
        const convertedContent = convertSquiggleEditorTags(withoutHeaders);
        return convertedContent;
      })
    ).then((contents) => contents.join("\n\n\n"));
  };

  console.log("Compiling documentation bundle page...");
  const grammarContent = await getGrammarContent();
  const guideContent = await getGuideContent();
  const apiContent = allDocumentationItems();
  // const content = guideContent;
  const content =
    header +
    promptPageRaw +
    `## Peggy Grammar \n\n ${grammarContent} \n\n --- \n\n ` +
    convertSquiggleEditorTags(guideContent) +
    apiContent;
  fs.writeFile(targetFilename, content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Content written to ${targetFilename}`);
  });
};

const promptPage = async () => {
  console.log("Compiling prompt page...");
  const introduction = `---
description: LLM Prompt Example
notes: "This Doc is generated using a script, do not edit directly!"
---

# LLM Prompt Example

The following is a prompt that we use to help LLMs, like GPT and Claude, write Squiggle code. This would ideally be provided with the full documentation, for example with [this document](/llms/documentationBundle.txt). 

You can read this document in plaintext [here](/llms/prompt.txt).

---

`;
  const target = "./src/pages/docs/Ecosystem/LLMPrompt.md";
  fs.writeFile(
    target,
    introduction + promptPageRaw.replace(/\`squiggle/g, "`js"),
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(`Content written to ${target}`);
    }
  );
};

async function main() {
  await documentationBundlePage();
  await promptPage();
}

main();
