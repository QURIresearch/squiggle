import { notFound } from "next/navigation";
import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";

import { loadModelFull } from "@/models/data/full";

import { EditSquiggleSnippetModel } from "../../../../squiggle/components/EditSquiggleSnippetModel";

type Props = {
  params: Promise<{ owner: string; slug: string }>;
};

async function InnerPage({ params }: Props) {
  const { owner, slug } = await params;

  const model = await loadModelFull({ owner, slug });
  if (!model) {
    notFound();
  }

  const { contentType } = model.currentRevision;
  switch (contentType) {
    case "SquiggleSnippet":
      return (
        <div className="bg-white">
          <EditSquiggleSnippetModel model={model} />
        </div>
      );
    default:
      return <div>Unknown model type {contentType}</div>;
  }
}

const Loading = () => {
  return (
    <div className="flex h-screen">
      <div className="flex-1 border-r border-gray-200 p-1">
        <Skeleton className="h-full" />
      </div>
      <div className="flex-1 p-1">
        <Skeleton className="h-full" />
      </div>
    </div>
  );
};

export default async function Page({ params }: Props) {
  return (
    <div className="bg-white">
      {/* Intentionally not using loading.tsx here, because this route has sub-routes where that doesn't make sense. */}
      <Suspense fallback={<Loading />}>
        <InnerPage params={params} />
      </Suspense>
    </div>
  );
}
