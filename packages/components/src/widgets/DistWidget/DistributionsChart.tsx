import clsx from "clsx";
import * as d3 from "d3";
import isEqual from "lodash/isEqual.js";
import { FC, useCallback, useMemo, useState } from "react";

import {
  Env,
  result,
  resultMap,
  SqDistributionError,
  SqDistributionsPlot,
  SqDistributionTag,
  SqShape,
} from "@quri/squiggle-lang";
import { MouseTooltip, TextTooltip } from "@quri/ui";

import { useViewerType } from "../../components/SquiggleViewer/ViewerProvider.js";
import { ErrorAlert } from "../../components/ui/Alert.js";
import { sqScaleToD3 } from "../../lib/d3/index.js";
import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import {
  calculatePadding,
  distance,
  distributionColor,
  drawAxes,
  drawCircle,
  drawCursorLines,
  drawVerticalLine,
  makeCartesianFrame,
} from "../../lib/draw/index.js";
import { Point } from "../../lib/draw/types.js";
import { useCanvas, useCanvasCursor } from "../../lib/hooks/index.js";
import { DrawContext } from "../../lib/hooks/useCanvas.js";
import { canvasClasses, flattenResult } from "../../lib/utility.js";
import { PlotTitle } from "../PlotWidget/PlotTitle.js";
import { DistProvider, useSelectedVerticalLine } from "./DistProvider.js";
import { SummaryTable } from "./SummaryTable.js";
import { adjustPdfHeightToScale } from "./utils.js";

const distRadiusScalingFromHeight = d3
  .scaleLinear()
  .domain([10, 300]) // The potential height of the chart
  .range([2, 5]) // The range of circle radiuses
  .clamp(true);

export type DistributionsChartProps = {
  plot: SqDistributionsPlot;
  environment: Env;
  height: number;
};

// We have a similar function in squiggle-lang, but it's not exported, and this function is simple enough.
type DataPoint = {
  x: number;
  y: number;
};
function interpolateYAtX(
  xValue: number,
  continuousData: { x: number; y: number }[],
  yScale: d3.ScaleContinuousNumeric<number, number>
): number | null {
  let pointBefore: DataPoint | null = null,
    pointAfter: DataPoint | null = null;
  for (const point of continuousData) {
    if (point.x <= xValue) {
      pointBefore = point;
    } else {
      pointAfter = point;
      break;
    }
  }

  if (pointBefore && pointAfter) {
    const xInterpolate = d3
      .scaleLinear()
      .domain([pointBefore.x, pointAfter.x])
      .range([yScale(pointBefore.y), yScale(pointAfter.y)]);
    return xInterpolate(xValue);
  } else {
    return null;
  }
}

type SampleBarSetting = "none" | "bottom" | "behind";

