import { QuestionWithHistoryFragment } from "../../fragments.generated";
import { HistoryChart } from "./HistoryChart";

type Props = {
  question: QuestionWithHistoryFragment;
};

export const QuestionChartOrVisualization: React.FC<Props> = ({ question }) =>
  question.platform.id === "guesstimate" && question.visualization ? (
    <a className="no-underline" href={question.url} target="_blank">
      <img
        className="rounded-xs"
        src={question.visualization}
        alt="Guesstimate Screenshot"
      />
    </a>
  ) : question.options.length > 0 ? (
    <HistoryChart question={question} />
  ) : null; /* Don't display chart if there are no options, for now. */
