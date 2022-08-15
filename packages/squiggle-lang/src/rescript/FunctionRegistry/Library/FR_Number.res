open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Number"
let requiresNamespace = false

module NumberToNumber = {
  let make = (name, fn) =>
    FnDefinition.make(
      ~name,
      ~inputs=[FRTypeNumber],
      ~run=(_, inputs, _, _) => {
        inputs
        ->getOrError(0)
        ->E.R.bind(Prepare.oneNumber)
        ->E.R2.fmap(fn)
        ->E.R2.fmap(Wrappers.evNumber)
      },
      (),
    )
}

module ArrayNumberDist = {
  let make = (name, fn) => {
    FnDefinition.make(
      ~name,
      ~inputs=[FRTypeArray(FRTypeNumber)],
      ~run=(_, inputs, _, _) =>
        Prepare.ToTypedArray.numbers(inputs)
        ->E.R.bind(r => E.A.length(r) === 0 ? Error("List is empty") : Ok(r))
        ->E.R.bind(fn),
      (),
    )
  }
  let make2 = (name, fn) => {
    FnDefinition.make(
      ~name,
      ~inputs=[FRTypeArray(FRTypeAny)],
      ~run=(_, inputs, _, _) =>
        Prepare.ToTypedArray.numbers(inputs)
        ->E.R.bind(r => E.A.length(r) === 0 ? Error("List is empty") : Ok(r))
        ->E.R.bind(fn),
      (),
    )
  }
}

let library = [
  Function.make(
    ~name="floor",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`floor(3.5)`],
    ~definitions=[NumberToNumber.make("floor", Js.Math.floor_float)],
    (),
  ),
  Function.make(
    ~name="ceiling",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`ceil(3.5)`],
    ~definitions=[NumberToNumber.make("ceil", Js.Math.ceil_float)],
    (),
  ),
  Function.make(
    ~name="absolute value",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`abs(3.5)`],
    ~definitions=[NumberToNumber.make("abs", Js.Math.abs_float)],
    (),
  ),
  Function.make(
    ~name="exponent",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`exp(3.5)`],
    ~definitions=[NumberToNumber.make("exp", Js.Math.exp)],
    (),
  ),
  Function.make(
    ~name="log",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`log(3.5)`],
    ~definitions=[NumberToNumber.make("log", Js.Math.log)],
    (),
  ),
  Function.make(
    ~name="log base 10",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`log10(3.5)`],
    ~definitions=[NumberToNumber.make("log10", Js.Math.log10)],
    (),
  ),
  Function.make(
    ~name="log base 2",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`log2(3.5)`],
    ~definitions=[NumberToNumber.make("log2", Js.Math.log2)],
    (),
  ),
  Function.make(
    ~name="round",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`round(3.5)`],
    ~definitions=[NumberToNumber.make("round", Js.Math.round)],
    (),
  ),
  Function.make(
    ~name="sum",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`sum([3,5,2])`],
    ~definitions=[ArrayNumberDist.make("sum", r => r->E.A.Floats.sum->Wrappers.evNumber->Ok)],
    (),
  ),
  Function.make(
    ~name="product",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`product([3,5,2])`],
    ~definitions=[
      ArrayNumberDist.make("product", r => r->E.A.Floats.product->Wrappers.evNumber->Ok),
    ],
    (),
  ),
  Function.make(
    ~name="min",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`min([3,5,2])`],
    ~definitions=[ArrayNumberDist.make("min", r => r->E.A.Floats.min->Wrappers.evNumber->Ok)],
    (),
  ),
  Function.make(
    ~name="max",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`max([3,5,2])`],
    ~definitions=[ArrayNumberDist.make("max", r => r->E.A.Floats.max->Wrappers.evNumber->Ok)],
    (),
  ),
  Function.make(
    ~name="mean",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`mean([3,5,2])`],
    ~definitions=[ArrayNumberDist.make("mean", r => r->E.A.Floats.mean->Wrappers.evNumber->Ok)],
    (),
  ),
  Function.make(
    ~name="geometric mean",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`geomean([3,5,2])`],
    ~definitions=[
      ArrayNumberDist.make("geomean", r => r->E.A.Floats.geomean->Wrappers.evNumber->Ok),
    ],
    (),
  ),
  Function.make(
    ~name="standard deviation",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`stdev([3,5,2,3,5])`],
    ~definitions=[ArrayNumberDist.make("stdev", r => r->E.A.Floats.stdev->Wrappers.evNumber->Ok)],
    (),
  ),
  Function.make(
    ~name="variance",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtNumber,
    ~examples=[`variance([3,5,2,3,5])`],
    ~definitions=[
      ArrayNumberDist.make("variance", r => r->E.A.Floats.variance->Wrappers.evNumber->Ok),
    ],
    (),
  ),
  Function.make(
    ~name="sort",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtArray,
    ~examples=[`sort([3,5,2,3,5])`],
    ~definitions=[
      ArrayNumberDist.make("sort", r =>
        r->E.A.Floats.sort->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
      ),
    ],
    (),
  ),
  Function.make(
    ~name="cumulative sum",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtArray,
    ~examples=[`cumsum([3,5,2,3,5])`],
    ~definitions=[
      ArrayNumberDist.make("cumsum", r =>
        r->E.A.Floats.cumSum->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
      ),
    ],
    (),
  ),
  Function.make(
    ~name="cumulative prod",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtArray,
    ~examples=[`cumprod([3,5,2,3,5])`],
    ~definitions=[
      ArrayNumberDist.make("cumprod", r =>
        r->E.A.Floats.cumProd->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
      ),
    ],
    (),
  ),
  Function.make(
    ~name="diff",
    ~nameSpace,
    ~requiresNamespace,
    ~output=EvtArray,
    ~examples=[`diff([3,5,2,3,5])`],
    ~definitions=[
      ArrayNumberDist.make("diff", r =>
        r->E.A.Floats.diff->E.A2.fmap(Wrappers.evNumber)->Wrappers.evArray->Ok
      ),
    ],
    (),
  ),
]
