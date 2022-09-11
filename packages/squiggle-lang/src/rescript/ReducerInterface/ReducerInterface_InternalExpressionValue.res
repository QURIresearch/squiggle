// deprecated, use Reducer_T instead
// (value methods should be moved to Reducer_Value.res)

module ErrorValue = Reducer_ErrorValue
module Extra_Array = Reducer_Extra_Array
type environment = GenericDist.env
module T = Reducer_T

let defaultEnvironment: environment = DistributionOperation.defaultEnv

type t = Reducer_T.value

type internalExpressionValue = t

type functionCall = (string, array<t>)

let rec toString = (aValue: T.value) =>
  switch aValue {
  | IEvArray(anArray) => toStringArray(anArray)
  | IEvArrayString(anArray) => toStringArrayString(anArray)
  | IEvBindings(m) => toStringBindings(m)
  | IEvBool(aBool) => toStringBool(aBool)
  // | IEvCall(fName) => toStringCall(fName)
  | IEvDate(date) => toStringDate(date)
  | IEvDeclaration(d) => toStringDeclaration(d)
  | IEvDistribution(dist) => toStringDistribution(dist)
  | IEvLambda(lambdaValue) => toStringLambda(lambdaValue)
  | IEvNumber(aNumber) => toStringNumber(aNumber)
  | IEvRecord(aMap) => aMap->toStringRecord
  | IEvString(aString) => toStringString(aString)
  // | IEvSymbol(aString) => toStringSymbol(aString)
  | IEvTimeDuration(t) => toStringTimeDuration(t)
  | IEvType(aMap) => toStringType(aMap)
  | IEvTypeIdentifier(id) => toStringTypeIdentifier(id)
  | IEvVoid => toStringVoid
  }
and toStringArray = anArray => {
  let args = anArray->Js.Array2.map(each => toString(each))->Js.Array2.toString
  `[${args}]`
}
and toStringArrayString = anArray => {
  let args = anArray->Js.Array2.toString
  `[${args}]`
}
and toStringBindings = m => `@${m->toStringNameSpace}`
and toStringBool = aBool => Js.String.make(aBool)
and toStringCall = fName => `:${fName}`
and toStringDate = date => DateTime.Date.toString(date)
and toStringDeclaration = d => Declaration.toString(d, r => toString(IEvLambda(r)))
and toStringDistribution = dist => GenericDist.toString(dist)
and toStringLambda = (lambdaValue: T.lambdaValue) =>
  `lambda(${Js.Array2.toString(lambdaValue.parameters)}=>internal code)`
and toStringFunction = (lambdaValue: T.lambdaValue) => `function(${Js.Array2.toString(lambdaValue.parameters)})`
and toStringNumber = aNumber => Js.String.make(aNumber)
and toStringRecord = aMap => aMap->toStringMap
and toStringString = aString => `'${aString}'`
and toStringSymbol = aString => `:${aString}`
and toStringTimeDuration = t => DateTime.Duration.toString(t)
and toStringType = aMap => aMap->toStringMap
and toStringTypeIdentifier = id => `#${id}`
and toStringVoid = `()`

and toStringMap = aMap => {
  let pairs =
    aMap
    ->Belt.Map.String.toArray
    ->Js.Array2.map(((eachKey, eachValue)) => `${eachKey}: ${toString(eachValue)}`)
    ->Js.Array2.toString
  `{${pairs}}`
}
and toStringNameSpace = nameSpace => {
  let T.NameSpace(container, parent) = nameSpace
  let pairs =
    container
    ->Belt.MutableMap.String.toArray
    ->Js.Array2.map(((eachKey, eachValue)) => `${eachKey}: ${toString(eachValue)}`)
    ->Js.Array2.toString
  
  switch parent {
    | Some(p) => `{${pairs}} / ${toStringNameSpace(p)}`
    | None => `{${pairs}}`
  }
}

