import { flip, FloatingPortal, offset, useFloating } from "@floating-ui/react";
import * as d3 from "d3";
import { FC, useCallback, useContext, useMemo, useRef } from "react";

import {
  Env,
  result,
  SqDistFnPlot,
  SqDistributionsPlot,
  SqErrorList,
  SqOtherError,
  SqScale,
  SqValue,
} from "@quri/squiggle-lang";
import { TailwindContext } from "@quri/ui";

import { sqScaleToD3 } from "../../../lib/d3/index.js";
import { CartesianFrame } from "../../../lib/draw/CartesianFrame.js";
import {
  drawAxes,
  drawCursorLines,
  primaryColor,
} from "../../../lib/draw/index.js";
import { useCanvas, useCanvasCursor } from "../../../lib/hooks/index.js";
import { DrawContext } from "../../../lib/hooks/useCanvas.js";
import { canvasClasses, unwrapOrFailure } from "../../../lib/utility.js";
import { DistributionsChart } from "../../DistWidget/DistributionsChart.js";
import { PlotTitle } from "../../PlotWidget/PlotTitle.js";
import { ImageErrors } from "./ImageErrors.js";
import { getFunctionImage } from "./utils.js";

type FunctionChart1DistProps = {
  plot: SqDistFnPlot;
  environment: Env;
  height: number;
  xCount: number;
};

const intervals = [
  { width: 0.2, opacity: 0.2 },
  { width: 0.4, opacity: 0.2 },
  { width: 0.6, opacity: 0.2 },
  { width: 0.8, opacity: 0.15 },
  { width: 0.9, opacity: 0.1 },
  { width: 0.98, opacity: 0.05 },
] as const;

type Width = (typeof intervals)[number]["width"];

type Datum = {
  x: number;
  areas: {
    [k in Width]: [number, number];
  };
  50: number;
};

function getDistPlotPercentiles({
  plot,
  environment,
  xCount,
}: {
  plot: SqDistFnPlot;
  environment: Env;
  xCount;
}) {
  const { functionImage, errors, xScale } = getFunctionImage(
    plot,
    environment,
    xCount
  );

  const data: Datum[] = functionImage
    .map(({ x, y: dist }) => {
      const res = {
        x,
        areas: Object.fromEntries(
          intervals.map(({ width }) => {
            const left = (1 - width) / 2;
            const right = left + width;
            return [
              width as Width,
              [
                unwrapOrFailure(dist.inv(environment, left)),
                unwrapOrFailure(dist.inv(environment, right)),
              ],
            ];
          })
        ),
        50: unwrapOrFailure(dist.inv(environment, 0.5)),
      } as Datum;

      return res;
    })
    .filter((d) => isFinite(d[50]));

  return { data, errors, xScale };
}

