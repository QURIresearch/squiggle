import { XYShape } from "../../XYShape.js";
import { kde, KdeParams } from "./kde.js";

const logSamples = (s: number[]) => s.map(Math.log);

const reverseNegativeSamples = (s: number[]) =>
  s.map(Math.abs).slice().reverse();

function unLogShape({ xs, ys }: XYShape): XYShape {
  const adjustedXs = xs.map(Math.exp);
  //Sometimes kde() gives us back negative values. This would lead to invalid PDFs, so we adjust these manually.
  const adjustedYs = ys
    .map((y, index) => y / adjustedXs[index])
    .map((r) => (r < 0 ? 0 : r));
  return { xs: adjustedXs, ys: adjustedYs };
}

function reverseNegativeShape({ xs, ys }: XYShape): XYShape {
  return {
    xs: xs
      .slice()
      .reverse()
      .map((x) => -x),
    ys: ys.slice().reverse(),
  };
}

type Sign = "positive" | "negative";

// Takes a set of either all positive or all negative samples,
// takes the log of them, takes the KDE, and then takes the exp of the result.
function logKdeSingleSide({
  samples,
  weight,
  outputLength,
  kernelWidth,
  sign,
}: KdeParams & { sign: Sign }): XYShape {
  let adjustedSamples = samples;
  if (sign === "negative") {
    adjustedSamples = reverseNegativeSamples(adjustedSamples);
  }
  adjustedSamples = logSamples(adjustedSamples);

  const { xs, ys } = kde({
    samples: adjustedSamples,
    outputLength: Math.round(outputLength),
    weight,
    kernelWidth,
  });

  let result = unLogShape({ xs, ys });
  if (sign === "negative") {
    result = reverseNegativeShape(result);
  }
  return result;
}

/**
 * Splits samples at 0 into positive and negative parts. Takes the log KDE of each part, and
 * then combines them.
 * Removes samples that are 0.
 */
export function logKde({
  samples,
  outputLength,
  weight,
  kernelWidth,
}: KdeParams): XYShape {
  //Note that this process filters out samples that are at exactly 0.
  const singleSideKde = (sign: Sign) => {
    let sideSamples =
      sign === "positive"
        ? samples.filter((v) => v > 0)
        : samples.filter((v) => v < 0);

    // We can only approximate a bandwidth if there are at least 3 samples.
    if (sideSamples.length <= 3) {
      sideSamples = [];
    }
    const proportion = sideSamples.length / samples.length;
    return logKdeSingleSide({
      samples: sideSamples,
      weight: weight * proportion,
      outputLength: Math.round(outputLength * proportion),
      kernelWidth,
      sign,
    });
  };

  const [positivePart, negativePart] = [
    singleSideKde("positive"),
    singleSideKde("negative"),
  ];

  const result = {
    xs: [...negativePart.xs, ...positivePart.xs],
    ys: [...negativePart.ys, ...positivePart.ys],
  };
  return result;
}
