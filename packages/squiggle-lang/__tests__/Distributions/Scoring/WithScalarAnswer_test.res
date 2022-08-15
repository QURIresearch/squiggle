open Jest
open Expect
open TestHelpers
open GenericDist_Fixtures
exception ScoreFailed

describe("WithScalarAnswer: discrete -> scalar -> score", () => {
  let mixture = a => DistributionTypes.DistributionOperation.Mixture(a)
  let pointA = mkDelta(3.0)
  let pointB = mkDelta(2.0)
  let pointC = mkDelta(1.0)
  let pointD = mkDelta(0.0)

  test("score: agrees with analytical answer when finite", () => {
    let prediction' = [(pointA, 0.25), (pointB, 0.25), (pointC, 0.25), (pointD, 0.25)]->mixture->run
    let prediction = switch prediction' {
    | Dist(PointSet(p)) => p
    | _ => raise(MixtureFailed)
    }

    let answer = 2.0 // So this is: assigning 100% probability to 2.0
    let result = PointSetDist_Scoring.WithScalarAnswer.score(~estimate=prediction, ~answer)
    switch result {
    | Ok(x) => x->expect->toEqual(-.Js.Math.log(0.25 /. 1.0))
    | _ => raise(ScoreFailed)
    }
  })

  test("score: agrees with analytical answer when finite", () => {
    let prediction' = [(pointA, 0.75), (pointB, 0.25)]->mixture->run
    let prediction = switch prediction' {
    | Dist(PointSet(p)) => p
    | _ => raise(MixtureFailed)
    }
    let answer = 3.0 // So this is: assigning 100% probability to 2.0
    let result = PointSetDist_Scoring.WithScalarAnswer.score(~estimate=prediction, ~answer)
    switch result {
    | Ok(x) => x->expect->toEqual(-.Js.Math.log(0.75 /. 1.0))
    | _ => raise(ScoreFailed)
    }
  })

  test("scoreWithPrior: agrees with analytical answer when finite", () => {
    let prior' = [(pointA, 0.5), (pointB, 0.5)]->mixture->run
    let prediction' = [(pointA, 0.75), (pointB, 0.25)]->mixture->run

    let prediction = switch prediction' {
    | Dist(PointSet(p)) => p
    | _ => raise(MixtureFailed)
    }

    let prior = switch prior' {
    | Dist(PointSet(p)) => p
    | _ => raise(MixtureFailed)
    }

    let answer = 3.0 // So this is: assigning 100% probability to 2.0
    let result = PointSetDist_Scoring.WithScalarAnswer.scoreWithPrior(
      ~estimate=prediction,
      ~answer,
      ~prior,
    )
    switch result {
    | Ok(x) => x->expect->toEqual(-.Js.Math.log(0.75 /. 1.0) -. -.Js.Math.log(0.5 /. 1.0))
    | _ => raise(ScoreFailed)
    }
  })
})
