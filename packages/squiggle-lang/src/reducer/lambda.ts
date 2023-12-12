import maxBy from "lodash/maxBy.js";
import uniq from "lodash/uniq.js";
import { LocationRange } from "peggy";

import { ASTNode } from "../ast/parse.js";
import * as IError from "../errors/IError.js";
import { REArityError, REOther } from "../errors/messages.js";
import { Expression } from "../expression/index.js";
import {
  FnDefinition,
  fnDefinitionToString,
  showInDocumentation,
  tryCallFnDefinition,
} from "../library/registry/fnDefinition.js";
import { FRType } from "../library/registry/frTypes.js";
import { sort } from "../utility/E_A_Floats.js";
import { Calculator, Input, Value, VDomain } from "../value/index.js";
import * as Context from "./context.js";
import { ReducerContext } from "./context.js";
import { Stack } from "./stack.js";

export type UserDefinedLambdaParameter = {
  name: string;
  domain?: VDomain; // should this be Domain instead of VDomain?
};

type LambdaBody = (args: Value[], context: ReducerContext) => Value;

export abstract class BaseLambda {
  constructor(public body: LambdaBody) {}

  abstract readonly type: string;
  abstract getName(): string;
  abstract toString(): string;
  abstract parameterString(): string;
  abstract parameterCounts(): number[];
  abstract parameterCountString(): string;
  abstract defaultInputs(): Input[];
  abstract toCalculator(): Calculator;

  callFrom(
    args: Value[],
    context: ReducerContext,
    ast: ASTNode | undefined
  ): Value {
    const newContext: ReducerContext = {
      // Be careful! the order here must match the order of props in ReducerContext.
      // Also, we intentionally don't use object spread syntax because of monomorphism.
      stack: context.stack,
      environment: context.environment,
      frameStack: context.frameStack.extend(
        Context.currentFunctionName(context),
        ast?.location
      ),
      evaluate: context.evaluate,
      inFunction: this,
    };

    try {
      return this.body(args, newContext);
    } catch (e) {
      IError.rethrowWithFrameStack(e, newContext.frameStack);
    }
  }

  call(args: Value[], context: ReducerContext): Value {
    return this.callFrom(args, context, undefined);
  }
}

// User-defined functions, e.g. `add2 = {|x, y| x + y}`, are instances of this class.
export class UserDefinedLambda extends BaseLambda {
  parameters: UserDefinedLambdaParameter[];
  location: LocationRange;
  name?: string;
  readonly type = "UserDefinedLambda";

  constructor(
    name: string | undefined,
    parameters: UserDefinedLambdaParameter[],
    stack: Stack,
    body: Expression,
    location: LocationRange
  ) {
    const lambda: LambdaBody = (args: Value[], context: ReducerContext) => {
      const argsLength = args.length;
      const parametersLength = parameters.length;
      if (argsLength !== parametersLength) {
        throw new REArityError(undefined, parametersLength, argsLength);
      }

      let localStack = stack;
      for (let i = 0; i < parametersLength; i++) {
        const parameter = parameters[i];
        localStack = localStack.push(parameter.name, args[i]);
        if (parameter.domain) {
          parameter.domain.value.validateValue(args[i]);
        }
      }

      const lambdaContext: ReducerContext = {
        stack: localStack,
        // no spread is intentional - helps with monomorphism
        environment: context.environment,
        frameStack: context.frameStack,
        evaluate: context.evaluate,
        inFunction: context.inFunction,
      };

      const [value] = context.evaluate(body, lambdaContext);
      return value;
    };

    super(lambda);
    this.name = name;
    this.parameters = parameters;
    this.location = location;
  }

  getName() {
    return this.name || "<anonymous>";
  }

  _getParameterNames() {
    return this.parameters.map((parameter) => parameter.name);
  }

  parameterString() {
    return this._getParameterNames().join(",");
  }

  toString() {
    return `(${this._getParameterNames().join(",")}) => internal code`;
  }

  parameterCounts() {
    return [this.parameters.length];
  }

  parameterCountString() {
    return this.parameters.length.toString();
  }

  defaultInputs(): Input[] {
    return this._getParameterNames().map((name) => ({
      name,
      type: "text",
    }));
  }

  toCalculator(): Calculator {
    const only0Params = this.parameters.length === 0;
    return {
      fn: this,
      inputs: this.defaultInputs(),
      autorun: only0Params,
    };
  }
}

// Stdlib functions (everything in FunctionRegistry) are instances of this class.
export class BuiltinLambda extends BaseLambda {
  readonly type = "BuiltinLambda";
  _definitions: FnDefinition[];

  constructor(
    public name: string,
    signatures: FnDefinition[]
  ) {
    super((args, context) => this._call(args, context));
    this._definitions = signatures;
  }

  getName() {
    return this.name;
  }

  toString() {
    return this.name;
  }

  parameterString() {
    return this._definitions
      .filter(showInDocumentation)
      .map(fnDefinitionToString)
      .join(" | ");
  }

  parameterCounts() {
    return sort(uniq(this._definitions.map((d) => d.inputs.length)));
  }

  parameterCountString() {
    return `[${this.parameterCounts().join(",")}]`;
  }

  signatures(): FRType<unknown>[][] {
    return this._definitions.map((d) => d.inputs);
  }

  _call(args: Value[], context: ReducerContext): Value {
    const signatures = this._definitions;
    const showNameMatchDefinitions = () => {
      const defsString = signatures
        .filter(showInDocumentation)
        .map(fnDefinitionToString)
        .map((def) => `  ${this.name}${def}\n`)
        .join("");
      return `There are function matches for ${
        this.name
      }(), but with different arguments:\n${defsString}Was given arguments: (${args.join(
        ","
      )})`;
    };

    for (const signature of signatures) {
      const callResult = tryCallFnDefinition(signature, args, context);
      if (callResult !== undefined) {
        return callResult;
      }
    }
    throw new REOther(showNameMatchDefinitions());
  }

  override defaultInputs(): Input[] {
    const longestSignature = maxBy(this.signatures(), (s) => s.length) || [];
    return longestSignature.map((sig, i) => {
      const name = sig.name ? sig.name : `Input ${i + 1}`;
      return {
        name,
        type: sig.getName() === "Bool" ? "checkbox" : "text",
      };
    });
  }

  toCalculator(): Calculator {
    const inputs = this.defaultInputs();
    return {
      fn: this,
      inputs: inputs,
      autorun: inputs.length !== 0,
    };
  }
}

export type Lambda = UserDefinedLambda | BuiltinLambda;
