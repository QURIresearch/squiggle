import { ICompileError } from "../errors/IError.js";
import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import { SExpr, SExprPrintOptions, sExprToString } from "../utility/sExpr.js";
import {
  parse as peggyParse,
  SyntaxError as PeggySyntaxError,
} from "./peggyParser.js";
import {
  AST,
  type ASTCommentNode,
  type ASTNode,
  LocationRange,
} from "./types.js";
import { unitTypeCheck } from "./unitTypeChecker.js";

export type ParseError = {
  type: "SyntaxError";
  location: LocationRange;
  message: string;
};

type ParseResult = result<AST, ICompileError>;

export function parse(expr: string, source: string): ParseResult {
  try {
    const comments: ASTCommentNode[] = [];
    const parsed: AST = peggyParse(expr, {
      grammarSource: source,
      comments,
    });
    if (parsed.type !== "Program") {
      throw new Error("Expected parse to result in a Program node");
    }
    unitTypeCheck(parsed);
    parsed.comments = comments;
    return Result.Ok(parsed);
  } catch (e) {
    if (e instanceof PeggySyntaxError) {
      return Result.Err(
        new ICompileError((e as any).message, (e as any).location)
      );
    } else {
      throw e;
    }
  }
}

// This function is just for the sake of tests.
// For real generation of Squiggle code from AST try our prettier plugin.
export function nodeToString(
  node: ASTNode,
  printOptions: SExprPrintOptions = {}
): string {
  const toSExpr = (node: ASTNode): SExpr => {
    const sExpr = (components: (SExpr | undefined)[]): SExpr => ({
      name: node.type,
      args: components,
    });

    switch (node.type) {
      case "Block":
      case "Program":
        return sExpr(node.statements.map(toSExpr));
      case "Array":
        return sExpr(node.elements.map(toSExpr));
      case "Dict":
        return sExpr(node.elements.map(toSExpr));
      case "Boolean":
        return String(node.value);
      case "Call":
        return sExpr([node.fn, ...node.args].map(toSExpr));
      case "InfixCall":
        return sExpr([node.op, ...node.args.map(toSExpr)]);
      case "Pipe":
        return sExpr([node.leftArg, node.fn, ...node.rightArgs].map(toSExpr));
      case "DotLookup":
        return sExpr([toSExpr(node.arg), node.key]);
      case "BracketLookup":
        return sExpr([node.arg, node.key].map(toSExpr));
      case "UnaryCall":
        return sExpr([node.op, toSExpr(node.arg)]);
      case "Float":
        // see also: "Float" branch in expression/compile.ts
        return `${node.integer}${
          node.fractional === null ? "" : `.${node.fractional}`
        }${node.exponent === null ? "" : `e${node.exponent}`}`;
      case "Identifier":
        if (node.unitTypeSignature) {
          return sExpr([node.value, toSExpr(node.unitTypeSignature)]);
        } else {
          return `:${node.value}`;
        }
      case "IdentifierWithAnnotation":
        return sExpr([node.variable, toSExpr(node.annotation)]);
      case "KeyValue":
        return sExpr([node.key, node.value].map(toSExpr));
      case "Lambda":
        return sExpr([
          ...node.args.map(toSExpr),
          toSExpr(node.body),
          node.returnUnitType ? toSExpr(node.returnUnitType) : undefined,
        ]);
      case "Decorator":
        return sExpr([node.name, ...node.args].map(toSExpr));
      case "LetStatement":
        return sExpr([
          toSExpr(node.variable),
          node.unitTypeSignature ? toSExpr(node.unitTypeSignature) : undefined,
          toSExpr(node.value),
          node.exported ? "exported" : undefined,
          ...node.decorators.map(toSExpr),
        ]);
      case "DefunStatement":
        return sExpr([
          toSExpr(node.variable),
          toSExpr(node.value),
          node.exported ? "exported" : undefined,
          ...node.decorators.map(toSExpr),
        ]);
      case "String":
        return `'${node.value}'`; // TODO - quote?
      case "Ternary":
        return sExpr(
          [node.condition, node.trueExpression, node.falseExpression].map(
            toSExpr
          )
        );
      case "UnitTypeSignature":
        return sExpr([toSExpr(node.body)]);
      case "InfixType":
        return sExpr([node.op, ...node.args.map(toSExpr)]);
      case "UnitValue":
        return sExpr([toSExpr(node.value), node.unit]);

      default:
        throw new Error(`Unknown node: ${node satisfies never}`);
    }
  };

  return sExprToString(toSExpr(node), printOptions);
}

export function nodeResultToString(
  r: ParseResult,
  printOptions?: SExprPrintOptions
): string {
  if (!r.ok) {
    return r.value.toString();
  }
  return nodeToString(r.value, printOptions);
}
