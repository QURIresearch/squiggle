"use client";
import { useFragment, useLazyLoadQuery } from "react-relay";

import { RelativeValuesDefinitionPage$key } from "@/__generated__/RelativeValuesDefinitionPage.graphql";
import { Header } from "@/components/ui/Header";
import { StyledLink } from "@/components/ui/StyledLink";
import { RelativeValuesDefinitionRevision } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { modelForRelativeValuesExportRoute } from "@/routes";
import { RelativeValuesDefinitionPageQuery as RelativeValuesDefinitionPageQueryType } from "@gen/RelativeValuesDefinitionPageQuery.graphql";
import {
  RelativeValuesDefinitionPageFragment,
  RelativeValuesDefinitionPageQuery,
} from "./RelativeValuesDefinitionPage";

export default function OuterDefinitionPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  // should be de-duped by Next.js caches, so it's not a problem that we do this query twice
  const data = useLazyLoadQuery<RelativeValuesDefinitionPageQueryType>(
    RelativeValuesDefinitionPageQuery,
    {
      input: { ownerUsername: params.username, slug: params.slug },
    },
    { fetchPolicy: "store-and-network" }
  );

  const definition = useFragment<RelativeValuesDefinitionPage$key>(
    RelativeValuesDefinitionPageFragment,
    data.relativeValuesDefinition
  );

  return (
    <div className="mx-auto max-w-6xl mt-4">
      <div>
        {definition.modelExports.length ? (
          <section className="mb-4">
            <Header>Models that implement this definition</Header>
            <div>
              {definition.modelExports.map((row) => (
                <StyledLink
                  key={row.id}
                  href={modelForRelativeValuesExportRoute({
                    username: row.modelRevision.model.owner.username,
                    slug: row.modelRevision.model.slug,
                    variableName: row.variableName,
                  })}
                >
                  {row.modelRevision.model.owner.username}/
                  {row.modelRevision.model.slug}
                </StyledLink>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <RelativeValuesDefinitionRevision dataRef={definition.currentRevision} />
    </div>
  );
}