const InnerDistributionsChart: FC<{
  shapes: (SqShape & {
    name: string;
    p5: result<number, SqDistributionError>;
    p50: result<number, SqDistributionError>;
    p95: result<number, SqDistributionError>;
  })[];
  samples: number[];
  plot: SqDistributionsPlot;
  height: number;
  isMulti: boolean; // enables legend and semi-transparent rendering
  samplesBarSetting: SampleBarSetting;
  showCursorLine: boolean;
  showPercentileLines: boolean;
  showAxisTitles: boolean;
  showXAxis: boolean;
}> = ({
  shapes: unAdjustedShapes,
  samples,
  plot,
  height: innerHeight,
  isMulti,
  samplesBarSetting,
  showAxisTitles,
  showCursorLine,
  showPercentileLines,
  showXAxis,
}) => {
  const verticalLine = useSelectedVerticalLine();

  const [discreteTooltip, setDiscreteTooltip] = useState<
    { value: number; probability: number } | undefined
  >();

  const shapes = unAdjustedShapes.map(
    ({ name, continuous, discrete, p5, p50, p95 }) => ({
      name,
      p5,
      p50,
      p95,
      ...adjustPdfHeightToScale({ discrete, continuous }, plot.xScale),
    })
  );

  const domain = shapes.flatMap((shape) =>
    shape.discrete.concat(shape.continuous)
  );

  const legendItemHeight = 16;
  const legendOffset = 2;

  const legendHeight = isMulti
    ? legendItemHeight * shapes.length + legendOffset
    : 0;
  const samplesFooterHeight = samplesBarSetting === "bottom" ? 20 : 0;

  const bottomPadding = (showXAxis ? 14 : 0) + samplesFooterHeight;

  const height = Math.max(
    innerHeight + bottomPadding,
    legendHeight + bottomPadding
  );

  const discreteRadius = distRadiusScalingFromHeight(height);

  const sampleBarHeight =
    samplesBarSetting === "behind" ? Math.min(7, innerHeight * 0.04 + 1) : 7;

  const { xScale, yScale } = useMemo(() => {
    const xScale = sqScaleToD3(plot.xScale);

    const ensureFinite = (x: number | undefined) =>
      Number.isFinite(x) ? x : undefined;
    xScale.domain([
      ensureFinite(plot.xScale.min) ?? d3.min(domain, (d) => d.x) ?? 0,
      ensureFinite(plot.xScale.max) ?? d3.max(domain, (d) => d.x) ?? 0,
    ]);

    const yScale = sqScaleToD3(plot.yScale);

    yScale.domain([
      Math.min(0, ...domain.map((p) => p.y)),
      Math.max(0, ...domain.map((p) => p.y)),
    ]);

    return { xScale, yScale };
  }, [domain, plot.xScale, plot.yScale]);

  const { cursor, initCursor } = useCanvasCursor();

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);

      const getColor = (i: number, lightening?: number) => {
        const color = isMulti ? d3.schemeCategory10[i] : distributionColor;
        if (lightening) {
          return d3.interpolateLab(color, "#fff")(lightening);
        } else {
          return color;
        }
      };

      const suggestedPadding = {
        left: discreteRadius,
        right: discreteRadius,
        top: discreteRadius,
        bottom: bottomPadding,
      };

      const padding = calculatePadding({
        suggestedPadding,
        hasXAxisTitle: showAxisTitles && !!plot.xScale.title,
        hasYAxisTitle: false,
      });

      const frame = makeCartesianFrame({ context, padding, width, height });

      xScale.range([0, frame.width]);
      yScale.range([0, frame.height]);
      // samplesBar
      function samplesBarShowSettings(): { yOffset: number; color: string } {
        if (samplesBarSetting === "behind") {
          return { yOffset: bottomPadding, color: getColor(0, 0.4) };
        } else if (samplesBarSetting === "bottom") {
          return { yOffset: 0, color: getColor(0) };
        } else {
          // Only for the case of samplesBarSetting === "none", should not happen
          return { yOffset: 0, color: getColor(0) };
        }
      }
      if (samplesBarSetting !== "none") {
        context.save();
        const { yOffset, color } = samplesBarShowSettings();
        context.lineWidth = 0.5;
        context.strokeStyle = color;
        samples.forEach((sample) => {
          context.beginPath();
          const x = xScale(sample);
          context.beginPath();
          context.moveTo(padding.left + x, height - yOffset - sampleBarHeight);
          context.lineTo(padding.left + x, height - yOffset);
          context.stroke();
        });
        context.restore();
      }

      // shapes
      {
        frame.enter();
        const translatedCursor: Point | undefined = cursor
          ? frame.translatedPoint(cursor)
          : undefined;

        // there can be only one
        let newDiscreteTooltip: typeof discreteTooltip = undefined;

        for (let i = 0; i < shapes.length; i++) {
          const shape = shapes[i];

          // continuous fill
          //In the case of one distribution, we don't want it to be transparent, so that we can show the samples lines. In the case of multiple distributions, we want them to be transparent so that we can see the other distributions.
          context.fillStyle = isMulti ? getColor(i, 0) : getColor(i, 0.7);
          context.globalAlpha = isMulti ? 0.4 : 1;
          context.beginPath();
          d3
            .area<SqShape["continuous"][number]>()
            .x((d) => xScale(d.x))
            .y0((d) => yScale(d.y))
            .y1(yScale(0))
            .context(context)(shape.continuous);
          context.fill();
          context.globalAlpha = 1;

          // Percentile lines
          if (showPercentileLines) {
            const percentiles = [
              [shape.p5, "p5"],
              [shape.p50, "p50"],
              [shape.p95, "p95"],
            ] as const;
            percentiles.forEach(([percentile, name]) => {
              if (percentile.ok) {
                const xPoint = percentile.value;
                //We need to find the y value of the percentile in question, to draw the line only up to the top of the distribution. We have to do this with interpolation, which is not provided straightforwardly by d3.
                const interpolateY = interpolateYAtX(
                  xPoint,
                  shape.continuous,
                  yScale
                );
                if (interpolateY) {
                  context.beginPath();
                  context.strokeStyle = getColor(i, name === "p50" ? 0.4 : 0.3);
                  if (name === "p50") {
                    context.setLineDash([6, 4]);
                  } else {
                    context.setLineDash([2, 2]);
                  }
                  context.lineWidth = 1;
                  context.moveTo(xScale(xPoint), 0);
                  context.lineTo(xScale(xPoint), interpolateY);
                  context.stroke();
                  context.setLineDash([]);
                }
              }
            });
          }

          // The top line
          context.strokeStyle = getColor(i);
          context.beginPath();
          d3
            .line<SqShape["continuous"][number]>()
            .x((d) => xScale(d.x))
            .y((d) => yScale(d.y))
            .context(context)(shape.continuous);
          context.stroke();

          const darkenAmountCircle = isMulti ? 0.05 : 0.1;

          const discreteLineColor = getColor(i, -darkenAmountCircle);
          const discreteCircleColor = getColor(i, -darkenAmountCircle);

          context.fillStyle = discreteCircleColor;
          context.strokeStyle = discreteLineColor;
          for (const point of shape.discrete) {
            context.beginPath();
            context.lineWidth = 1;
            const x = xScale(point.x);
            // The circle is drawn from the top of the circle, so we need to subtract the radius to get the center of the circle to be at the top of the bar.
            const y = yScale(point.y) - discreteRadius;
            if (
              translatedCursor &&
              distance({ x, y }, translatedCursor) <= discreteRadius + 2
            ) {
              // the last discrete point always wins over overlapping previous points
              // this makes sense because it's drawn last
              newDiscreteTooltip = { value: point.x, probability: point.y };
              //darken the point if it's hovered
              context.fillStyle = getColor(i, -1);
              context.strokeStyle = getColor(i, -1);
            }
            context.moveTo(x, 0);
            context.lineTo(x, y);
            context.globalAlpha = 0.5; // We want the lines to be transparent - the circles are the main focus
            context.stroke();
            context.globalAlpha = 1;
            drawCircle({
              context,
              x,
              y,
              r: discreteRadius,
            });
          }
        }
        if (!isEqual(discreteTooltip, newDiscreteTooltip)) {
          setDiscreteTooltip(newDiscreteTooltip);
        }
        frame.exit();
      }

      drawAxes({
        context,
        width,
        height,
        suggestedPadding,
        xScale,
        yScale,
        showYAxis: false,
        showXAxis,
        xTickFormat: plot.xScale.tickFormat,
        xAxisTitle: showAxisTitles ? plot.xScale.title : undefined,
        showAxisLines: true, // Set this to true to show the axis lines
      });

      if (isMulti) {
        const radius = 5;
        for (let i = 0; i < shapes.length; i++) {
          context.save();
          context.translate(padding.left, legendItemHeight * i + legendOffset);
          context.fillStyle = getColor(i);
          drawCircle({
            context,
            x: radius,
            y: radius,
            r: radius,
          });

          context.textAlign = "left";
          context.textBaseline = "middle";
          context.fillStyle = "black";
          context.font = "12px sans-serif";
          context.fillText(shapes[i].name, 16, radius);
          context.restore();
        }
      }

      if (showCursorLine) {
        drawCursorLines({
          frame,
          cursor,
          x: {
            scale: xScale,
            format: plot.xScale.tickFormat,
          },
        });
      }

      if (verticalLine) {
        drawVerticalLine({
          frame,
          scale: xScale,
          format: plot.xScale.tickFormat,
          x: xScale(verticalLine),
        });
      }
    },
    [
      height,
      discreteRadius,
      shapes,
      samples,
      plot,
      discreteTooltip,
      cursor,
      isMulti,
      xScale,
      yScale,
      verticalLine,
      sampleBarHeight,
      bottomPadding,
      samplesBarSetting,
      showCursorLine,
      showPercentileLines,
      showXAxis,
      showAxisTitles,
    ]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <MouseTooltip
      isOpen={!!discreteTooltip}
      render={() =>
        discreteTooltip ? (
          <div
            className={clsx(
              "grid gap-x-2 rounded-sm border border-gray-300 bg-white p-2 text-xs"
            )}
            style={{
              gridTemplateColumns: "min-content min-content",
            }}
          >
            <div className="text-right text-gray-500">Value:</div>
            <div>
              {xScale.tickFormat(
                undefined,
                plot.xScale.tickFormat
              )(discreteTooltip.value)}
            </div>
            <div className="text-right text-gray-500">Probability:</div>
            <div>
              {yScale.tickFormat(
                undefined,
                plot.yScale.tickFormat
              )(discreteTooltip.probability)}
            </div>
            <br />
          </div>
        ) : null
      }
    >
      <canvas
        data-testid="multi-distribution-chart"
        className={canvasClasses}
        ref={ref}
      >
        Distribution plot
      </canvas>
    </MouseTooltip>
  );
};

