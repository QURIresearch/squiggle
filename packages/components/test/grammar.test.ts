import { parser } from "../src/components/CodeEditor/languageSupport/generated/squiggle.js";

describe("Lezer grammar", () => {
  test("Basic", () => {
    expect(parser.parse("2+2").toString()).toBe(
      "Program(InfixCall(Number,ArithOp,Number))"
    );
  });

  test("Parens", () => {
    expect(parser.parse("((2))").toString()).toBe(
      'Program("(","(",Number,")",")")'
    );
  });

  test("Statements only", () => {
    expect(
      parser
        .parse(
          `foo = 5
bar = 6`
        )
        .toString()
    ).toBe(
      "Program(LetStatement(VariableName,Equals,Number),LetStatement(VariableName,Equals,Number))"
    );
  });

  test("Statements with trailing expression", () => {
    expect(
      parser
        .parse(
          `foo = 5
bar = 6
foo + bar`
        )
        .toString()
    ).toBe(
      "Program(LetStatement(VariableName,Equals,Number),LetStatement(VariableName,Equals,Number),InfixCall(Identifier,ArithOp,Identifier))"
    );
  });

  test("Function declarations and calls", () => {
    expect(
      parser
        .parse(
          `foo(x) = x
foo(5)`
        )
        .toString()
    ).toBe(
      'Program(DefunStatement(VariableName,"(",LambdaArgs(LambdaParameter(LambdaParameterName)),")",Equals,Identifier),Call(Identifier,"(",Argument(Number),")"))'
    );
  });

  // https://github.com/quantified-uncertainty/squiggle/issues/2246
  test("Multiline strings", () => {
    expect(
      parser
        .parse(
          `x = "foo
bar"
`
        )
        .toString()
    ).toBe("Program(LetStatement(VariableName,Equals,String))");
  });

  test("Decorators", () => {
    expect(
      parser
        .parse(
          `@name("X")
x = 5
`
        )
        .toString()
    ).toBe(
      'Program(LetStatement(Decorator(At,DecoratorName,"(",Argument(String),")"),VariableName,Equals,Number))'
    );
  });

  test("Pipe", () => {
    expect(parser.parse("5 -> max(6)").toString()).toBe(
      'Program(Pipe(Number,ControlOp,Call(Identifier,"(",Argument(Number),")")))'
    );
  });

  test("Lambda with zero args", () => {
    expect(parser.parse("f = {|| 1}").toString()).toBe(
      'Program(LetStatement(VariableName,Equals,Lambda("{",Number,"}")))'
    );
  });

  test("Defun with zero args", () => {
    expect(parser.parse("f() = 1").toString()).toBe(
      'Program(DefunStatement(VariableName,"(",LambdaArgs,")",Equals,Number))'
    );
  });
});
