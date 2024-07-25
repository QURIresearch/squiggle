import { parse } from "../../ast/parse.js";
import { compileAst } from "../../compiler/compile.js";
import { defaultEnv } from "../../dists/env.js";
import { Reducer } from "../../reducer/Reducer.js";
import { Bindings } from "../../reducer/Stack.js";
import { Value } from "../../value/index.js";

export type SquiggleDefinition = {
  name: string;
  value: Value;
};

export function makeSquiggleDefinition({
  builtins,
  name,
  code,
}: {
  builtins: Bindings;
  name: string;
  code: string;
}): SquiggleDefinition {
  const astResult = parse(code, "@stdlib");
  if (!astResult.ok) {
    // will be detected during tests, should never happen in runtime
    throw new Error(`Stdlib code ${code} is invalid`);
  }

  const irResult = compileAst(astResult.value, builtins);

  if (!irResult.ok) {
    // fail fast
    throw irResult.value;
  }

  // TODO - do we need runtime env? That would mean that we'd have to build stdlib for each env separately.
  const reducer = new Reducer(defaultEnv);
  const value = reducer.evaluate(irResult.value);

  return { name, value };
}
