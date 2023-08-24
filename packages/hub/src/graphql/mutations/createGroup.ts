import { prisma } from "@/prisma";
import { builder } from "../builder";
import { Group } from "../types/Group";

builder.mutationField("createGroup", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("CreateGroupResult", {
      fields: (t) => ({
        group: t.field({
          type: Group,
          nullable: false,
        }),
      }),
    }),
    errors: {},
    input: {
      slug: t.input.string({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email: session.user.email },
      });

      const group = await prisma.group.create({
        data: {
          slug: input.slug,
          memberships: {
            create: [{ userId: user.id, role: "Admin" }],
          },
        },
      });

      return { group };
    },
  })
);
