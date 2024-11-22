import { PropsWithChildren } from "react";

import { LockIcon } from "@quri/ui";

import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { H1 } from "@/components/ui/Headers";
import { isRootEmail } from "@/graphql/helpers/userHelpers";
import { getServerSession } from "@/server/helpers";

export default async function AdminLayout({ children }: PropsWithChildren) {
  const session = await getServerSession();

  const email = session?.user.email;

  if (!email || !isRootEmail(email)) {
    return <NarrowPageLayout>Access denied.</NarrowPageLayout>;
  }

  return (
    <div>
      <div className="bg-red-200 p-4">
        <H1>
          <div className="flex items-center gap-1">
            <LockIcon />
            <span>Admin console</span>
          </div>
        </H1>
      </div>
      <FullLayoutWithPadding>{children}</FullLayoutWithPadding>
    </div>
  );
}