export const DistributionsChart: FC<DistributionsChartProps> = ({
  plot,
  environment,
  height,
}) => {
  const viewerType = useViewerType();

  const CUTOFF_TO_SHOW_SAMPLES_BAR = 100000; // Default to stop showing bottom samples bar if there are more than 100k samples
  const distributions = plot.distributions;

  // Collect samples to render them in a sample bar.
  const samples: number[] = useMemo(() => {
    const samplesToConcat: (readonly number[])[] = [];
    for (const { distribution } of distributions) {
      if (distribution.tag === SqDistributionTag.SampleSet) {
        // It's important not to use the ...spread operator on samples, so that it works with >1M samples.
        // (JS would fail with "Too many arguments" otherwise).
        samplesToConcat.push(distribution.getSamples());
      }
    }
    return ([] as number[]).concat(...samplesToConcat);
  }, [distributions]);

  const shapes = flattenResult(
    distributions.map((x) =>
      resultMap(x.distribution.pointSet(environment), (pointSet) => ({
        name: x.name ?? x.distribution.toString(),
        p5: x.distribution.inv(environment, 0.05),
        p50: x.distribution.inv(environment, 0.5),
        p95: x.distribution.inv(environment, 0.95),
        ...pointSet.asShape(),
      }))
    )
  );

  if (!shapes.ok) {
    return (
      <ErrorAlert heading="Distribution Error">
        {shapes.value.toString()}
      </ErrorAlert>
    );
  }

  const normalizedStatus = distributions.map(({ name, distribution }) => ({
    name,
    isNormalized: distribution.isNormalized(),
  }));

  const showAxisTitles = height > 30;
  const shownXAxisTitle = showAxisTitles && !!plot.xScale.title;
  const showXAxis = height > 15;
  const nonTitleHeight = Math.max(height - (showXAxis ? 20 : 0), 0);

  const anyAreNonnormalized = normalizedStatus.some(
    ({ isNormalized }) => !isNormalized
  );

  const nonNormalizedError = () => {
    const message =
      distributions.length === 1
        ? `Not a valid probability distribution. Its integral is ${distributions[0].distribution.integralSum()}, it should be 1. Squiggle currently poorly supports these types.`
        : `Distributions: [${normalizedStatus
            .filter(({ isNormalized }) => !isNormalized)
            .map(({ name }) => name)
            .join(
              ", "
            )}] are not valid probability distributions, because their integrals do not add up to 1.`;
    return (
      <TextTooltip text={message} placement="top">
        <div className="ml-2 w-fit rounded-md bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-900">
          Not Normalized
        </div>
      </TextTooltip>
    );
  };

  const isMulti =
    distributions.length > 1 ||
    Boolean(distributions.length === 1 && distributions[0].name);

  let samplesState: SampleBarSetting = "none";

  const size = nonTitleHeight > 150 ? "large" : "small";

  //It probably would be nices to show samples behind, if its small and there's an xAxisTitle, but that would require messing more with the yPadding in the draw/index file.
  if (
    samples.length < 10 ||
    samples.length > CUTOFF_TO_SHOW_SAMPLES_BAR ||
    isMulti ||
    nonTitleHeight <= 15
  ) {
    samplesState = "none";
  } else if (size == "small" && !shownXAxisTitle) {
    samplesState = "behind";
  } else {
    samplesState = "bottom";
  }

  const hasLogError =
    plot.xScale.method?.type === "log" && shapes.value.some(hasMassBelowZero);

  return (
    <DistProvider generateInitialValue={() => ({})}>
      {plot.title && <PlotTitle title={plot.title} />}
      {hasLogError && (
        <ErrorAlert heading="Log Domain Error">
          Cannot graph distribution with negative values on logarithmic scale.
        </ErrorAlert>
      )}

      {!hasLogError && (
        <>
          <div className="flex flex-col items-stretch">
            <div
              className="flex-1"
              // In tooltips, dist widgets are setting their own size, so without max width there's a risk that the canvas would expand incrementally because of its ResizeObserver.
              // See also: https://github.com/quantified-uncertainty/squiggle/issues/3013
              // Note that 300px is the default width in HTML5 Canvas standard, so it's the safest default. So any larger `maxWidth` could still cause incremental expanding up to that value.
              style={viewerType === "tooltip" ? { maxWidth: 300 } : undefined}
            >
              <InnerDistributionsChart
                isMulti={isMulti}
                samples={samples}
                shapes={shapes.value}
                plot={plot}
                height={height}
                samplesBarSetting={samplesState}
                showCursorLine={nonTitleHeight > 30}
                // We don't want to show percentile lines if it's not normalized, as they wouldn't make sense.
                showPercentileLines={
                  !anyAreNonnormalized && nonTitleHeight > 30
                }
                showXAxis={showXAxis}
                showAxisTitles={showAxisTitles}
              />
            </div>

            {!anyAreNonnormalized &&
              plot.showSummary &&
              nonTitleHeight > 30 && (
                <div
                  className={clsx("mt-3 self-end", size === "large" && "pt-5")}
                >
                  <SummaryTable
                    plot={plot}
                    environment={environment}
                    size={size}
                  />
                </div>
              )}
            {anyAreNonnormalized && height > 20 && (
              <div className="flex-1 pt-2"> {nonNormalizedError()}</div>
            )}
          </div>
        </>
      )}
    </DistProvider>
  );
};
