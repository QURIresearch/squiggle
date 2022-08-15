import * as React from "react";
import {
  Distribution,
  result,
  distributionError,
  distributionErrorToString,
} from "@quri/squiggle-lang";
import { Vega } from "react-vega";
import { ErrorAlert } from "./Alert";
import { useSize } from "react-use";

import {
  buildVegaSpec,
  DistributionChartSpecOptions,
} from "../lib/distributionSpecBuilder";
import { NumberShower } from "./NumberShower";
import { hasMassBelowZero } from "../lib/distributionUtils";

export type DistributionPlottingSettings = {
  /** Whether to show a summary of means, stdev, percentiles etc */
  showSummary: boolean;
  actions?: boolean;
} & DistributionChartSpecOptions;

export type DistributionChartProps = {
  distribution: Distribution;
  width?: number;
  height: number;
} & DistributionPlottingSettings;

export const DistributionChart: React.FC<DistributionChartProps> = (props) => {
  const {
    distribution,
    height,
    showSummary,
    width,
    logX,
    actions = false,
  } = props;
  const shape = distribution.pointSet();
  const [sized] = useSize((size) => {
    if (shape.tag === "Error") {
      return (
        <ErrorAlert heading="Distribution Error">
          {distributionErrorToString(shape.value)}
        </ErrorAlert>
      );
    }

    const spec = buildVegaSpec(props);

    let widthProp = width ? width : size.width;
    if (widthProp < 20) {
      console.warn(
        `Width of Distribution is set to ${widthProp}, which is too small`
      );
      widthProp = 20;
    }

    return (
      <div style={{ width: widthProp }}>
        {logX && hasMassBelowZero(shape.value) ? (
          <ErrorAlert heading="Log Domain Error">
            Cannot graph distribution with negative values on logarithmic scale.
          </ErrorAlert>
        ) : (
          <Vega
            spec={spec}
            data={{ con: shape.value.continuous, dis: shape.value.discrete }}
            width={widthProp - 10}
            height={height}
            actions={actions}
          />
        )}
        <div className="flex justify-center">
          {showSummary && <SummaryTable distribution={distribution} />}
        </div>
      </div>
    );
  });
  return sized;
};

const TableHeadCell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <th className="border border-slate-200 bg-slate-50 py-1 px-2 text-slate-500 font-semibold">
    {children}
  </th>
);

const Cell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="border border-slate-200 py-1 px-2 text-slate-900">
    {children}
  </td>
);

type SummaryTableProps = {
  distribution: Distribution;
};

const SummaryTable: React.FC<SummaryTableProps> = ({ distribution }) => {
  const mean = distribution.mean();
  const stdev = distribution.stdev();
  const p5 = distribution.inv(0.05);
  const p10 = distribution.inv(0.1);
  const p25 = distribution.inv(0.25);
  const p50 = distribution.inv(0.5);
  const p75 = distribution.inv(0.75);
  const p90 = distribution.inv(0.9);
  const p95 = distribution.inv(0.95);

  const hasResult = (x: result<number, distributionError>): boolean =>
    x.tag === "Ok";

  const unwrapResult = (
    x: result<number, distributionError>
  ): React.ReactNode => {
    if (x.tag === "Ok") {
      return <NumberShower number={x.value} />;
    } else {
      return (
        <ErrorAlert heading="Distribution Error">
          {distributionErrorToString(x.value)}
        </ErrorAlert>
      );
    }
  };

  return (
    <table className="border border-collapse border-slate-400">
      <thead className="bg-slate-50">
        <tr>
          <TableHeadCell>{"Mean"}</TableHeadCell>
          {hasResult(stdev) && <TableHeadCell>{"Stdev"}</TableHeadCell>}
          <TableHeadCell>{"5%"}</TableHeadCell>
          <TableHeadCell>{"10%"}</TableHeadCell>
          <TableHeadCell>{"25%"}</TableHeadCell>
          <TableHeadCell>{"50%"}</TableHeadCell>
          <TableHeadCell>{"75%"}</TableHeadCell>
          <TableHeadCell>{"90%"}</TableHeadCell>
          <TableHeadCell>{"95%"}</TableHeadCell>
        </tr>
      </thead>
      <tbody>
        <tr>
          <Cell>{unwrapResult(mean)}</Cell>
          {hasResult(stdev) && <Cell>{unwrapResult(stdev)}</Cell>}
          <Cell>{unwrapResult(p5)}</Cell>
          <Cell>{unwrapResult(p10)}</Cell>
          <Cell>{unwrapResult(p25)}</Cell>
          <Cell>{unwrapResult(p50)}</Cell>
          <Cell>{unwrapResult(p75)}</Cell>
          <Cell>{unwrapResult(p90)}</Cell>
          <Cell>{unwrapResult(p95)}</Cell>
        </tr>
      </tbody>
    </table>
  );
};
