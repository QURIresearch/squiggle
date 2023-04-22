import * as React from "react";
import { FC, useCallback, useState } from "react";
import * as yup from "yup";

import {
  Env,
  resultMap,
  SqDistributionsPlot,
  SqDistributionTag,
  SqShape,
} from "@quri/squiggle-lang";

import isEqual from "lodash/isEqual.js";
import { hasMassBelowZero } from "../../lib/distributionUtils.js";
import {
  distance,
  drawAxes,
  drawCircle,
  drawCursorLines,
  primaryColor,
} from "../../lib/draw/index.js";
import { useCanvas, useCanvasCursor } from "../../lib/hooks/index.js";
import { flattenResult } from "../../lib/utility.js";
import { ErrorAlert } from "../Alert.js";
import { SummaryTable } from "./SummaryTable.js";
import { Plot } from "./types.js";

import * as d3 from "d3";
import { DrawContext } from "../../lib/hooks/useCanvas.js";
import { MouseTooltip } from "../ui/MouseTooltip.js";
import { Point } from "../../lib/draw/types.js";

const scaleTypes = ["linear", "log", "exp"] as const;
type ScaleType = (typeof scaleTypes)[number];

export const distributionSettingsSchema = yup.object({}).shape({
  xScale: yup.mixed<ScaleType>().oneOf(scaleTypes).default("linear"),
  yScale: yup.mixed<ScaleType>().oneOf(scaleTypes).default("linear"),
  disableLogX: yup.boolean(),
  minX: yup.number(),
  maxX: yup.number(),
  title: yup.string(),
  xAxisType: yup
    .mixed<"number" | "dateTime">()
    .oneOf(["number", "dateTime"])
    .default("number"),
  /** Documented here: https://github.com/d3/d3-format */
  tickFormat: yup.string().required().default(".9~s"),
  showSummary: yup.boolean().required().default(false),
});

function scaleTypeToScale(
  scaleType: ScaleType
): d3.ScaleContinuousNumeric<number, number, never> {
  switch (scaleType) {
    case "linear":
      return d3.scaleLinear();
    case "log":
      return d3.scaleLog();
    case "exp":
      return d3.scalePow().exponent(0.1);
  }
}

export type DistributionChartSettings = yup.InferType<
  typeof distributionSettingsSchema
>;

export function sqPlotToPlot(sqPlot: SqDistributionsPlot): Plot {
  return {
    distributions: sqPlot.distributions.map((x) => ({ ...x, opacity: 0.3 })),
    colorScheme: "category10",
    showLegend: true,
  };
}

export type MultiDistributionChartProps = {
  plot: Plot;
  environment: Env;
  height: number;
  settings: DistributionChartSettings;
};

