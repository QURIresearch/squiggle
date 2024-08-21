/* Notes: See commit 5ce0a6979d9f95d77e4ddbdffc40009de73821e3 for last commit which has more detailed helper functions. These might be useful when coming back to this code after a long time. */

import jstat from "jstat";

import { Binomial } from "../dists/SymbolicDist/Binomial.js";
import * as PoissonJs from "../dists/SymbolicDist/Poisson.js";
import { ErrorMessage } from "../errors/messages.js";
import { FRFunction, makeFnExample } from "../library/registry/core.js";
import {
  FnFactory,
  makeOneArgSamplesetDist,
  makeTwoArgsSamplesetDist,
} from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { fnInput, namedInput } from "../reducer/lambda/FnInput.js";
import { Lambda } from "../reducer/lambda/index.js";
import { Reducer } from "../reducer/Reducer.js";
import {
  tAny,
  tArray,
  tDate,
  tLambda,
  tNumber,
  tOr,
  tPointSetDist,
  tString,
} from "../types/index.js";
import * as E_A from "../utility/E_A.js";
import { SDate } from "../utility/SDate.js";
import {
  removeLambdas,
  simpleValueFromValue,
  simpleValueToJson,
  simpleValueToValue,
} from "../value/simpleValue.js";
import { vArray } from "../value/VArray.js";
import { vNumber } from "../value/VNumber.js";

const { factorial } = jstat;

const maker = new FnFactory({
  nameSpace: "Danger",
  requiresNamespace: true,
});

function combinations<T>(arr: readonly T[], k: number): (readonly T[])[] {
  if (k === 0) return [[]];
  if (k === arr.length) return [arr];

  const withoutFirst = combinations(arr.slice(1), k);
  const withFirst: (readonly T[])[] = combinations(arr.slice(1), k - 1).map(
    (comb) => [arr[0], ...comb]
  );

  return withFirst.concat(withoutFirst);
}

function allCombinations<T>(arr: readonly T[]): (readonly T[])[] {
  let allCombs: (readonly T[])[] = [];
  for (let k = 1; k <= arr.length; k++) {
    allCombs = allCombs.concat(combinations(arr, k));
  }
  return allCombs;
}

const choose = (n: number, k: number) =>
  factorial(n) / (factorial(n - k) * factorial(k));

const combinatoricsLibrary: FRFunction[] = [
  maker.nn2n({
    name: "laplace",
    description: `Calculates the probability implied by [Laplace's rule of succession](https://en.wikipedia.org/wiki/Rule_of_succession)`,
    examples: [
      makeFnExample(`trials = 10
successes = 1
Danger.laplace(successes, trials) //  (successes + 1) / (trials + 2)  = 2 / 12 = 0.1666`),
    ],
    displaySection: "Math",
    fn: (successes, trials) => (successes + 1) / (trials + 2),
  }),
  maker.make({
    name: "parseFloat",
    examples: [makeFnExample("Danger.parseFloat('10.3')")],
    displaySection: "Javascript",
    description: `Converts a string to a number. If the string can't be converted, returns \`Parse Failed\`. Calls Javascript \`parseFloat\` under the hood.`,
    definitions: [
      makeDefinition([tString], tOr(tNumber, tString), ([str]) => {
        const result = parseFloat(str);
        if (isNaN(result)) {
          return { tag: "2", value: "Parse Failed" };
        } else {
          return { tag: "1", value: result };
        }
      }),
    ],
  }),
  maker.make({
    name: "now",
    description: `Returns the current date. Internally calls \`\`Date.now()\`\` in JavaScript.  

*Caution: This function, which returns the current date, produces varying outputs with each call. As a result, accurately estimating the value of functions that incorporate \`\`Danger.now()\`\` at past time points is challenging. In the future, we intend to implement a feature allowing the input of a simulated time via an environment variable to address this issue.*`,
    examples: [makeFnExample("Danger.now()")],
    requiresNamespace: true,
    displaySection: "Javascript",
    definitions: [
      makeDefinition([], tDate, () => {
        return SDate.now();
      }),
    ],
  }),
  maker.n2n({
    name: "factorial",
    displaySection: "Combinatorics",
    examples: [makeFnExample(`Danger.factorial(20)`)],
    fn: factorial,
  }),
  maker.nn2n({
    name: "choose",
    displaySection: "Combinatorics",
    description: `\`Danger.choose(n,k)\` returns \`factorial(n) / (factorial(n - k) * factorial(k))\`, i.e., the number of ways you can choose k items from n choices, without repetition. This function is also known as the [binomial coefficient](https://en.wikipedia.org/wiki/Binomial_coefficient).`,
    examples: [makeFnExample(`Danger.choose(1, 20)`)],
    fn: choose,
  }),
  maker.make({
    name: "binomial",
    displaySection: "Combinatorics",
    description: `\`Danger.binomial(n, k, p)\` returns \`choose((n, k)) * pow(p, k) * pow(1 - p, n - k)\`, i.e., the probability that an event of probability p will happen exactly k times in n draws.`,
    examples: [makeFnExample(`Danger.binomial(1, 20, 0.5)`)],
    definitions: [
      makeDefinition(
        [tNumber, tNumber, tNumber],
        tNumber,
        ([n, k, p]) => choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)
      ),
    ],
  }),
];

