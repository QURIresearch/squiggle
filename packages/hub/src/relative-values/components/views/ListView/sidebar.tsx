import { fromByteArray } from "base64-js";
import { deflate } from "pako";
import { FC, Fragment } from "react";

import { NumberShower, SquiggleChart } from "@quri/squiggle-components";

import { Item } from "@/relative-values/types";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";

function codeToPlaygroundUrl(code: string) {
  const text = JSON.stringify({ initialSquiggleString: code });
  const HASH_PREFIX = "https://www.squiggle-language.com/playground#code=";
  const compressed = deflate(text, { level: 9 });
  return HASH_PREFIX + encodeURIComponent(fromByteArray(compressed));
}

interface TableRowProps {
  label: string;
  number: number;
}

const TableRow: React.FC<TableRowProps> = ({ label, number }) => (
  <Fragment key={label}>
    <div className="text-slate-400 py-1 mt-1 font-normal text-left text-xs col-span-1">
      {label}
    </div>
    <div className="py-1 pl-2 text-left text-slate-600 text-md col-span-2">
      <NumberShower number={number} precision={2} />
    </div>
  </Fragment>
);

let buildurl = (
  model: ModelEvaluator,
  numeratorItem: Item,
  denominatorItem: Item,
  variableName: string
) => {
  const toVarName = (id: string) => id.replace(/-/g, "_");
  const numeratorItemName = toVarName(numeratorItem.id);
  const denominatorItemName = toVarName(denominatorItem.id);
  return `${model.modelCode}
// ------- AUTOGENERATED CODE -------
dists = ${variableName}("${numeratorItem.id}", "${denominatorItem.id}")
value_${numeratorItemName} = Dist(dists[0])
value_${denominatorItemName} = Dist(dists[1])
valueRatio = value_${numeratorItemName} / value_${denominatorItemName}
medianDenominator = abs(median(value_${denominatorItemName}))
tickFormat = '10'
tickFormatObj = {tickFormat: tickFormat}

@name("Normalized Scatter Plot")
scatter = Plot.scatter(
  {
    xDist: SampleSet(dists[1] / medianDenominator),
    yDist: SampleSet(dists[0] / medianDenominator),
    xScale: Scale.symlog(
      { tickFormatObj, title: "${numeratorItem.name}" }
    ),
    yScale: Scale.symlog(
      { tickFormatObj, title: "${denominatorItem.name}" }
    ),
  }
)

@name("Debug")
debug = [
  scatter,
  Tag.name(
    [
      Tag.name(
        Plot.dist(dists[0], { xScale: Scale.symlog() }),
        "${numeratorItem.name}"
      ),
      Tag.name(
        Plot.dist(dists[1], { xScale: Scale.symlog() }),
        "${denominatorItem.name}"
      ),
    ],
    "Distributions"
  ),
]

@name("Ratio Distribution")
ratio = Plot.dist(
  {
    dist: valueRatio,
    xScale: Scale.symlog(tickFormatObj),
    yScale: Scale.symlog(tickFormatObj),
    showSummary: false,
  }
)

ratio
`;
};

type Props = {
  model: ModelEvaluator;
  numeratorItem: Item;
  denominatorItem: Item;
  variableName: string;
};

export const ItemSideBar: FC<Props> = ({
  model,
  numeratorItem,
  variableName,
  denominatorItem,
}) => {
  const result = model.compare(numeratorItem.id, denominatorItem.id);
  if (!result.ok) {
    return <div>Result not found</div>;
  } else {
    let item = result.value;
    const squggleCode = buildurl(
      model,
      numeratorItem,
      denominatorItem,
      variableName
    );

    // It would be better to not load SquiggleChart, but rather, a lower-level compontent. That can be refactored later.
    return (
      <div>
        <div className="mt-2 mb-6 flex overflow-x-auto items-center p-1">
          <span className="text-slate-500 text-md whitespace-nowrap mr-1">
            value
          </span>
          <span className="text-slate-300 text-xl whitespace-nowrap">(</span>
          <span className="text-sm bg-slate-200 font-semibold bg-opacity-80 rounded-sm text-slate-900 px-1 text-center whitespace-pre-wrap mr-2 ml-2">
            {numeratorItem.name}
          </span>
          <span className="text-slate-300 px-1 text-xl whitespace-nowrap">
            /
          </span>

          <span className="text-sm bg-slate-200  font-semibold rounded-sm text-slate-900 px-1 text-center whitespace-pre-wrap mr-2 ml-2">
            <span className="inline-block">{denominatorItem.name}</span>
          </span>
          <span className="text-slate-300 text-xl whitespace-nowrap">)</span>
        </div>

        <div className="mb-4 text-slate-500 xs">
          An estimate of the value of{" "}
          <span className="font-semibold text-slate-700">
            {numeratorItem.name}
          </span>{" "}
          in terms of{" "}
          <span className="text-slate-700 font-semibold">
            {denominatorItem.name}
          </span>
        </div>

        <SquiggleChart code={squggleCode} />

        <div className="grid grid-cols-6 gap-1 w-full mt-10 mb-10">
          <TableRow label="median" number={item.median} />
          <TableRow label="mean" number={item.mean} />
          <TableRow label="p5" number={item.min} />
          <TableRow label="p95" number={item.max} />
          <TableRow label="uncertainty" number={item.uncertainty} />
        </div>

        <a
          href={codeToPlaygroundUrl(squggleCode)}
          className="text-slate-400 underline"
        >
          Open in Playground
        </a>
      </div>
    );
  }
};
