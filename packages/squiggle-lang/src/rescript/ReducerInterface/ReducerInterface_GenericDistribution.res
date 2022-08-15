module IEV = ReducerInterface_InternalExpressionValue
type internalExpressionValue = IEV.t

module Helpers = {
  let arithmeticMap = r =>
    switch r {
    | "add" => #Add
    | "dotAdd" => #Add
    | "subtract" => #Subtract
    | "dotSubtract" => #Subtract
    | "divide" => #Divide
    | "log" => #Logarithm
    | "dotDivide" => #Divide
    | "pow" => #Power
    | "dotPow" => #Power
    | "multiply" => #Multiply
    | "dotMultiply" => #Multiply
    | _ => #Multiply
    }

  let catchAndConvertTwoArgsToDists = (args: array<internalExpressionValue>): option<(
    DistributionTypes.genericDist,
    DistributionTypes.genericDist,
  )> =>
    switch args {
    | [IEvDistribution(a), IEvDistribution(b)] => Some((a, b))
    | [IEvNumber(a), IEvDistribution(b)] => Some((GenericDist.fromFloat(a), b))
    | [IEvDistribution(a), IEvNumber(b)] => Some((a, GenericDist.fromFloat(b)))
    | _ => None
    }

  let toFloatFn = (
    fnCall: DistributionTypes.DistributionOperation.toFloat,
    dist: DistributionTypes.genericDist,
    ~env: GenericDist.env,
  ) => {
    FromDist(#ToFloat(fnCall), dist)->DistributionOperation.run(~env)->Some
  }

  let toStringFn = (
    fnCall: DistributionTypes.DistributionOperation.toString,
    dist: DistributionTypes.genericDist,
    ~env: GenericDist.env,
  ) => {
    FromDist(#ToString(fnCall), dist)->DistributionOperation.run(~env)->Some
  }

  let toBoolFn = (
    fnCall: DistributionTypes.DistributionOperation.toBool,
    dist: DistributionTypes.genericDist,
    ~env: GenericDist.env,
  ) => {
    FromDist(#ToBool(fnCall), dist)->DistributionOperation.run(~env)->Some
  }

  let toDistFn = (
    fnCall: DistributionTypes.DistributionOperation.toDist,
    dist,
    ~env: GenericDist.env,
  ) => {
    FromDist(#ToDist(fnCall), dist)->DistributionOperation.run(~env)->Some
  }

  let twoDiststoDistFn = (direction, arithmetic, dist1, dist2, ~env: GenericDist.env) => {
    FromDist(
      #ToDistCombination(direction, arithmeticMap(arithmetic), #Dist(dist2)),
      dist1,
    )->DistributionOperation.run(~env)
  }

  let parseNumber = (args: internalExpressionValue): Belt.Result.t<float, string> =>
    switch args {
    | IEvNumber(x) => Ok(x)
    | _ => Error("Not a number")
    }

  let parseNumberArray = (ags: array<internalExpressionValue>): Belt.Result.t<
    array<float>,
    string,
  > => E.A.fmap(parseNumber, ags) |> E.A.R.firstErrorOrOpen

  let parseDist = (args: internalExpressionValue): Belt.Result.t<
    DistributionTypes.genericDist,
    string,
  > =>
    switch args {
    | IEvDistribution(x) => Ok(x)
    | IEvNumber(x) => Ok(GenericDist.fromFloat(x))
    | _ => Error("Not a distribution")
    }

  let parseDistributionArray = (ags: array<internalExpressionValue>): Belt.Result.t<
    array<DistributionTypes.genericDist>,
    string,
  > => E.A.fmap(parseDist, ags) |> E.A.R.firstErrorOrOpen

  let mixtureWithGivenWeights = (
    distributions: array<DistributionTypes.genericDist>,
    weights: array<float>,
    ~env: GenericDist.env,
  ): DistributionOperation.outputType =>
    E.A.length(distributions) == E.A.length(weights)
      ? Mixture(Belt.Array.zip(distributions, weights))->DistributionOperation.run(~env)
      : GenDistError(
          ArgumentError("Error, mixture call has different number of distributions and weights"),
        )

  let mixtureWithDefaultWeights = (
    distributions: array<DistributionTypes.genericDist>,
    ~env: GenericDist.env,
  ): DistributionOperation.outputType => {
    let length = E.A.length(distributions)
    let weights = Belt.Array.make(length, 1.0 /. Belt.Int.toFloat(length))
    mixtureWithGivenWeights(distributions, weights, ~env)
  }

  let mixture = (
    args: array<internalExpressionValue>,
    ~env: GenericDist.env,
  ): DistributionOperation.outputType => {
    let error = (err: string): DistributionOperation.outputType =>
      err->DistributionTypes.ArgumentError->GenDistError
    switch args {
    | [IEvArray(distributions)] =>
      switch parseDistributionArray(distributions) {
      | Ok(distrs) => mixtureWithDefaultWeights(distrs, ~env)
      | Error(err) => error(err)
      }
    | [IEvArray(distributions), IEvArray(weights)] =>
      switch (parseDistributionArray(distributions), parseNumberArray(weights)) {
      | (Ok(distrs), Ok(wghts)) => mixtureWithGivenWeights(distrs, wghts, ~env)
      | (Error(err), Ok(_)) => error(err)
      | (Ok(_), Error(err)) => error(err)
      | (Error(err1), Error(err2)) => error(`${err1}|${err2}`)
      }
    | _ =>
      switch E.A.last(args) {
      | Some(IEvArray(b)) => {
          let weights = parseNumberArray(b)
          let distributions = parseDistributionArray(
            Belt.Array.slice(args, ~offset=0, ~len=E.A.length(args) - 1),
          )
          switch E.R.merge(distributions, weights) {
          | Ok(d, w) => mixtureWithGivenWeights(d, w, ~env)
          | Error(err) => error(err)
          }
        }
      | Some(IEvNumber(_))
      | Some(IEvDistribution(_)) =>
        switch parseDistributionArray(args) {
        | Ok(distributions) => mixtureWithDefaultWeights(distributions, ~env)
        | Error(err) => error(err)
        }
      | _ => error("Last argument of mx must be array or distribution")
      }
    }
  }
}

module SymbolicConstructors = {
  let threeFloat = name =>
    switch name {
    | "triangular" => Ok(SymbolicDist.Triangular.make)
    | _ => Error("Unreachable state")
    }

  let symbolicResultToOutput = (
    symbolicResult: result<SymbolicDistTypes.symbolicDist, string>,
  ): option<DistributionOperation.outputType> =>
    switch symbolicResult {
    | Ok(r) => Some(Dist(Symbolic(r)))
    | Error(r) => Some(GenDistError(OtherError(r)))
    }
}

let dispatchToGenericOutput = (call: IEV.functionCall, env: GenericDist.env): option<
  DistributionOperation.outputType,
> => {
  let (fnName, args) = call
  switch (fnName, args) {
  | ("triangular" as fnName, [IEvNumber(f1), IEvNumber(f2), IEvNumber(f3)]) =>
    SymbolicConstructors.threeFloat(fnName)
    ->E.R.bind(r => r(f1, f2, f3))
    ->SymbolicConstructors.symbolicResultToOutput
  | ("sample", [IEvDistribution(dist)]) => Helpers.toFloatFn(#Sample, dist, ~env)
  | ("sampleN", [IEvDistribution(dist), IEvNumber(n)]) =>
    Some(FloatArray(GenericDist.sampleN(dist, Belt.Int.fromFloat(n))))
  | (("mean" | "stdev" | "variance" | "min" | "max" | "mode") as op, [IEvDistribution(dist)]) => {
      let fn = switch op {
      | "mean" => #Mean
      | "stdev" => #Stdev
      | "variance" => #Variance
      | "min" => #Min
      | "max" => #Max
      | "mode" => #Mode
      | _ => #Mean
      }
      Helpers.toFloatFn(fn, dist, ~env)
    }
  | ("integralSum", [IEvDistribution(dist)]) => Helpers.toFloatFn(#IntegralSum, dist, ~env)
  | ("toString", [IEvDistribution(dist)]) => Helpers.toStringFn(ToString, dist, ~env)
  | ("sparkline", [IEvDistribution(dist)]) =>
    Helpers.toStringFn(ToSparkline(MagicNumbers.Environment.sparklineLength), dist, ~env)
  | ("sparkline", [IEvDistribution(dist), IEvNumber(n)]) =>
    Helpers.toStringFn(ToSparkline(Belt.Float.toInt(n)), dist, ~env)
  | ("exp", [IEvDistribution(a)]) =>
    // https://mathjs.org/docs/reference/functions/exp.html
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "pow",
      GenericDist.fromFloat(MagicNumbers.Math.e),
      a,
      ~env,
    )->Some
  | ("normalize", [IEvDistribution(dist)]) => Helpers.toDistFn(Normalize, dist, ~env)
  | ("isNormalized", [IEvDistribution(dist)]) => Helpers.toBoolFn(IsNormalized, dist, ~env)
  | ("toPointSet", [IEvDistribution(dist)]) => Helpers.toDistFn(ToPointSet, dist, ~env)
  | ("scaleLog", [IEvDistribution(dist)]) =>
    Helpers.toDistFn(Scale(#Logarithm, MagicNumbers.Math.e), dist, ~env)
  | ("scaleLog10", [IEvDistribution(dist)]) => Helpers.toDistFn(Scale(#Logarithm, 10.0), dist, ~env)
  | ("scaleLog", [IEvDistribution(dist), IEvNumber(float)]) =>
    Helpers.toDistFn(Scale(#Logarithm, float), dist, ~env)
  | ("scaleLogWithThreshold", [IEvDistribution(dist), IEvNumber(base), IEvNumber(eps)]) =>
    Helpers.toDistFn(Scale(#LogarithmWithThreshold(eps), base), dist, ~env)
  | ("scaleMultiply", [IEvDistribution(dist), IEvNumber(float)]) =>
    Helpers.toDistFn(Scale(#Multiply, float), dist, ~env)
  | ("scalePow", [IEvDistribution(dist), IEvNumber(float)]) =>
    Helpers.toDistFn(Scale(#Power, float), dist, ~env)
  | ("scaleExp", [IEvDistribution(dist)]) =>
    Helpers.toDistFn(Scale(#Power, MagicNumbers.Math.e), dist, ~env)
  | ("cdf", [IEvDistribution(dist), IEvNumber(float)]) => Helpers.toFloatFn(#Cdf(float), dist, ~env)
  | ("pdf", [IEvDistribution(dist), IEvNumber(float)]) => Helpers.toFloatFn(#Pdf(float), dist, ~env)
  | ("inv", [IEvDistribution(dist), IEvNumber(float)]) => Helpers.toFloatFn(#Inv(float), dist, ~env)
  | ("quantile", [IEvDistribution(dist), IEvNumber(float)]) =>
    Helpers.toFloatFn(#Inv(float), dist, ~env)
  | ("inspect", [IEvDistribution(dist)]) => Helpers.toDistFn(Inspect, dist, ~env)
  | ("truncateLeft", [IEvDistribution(dist), IEvNumber(float)]) =>
    Helpers.toDistFn(Truncate(Some(float), None), dist, ~env)
  | ("truncateRight", [IEvDistribution(dist), IEvNumber(float)]) =>
    Helpers.toDistFn(Truncate(None, Some(float)), dist, ~env)
  | ("truncate", [IEvDistribution(dist), IEvNumber(float1), IEvNumber(float2)]) =>
    Helpers.toDistFn(Truncate(Some(float1), Some(float2)), dist, ~env)
  | ("mx" | "mixture", args) => Helpers.mixture(args, ~env)->Some
  | ("log", [IEvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "log",
      a,
      GenericDist.fromFloat(MagicNumbers.Math.e),
      ~env,
    )->Some
  | ("log10", [IEvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "log",
      a,
      GenericDist.fromFloat(10.0),
      ~env,
    )->Some
  | ("unaryMinus", [IEvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Algebraic(AsDefault),
      "multiply",
      a,
      GenericDist.fromFloat(-1.0),
      ~env,
    )->Some
  | (("add" | "multiply" | "subtract" | "divide" | "pow" | "log") as arithmetic, [_, _] as args) =>
    Helpers.catchAndConvertTwoArgsToDists(args)->E.O2.fmap(((fst, snd)) =>
      Helpers.twoDiststoDistFn(Algebraic(AsDefault), arithmetic, fst, snd, ~env)
    )
  | (
      ("dotAdd"
      | "dotMultiply"
      | "dotSubtract"
      | "dotDivide"
      | "dotPow") as arithmetic,
      [_, _] as args,
    ) =>
    Helpers.catchAndConvertTwoArgsToDists(args)->E.O2.fmap(((fst, snd)) =>
      Helpers.twoDiststoDistFn(Pointwise, arithmetic, fst, snd, ~env)
    )
  | ("dotExp", [IEvDistribution(a)]) =>
    Helpers.twoDiststoDistFn(
      Pointwise,
      "dotPow",
      GenericDist.fromFloat(MagicNumbers.Math.e),
      a,
      ~env,
    )->Some
  | _ => None
  }
}

let genericOutputToReducerValue = (o: DistributionOperation.outputType): result<
  internalExpressionValue,
  Reducer_ErrorValue.errorValue,
> =>
  switch o {
  | Dist(d) => Ok(ReducerInterface_InternalExpressionValue.IEvDistribution(d))
  | Float(d) => Ok(IEvNumber(d))
  | String(d) => Ok(IEvString(d))
  | Bool(d) => Ok(IEvBool(d))
  | FloatArray(d) =>
    Ok(IEvArray(d |> E.A.fmap(r => ReducerInterface_InternalExpressionValue.IEvNumber(r))))
  | GenDistError(err) => Error(REDistributionError(err))
  }

let dispatch = (call: IEV.functionCall, environment) =>
  dispatchToGenericOutput(call, environment)->E.O2.fmap(genericOutputToReducerValue)
