import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { WithAuth } from "@/components/WithAuth";
import { loadGroupCard } from "@/groups/data/groupCards";
import {
  hasGroupMembership,
  validateReusableGroupInviteToken,
} from "@/groups/data/helpers";
import { groupRoute } from "@/lib/routes";

import { AcceptGroupInvitePage } from "./AcceptGroupInvitePage";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token: string }>;
};

async function InnerPage({ params, searchParams }: Props) {
  const { slug } = await params;

  const { token: inviteToken } = z
    .object({
      token: z.string(),
    })
    .parse(await searchParams);

  const group = await loadGroupCard(slug);
  if (!group) {
    notFound();
  }
  const isMember = await hasGroupMembership(slug);
  if (isMember) {
    redirect(groupRoute({ slug: group.slug }));
  }

  const isValidToken = await validateReusableGroupInviteToken({
    groupSlug: group.slug,
    inviteToken,
  });

  if (!isValidToken) {
    // FIXME - copy-pasted from ErrorBoudnary
    return (
      <div className="mx-auto mt-4 max-w-2xl rounded-sm bg-red-400 p-4">
        <header className="mb-2 font-bold">Error</header>
        <div className="mb-2">Invalid invite token.</div>
      </div>
    );
  }

  return <AcceptGroupInvitePage group={group} inviteToken={inviteToken} />;
}

export default async function InviteLinkPage(props: Props) {
  return (
    <WithAuth>
      <InnerPage {...props} />
    </WithAuth>
  );
}
