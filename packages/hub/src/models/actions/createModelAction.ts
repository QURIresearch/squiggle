"use server";

import { returnValidationErrors } from "next-safe-action";
import { redirect } from "next/navigation";
import { z } from "zod";

import { generateSeed } from "@quri/squiggle-lang";
import { defaultSquiggleVersion } from "@quri/versioned-squiggle-components";

import { modelRoute } from "@/lib/routes";
import { prisma } from "@/lib/server/prisma";
import { actionClient } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";
import { getWriteableOwner } from "@/owners/data/auth";
import { indexModelId } from "@/search/helpers";
import { getSelf, getSessionOrRedirect } from "@/users/auth";

const defaultCode = `/*
Describe your code here
*/

a = normal(2, 5)
`;

const schema = z.object({
  groupSlug: zSlug.optional(),
  slug: zSlug.optional(),
  isPrivate: z.boolean(),
});

// This action is tightly coupled with the form in NewModel.tsx.
// In particular, it uses the default code, and redirects to the newly created model.
export const createModelAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: input }) => {
    try {
      const slug = input.slug;
      if (!slug) {
        returnValidationErrors(schema, {
          slug: {
            _errors: ["Slug is required"],
          },
        });
      }

      const session = await getSessionOrRedirect();

      const seed = generateSeed();
      const version = defaultSquiggleVersion;
      const code = defaultCode;

      const model = await prisma.$transaction(async (tx) => {
        const owner = await getWriteableOwner(session, input.groupSlug);

        // nested create is not possible here;
        // similar problem is described here: https://github.com/prisma/prisma/discussions/14937,
        // seems to be caused by multiple Model -> ModelRevision relations
        let model: { id: string };
        try {
          model = await tx.model.create({
            data: {
              slug,
              ownerId: owner.id,
              isPrivate: input.isPrivate,
            },
            select: { id: true },
          });
        } catch {
          returnValidationErrors(schema, {
            slug: {
              _errors: [`Model ${input.slug} already exists on this account`],
            },
          });
        }

        const self = await getSelf(session);

        const revision = await tx.modelRevision.create({
          data: {
            squiggleSnippet: {
              create: {
                code,
                version,
                seed,
              },
            },
            author: {
              connect: { id: self.id },
            },
            contentType: "SquiggleSnippet",
            model: {
              connect: {
                id: model.id,
              },
            },
          },
        });

        return await tx.model.update({
          where: {
            id: model.id,
          },
          data: {
            currentRevisionId: revision.id,
          },
          select: {
            id: true,
            slug: true,
            owner: {
              select: {
                slug: true,
              },
            },
          },
        });
      });

      await indexModelId(model.id);

      redirect(
        modelRoute({
          owner: model.owner.slug,
          slug: model.slug,
        })
      );

      return { model };
    } catch (e) {
      console.log("action error", e instanceof Error && e.message);
      throw e;
    }
  });
