@genType type squiggleValue = ReducerInterface_InternalExpressionValue.t //re-export
type reducerErrorValue = ForTS_Reducer_ErrorValue.reducerErrorValue //use

@genType type squiggleValue_Array = ReducerInterface_InternalExpressionValue.squiggleArray //re-export recursive type
@genType type squiggleValue_Module = ReducerInterface_InternalExpressionValue.nameSpace //re-export recursive type
@genType type squiggleValue_Record = ReducerInterface_InternalExpressionValue.map //re-export recursive type
@genType type squiggleValue_Type = ReducerInterface_InternalExpressionValue.map //re-export recursive type
type squiggleValue_Declaration = ForTS_SquiggleValue_Declaration.squiggleValue_Declaration //use
type squiggleValue_Distribution = ForTS_SquiggleValue_Distribution.squiggleValue_Distribution //use
type squiggleValue_Lambda = ForTS_SquiggleValue_Lambda.squiggleValue_Lambda //use

// Return values are kept as they are if they are JavaScript types.

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtArray_: string = "Array"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtArrayString_: string = "ArrayString"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtBool_: string = "Bool"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtCall_: string = "Call"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtDate_: string = "Date"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtDeclaration_: string = "Declaration"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtDistribution_: string = "Distribution"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtLambda_: string = "Lambda"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtModule_: string = "Module"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtNumber_: string = "Number"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtRecord_: string = "Record"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtString_: string = "String"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtSymbol_: string = "Symbol"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtTimeDuration_: string = "TimeDuration"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtType_: string = "Type"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtTypeIdentifier_: string = "TypeIdentifier"

@module("./ForTS_SquiggleValue_tag") @scope("squiggleValueTag")
external svtVoid_: string = "Void"

@genType.import("./ForTS_SquiggleValue_tag")
type squiggleValueTag

external castEnum: string => squiggleValueTag = "%identity"

@genType
let getTag = (variant: squiggleValue): squiggleValueTag =>
  switch variant {
  | IEvArray(_) => svtArray_->castEnum
  | IEvArrayString(_) => svtArrayString_->castEnum
  | IEvBool(_) => svtBool_->castEnum
  | IEvCall(_) => svtCall_->castEnum //Impossible
  | IEvDate(_) => svtDate_->castEnum
  | IEvDeclaration(_) => svtDeclaration_->castEnum
  | IEvDistribution(_) => svtDistribution_->castEnum
  | IEvLambda(_) => svtLambda_->castEnum
  | IEvBindings(_) => svtModule_->castEnum //Impossible
  | IEvNumber(_) => svtNumber_->castEnum
  | IEvRecord(_) => svtRecord_->castEnum
  | IEvString(_) => svtString_->castEnum
  | IEvSymbol(_) => svtSymbol_->castEnum
  | IEvTimeDuration(_) => svtTimeDuration_->castEnum
  | IEvType(_) => svtType_->castEnum
  | IEvTypeIdentifier(_) => svtTypeIdentifier_->castEnum
  | IEvVoid => svtVoid_->castEnum
  }

@genType
let toString = (variant: squiggleValue) =>
  ReducerInterface_InternalExpressionValue.toString(variant)

// This is a useful method for unit tests.
// Convert the result along with the error message to a string.
@genType
let toStringResult = (variantResult: result<squiggleValue, reducerErrorValue>) =>
  ReducerInterface_InternalExpressionValue.toStringResult(variantResult)

@genType
let getArray = (variant: squiggleValue): option<squiggleValue_Array> =>
  //FIXME: Convert
  switch variant {
  | IEvArray(arrayLike) => arrayLike->Some
  | _ => None
  }

@genType
let getArrayString = (variant: squiggleValue): option<array<string>> =>
  switch variant {
  | IEvArrayString(value) => value->Some
  | _ => None
  }

@genType
let getBool = (variant: squiggleValue): option<bool> =>
  switch variant {
  | IEvBool(value) => value->Some
  | _ => None
  }

@genType
let getCall = (variant: squiggleValue): option<string> =>
  switch variant {
  | IEvCall(value) => value->Some
  | _ => None
  }

@genType
let getDate = (variant: squiggleValue): option<Js.Date.t> =>
  switch variant {
  | IEvDate(value) => value->Some
  | _ => None
  }

@genType
let getDeclaration = (variant: squiggleValue): option<squiggleValue_Declaration> =>
  switch variant {
  | IEvDeclaration(value) => value->Some
  | _ => None
  }

@genType
let getDistribution = (variant: squiggleValue): option<squiggleValue_Distribution> =>
  switch variant {
  | IEvDistribution(value) => value->Some
  | _ => None
  }

@genType
let getLambda = (variant: squiggleValue): option<squiggleValue_Lambda> =>
  switch variant {
  | IEvLambda(value) => value->Some
  | _ => None
  }

@genType
let getModule = (variant: squiggleValue): option<squiggleValue_Module> =>
  switch variant {
  | IEvBindings(value) => value->Some
  | _ => None
  }

@genType
let getNumber = (variant: squiggleValue): option<float> =>
  switch variant {
  | IEvNumber(value) => value->Some
  | _ => None
  }

@genType
let getRecord = (variant: squiggleValue): option<squiggleValue_Record> =>
  switch variant {
  | IEvRecord(value) => value->Some
  | _ => None
  }

@genType
let getString = (variant: squiggleValue): option<string> =>
  switch variant {
  | IEvString(value) => value->Some
  | _ => None
  }

@genType
let getSymbol = (variant: squiggleValue): option<string> =>
  switch variant {
  | IEvSymbol(value) => value->Some
  | _ => None
  }

@genType
let getTimeDuration = (variant: squiggleValue): option<float> =>
  switch variant {
  | IEvTimeDuration(value) => value->Some
  | _ => None
  }

@genType
let getType = (variant: squiggleValue): option<squiggleValue_Type> =>
  switch variant {
  | IEvType(value) => value->Some
  | _ => None
  }

@genType
let getTypeIdentifier = (variant: squiggleValue): option<string> =>
  switch variant {
  | IEvTypeIdentifier(value) => value->Some
  | _ => None
  }
