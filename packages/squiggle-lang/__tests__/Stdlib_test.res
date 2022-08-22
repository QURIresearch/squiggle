open Jest
open Expect

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () => expect(item1)->toEqual(item2))
    : test(str, () => expect(item1)->toEqual(item2))

describe("Stdlib", () => {
  makeTest("min", Stdlib.Random.sample([1.0, 2.0], {probs: [0.5, 0.5], size: 10}) |> E.A.length, 10)
  makeTest(
    "min",
    Stdlib.Random.sample([1.0, 2.0], {probs: [0.5, 0.5], size: 10}) |> E.A.uniq |> E.A.Floats.sort,
    [1.0, 2.0],
  )
})
