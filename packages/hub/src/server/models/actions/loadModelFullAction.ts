"use server";
import { z } from "zod";

import { makeServerAction, zSlug } from "@/server/utils";

import { loadModelFull, ModelFullDTO } from "../data/full";

// Data-fetching action, used in /admin/upgrade-versions.
// Don't use this for loading models; server actions are discouraged for data fetching.
export const loadModelFullAction = makeServerAction(
  z.object({
    owner: zSlug,
    slug: zSlug,
  }),
  async ({ owner, slug }): Promise<ModelFullDTO | null> => {
    return loadModelFull({ owner, slug });
  }
);
