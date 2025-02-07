import { Metadata } from "next";
import { FC } from "react";

import { getGlobalStatistics } from "@/lib/server/globalStatistics";

const StatRow: FC<{ name: string; value: number }> = ({ name, value }) => (
  <tr className="border border-gray-200">
    <td className="p-4 font-bold">{name}</td>
    <td className="p-4">{value}</td>
  </tr>
);

export default async function OuterFrontPage() {
  const stats = await getGlobalStatistics();

  return (
    <table className="mt-8 table-auto bg-white">
      <tbody>
        <StatRow name="Users" value={stats.users} />
        <StatRow name="Models" value={stats.models} />
        <StatRow
          name="Relative Values Definitions"
          value={stats.relativeValuesDefinitions}
        />
      </tbody>
    </table>
  );
}

export const metadata: Metadata = {
  title: "Status",
};

export const dynamic = "force-dynamic";
