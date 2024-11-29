import { NextRequest } from "next/server";
import { z } from "zod";

import { loadModelCard } from "@/server/models/data/cards";
import { zSlug } from "@/server/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const { owner, slug } = z
    .object({
      owner: zSlug,
      slug: zSlug,
    })
    .parse(Object.fromEntries(searchParams.entries()));

  const model = await loadModelCard({ owner, slug });
  if (!model?.currentRevision.squiggleSnippet) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const code = model.currentRevision.squiggleSnippet.code;

  return Response.json({
    code,
  });
}
