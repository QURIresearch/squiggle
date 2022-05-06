open Jest
open Expect
open TestHelpers

describe("kl divergence", () => {
  let klDivergence = DistributionOperation.Constructors.klDivergence(~env)
  exception KlFailed

  let testUniform = (lowAnswer, highAnswer, lowPrediction, highPrediction) => {
    test("of two uniforms is equal to the analytic expression", () => {
      let answer =
        uniformMakeR(lowAnswer, highAnswer)->E.R2.errMap(s => DistributionTypes.ArgumentError(s))
      let prediction =
        uniformMakeR(
          lowPrediction,
          highPrediction,
        )->E.R2.errMap(s => DistributionTypes.ArgumentError(s))
      // integral along the support of the answer of answer.pdf(x) times log of prediction.pdf(x) divided by answer.pdf(x) dx
      let analyticalKl = Js.Math.log((highPrediction -. lowPrediction) /. (highAnswer -. lowAnswer))
      let kl = E.R.liftJoin2(klDivergence, prediction, answer)
      switch kl {
      | Ok(kl') => kl'->expect->toBeCloseTo(analyticalKl)
      | Error(err) => {
          Js.Console.log(DistributionTypes.Error.toString(err))
          raise(KlFailed)
        }
      }
    })
  }
  testUniform(0.0, 1.0, -1.0, 2.0)
  testUniform(0.0, 1.0, 0.0, 2.0)
  // testUniform(-1.0, 1.0, 0.0, 2.0)

  test("of two normals is equal to the formula", () => {
    // This test case comes via Nuño https://github.com/quantified-uncertainty/squiggle/issues/433
    let mean1 = 4.0
    let mean2 = 1.0
    let stdev1 = 4.0
    let stdev2 = 1.0

    let prediction =
      normalMakeR(mean1, stdev1)->E.R2.errMap(s => DistributionTypes.ArgumentError(s))
    let answer = normalMakeR(mean2, stdev2)->E.R2.errMap(s => DistributionTypes.ArgumentError(s))
    // https://stats.stackexchange.com/questions/7440/kl-divergence-between-two-univariate-gaussians
    let analyticalKl =
      Js.Math.log(stdev1 /. stdev2) +.
      (stdev2 ** 2.0 +. (mean2 -. mean1) ** 2.0) /. (2.0 *. stdev1 ** 2.0) -. 0.5
    let kl = E.R.liftJoin2(klDivergence, prediction, answer)

    switch kl {
    | Ok(kl') => kl'->expect->toBeCloseTo(analyticalKl)
    | Error(err) => {
        Js.Console.log(DistributionTypes.Error.toString(err))
        raise(KlFailed)
      }
    }
  })
})

describe("combine along support test", () => {
  test("combine along support test", _ => {
    let combineAlongSupportOfSecondArgument = XYShape.PointwiseCombination.combineAlongSupportOfSecondArgument0
    let lowAnswer = 0.0
    let highAnswer = 1.0
    let lowPrediction = 0.0
    let highPrediction = 2.0

    let answer =
      uniformMakeR(lowAnswer, highAnswer)->E.R2.errMap(s => DistributionTypes.ArgumentError(s))
    let prediction =
      uniformMakeR(lowPrediction, highPrediction)->E.R2.errMap(s => DistributionTypes.ArgumentError(
        s,
      ))
    let answerWrapped = E.R.fmap(a => run(FromDist(ToDist(ToPointSet), a)), answer)
    let predictionWrapped = E.R.fmap(a => run(FromDist(ToDist(ToPointSet), a)), prediction)

    let interpolator = XYShape.XtoY.continuousInterpolator(#Stepwise, #UseZero)
    let integrand = PointSetDist_Scoring.KLDivergence.integrand

    let result = switch (answerWrapped, predictionWrapped) {
    | (Ok(Dist(PointSet(Continuous(a)))), Ok(Dist(PointSet(Continuous(b))))) =>
      Some(combineAlongSupportOfSecondArgument(integrand, interpolator, a.xyShape, b.xyShape))
    | _ => None
    }
    result
    ->expect
    ->toEqual(
      Some(
        Ok({
          xs: [
            0.0,
            MagicNumbers.Epsilon.ten,
            2.0 *. MagicNumbers.Epsilon.ten,
            1.0 -. MagicNumbers.Epsilon.ten,
            1.0,
          ],
          ys: [
            -0.34657359027997264,
            -0.34657359027997264,
            -0.34657359027997264,
            -0.34657359027997264,
            -0.34657359027997264,
          ],
        }),
      ),
    )
  })
})
