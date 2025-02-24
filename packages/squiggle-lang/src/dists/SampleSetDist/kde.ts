// Convert samples to x-y pairs for a PDF
// Uses kernel density estimation (KDE) with a triangular kernel
// samples:      Must be sorted!
// outputLength: Number of points in output, >= 4
// xWidth:       Width of the kernel in x axis units

import { nrd0 } from "./bandwidth.js";

export type KdeParams = {
  samples: number[];
  outputLength: number;
  weight: number;
  kernelWidth?: number;
};

// weight:       Probability mass for each point
export const kde = ({
  samples,
  outputLength,
  weight,
  kernelWidth,
}: KdeParams) => {
  let xWidth = kernelWidth ?? nrd0(samples);
  samples = samples.filter((v) => Number.isFinite(v)); // Not sure if this is needed?
  const len = samples.length;

  // It's not clear what to do when xWidth is zero. We might want to throw an error or otherwise instead. This was an issue for discrete distributions, like binomial.
  if (len === 0 || xWidth === 0) return { usedWidth: xWidth, xs: [], ys: [] };

  // Sample min and range
  const smin = samples[0];
  const srange = samples[len - 1] - smin;

  // width is in units of the step size dx and has to be a whole number
  // If we set width = wantedWidth exactly then we have:
  // width * dx === width * srange / (outputLength - 1 - 2 * width)
  //            === srange / ((outputLength - 1) / width - 2)
  //            === srange / ((srange + 2 * xWidth) / xWidth - 2)
  //            === srange / (srange / xWidth + 2 - 2)
  //            === xWidth
  const wantedWidth = ((outputLength - 1) * xWidth) / (srange + 2 * xWidth);
  const width = Math.max(1, Math.floor(wantedWidth));

  // To give room for all the kernels, we'll have width steps
  // on either side as padding.
  // Subtract from the outputLength - 1 total intervals.
  const stepsInside = outputLength - 1 - 2 * width;
  const dx = srange / stepsInside;

  // Width in x units, not steps
  xWidth = width * dx;

  // Output min and range
  // Total number of intervals is:
  // range / dx === (srange + 2 * margin) / dx
  //            === stepsInside + 2 * width
  //            === outputLength - 1
  const min = smin - xWidth;

  // On our discrete set of x values, each triangle is indistinguishable
  // from a sum of two triangles with peaks at the sample's two nearest
  // neighbors. Here we sum up the peak values from all samples.
  // Only the indices width + 1 + [0, outputLength) in ysum are ever nonzero
  // The extra zeros are to avoid out-of-bounds lookups for ddy below
  const ysum = Array(outputLength + 2 * width).fill(0);
  const dxInv = 1 / dx;
  samples.forEach((x) => {
    const off = x - min;
    const index = Math.floor(off * dxInv);
    const leftWeight = off - index * dx;
    const rightWeight = dx - leftWeight;
    // Offset by 1; see below
    ysum[width + index + 1] += rightWeight;
    ysum[width + index + 2] += leftWeight;
  });

  // Sum for each sample will be width * width * dx
  // but we want weight / dx
  const normalizer = weight / (xWidth * xWidth);

  const xs = Array(outputLength)
    .fill(0)
    .map((_, i) => min + i * dx);

  // A triangle at i causes the KDE to
  // - start increasing (+1) at i - width,
  // - change from increasing to decreasing (-2) at i, and
  // - stop decreasing (+1) at i + width.
  // So the result is a double prefix sum.
  // The actual increase doesn't affect the point where the change
  // happens, but rather the next one. Since y and dy perform inclusive
  // prefix sums, the ysum values are offset by 1 above.
  let dy = 0;
  let y = 0;
  const ys = xs.map((_, i) => {
    const ddy = ysum[i] - 2 * ysum[i + width] + ysum[i + 2 * width];
    dy += ddy;
    y += dy;
    // Sometimes the KDE can be very slightly negative due to floating point errors
    return Math.max(normalizer * y, 0);
  });

  return { usedWidth: xWidth, xs, ys };
};
