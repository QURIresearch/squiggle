import "server-only";

import { prisma } from "@/prisma";

import { getSessionUserOrRedirect } from "../helpers";
import { decodeDbWorkflowToClientWorkflow } from "./storage";

export async function loadWorkflows({
  limit = 20,
}: {
  limit?: number;
} = {}) {
  const sessionUser = await getSessionUserOrRedirect();

  const rows = await prisma.aiWorkflow.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      user: { email: sessionUser.email },
    },
    take: limit + 1,
  });

  const workflows = rows.map((row) => decodeDbWorkflowToClientWorkflow(row));

  return {
    workflows: limit ? workflows.slice(0, limit) : workflows,
    hasMore: limit ? workflows.length > limit : false,
  };
}
