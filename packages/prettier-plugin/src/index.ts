import { ASTCommentNode, ASTNode, parse } from "@quri/squiggle-lang";
import {
  AstPath,
  Doc,
  Parser,
  Printer,
  SupportLanguage,
  doc,
  util,
} from "prettier";

const { group, indent, softline, line, hardline, join, ifBreak } = doc.builders;

export const languages: SupportLanguage[] = [
  {
    name: "Squiggle",
    parsers: ["squiggle"],
    extensions: [".squiggle"],
  },
];

type Node = ASTNode | ASTCommentNode;

export const parsers: Record<string, Parser<Node>> = {
  squiggle: {
    parse: (text) => {
      const parseResult = parse(text);
      if (!parseResult.ok) {
        throw new Error(`Parse failed. ${parseResult.value}`);
      }
      return parseResult.value;
    },
    astFormat: "squiggle-ast",
    locStart: (node: Node) => {
      return node.location.start.offset;
    },
    locEnd: (node: Node) => {
      return node.location.end.offset;
    },
  },
};

function getNodePrecedence(node: Node): number {
  const infixPrecedence = {
    "||": 2,
    "&&": 3,
    "==": 4,
    "!=": 4,
    "<=": 5,
    "<": 5,
    ">=": 5,
    ">": 5,
    to: 6,
    "+": 7,
    "-": 7,
    ".+": 7,
    ".-": 7,
    "*": 8,
    "/": 8,
    ".*": 8,
    "./": 8,
    "^": 9,
    ".^": 9,
    "->": 10,
    "|>": 10,
  };
  switch (node.type) {
    case "Ternary":
      return 1;
    case "InfixCall": {
      const precedence = infixPrecedence[node.op];
      if (precedence === undefined) {
        throw new Error(`Unknown operator ${node.op}`);
      }
      return precedence;
    }
    case "Pipe":
      return 11;
    case "UnaryCall":
      return 12;
    case "DotLookup":
    case "BracketLookup":
    case "Call":
      return 13;
    case "Block":
      if (node.statements.length === 1) {
        // will be unwrapped by printer
        return getNodePrecedence(node.statements[0]);
      }
    default:
      return 100;
  }
}

