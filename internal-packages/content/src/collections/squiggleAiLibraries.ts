import { defineCollection } from "@content-collections/core";
import { z } from "zod";

const SERVER = "https://squigglehub.org";

// copy-pasted from squiggle/internal-packages/ai/src/scripts/squiggleHubHelpers.ts
export async function fetchCodeFromHub(
  owner: string,
  slug: string
): Promise<string> {
  const data = await fetch(
    `${SERVER}/api/get-source?${new URLSearchParams({
      owner,
      slug,
    })}`
  ).then((res) => res.json());
  const parsed = z.object({ code: z.string() }).safeParse(data);
  if (!parsed.success) {
    throw new Error(`Failed to fetch source for ${owner}/${slug}`);
  }

  return parsed.data.code;
}

export const squiggleAiLibraries = defineCollection({
  name: "squiggleAiLibraries",
  directory: "content/squiggleAiLibraries",
  include: "**/*.yaml",
  parser: "yaml",
  schema: (z) => ({
    owner: z.string(),
    slug: z.string(),
  }),
  transform: async (data) => {
    const code = await fetchCodeFromHub(data.owner, data.slug);
    const importName = `hub:${data.owner}/${data.slug}`;

    return { ...data, importName, code };
  },
});
