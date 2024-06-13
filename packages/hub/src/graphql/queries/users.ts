import { Prisma } from "@prisma/client";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { User } from "../types/User";

const UsersQueryInput = builder.inputType("UsersQueryInput", {
  fields: (t) => ({
    usernameContains: t.string(),
  }),
});

builder.queryField("users", (t) =>
  t.prismaConnection({
    type: User,
    cursor: "id",
    args: {
      input: t.arg({ type: UsersQueryInput }),
    },
    resolve: async (query, _, { input }) => {
      const where: Prisma.UserWhereInput = {
        ownerId: { not: null },
      };

      if (input?.usernameContains) {
        where.asOwner = {
          slug: {
            contains: input.usernameContains,
            mode: "insensitive",
          },
        };
      }

      return await prisma.user.findMany({
        ...query,
        where,
      });
    },
  })
);