const integrateFunctionBetweenWithNumIntegrationPoints = (
  lambda: Lambda,
  min: number,
  max: number,
  numIntegrationPoints: number,
  reducer: Reducer
): number => {
  const applyFunctionAtFloatToFloatOption = (point: number) => {
    // Defined here so that it has access to reducer
    const result = reducer.call(lambda, [vNumber(point)]);
    if (result.type === "Number") {
      return result.value;
    }
    throw ErrorMessage.otherError(
      "Error 1 in Danger.integrate. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead"
    );
  };

  // Variables are punctiliously defined because it's otherwise easy to make off-by one errors.
  const numTotalPoints = numIntegrationPoints | 0; // superflous declaration, but useful to keep track that we are interpreting "numIntegrationPoints" as the total number on which we evaluate the function, not e.g., as the inner integration points.
  const numInnerPoints = numTotalPoints - 2;
  const numOuterPoints = 2;
  const totalWeight = max - min;
  const weightForAnInnerPoint = totalWeight / (numTotalPoints - 1);
  const weightForAnOuterPoint = totalWeight / (numTotalPoints - 1) / 2;
  const innerPointIncrement = (max - min) / (numTotalPoints - 1);
  const innerXs = E_A.makeBy(
    numInnerPoints,
    (i) => min + (i + 1) * innerPointIncrement
  );
  // Gotcha: makeBy goes from 0 to (n-1): <https://rescript-lang.org/docs/manual/latest/api/belt/array#makeby>
  const ys = innerXs.map((x) => applyFunctionAtFloatToFloatOption(x));

  /* Logging, with a worked example. */
  // Useful for understanding what is happening.
  // assuming min = 0, max = 10, numTotalPoints=10, results below:
  const verbose = false;
  if (verbose) {
    console.log("numTotalPoints", numTotalPoints); // 5
    console.log("numInnerPoints", numInnerPoints); // 3
    console.log("numOuterPoints", numOuterPoints); // always 2
    console.log("totalWeight", totalWeight); // 10 - 0 = 10
    console.log("weightForAnInnerPoint", weightForAnInnerPoint); // 10/4 = 2.5
    console.log("weightForAnOuterPoint", weightForAnOuterPoint); // 10/4/2 = 1.25
    console.log(
      "weightForAnInnerPoint * numInnerPoints + weightForAnOuterPoint * numOuterPoints",
      weightForAnInnerPoint * numInnerPoints +
        weightForAnOuterPoint * numOuterPoints
    ); // should be 10
    console.log(
      "sum of weights == totalWeight",
      weightForAnInnerPoint * numInnerPoints +
        weightForAnOuterPoint * numOuterPoints ===
        totalWeight
    ); // true
    console.log("innerPointIncrement", innerPointIncrement); // (10-0)/4 = 2.5
    console.log("innerXs", innerXs); // 2.5, 5, 7.5
    console.log("ys", ys);
  }

  const innerPointsSum = ys.reduce((a, b) => a + b, 0);
  const yMin = applyFunctionAtFloatToFloatOption(min);
  const yMax = applyFunctionAtFloatToFloatOption(max);
  const result =
    (yMin + yMax) * weightForAnOuterPoint +
    innerPointsSum * weightForAnInnerPoint;
  return result;
};
const integrationLibrary: FRFunction[] = [
  // Integral in terms of function, min, max, num points
  // Note that execution time will be more predictable, because it
  // will only depend on num points and the complexity of the function
  maker.make({
    name: "integrateFunctionBetweenWithNumIntegrationPoints",
    requiresNamespace: false,
    displaySection: "Integration",
    examples: [
      makeFnExample(
        `Danger.integrateFunctionBetweenWithNumIntegrationPoints({|x| x+1}, 1, 10, 10)`
      ),
    ],
    description: `Integrates the function \`f\` between \`min\` and \`max\`, and computes \`numIntegrationPoints\` in between to do so.

Note that the function \`f\` has to take in and return numbers. To integrate a function which returns distributions, use:

~~~squiggle
auxiliaryF(x) = mean(f(x))

Danger.integrateFunctionBetweenWithNumIntegrationPoints(auxiliaryF, min, max, numIntegrationPoints)
~~~
`,
    // For the example of integrating x => x+1 between 1 and 10,
    // result should be close to 58.5
    // [x^2/2 + x]1_10 = (100/2 + 10) - (1/2 + 1) = 60 - 1.5 = 58.5
    // https://www.wolframalpha.com/input?i=integrate+x%2B1+from+1+to+10
    definitions: [
      makeDefinition(
        [
          fnInput({ name: "f", type: tLambda }),
          fnInput({ name: "min", type: tNumber }),
          fnInput({ name: "max", type: tNumber }),
          fnInput({ name: "numIntegrationPoints", type: tNumber }),
        ],
        tNumber,
        ([lambda, min, max, numIntegrationPoints], reducer) => {
          if (numIntegrationPoints === 0) {
            throw ErrorMessage.otherError(
              "Integration error 4 in Danger.integrate: Increment can't be 0."
            );
          }
          return integrateFunctionBetweenWithNumIntegrationPoints(
            lambda,
            min,
            max,
            numIntegrationPoints,
            reducer
          );
        }
      ),
    ],
  }),
  // Integral in terms of function, min, max, epsilon (distance between points)
  // Execution time will be less predictable, because it
  // will depend on min, max and epsilon together,
  // as well and the complexity of the function
  maker.make({
    name: "integrateFunctionBetweenWithEpsilon",
    requiresNamespace: false,
    displaySection: "Integration",
    examples: [
      makeFnExample(
        `Danger.integrateFunctionBetweenWithEpsilon({|x| x+1}, 1, 10, 0.1)`
      ),
    ],
    description: `Integrates the function \`f\` between \`min\` and \`max\`, and uses an interval of \`epsilon\` between integration points when doing so. This makes its runtime less predictable than \`integrateFunctionBetweenWithNumIntegrationPoints\`, because runtime will not only depend on \`epsilon\`, but also on \`min\` and \`max\`.

Same caveats as \`integrateFunctionBetweenWithNumIntegrationPoints\` apply.`,
    definitions: [
      makeDefinition(
        [
          namedInput("f", tLambda),
          namedInput("min", tNumber),
          namedInput("max", tNumber),
          namedInput("epsilon", tNumber),
        ],
        tNumber,
        ([lambda, min, max, epsilon], reducer) => {
          if (epsilon === 0) {
            throw ErrorMessage.otherError(
              "Integration error in Danger.integrate: Increment can't be 0."
            );
          }
          return integrateFunctionBetweenWithNumIntegrationPoints(
            lambda,
            min,
            max,
            (max - min) / epsilon,
            reducer
          );
        }
      ),
    ],
  }),
];

