import { FC, Fragment } from "react";

import { StyledTab, StyledTextArea } from "@quri/ui";

import { H2 } from "@/components/ui/Headers";
import { RelativeValuesDefinitionFullDTO } from "@/relative-values/data/full";

import { ClusterInfo } from "./common/ClusterInfo";

type Props = {
  revision: RelativeValuesDefinitionFullDTO["currentRevision"];
};

export const RelativeValuesDefinitionRevision: FC<Props> = ({
  revision: content,
}) => {
  const clusters = Object.fromEntries(
    content.clusters.map((cluster) => [cluster.id, cluster])
  );

  const jsonPart = (
    <StyledTextArea
      defaultValue={JSON.stringify(
        {
          clusters: content.clusters,
          items: content.items,
          recommendedUnit: content.recommendedUnit,
        },
        null,
        2
      )}
      name="json"
      readOnly
    />
  );

  const regular = (
    <>
      <section>
        <H2>Clusters</H2>
        <div
          className="grid gap-x-8 gap-y-2"
          style={{
            gridTemplateColumns: "0fr 1fr",
          }}
        >
          <div>ID</div>
          <div>Recommended unit</div>
          <div className="col-span-2 border-b border-gray-200" />
          {content.clusters.map((cluster) => (
            <Fragment key={cluster.id}>
              <ClusterInfo cluster={cluster} />
              <div className="text-sm">{cluster.recommendedUnit}</div>
            </Fragment>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <H2>Items</H2>
        <div
          className="grid gap-x-8 gap-y-2"
          style={{
            gridTemplateColumns: "1fr 1fr 1fr 2fr",
          }}
        >
          <div>ID</div>
          <div>Name</div>
          <div>Cluster</div>
          <div>Description</div>
          <div className="col-span-4 border-b border-gray-200" />
          {content.items.map((item) => (
            <Fragment key={item.id}>
              <code>{item.id}</code>
              <div>{item.name}</div>
              <div>
                {item.clusterId ? (
                  clusters[item.clusterId] ? (
                    <ClusterInfo cluster={clusters[item.clusterId]} />
                  ) : (
                    <div>UNKNOWN CLUSTER</div>
                  )
                ) : null}
              </div>
              <div>{item.description}</div>
            </Fragment>
          ))}
        </div>
      </section>
    </>
  );

  return (
    <section>
      <div className="mb-4">
        <H2 size="large">{content.title}</H2>
      </div>
      <StyledTab.Group>
        <StyledTab.List>
          <StyledTab name="Tables" />
          <StyledTab name="JSON" />
        </StyledTab.List>
        <div className="mt-4">
          <StyledTab.Panels>
            <StyledTab.Panel>{regular}</StyledTab.Panel>
            <StyledTab.Panel>{jsonPart}</StyledTab.Panel>
          </StyledTab.Panels>
        </div>
      </StyledTab.Group>
    </section>
  );
};