let toStringWithType = (aValue: T.value) =>
  switch aValue {
  | IEvArray(_) => `Array::${toString(aValue)}`
  | IEvArrayString(_) => `ArrayString::${toString(aValue)}`
  | IEvBool(_) => `Bool::${toString(aValue)}`
  // | IEvCall(_) => `Call::${toString(aValue)}`
  | IEvDate(_) => `Date::${toString(aValue)}`
  | IEvDeclaration(_) => `Declaration::${toString(aValue)}`
  | IEvDistribution(_) => `Distribution::${toString(aValue)}`
  | IEvLambda(_) => `Lambda::${toString(aValue)}`
  | IEvBindings(_) => `Bindings::${toString(aValue)}`
  | IEvNumber(_) => `Number::${toString(aValue)}`
  | IEvRecord(_) => `Record::${toString(aValue)}`
  | IEvString(_) => `String::${toString(aValue)}`
  // | IEvSymbol(_) => `Symbol::${toString(aValue)}`
  | IEvTimeDuration(_) => `Date::${toString(aValue)}`
  | IEvType(_) => `Type::${toString(aValue)}`
  | IEvTypeIdentifier(_) => `TypeIdentifier::${toString(aValue)}`
  | IEvVoid => `Void`
  }

let argsToString = (args: array<t>): string => {
  args->Js.Array2.map(arg => arg->toString)->Js.Array2.toString
}

let toStringFunctionCall = ((fn, args)): string => `${fn}(${argsToString(args)})`

let toStringResult = x =>
  switch x {
  | Ok(a) => `Ok(${toString(a)})`
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

let toStringOptionResult = x =>
  switch x {
  | Some(a) => toStringResult(a)
  | None => "None"
  }

let toStringResultOkless = (codeResult: result<t, ErrorValue.errorValue>): string =>
  switch codeResult {
  | Ok(a) => toString(a)
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

let toStringResultRecord = x =>
  switch x {
  | Ok(a) => `Ok(${toStringMap(a)})`
  | Error(m) => `Error(${ErrorValue.errorToString(m)})`
  }

type internalExpressionValueType =
  | EvtArray
  | EvtArrayString
  | EvtBool
  // | EvtCall
  | EvtDate
  | EvtDeclaration
  | EvtDistribution
  | EvtLambda
  | EvtModule
  | EvtNumber
  | EvtRecord
  | EvtString
  // | EvtSymbol
  | EvtTimeDuration
  | EvtType
  | EvtTypeIdentifier
  | EvtVoid

type functionCallSignature = CallSignature(string, array<internalExpressionValueType>)
type functionDefinitionSignature =
  FunctionDefinitionSignature(functionCallSignature, internalExpressionValueType)

let valueToValueType = (value: T.value) =>
  switch value {
  | IEvArray(_) => EvtArray
  | IEvArrayString(_) => EvtArrayString
  | IEvBool(_) => EvtBool
  // | IEvCall(_) => EvtCall
  | IEvDate(_) => EvtDate
  | IEvDeclaration(_) => EvtDeclaration
  | IEvDistribution(_) => EvtDistribution
  | IEvLambda(_) => EvtLambda
  | IEvBindings(_) => EvtModule
  | IEvNumber(_) => EvtNumber
  | IEvRecord(_) => EvtRecord
  | IEvString(_) => EvtString
  // | IEvSymbol(_) => EvtSymbol
  | IEvTimeDuration(_) => EvtTimeDuration
  | IEvType(_) => EvtType
  | IEvTypeIdentifier(_) => EvtTypeIdentifier
  | IEvVoid => EvtVoid
  }

let functionCallToCallSignature = (functionCall: functionCall): functionCallSignature => {
  let (fn, args) = functionCall
  CallSignature(fn, args->Js.Array2.map(valueToValueType))
}

let valueTypeToString = (valueType: internalExpressionValueType): string =>
  switch valueType {
  | EvtArray => `Array`
  | EvtArrayString => `ArrayString`
  | EvtBool => `Bool`
  // | EvtCall => `Call`
  | EvtDate => `Date`
  | EvtDeclaration => `Declaration`
  | EvtDistribution => `Distribution`
  | EvtLambda => `Lambda`
  | EvtModule => `Module`
  | EvtNumber => `Number`
  | EvtRecord => `Record`
  | EvtString => `String`
  // | EvtSymbol => `Symbol`
  | EvtTimeDuration => `Duration`
  | EvtType => `Type`
  | EvtTypeIdentifier => `TypeIdentifier`
  | EvtVoid => `Void`
  }

let functionCallSignatureToString = (functionCallSignature: functionCallSignature): string => {
  let CallSignature(fn, args) = functionCallSignature
  `${fn}(${args->Js.Array2.map(valueTypeToString)->Js.Array2.toString})`
}

let arrayToValueArray = (arr: array<t>): array<t> => arr

let recordToKeyValuePairs = (record: T.map): array<(string, t)> => record->Belt.Map.String.toArray