export const printers: Record<string, Printer<Node>> = {
  "squiggle-ast": {
    print: (path, options, print) => {
      const node = path.getValue();
      const typedPath = <T extends Node>(_: T) => {
        return path as AstPath<T>;
      };

      const printChild = (
        doc: Doc,
        parentNode: Node,
        childNode: Node,
        rightSide: boolean = false
      ) => {
        const parentPrecedence = getNodePrecedence(parentNode);
        const childPrecedence = getNodePrecedence(childNode);
        const needParens = rightSide
          ? childPrecedence <= parentPrecedence // handles 4 / (5 / 6) case
          : childPrecedence < parentPrecedence;

        // TODO - indent
        return needParens ? ["(", doc, ")"] : doc;
      };

      switch (node.type) {
        case "Program":
          return path.map(print, "statements");
        case "Block":
          if (node.statements.length === 1) {
            return typedPath(node).call(print, "statements", 0);
          }
          return group([
            "{",
            indent([line, path.map(print, "statements")]),
            line,
            "}",
          ]);
        case "LetStatement":
          return group([
            node.variable.value,
            " = ",
            typedPath(node).call(print, "value"),
            hardline,
            util.isNextLineEmptyAfterIndex(
              options.originalText,
              node.location.end.offset
            )
              ? hardline
              : "",
          ]);
        case "DefunStatement":
          return group([
            node.variable.value,
            "(",
            join(", ", typedPath(node).map(print, "value", "args")),
            ")",
            " = ",
            typedPath(node).call(print, "value", "body"),
            hardline,
            util.isNextLineEmptyAfterIndex(
              options.originalText,
              node.location.end.offset
            )
              ? hardline
              : "",
          ]);
        case "Boolean":
          return node.value ? "true" : "false";
        case "Float":
          return String(node.value);
        case "Integer":
          return String(node.value);
        case "Array":
          return group([
            "[",
            indent([softline, join([",", line], path.map(print, "elements"))]),
            ifBreak(",", ""),
            softline,
            "]",
          ]);
        case "Call":
          return group([
            typedPath(node).call(print, "fn"), // parenthesize?..
            "(",
            indent([softline, join([",", line], path.map(print, "args"))]),
            softline,
            ")",
          ]);
        case "InfixCall":
          const args = ([0, 1] as const).map((i) =>
            printChild(
              typedPath(node).call(print, "args", i),
              node,
              node.args[i],
              i === 1
            )
          );

          return group([args[0], " ", node.op, line, args[1]]);
        case "UnaryCall":
          return group([
            node.op,
            printChild(typedPath(node).call(print, "arg"), node, node.arg),
          ]);
        case "Pipe": {
          const args = node.rightArgs.length
            ? [
                "(",
                indent([
                  softline,
                  join([",", line], typedPath(node).map(print, "rightArgs")),
                ]),
                softline,
                ")",
              ]
            : [];
          return group([
            printChild(
              typedPath(node).call(print, "leftArg"),
              node,
              node.leftArg
            ),
            " ->",
            line,
            printChild(typedPath(node).call(print, "fn"), node, node.fn),
            args,
          ]);
        }
        case "DotLookup":
          return group([typedPath(node).call(print, "arg"), ".", node.key]);
        case "BracketLookup":
          return group([
            typedPath(node).call(print, "arg"),
            "[",
            typedPath(node).call(print, "key"),
            "]",
          ]);
        case "Identifier":
          return node.value;
        case "ModuleIdentifier":
          return node.value;
        case "KeyValue": {
          const key =
            node.key.type === "String" &&
            node.key.value.match(/^[\$_a-z]+[\$_a-z0-9]*$/i)
              ? node.key.value
              : typedPath(node).call(print, "key");

          return group([
            key,
            // it would be better to allow a break here, but it's hard to format well */
            ": ",
            typedPath(node).call(print, "value"),
          ]);
        }
        case "Lambda":
          return group([
            "{|",
            join(", ", path.map(print, "args")),
            "|",
            path.call(print, "body"),
            "}",
          ]);
        case "Record":
          return group([
            "{",
            node.elements.length
              ? [
                  indent([
                    line,
                    join([",", line], path.map(print, "elements")),
                  ]),
                  ifBreak(",", ""),
                  line,
                ]
              : [],
            "}",
          ]);
        case "String":
          return ['"', node.value, '"'];
        case "Ternary":
          return [
            node.kind === "C" ? [] : "if ",
            path.call(print, "condition"),
            node.kind === "C" ? " ? " : " then ",
            path.call(print, "trueExpression"),
            node.kind === "C" ? " : " : " else ",
            path.call(print, "falseExpression"),
          ];
        case "Void":
          return "()";
        case "lineComment":
        case "blockComment":
          throw new Error("Didn't expect comment node in print()");
        default:
          throw new Error(`Unsupported node type ${node satisfies never}`);
      }
    },
    printComment: (path: AstPath<ASTCommentNode>) => {
      const commentNode = path.getValue();
      switch (commentNode.type) {
        case "lineComment":
          // I'm not sure why "hardline" at the end here is not necessary
          return ["//", commentNode.value];
        case "blockComment":
          return ["/*", commentNode.value, "*/"];
        default:
          throw new Error("Unknown comment type");
      }
    },
    ...({
      getCommentChildNodes: (node: ASTNode) => {
        if (!node) {
          return [];
        }
        switch (node.type) {
          case "Program":
            return node.statements;
          case "Block":
            return node.statements;
          case "Array":
            return node.elements;
          case "LetStatement":
            return [node.variable, node.value];
          case "Call":
            return [...node.args, node.fn];
          case "Record":
            return node.elements;
          case "KeyValue":
            return [node.key, node.value];
          default:
            return [];
        }
      },
      canAttachComment: (node: ASTNode) => {
        return node && node.type;
      },
    } as any),
  },
};

export const options = {};
export const defaultOptions = {};