function useDrawDistFunctionChart({
  plot,
  environment,
  height: innerHeight,
  xCount,
}: {
  plot: SqDistFnPlot;
  environment: Env;
  height: number;
  xCount: number;
}) {
  const height = innerHeight + 30; // consider paddings, should match suggestedPadding below
  const { cursor, initCursor } = useCanvasCursor();

  const { data, errors, xScale } = useMemo(
    () => getDistPlotPercentiles({ plot, environment, xCount }),
    [plot, environment, xCount]
  );

  // note that range is not set on these scales yet (it happens in `draw()` below), so you can't use these in the following code
  const yScale = useMemo(() => {
    const yScale = sqScaleToD3(plot.yScale);
    yScale.domain([
      plot.yScale.min ??
        Math.min(
          ...data.map((d) =>
            Math.min(
              ...Object.values(d.areas)
                .map((p) => p[0])
                .filter(isFinite),
              isFinite(d[50]) ? d[50] : Infinity
            )
          )
        ),
      plot.yScale.max ??
        Math.max(
          ...data.map((d) =>
            Math.max(
              ...Object.values(d.areas)
                .map((p) => p[1])
                .filter(isFinite),
              isFinite(d[50]) ? d[50] : -Infinity
            )
          )
        ),
    ]);

    return yScale;
  }, [data, plot.yScale]);

  const draw = useCallback(
    ({ context, width }: DrawContext) => {
      context.clearRect(0, 0, width, height);

      const { frame } = drawAxes({
        suggestedPadding: { left: 20, right: 10, top: 10, bottom: 20 },
        xScale,
        yScale,
        width,
        height,
        context,
        xTickFormat: plot.xScale.tickFormat,
        yTickFormat: plot.yScale.tickFormat,
        xAxisTitle: plot.xScale.title,
        yAxisTitle: plot.yScale.title,
      });
      d3ref.current = { frame, xScale };

      frame.enter();

      // areas
      context.fillStyle = primaryColor;
      for (const { width, opacity } of intervals) {
        context.globalAlpha = opacity;
        d3
          .area<Datum>()
          .x((d) => xScale(d.x))
          .y1((d) => yScale(d.areas[width][0]))
          .y0((d) => yScale(d.areas[width][1]))
          .context(context)(data);
        context.fill();
      }

      // central 50% line
      context.globalAlpha = 1;
      context.strokeStyle = primaryColor;
      context.lineWidth = 2;
      context.imageSmoothingEnabled = true;
      context.beginPath();
      d3
        .line<Datum>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d[50]))
        .context(context)(data);
      context.stroke();

      frame.exit();

      drawCursorLines({
        frame,
        cursor,
        x: {
          scale: xScale,
          format: plot.xScale.tickFormat,
        },
      });
    },
    [cursor, height, data, plot, xScale, yScale]
  );

  const { ref, width } = useCanvas({ height, init: initCursor, draw });

  const d3ref = useRef<{
    frame: CartesianFrame;
    xScale: d3.ScaleContinuousNumeric<number, number, never>;
  }>(null);

  // Convert canvas coordinates to plot coordniates
  const cursorX: number | undefined = useMemo(() => {
    if (
      !d3ref.current ||
      !cursor ||
      !width ||
      !d3ref.current.frame.containsPoint(cursor)
    ) {
      return;
    }
    return d3ref.current.xScale.invert(cursor.x - d3ref.current.frame.x0);
  }, [
    cursor,
    width, // it's important to depend on `width` because `draw()` mutates `xScale` which is located in d3ref, so it's not reactive directly
  ]);

  return {
    ref,
    cursorX,
    xScale,
    errors,
  };
}

export const DistFunctionChart: FC<FunctionChart1DistProps> = ({
  plot,
  environment,
  height,
  xCount,
}) => {
  const {
    ref: canvasRef,
    xScale,
    cursorX,
    errors,
  } = useDrawDistFunctionChart({
    plot,
    environment,
    height,
    xCount,
  });
  //TODO: This custom error handling is a bit hacky and should be improved.
  const valueAtCursor: result<SqValue, SqErrorList> | undefined =
    useMemo(() => {
      return cursorX !== undefined
        ? plot.fn.call([plot.xScale.numberToValue(cursorX)], environment)
        : {
            ok: false,
            value: new SqErrorList([new SqOtherError("No cursor")]), // will never happen, we check `cursorX` later
          };
    }, [plot.fn, environment, cursorX, plot.xScale]);

  const distChartAtCursor =
    valueAtCursor?.ok &&
    valueAtCursor.value.tag === "Dist" &&
    cursorX !== undefined ? (
      <DistributionsChart
        plot={SqDistributionsPlot.create({
          distribution: valueAtCursor.value.value,
          xScale: plot.distXScale,
          yScale: SqScale.linearDefault(),
          showSummary: false,
          // TODO - use an original function name? it could be obtained with `pathToShortName`, but there's a corner case for arrays.
          title: `f(${xScale.tickFormat(
            undefined,
            plot.xScale.tickFormat
          )(cursorX)})`,
        })}
        environment={environment}
        height={50}
      />
    ) : null; // TODO - show error

  const { x, y, strategy, refs } = useFloating({
    open: distChartAtCursor !== null,
    placement: "bottom-start",
    middleware: [offset(4), flip()],
  });
  const { selector: tailwindSelector } = useContext(TailwindContext);

  const renderChartAtCursor = () => {
    return (
      <FloatingPortal>
        <div className={tailwindSelector}>
          <div
            ref={refs.setFloating}
            className="z-30 rounded-md border border-gray-200 bg-white shadow-lg"
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: refs.reference.current?.getBoundingClientRect().width,
            }}
          >
            {distChartAtCursor}
          </div>
        </div>
      </FloatingPortal>
    );
  };

  return (
    <div className="flex flex-col items-stretch">
      {plot.title && <PlotTitle title={plot.title} />}
      <div ref={refs.setReference}>
        <canvas ref={canvasRef} className={canvasClasses}>
          Chart for {plot.toString()}
        </canvas>
      </div>
      {distChartAtCursor && renderChartAtCursor()}
      <ImageErrors errors={errors} />
    </div>
  );
};