const findBiggestElementIndex = (xs: number[]) =>
  xs.reduce((acc, newElement, index) => {
    if (newElement > xs[acc]) {
      return index;
    } else {
      return acc;
    }
  }, 0);

const diminishingReturnsLibrary = [
  maker.make({
    name: "optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions",
    requiresNamespace: false,
    examples: [
      makeFnExample(`Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions(
  [
    {|x| x+1},
    {|y| 10}
  ],
  100,
  0.01
)`),
    ],
    description: `Computes the optimal allocation of $\`funds\` between \`f1\` and \`f2\`. For the answer given to be correct, \`f1\` and \`f2\` will have to be decreasing, i.e., if \`x > y\`, then \`f_i(x) < f_i(y)\`.`,
    displaySection: "Optimization",
    definitions: [
      makeDefinition(
        [
          namedInput("fs", tArray(tLambda)),
          namedInput("funds", tNumber),
          namedInput("approximateIncrement", tNumber),
        ],
        tAny(),
        ([lambdas, funds, approximateIncrement], reducer) => {
          // TODO: This is so complicated, it probably should be its own file. It might also make sense to have it work in Rescript directly, taking in a function rather than a reducer; then something else can wrap that function in the reducer/lambdas.
          /*
    The key idea for this function is that
    1. we keep track of past spending and current marginal returns for each function
    2. we look an additional increment in funds
    3. we assign it to the function with the best marginal returns
    4. we update the spending, and we compute the new returns for that function, with more spending
      - But we only compute the new marginal returns for the function we end up assigning the spending to.
    5. We continue doing this until all the funding is exhausted
    This is currently being done with a reducer, that keeps track of:
      - Value of marginal spending for each function
      - How much has been assigned to each function.
 */

          /*
      Two possible algorithms (n=funds/increment, m=num lambdas)
      1. O(n): Iterate through value on next n dollars. At each step, only compute the new marginal return of the function which is spent. (This is what we are doing.)
      2. O(n*(m-1)): Iterate through all possible spending combinations. The advantage of this option is that it wouldn't assume that the returns of marginal spending are diminishing.
 */
          if (lambdas.length <= 1) {
            throw ErrorMessage.otherError(
              "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, number of functions should be greater than 1."
            );
          }
          if (funds <= 0) {
            throw ErrorMessage.otherError(
              "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, funds should be greater than 0."
            );
          }
          if (approximateIncrement <= 0) {
            throw ErrorMessage.otherError(
              "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, approximateIncrement should be greater than 0."
            );
          }
          if (approximateIncrement >= funds) {
            throw ErrorMessage.otherError(
              "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, approximateIncrement should be smaller than funds amount."
            );
          }
          const applyFunctionAtPoint = (lambda: Lambda, point: number) => {
            // Defined here so that it has access to reducer
            const lambdaResult = reducer.call(lambda, [vNumber(point)]);
            if (lambdaResult.type === "Number") {
              return lambdaResult.value;
            }
            throw ErrorMessage.otherError(
              "Error 1 in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead"
            );
          };

          const numDivisions = Math.round(funds / approximateIncrement);
          const increment = funds / numDivisions;
          const arrayOfIncrements = new Array(numDivisions).fill(increment);
          // ^ make the increment cleanly divide the amount of funds
          // nicely simplifies the calculations.

          type DiminishingReturnsAccumulator = {
            optimalAllocations: number[];
            currentMarginalReturns: number[];
          };

          const initAccumulator: DiminishingReturnsAccumulator = {
            optimalAllocations: new Array(lambdas.length).fill(0),
            currentMarginalReturns: lambdas.map((lambda) =>
              applyFunctionAtPoint(lambda, 0)
            ),
          };

          const optimalAllocationEndAccumulator = arrayOfIncrements.reduce(
            (acc, newIncrement) => {
              const oldMarginalReturns = acc.currentMarginalReturns;
              const indexOfBiggestDMR =
                findBiggestElementIndex(oldMarginalReturns);
              const newOptimalAllocations = [...acc.optimalAllocations];
              const newOptimalAllocationsi =
                newOptimalAllocations[indexOfBiggestDMR] + newIncrement;
              newOptimalAllocations[indexOfBiggestDMR] = newOptimalAllocationsi;
              const lambdai = lambdas[indexOfBiggestDMR];
              const newMarginalResultsLambdai = applyFunctionAtPoint(
                lambdai,
                newOptimalAllocationsi
              );
              const newCurrentMarginalReturns = [...oldMarginalReturns];
              newCurrentMarginalReturns[indexOfBiggestDMR] =
                newMarginalResultsLambdai;

              const newAcc: DiminishingReturnsAccumulator = {
                optimalAllocations: newOptimalAllocations,
                currentMarginalReturns: newCurrentMarginalReturns,
              };
              return newAcc;
            },
            initAccumulator
          );

          return vArray(
            optimalAllocationEndAccumulator.optimalAllocations.map(vNumber)
          );
        }
      ),
    ],
  }),
];

