"use client";
import { FC, useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { ClipboardCopyIcon, TextTooltip, useToast } from "@quri/ui";

import { H2 } from "@/components/ui/Headers";
import { SafeActionButton } from "@/components/ui/SafeActionButton";
import { createReusableGroupInviteTokenAction } from "@/groups/actions/createReusableGroupInviteTokenAction";
import { deleteReusableGroupInviteTokenAction } from "@/groups/actions/deleteReusableGroupInviteTokenAction";
import { groupInviteLink } from "@/lib/routes";

type Props = {
  groupSlug: string;
  reusableInviteToken: string | null;
};

export const GroupReusableInviteSection: FC<Props> = ({
  groupSlug,
  reusableInviteToken,
}) => {
  const toast = useToast();

  // Necessary for SSR and to avoid hydration errors
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const inviteLink = useMemo(() => {
    if (!reusableInviteToken) {
      return undefined;
    }
    const routeArgs = {
      groupSlug: groupSlug,
      inviteToken: reusableInviteToken,
    };
    const fullLink = groupInviteLink(routeArgs);
    const blurredLink = groupInviteLink({ ...routeArgs, blur: true });

    return {
      full: `${origin}${fullLink}`,
      blurred: `${origin}${blurredLink}`,
    };
  }, [reusableInviteToken, groupSlug, origin]);

  const copy = () => {
    if (!inviteLink) {
      return;
    }
    navigator.clipboard.writeText(inviteLink.full);
    toast("Copied to clipboard", "confirmation");
  };

  return (
    <div>
      <H2>Invite link</H2>
      {inviteLink ? (
        origin ? (
          <TextTooltip text="Click to copy">
            <div
              onClick={copy}
              className="group flex cursor-pointer items-center gap-1 rounded-sm bg-white p-2 shadow-sm hover:bg-slate-200"
            >
              <ClipboardCopyIcon
                size={24}
                className="text-slate-400 group-hover:text-slate-500"
              />
              <code className="text-xs">{inviteLink.blurred}</code>
            </div>
          </TextTooltip>
        ) : (
          <Skeleton height={36} />
        )
      ) : null}
      <div className="mt-4 flex gap-2">
        <SafeActionButton
          action={createReusableGroupInviteTokenAction}
          input={{ slug: groupSlug }}
        >
          {reusableInviteToken ? "Reset Invite Link" : "Create Invite Link"}
        </SafeActionButton>
        {reusableInviteToken ? (
          <SafeActionButton
            action={deleteReusableGroupInviteTokenAction}
            input={{ slug: groupSlug }}
          >
            Delete Invite Link
          </SafeActionButton>
        ) : null}
      </div>
    </div>
  );
};
