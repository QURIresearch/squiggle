import { FC, PropsWithChildren } from "react";

import { QuestionFragment } from "../../fragments.generated";
import {
  formatIndicatorValue,
  qualityIndicatorLabels,
  UsedIndicatorName,
} from "./QuestionCard/QuestionFooter";
import { Stars } from "./Stars";

interface Props {
  question: QuestionFragment;
}

const TableRow: FC<PropsWithChildren<{ title: string }>> = ({
  title,
  children,
}) => (
  <tr className="border-b border-gray-200">
    <th
      scope="row"
      className="whitespace-nowrap px-6 py-4 font-medium text-gray-900"
    >
      {title}
    </th>
    <td className="px-6 py-4">{children}</td>
  </tr>
);

export const IndicatorsTable: React.FC<Props> = ({ question }) => (
  <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
    <table className="w-full text-left text-sm text-gray-500">
      <thead className="bg-gray-100 text-xs uppercase text-gray-700">
        <tr>
          <th scope="col" className="px-6 py-3">
            Indicator
          </th>
          <th scope="col" className="px-6 py-3">
            Value
          </th>
        </tr>
      </thead>
      <tbody>
        <TableRow title="Stars">
          <Stars num={question.qualityIndicators.stars} />
        </TableRow>
        <TableRow title="Platform">{question.platform.label}</TableRow>
        {question.qualityIndicators.numForecasts ? (
          <TableRow title="Number of forecasts">
            {question.qualityIndicators.numForecasts}
          </TableRow>
        ) : null}
        {Object.keys(question.qualityIndicators)
          .filter(
            (indicator): indicator is UsedIndicatorName =>
              (question.qualityIndicators as any)[indicator] != null &&
              indicator in qualityIndicatorLabels
          )
          .map((indicator) => {
            return (
              <TableRow
                title={qualityIndicatorLabels[indicator]}
                key={indicator}
              >
                {formatIndicatorValue(
                  Number(question.qualityIndicators[indicator]), // must be non-null due to former check
                  indicator,
                  question.platform.id
                )}
              </TableRow>
            );
          })}
      </tbody>
    </table>
  </div>
);