const InnerMultiDistributionChart: FC<{
  shapes: (SqShape & { name: string; opacity: number })[];
  samples: number[];
  settings: DistributionChartSettings;
  height: number;
  plot: Plot;
}> = ({ shapes, samples, plot, height: innerHeight, settings }) => {
  const [discreteTooltip, setDiscreteTooltip] = useState<
    { value: number; probability: number } | undefined
  >();

  const domain = shapes.flatMap((shape) =>
    shape.discrete.concat(shape.continuous)
  );

  const legendItemHeight = 16;
  const sampleBarHeight = 5;

  const showTitle = !!settings.title;
  const titleHeight = showTitle ? 20 : 4;
  const legendHeight = plot.showLegend ? legendItemHeight * shapes.length : 0;
  const samplesFooterHeight = samples.length ? 10 : 0;

  const height =
    innerHeight + legendHeight + titleHeight + samplesFooterHeight + 30;

  const { cursor, initCursor } = useCanvasCursor();

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);

      const getColor = (i: number) =>
        plot.colorScheme === "blues" ? "#5ba3cf" : d3.schemeCategory10[i];

      const xScale = scaleTypeToScale(settings.xScale);
      xScale.domain([
        Number.isFinite(settings.minX)
          ? settings.minX!
          : d3.min(domain, (d) => d.x) ?? 0,
        Number.isFinite(settings.maxX)
          ? settings.maxX!
          : d3.max(domain, (d) => d.x) ?? 0,
      ]);

      const yScale = scaleTypeToScale(settings.yScale);
      yScale.domain([
        Math.min(...domain.map((p) => p.y), 0), // min value, but at least 0
        Math.max(...domain.map((p) => p.y)),
      ]);

      const { padding, frame } = drawAxes({
        context,
        width,
        height,
        suggestedPadding: {
          left: 10,
          right: 10,
          top: 10 + legendHeight + titleHeight,
          bottom: 20 + samplesFooterHeight,
        },
        xScale,
        yScale,
        hideYAxis: true,
        drawTicks: true,
        tickCount: 10,
        tickFormat: settings.tickFormat,
      });

      if (settings.title) {
        context.save();
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillStyle = "black";
        context.font = "bold 12px sans-serif";
        context.fillText(settings.title, width / 2, 4);
        context.restore();
      }

      if (plot.showLegend) {
        const radius = 5;
        for (let i = 0; i < shapes.length; i++) {
          context.save();
          context.translate(padding.left, titleHeight + legendItemHeight * i);
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

      // shapes
      {
        frame.enter();
        const translatedCursor: Point | undefined = cursor
          ? frame.translatedPoint(cursor)
          : undefined;
        const discreteRadius = 5;

        // there can be only one
        let newDiscreteTooltip: typeof discreteTooltip = undefined;

        for (let i = 0; i < shapes.length; i++) {
          const shape = shapes[i];

          // continuous
          context.globalAlpha = shape.opacity;
          context.fillStyle = getColor(i);
          context.beginPath();
          d3
            .area<SqShape["continuous"][number]>()
            .x((d) => xScale(d.x))
            .y0((d) => yScale(d.y))
            .y1(0)
            .context(context)(shape.continuous);
          context.fill();

          context.globalAlpha = 1;
          context.strokeStyle = context.fillStyle;
          d3
            .line<SqShape["continuous"][number]>()
            .x((d) => xScale(d.x))
            .y((d) => yScale(d.y))
            .context(context)(shape.continuous);
          context.stroke();

          // discrete
          for (const point of shape.discrete) {
            context.beginPath();
            context.lineWidth = 1;
            const x = xScale(point.x);
            const y = yScale(point.y);
            if (
              translatedCursor &&
              distance({ x, y }, translatedCursor) <= discreteRadius
            ) {
              // the last discrete point always wins over overlapping previous points
              // this makes sense because it's drawn last
              newDiscreteTooltip = { value: point.x, probability: point.y };
            }
            context.moveTo(x, 0);
            context.lineTo(x, y);
            context.stroke();
            drawCircle({ context, x, y, r: discreteRadius });
          }
        }
        if (!isEqual(discreteTooltip, newDiscreteTooltip)) {
          setDiscreteTooltip(newDiscreteTooltip);
        }
        frame.exit();
      }

      // samples
      context.save();
      context.strokeStyle = primaryColor;
      context.lineWidth = 0.1;
      samples.forEach((sample) => {
        context.beginPath();
        const x = xScale(sample);

        context.beginPath();
        context.moveTo(padding.left + x, height - sampleBarHeight);
        context.lineTo(padding.left + x, height);
        context.stroke();
      });
      context.restore();

      if (
        cursor &&
        cursor.x >= padding.left &&
        cursor.y - padding.left <= frame.width
      ) {
        drawCursorLines({
          frame,
          cursor,
          x: {
            scale: xScale,
            format: d3.format(",.4r"),
          },
        });
      }
    },
    [
      height,
      legendHeight,
      titleHeight,
      samplesFooterHeight,
      shapes,
      samples,
      domain,
      plot.colorScheme,
      plot.showLegend,
      discreteTooltip,
      cursor,
      settings.xScale,
      settings.yScale,
      settings.title,
      settings.minX,
      settings.maxX,
      settings.tickFormat,
    ]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <MouseTooltip
      isOpen={!!discreteTooltip}
      render={() => (
        <div
          className="bg-white border border-gray-300 rounded text-xs p-2 grid gap-x-2"
          style={{
            gridTemplateColumns: "min-content min-content",
          }}
        >
          <div className="text-gray-500 text-right">Value:</div>
          <div>{d3.format(",.6r")(discreteTooltip!.value)}</div>
          <div className="text-gray-500 text-right">Probability:</div>
          <div>{d3.format(",.6r")(discreteTooltip!.probability)}</div>
          <br />
        </div>
      )}
    >
      <canvas
        data-testid="multi-distribution-chart"
        className="w-full"
        ref={ref}
      >
        Distribution plot
      </canvas>
    </MouseTooltip>
  );
};

export const MultiDistributionChart: FC<MultiDistributionChartProps> = ({
  plot,
  environment,
  settings,
  height,
}) => {
  const distributions = plot.distributions;

  const shapes = flattenResult(
    distributions.map((x) =>
      resultMap(x.distribution.pointSet(environment), (pointSet) => ({
        name: x.name,
        opacity: x.opacity,
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

  // if this is a sample set, include the samples
  const samples: number[] = [];
  for (const { distribution } of distributions) {
    if (distribution.tag === SqDistributionTag.SampleSet) {
      samples.push(...distribution.getSamples());
    }
  }

  return (
    <div className="flex flex-col items-stretch">
      {settings.xScale === "log" && shapes.value.some(hasMassBelowZero) ? (
        <ErrorAlert heading="Log Domain Error">
          Cannot graph distribution with negative values on logarithmic scale.
        </ErrorAlert>
      ) : (
        <InnerMultiDistributionChart
          samples={samples}
          shapes={shapes.value}
          plot={plot}
          settings={settings}
          height={height}
        />
      )}
      <div className="flex justify-center">
        {settings.showSummary && (
          <SummaryTable plot={plot} environment={environment} />
        )}
      </div>
    </div>
  );
};
