import { LocationRange } from "peggy";

export const toFunction = {
  "-": "subtract",
  "->": "pipe",
  "!=": "unequal",
  ".-": "dotSubtract",
  ".*": "dotMultiply",
  "./": "dotDivide",
  ".^": "dotPow",
  ".+": "dotAdd",
  "*": "multiply",
  "/": "divide",
  "&&": "and",
  "^": "pow", // or xor
  "+": "add",
  "<": "smaller",
  "<=": "smallerEq",
  "==": "equal",
  ">": "larger",
  ">=": "largerEq",
  "||": "or",
  to: "credibleIntervalToDistribution",
};

export const unaryToFunction = {
  "-": "unaryMinus",
  "!": "not",
  ".-": "unaryDotMinus",
};

export const postOperatorToFunction = {
  ".": "$_atIndex_$",
  "()": "$$_applyAll_$$",
  "[]": "$_atIndex_$",
};

type NodeBlock = {
  type: "Block";
  statements: AnyPeggyNode[];
};

type NodeExpression = {
  type: "Expression";
  nodes: AnyPeggyNode[];
};

type NodeFloat = {
  type: "Float";
  value: number;
};

type NodeInteger = {
  type: "Integer";
  value: number;
};

type NodeIdentifier = {
  type: "Identifier";
  value: string;
  location: LocationRange;
};

type NodeCallIdentifier = {
  type: "CallIdentifier";
  value: string;
};

type NodeLetStatement = {
  type: "LetStatement";
  variable: NodeIdentifier;
  value: AnyPeggyNode;
};

type NodeLambda = {
  type: "Lambda";
  args: AnyPeggyNode[];
  body: AnyPeggyNode;
};

type NodeTernary = {
  type: "Ternary";
  condition: AnyPeggyNode;
  trueExpression: AnyPeggyNode;
  falseExpression: AnyPeggyNode;
};

type NodeKeyValue = {
  type: "KeyValue";
  key: AnyPeggyNode;
  value: AnyPeggyNode;
};

type NodeString = {
  type: "String";
  value: string;
  location?: LocationRange;
};

type NodeBoolean = {
  type: "Boolean";
  value: boolean;
};

export type AnyPeggyNode =
  | NodeBlock
  | NodeExpression
  | NodeFloat
  | NodeInteger
  | NodeIdentifier
  | NodeCallIdentifier
  | NodeLetStatement
  | NodeLambda
  | NodeTernary
  | NodeKeyValue
  | NodeString
  | NodeBoolean;

export function makeFunctionCall(fn: string, args: AnyPeggyNode[]) {
  if (fn === "$$_applyAll_$$") {
    // Any list of values is applied from left to right anyway.
    // Like in Haskell and Lisp.
    // So we remove the redundant $$_applyAll_$$.
    if (args[0].type === "Identifier") {
      args[0] = {
        ...args[0],
        type: "CallIdentifier",
      };
    }
    return nodeExpression(args);
  } else {
    return nodeExpression([nodeCallIndentifier(fn), ...args]);
  }
}

export function apply(fn: string, arg: AnyPeggyNode) {
  return makeFunctionCall(fn, [arg]);
}
export function constructArray(elems: AnyPeggyNode[]) {
  return apply("$_constructArray_$", nodeExpression(elems));
}
export function constructRecord(elems: AnyPeggyNode[]) {
  return apply("$_constructRecord_$", nodeExpression(elems));
}

export function nodeBlock(statements: AnyPeggyNode[]): NodeBlock {
  return { type: "Block", statements };
}
export function nodeBoolean(value: boolean): NodeBoolean {
  return { type: "Boolean", value };
}
export function nodeCallIndentifier(value: string): NodeCallIdentifier {
  return { type: "CallIdentifier", value };
}
export function nodeExpression(args: AnyPeggyNode[]): NodeExpression {
  return { type: "Expression", nodes: args };
}
export function nodeFloat(value: number): NodeFloat {
  return { type: "Float", value };
}
export function nodeIdentifier(
  value: string,
  location: LocationRange
): NodeIdentifier {
  return { type: "Identifier", value, location };
}
export function nodeInteger(value: number): NodeInteger {
  return { type: "Integer", value };
}
export function nodeKeyValue(
  key: AnyPeggyNode,
  value: AnyPeggyNode
): NodeKeyValue {
  if (key.type === "Identifier") {
    key = {
      ...key,
      type: "String",
    };
  }
  return { type: "KeyValue", key, value };
}
export function nodeLambda(
  args: AnyPeggyNode[],
  body: AnyPeggyNode
): NodeLambda {
  return { type: "Lambda", args, body };
}
export function nodeLetStatement(
  variable: NodeIdentifier,
  value: AnyPeggyNode
): NodeLetStatement {
  return { type: "LetStatement", variable, value };
}
export function nodeModuleIdentifier(value: string) {
  return { type: "ModuleIdentifier", value };
}
export function nodeString(value: string): NodeString {
  return { type: "String", value };
}
export function nodeTernary(
  condition: AnyPeggyNode,
  trueExpression: AnyPeggyNode,
  falseExpression: AnyPeggyNode
): NodeTernary {
  return {
    type: "Ternary",
    condition,
    trueExpression,
    falseExpression,
  };
}

export function nodeTypeIdentifier(typeValue: string) {
  return { type: "TypeIdentifier", value: typeValue };
}

export function nodeVoid() {
  return { type: "Void" };
}