const mapYLibrary: FRFunction[] = [
  maker.make({
    name: "binomialDist",
    examples: [makeFnExample("Danger.binomialDist(8, 0.5)")],
    displaySection: "Distributions",
    description: `A binomial distribution.

\`\`n\`\` must be above 0, and \`\`p\`\` must be between 0 and 1. 

Note: The binomial distribution is a discrete distribution. When representing this, the Squiggle distribution component might show it as partially or fully continuous. This is a visual mistake; if you inspect the underlying data, it should be discrete.`,
    definitions: [
      makeTwoArgsSamplesetDist(
        (n, p) => Binomial.make({ n, p }),
        "numberOfTrials",
        "probabilityOfSuccess"
      ),
    ],
  }),
  maker.make({
    name: "poissonDist",
    examples: [makeFnExample("Danger.poissonDist(10)")],
    displaySection: "Distributions",
    description: `A Poisson distribution.

Note: The Poisson distribution is a discrete distribution. When representing this, the Squiggle distribution component might show it as partially or fully continuous.  This is a visual mistake; if you inspect the underlying data, it should be discrete.`,
    definitions: [
      makeOneArgSamplesetDist(
        (lambda) => PoissonJs.Poisson.make(lambda),
        "rate"
      ),
    ],
  }),
  maker.make({
    name: "combinations",
    displaySection: "Combinatorics",
    examples: [
      makeFnExample(
        `Danger.combinations([1, 2, 3], 2) // [[1, 2], [1, 3], [2, 3]]`
      ),
    ],
    description: `Returns all combinations of the input list taken r elements at a time.`,
    definitions: [
      makeDefinition(
        [tArray(tAny({ genericName: "A" })), tNumber],
        tArray(tArray(tAny({ genericName: "A" }))),
        ([elements, n]) => {
          if (n > elements.length) {
            throw ErrorMessage.argumentError(
              `Combinations of length ${n} were requested, but full list is only ${elements.length} long.`
            );
          }
          return combinations(elements, n);
        }
      ),
    ],
  }),
  maker.make({
    name: "allCombinations",
    displaySection: "Combinatorics",
    description: `Returns all possible combinations of the elements in the input list.`,
    examples: [
      makeFnExample(
        `Danger.allCombinations([1, 2, 3]) // [[1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]]`
      ),
    ],
    definitions: [
      makeDefinition(
        [tArray(tAny({ genericName: "A" }))],
        tArray(tArray(tAny({ genericName: "A" }))),
        ([elements]) => {
          return allCombinations(elements);
        }
      ),
    ],
  }),
  maker.make({
    name: "json",
    displaySection: "JSON",
    description:
      "Converts a value to a simpler form, similar to JSON. This is useful for debugging. Keeps functions and dates, but converts objects like distributions, calculators, and plots to combinations of dictionaries and lists.",
    examples: [
      makeFnExample(`Danger.json({a: 1, b: 2})`),
      makeFnExample(
        `Danger.json([2 to 5, Sym.normal(5, 2), Calculator({|x| x + 1})])`
      ),
    ],
    definitions: [
      makeDefinition([tAny()], tAny(), ([v]) => {
        return simpleValueToValue(simpleValueFromValue(v));
      }),
    ],
  }),
  maker.make({
    name: "jsonString",
    displaySection: "JSON",
    description:
      "Converts a value to a stringified JSON, similar to JSON.stringify() in Javasript. Replaces functions with dict summaries.",
    examples: [
      makeFnExample(`Danger.jsonString({a: 1, b: 2})`),
      makeFnExample(
        `Danger.jsonString([2 to 5, Sym.normal(5, 2), Calculator({|x| x + 1})])`
      ),
    ],
    definitions: [
      makeDefinition([tAny()], tString, ([v]) => {
        return JSON.stringify(
          simpleValueToJson(removeLambdas(simpleValueFromValue(v)))
        );
      }),
    ],
  }),
  maker.make({
    name: "yTransform",
    examples: [makeFnExample(`Danger.yTransform(PointSet(Sym.normal(5,2)))`)],
    displaySection: "Math",
    definitions: [
      makeDefinition([tPointSetDist], tPointSetDist, ([dist]) => {
        return dist.yTransform();
      }),
    ],
  }),
];

export const library = [
  // Combinatorics
  ...combinatoricsLibrary,

  //   // Integration
  ...integrationLibrary,

  // Diminishing marginal return functions
  ...diminishingReturnsLibrary,

  // previously called `scaleLog`/`scaleExp`/...
  ...mapYLibrary,
];
