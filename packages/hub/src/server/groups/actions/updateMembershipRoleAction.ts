"use server";

import { MembershipRole } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/prisma";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction, zSlug } from "@/server/utils";

import { groupHasAdminsBesidesUser } from "../data/helpers";
import {
  GroupMemberDTO,
  loadMembership,
  loadMyMembership,
  membershipSelect,
  membershipToDTO,
} from "../data/members";

export const updateMembershipRoleAction = makeServerAction(
  z.object({
    group: zSlug,
    user: zSlug,
    role: z.enum(Object.keys(MembershipRole) as [keyof typeof MembershipRole]),
  }),
  async (input): Promise<GroupMemberDTO> => {
    const session = await getSessionOrRedirect();
    // somewhat repetitive compared to `deleteMembership`, but with slightly different error messages

    const myMembership = await loadMyMembership({
      groupSlug: input.group,
    });

    if (!myMembership) {
      throw new Error("You're not a member of this group");
    }

    if (input.user !== session.user.username && myMembership.role !== "Admin") {
      throw new Error("Only admins can update other members roles");
    }

    const membershipToUpdate = await loadMembership({
      groupSlug: input.group,
      userSlug: input.user,
    });

    if (!membershipToUpdate) {
      throw new Error(`${input.user} is not a member of ${input.group}`);
    }

    if (membershipToUpdate.role === input.role) {
      return membershipToUpdate; // nothing to do
    }

    if (
      !(await groupHasAdminsBesidesUser({
        groupSlug: input.group,
        userSlug: input.user,
      }))
    ) {
      throw new Error(
        `Can't change the role, ${input.user} is the last admin of ${input.group}`
      );
    }

    const updatedMembership = await prisma.userGroupMembership.update({
      where: { id: membershipToUpdate.id },
      data: { role: input.role },
      select: membershipSelect,
    });

    return membershipToDTO(updatedMembership);
  }
);
