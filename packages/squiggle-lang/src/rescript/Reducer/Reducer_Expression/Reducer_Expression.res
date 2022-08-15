module BindingsReplacer = Reducer_Expression_BindingsReplacer
module BuiltIn = Reducer_Dispatch_BuiltIn
module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module Extra = Reducer_Extra
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Lambda = Reducer_Expression_Lambda
module Macro = Reducer_Expression_Macro
module MathJs = Reducer_MathJs
module Bindings = Reducer_Bindings
module Result = Belt.Result
module T = Reducer_Expression_T

type environment = InternalExpressionValue.environment
type errorValue = Reducer_ErrorValue.errorValue
type expression = T.expression
type internalExpressionValue = InternalExpressionValue.t
type externalExpressionValue = ReducerInterface_ExternalExpressionValue.t
type t = expression

/*
  Converts a Squigle code to expression
*/
let parse = (peggyCode: string): result<t, errorValue> =>
  peggyCode->Reducer_Peggy_Parse.parse->Result.map(Reducer_Peggy_ToExpression.fromNode)

/*
  Recursively evaluate/reduce the expression (Lisp AST)
*/
let rec reduceExpression = (expression: t, bindings: T.bindings, environment: environment): result<
  internalExpressionValue,
  'e,
> => {
  // Js.log(`reduce: ${T.toString(expression)} bindings: ${bindings->Bindings.toString}`)
  switch expression {
  | T.EValue(value) => value->Ok
  | T.EList(list) =>
    switch list {
    | list{EValue(IEvCall(fName)), ..._args} =>
      switch Macro.isMacroName(fName) {
      // A macro expands then reduces itself
      | true => Macro.doMacroCall(expression, bindings, environment, reduceExpression)
      | false => reduceExpressionList(list, bindings, environment)
      }
    | _ => reduceExpressionList(list, bindings, environment)
    }
  }
}

and reduceExpressionList = (
  expressions: list<t>,
  bindings: T.bindings,
  environment: environment,
): result<internalExpressionValue, 'e> => {
  let racc: result<
    list<internalExpressionValue>,
    'e,
  > = expressions->Belt.List.reduceReverse(Ok(list{}), (racc, each: expression) =>
    racc->Result.flatMap(acc => {
      each
      ->reduceExpression(bindings, environment)
      ->Result.map(newNode => {
        acc->Belt.List.add(newNode)
      })
    })
  )
  racc->Result.flatMap(acc => acc->reduceValueList(environment))
}

/*
    After reducing each level of expression(Lisp AST), we have a value list to evaluate
 */
and reduceValueList = (valueList: list<internalExpressionValue>, environment): result<
  internalExpressionValue,
  'e,
> =>
  switch valueList {
  | list{IEvCall(fName), ...args} => {
      let rCheckedArgs = switch fName {
      | "$_setBindings_$" | "$_setTypeOfBindings_$" | "$_setTypeAliasBindings_$" => args->Ok
      | _ => args->Lambda.checkIfReduced
      }

      rCheckedArgs->Result.flatMap(checkedArgs =>
        (fName, checkedArgs->Belt.List.toArray)->BuiltIn.dispatch(environment, reduceExpression)
      )
    }
  | list{IEvLambda(_)} =>
    // TODO: remove on solving issue#558
    valueList
    ->Lambda.checkIfReduced
    ->Result.flatMap(reducedValueList =>
      reducedValueList->Belt.List.toArray->InternalExpressionValue.IEvArray->Ok
    )
  | list{IEvLambda(lamdaCall), ...args} =>
    args
    ->Lambda.checkIfReduced
    ->Result.flatMap(checkedArgs =>
      Lambda.doLambdaCall(lamdaCall, checkedArgs, environment, reduceExpression)
    )

  | _ =>
    valueList
    ->Lambda.checkIfReduced
    ->Result.flatMap(reducedValueList =>
      reducedValueList->Belt.List.toArray->InternalExpressionValue.IEvArray->Ok
    )
  }

let evalUsingBindingsExpression_ = (aExpression, bindings, environment): result<
  internalExpressionValue,
  'e,
> => reduceExpression(aExpression, bindings, environment)

let evaluateUsingOptions = (
  ~environment: option<ReducerInterface_ExternalExpressionValue.environment>,
  ~externalBindings: option<ReducerInterface_ExternalExpressionValue.externalBindings>,
  code: string,
): result<externalExpressionValue, errorValue> => {
  let anEnvironment = Belt.Option.getWithDefault(
    environment,
    ReducerInterface_ExternalExpressionValue.defaultEnvironment,
  )

  let mergedBindings: InternalExpressionValue.nameSpace = Bindings.merge(
    ReducerInterface_StdLib.internalStdLib,
    Belt.Option.map(externalBindings, Bindings.fromTypeScriptBindings)->Belt.Option.getWithDefault(
      Bindings.emptyModule,
    ),
  )

  parse(code)
  ->Result.flatMap(expr => evalUsingBindingsExpression_(expr, mergedBindings, anEnvironment))
  ->Result.map(ReducerInterface_InternalExpressionValue.toExternal)
}

/*
  IEvaluates Squiggle code and bindings via Reducer and answers the result
*/
let evaluate = (code: string): result<externalExpressionValue, errorValue> => {
  evaluateUsingOptions(~environment=None, ~externalBindings=None, code)
}
let evaluatePartialUsingExternalBindings = (
  code: string,
  externalBindings: ReducerInterface_ExternalExpressionValue.externalBindings,
  environment: ReducerInterface_ExternalExpressionValue.environment,
): result<ReducerInterface_ExternalExpressionValue.externalBindings, errorValue> => {
  let rAnswer = evaluateUsingOptions(
    ~environment=Some(environment),
    ~externalBindings=Some(externalBindings),
    code,
  )
  switch rAnswer {
  | Ok(EvModule(externalBindings)) => Ok(externalBindings)
  | Ok(_) =>
    Error(Reducer_ErrorValue.RESyntaxError(`Partials must end with an assignment or record`, None))
  | Error(err) => err->Error
  }
}
