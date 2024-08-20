import { testRun } from "../helpers/helpers.js";

describe("SqValue.asJS", () => {
  test("SqDict -> Map", async () => {
    const value = (
      await testRun('{ x: 5, y: [3, "foo", { dist: Sym.normal(5,2) } ] }')
    ).result.asJS();

    expect(value).toBeInstanceOf(Object);
  });

  test("Dict fields", async () => {
    const value = (await testRun("{ x: 5 }")).result.asJS();

    expect((value as any).value.x).toBe(5);
  });

  test("Deeply nested dist", async () => {
    const value = (
      await testRun('{ x: 5, y: [3, "foo", { dist: Sym.normal(5,2) } ] }')
    ).result.asJS();

    expect((value as any).value.y[2].value.dist).toBeInstanceOf(Object);
  });
});
