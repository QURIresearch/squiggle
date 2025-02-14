import { clsx } from "clsx";
import { FC, memo } from "react";

import { NumberShower } from "../../../components/ui/NumberShower.js";
import { RelativeValue } from "./types.js";

function hasInvalid(obj: RelativeValue): boolean {
  return Object.values(obj).some((value) => !Number.isFinite(value));
}

function numberToTier(
  rating: number,
  percentiles: [number, number] | undefined
) {
  if (!percentiles) {
    return 1;
  }
  const increment = (percentiles[1] - percentiles[0]) / 5;
  if (rating < percentiles[0] + increment) {
    return 1;
  } else if (rating < percentiles[0] + 2 * increment) {
    return 2;
  } else if (rating < percentiles[0] + 3 * increment) {
    return 3;
  } else if (rating < percentiles[0] + 4 * increment) {
    return 4;
  } else {
    return 5;
  }
}

function numberToColor(
  rating: number,
  percentiles: [number, number] | undefined
) {
  switch (numberToTier(rating, percentiles)) {
    case 1:
      return "text-gray-900";
    case 2:
      return "text-gray-700";
    case 3:
      return "text-yellow-700 opacity-90";
    case 4:
      return "text-orange-700 opacity-70";
    case 5:
      return "text-red-700 opacity-60";
  }
}

function numberToColor2(
  rating: number,
  percentiles: [number, number] | undefined
) {
  switch (numberToTier(rating, percentiles)) {
    case 1:
      return "hover:bg-gray-100";
    case 2:
      return "bg-yellow-300/5 hover:bg-yellow-300/30";
    case 3:
      return "bg-yellow-500/10 hover:bg-yellow-500/30";
    case 4:
      return "bg-red-400/10 hover:bg-red-400/30";
    case 5:
      return "bg-red-400/20 hover:bg-red-400/40";
  }
}

export const RelativeValueCell: FC<{
  item: RelativeValue;
  uncertaintyPercentiles?: [number, number];
  showRange?: boolean;
  showMedian?: boolean;
}> = memo(function DistCell({
  item,
  uncertaintyPercentiles,
  showRange,
  showMedian,
}) {
  return hasInvalid(item) ? (
    <div className="relative h-full min-h-[2em] bg-gray-300/30 pt-[1px]">
      <div className="z-0 p-4 text-center text-gray-500">Error</div>
    </div>
  ) : (
    <div
      className={clsx(
        "relative h-full min-h-[2em] pt-[1px]",
        numberToColor2(item.uncertainty, uncertaintyPercentiles)
      )}
    >
      <div className="z-0 py-1 text-center">
        <div>
          {showMedian && (
            <span className="text-lg font-semibold text-slate-700">
              <NumberShower number={item.median} precision={1} />
            </span>
          )}
          <span>
            {showMedian && (
              <span>
                {" "}
                <span
                  style={{ fontSize: "0.7em" }}
                  className="font-light text-gray-400"
                >
                  ±
                </span>{" "}
              </span>
            )}
            <span
              className={numberToColor(
                item.uncertainty,
                uncertaintyPercentiles
              )}
            >
              <NumberShower
                number={
                  item.uncertainty /
                  2 /* The uncertainty is the full range, we need to half for the +- to make sense. */
                }
                precision={2}
              />
            </span>
            <span
              style={{ fontSize: "0.6em" }}
              className={clsx(
                numberToColor(item.uncertainty, uncertaintyPercentiles),
                "font-light"
              )}
            >
              om
            </span>
          </span>
        </div>

        {showRange && (
          <div
            style={{ fontSize: "0.7em" }}
            className="font-light text-gray-400"
          >
            {item.min < 0 && item.max < 0 ? (
              <span>
                -(
                <NumberShower number={-1 * item.max} precision={1} /> to{" "}
                <NumberShower number={-1 * item.min} precision={1} />)
              </span>
            ) : (
              <span>
                <NumberShower number={item.min} precision={1} /> to{" "}
                <NumberShower number={item.max} precision={1} />
              </span>
            )}
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 -z-10 h-2"></div>
    </div>
  );
});
