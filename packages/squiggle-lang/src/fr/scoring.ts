import { BaseDist } from "../dists/BaseDist.js";
import * as distOperations from "../dists/distOperations/index.js";
import { Env } from "../dists/env.js";
import { REArgumentError, REDistributionError } from "../errors/messages.js";
import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frDict,
  frDist,
  frDistOrNumber,
  frNumber,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";

const maker = new FnFactory({
  nameSpace: "Dist",
  requiresNamespace: true,
});

const runScoringScalarAnswer = (
  estimate: BaseDist,
  answer: number,
  prior: BaseDist | undefined,
  env: Env
) => {
  const result = distOperations.logScoreScalarAnswer({
    estimate,
    answer,
    prior,
    env,
  });
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return result.value;
};

const runScoringDistAnswer = (
  estimate: BaseDist,
  answer: BaseDist,
  prior: BaseDist | undefined,
  env: Env
) => {
  const result = distOperations.logScoreDistAnswer({
    estimate,
    answer,
    prior,
    env,
  });
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return result.value;
};

export const library = [
  maker.make({
    name: "klDivergence",
    examples: [
      makeFnExample("Dist.klDivergence(Sym.normal(5,2), Sym.normal(5,1.5))"),
    ],
    displaySection: "Scoring",
    description: `[Kullback–Leibler divergence](https://en.wikipedia.org/wiki/Kullback%E2%80%93Leibler_divergence) between two distributions.

Note that this can be very brittle. If the second distribution has probability mass at areas where the first doesn't, then the result will be infinite. Due to numeric approximations, some probability mass in point set distributions is rounded to zero, leading to infinite results with klDivergence.`,
    definitions: [
      makeDefinition([frDist, frDist], frNumber, ([estimate, d], reducer) =>
        runScoringDistAnswer(estimate, d, undefined, reducer.environment)
      ),
    ],
  }),
  maker.make({
    name: "logScore",
    displaySection: "Scoring",
    description: `A log loss score. Often that often acts as a [scoring rule](https://en.wikipedia.org/wiki/Scoring_rule). Useful when evaluating the accuracy of a forecast.

    Note that it is fairly slow.`,
    examples: [
      makeFnExample(
        "Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1), prior: Sym.normal(5.5,3)})"
      ),
      makeFnExample(
        "Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1)})"
      ),
      makeFnExample("Dist.logScore({estimate: Sym.normal(5,2), answer: 4.5})"),
    ],
    definitions: [
      makeDefinition(
        [
          frDict(["estimate", frDist], ["answer", frDistOrNumber], {
            key: "prior",
            type: frDist,
            optional: true,
          }),
        ],
        frNumber,
        ([{ estimate, answer, prior }], reducer) => {
          if (prior !== null) {
            if (answer instanceof BaseDist) {
              return runScoringDistAnswer(
                estimate,
                answer,
                prior,
                reducer.environment
              );
            } else if (typeof answer === "number") {
              return runScoringScalarAnswer(
                estimate,
                answer,
                prior,
                reducer.environment
              );
            }
          }
          if (prior === null) {
            if (answer instanceof BaseDist) {
              return runScoringDistAnswer(
                estimate,
                answer,
                undefined,
                reducer.environment
              );
            } else if (typeof answer === "number") {
              return runScoringScalarAnswer(
                estimate,
                answer,
                undefined,
                reducer.environment
              );
            }
          }
          throw new REArgumentError("Impossible type");
        }
      ),
    ],
  }),
];
