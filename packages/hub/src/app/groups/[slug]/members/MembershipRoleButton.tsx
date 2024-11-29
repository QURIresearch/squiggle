import { FC } from "react";

import { Button, Dropdown, DropdownMenu } from "@quri/ui";

import { GroupMemberDTO } from "@/server/groups/data/members";

import { SetMembershipRoleAction } from "./SetMembershipRoleAction";

import { MembershipRole } from "@/__generated__/MembershipRoleButton_Membership.graphql";

type Props = {
  groupSlug: string;
  membership: GroupMemberDTO;
  update: (membership: GroupMemberDTO) => void;
};

export const MembershipRoleButton: FC<Props> = ({
  membership,
  groupSlug,
  update,
}) => {
  return (
    <Dropdown
      render={() => (
        <DropdownMenu>
          {(["Admin", "Member"] satisfies MembershipRole[]).map((role) => (
            <SetMembershipRoleAction
              key={role}
              membership={membership}
              groupSlug={groupSlug}
              role={role}
              update={update}
            />
          ))}
        </DropdownMenu>
      )}
    >
      <Button>{membership.role}</Button>
    </Dropdown>
  );
};
