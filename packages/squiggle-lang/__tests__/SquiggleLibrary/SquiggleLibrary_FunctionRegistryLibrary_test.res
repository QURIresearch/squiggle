open Jest
open Expect
open Reducer_TestHelpers

let expectEvalToBeOk = (expr: string) =>
  Reducer.evaluate(expr)->Reducer_Helpers.rRemoveDefaultsExternal->E.R.isOk->expect->toBe(true)

let registry = FunctionRegistry_Library.registry
let examples = E.A.to_list(FunctionRegistry_Core.Registry.allExamples(registry))

describe("FunctionRegistry Library", () => {
  describe("Regular tests", () => {
    testEvalToBe("List.make(3, 'HI')", "Ok(['HI','HI','HI'])")
    testEvalToBe("make(3, 'HI')", "Error(Function not found: make(Number,String))")
    testEvalToBe("List.upTo(1,3)", "Ok([1,2,3])")
    testEvalToBe("List.first([3,5,8])", "Ok(3)")
    testEvalToBe("List.last([3,5,8])", "Ok(8)")
    testEvalToBe("List.reverse([3,5,8])", "Ok([8,5,3])")
    testEvalToBe("double(x)=2*x; arr=[1,2,3]; List.map(arr, double)", "Ok([2,4,6])")
    testEvalToBe("double(x)=2*x; arr=[1,2,3]; map(arr, double)", "Ok([2,4,6])")
    testEvalToBe("myadd(acc,x)=acc+x; arr=[1,2,3]; List.reduce(arr, 0, myadd)", "Ok(6)")
    testEvalToBe("change(acc,x)=acc*x+x; arr=[1,2,3]; List.reduce(arr, 0, change)", "Ok(15)")
    testEvalToBe("change(acc,x)=acc*x+x; arr=[1,2,3]; List.reduceReverse(arr, 0, change)", "Ok(9)")
    testEvalToBe("check(x)=(x==2);arr=[1,2,3]; List.filter(arr,check)", "Ok([2])")
    testEvalToBe("arr=[1,2,3]; List.reverse(arr)", "Ok([3,2,1])")
    testEvalToBe("Dist.normal(5,2)", "Ok(Normal(5,2))")
    testEvalToBe("normal(5,2)", "Ok(Normal(5,2))")
    testEvalToBe("normal({mean:5,stdev:2})", "Ok(Normal(5,2))")
    testEvalToBe("-2 to 4", "Ok(Normal(1,1.8238704957353074))")
    testEvalToBe("pointMass(5)", "Ok(PointMass(5))")
    testEvalToBe("Number.floor(5.5)", "Ok(5)")
    testEvalToBe("Number.ceil(5.5)", "Ok(6)")
    testEvalToBe("floor(5.5)", "Ok(5)")
    testEvalToBe("ceil(5.5)", "Ok(6)")
    testEvalToBe("Number.abs(5.5)", "Ok(5.5)")
    testEvalToBe("abs(5.5)", "Ok(5.5)")
    testEvalToBe("Number.exp(10)", "Ok(22026.465794806718)")
    testEvalToBe("Number.log10(10)", "Ok(1)")
    testEvalToBe("Number.log2(10)", "Ok(3.321928094887362)")
    testEvalToBe("Number.sum([2,5,3])", "Ok(10)")
    testEvalToBe("sum([2,5,3])", "Ok(10)")
    testEvalToBe("Number.product([2,5,3])", "Ok(30)")
    testEvalToBe("Number.min([2,5,3])", "Ok(2)")
    testEvalToBe("Number.max([2,5,3])", "Ok(5)")
    testEvalToBe("Number.mean([0,5,10])", "Ok(5)")
    testEvalToBe("Number.geomean([1,5,18])", "Ok(4.481404746557164)")
    testEvalToBe("Number.stdev([0,5,10,15])", "Ok(5.5901699437494745)")
    testEvalToBe("Number.variance([0,5,10,15])", "Ok(31.25)")
    testEvalToBe("Number.sort([10,0,15,5])", "Ok([0,5,10,15])")
    testEvalToBe("Number.cumsum([1,5,3])", "Ok([1,6,9])")
    testEvalToBe("Number.cumprod([1,5,3])", "Ok([1,5,15])")
    testEvalToBe("Number.diff([1,5,3])", "Ok([4,-2])")
    testEvalToBe(
      "Dist.logScore({estimate: normal(5,2), answer: normal(5.2,1), prior: normal(5.5,3)})",
      "Ok(-0.33591375663884876)",
    )
    testEvalToBe(
      "Dist.logScore({estimate: normal(5,2), answer: normal(5.2,1)})",
      "Ok(0.32244107041564646)",
    )
    testEvalToBe("Dist.logScore({estimate: normal(5,2), answer: 4.5})", "Ok(1.6433360626394853)")
    testEvalToBe("Dist.klDivergence(normal(5,2), normal(5,1.5))", "Ok(0.06874342818671068)")
    testEvalToBe("SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5])", "Ok(Sample Set Distribution)")
    testEvalToBe("SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5])", "Ok(Sample Set Distribution)")
    testEvalToBe("SampleSet.fromFn({|| sample(normal(5,2))})", "Ok(Sample Set Distribution)")
    testEvalToBe(
      "addOne(t)=t+1; SampleSet.toList(SampleSet.map(SampleSet.fromList([1,2,3,4,5,6]), addOne))",
      "Ok([2,3,4,5,6,7])",
    )
    testEvalToBe(
      "SampleSet.toList(SampleSet.mapN([SampleSet.fromList([1,2,3,4,5,6]), SampleSet.fromList([6, 5, 4, 3, 2, 1])], {|x| x[0] > x[1] ? x[0] : x[1]}))",
      "Ok([6,5,4,4,5,6])",
    )
  })

  describe("Fn auto-testing", () => {
    testAll("tests of validity", examples, r => {
      expectEvalToBeOk(r)
    })

    testAll(
      "tests of type",
      E.A.to_list(
        FunctionRegistry_Core.Registry.allExamplesWithFns(registry)->E.A2.filter(((fn, _)) =>
          E.O.isSome(fn.output)
        ),
      ),
      ((fn, example)) => {
        let responseType =
          example
          ->Reducer.evaluate
          ->E.R2.fmap(ReducerInterface_InternalExpressionValue.externalValueToValueType)
        let expectedOutputType = fn.output |> E.O.toExn("")
        expect(responseType)->toEqual(Ok(expectedOutputType))
      },
    )
  })
})
