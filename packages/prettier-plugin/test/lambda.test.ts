import { format } from "./helpers.js";

describe("lambda", () => {
  test("lambda", async () => {
    expect(await format("f={|x|x*x}")).toBe("f = {|x|x * x}\n");
  });

  test("lambda with multiple args", async () => {
    expect(await format("f={|x,y|x*y}")).toBe("f = {|x, y|x * y}\n");
  });

  test("lambda with long body", async () => {
    expect(
      await format(
        "f={|x,y|yaewrtawieyra+auweyrauweyrauwyer+wekuryakwueyruaweyr+wekuryakwueyruaweyr+wekuryakwueyruaweyr}"
      )
    ).toBe(
      `f = {
  |x, y|
  yaewrtawieyra + auweyrauweyrauwyer + wekuryakwueyruaweyr +
  wekuryakwueyruaweyr +
  wekuryakwueyruaweyr
}\n`
    );
  });

  test("lambda with long parameters", async () => {
    expect(
      await format(
        "f={|yaewrtawieyra,auweyrauweyrauwyer,wekuryakwueyruaweyr,wekuryakwueyruaweyr,wekuryakwueyruaweyr|123}"
      )
    ).toBe(
      `f = {
  |
    yaewrtawieyra,
    auweyrauweyrauwyer,
    wekuryakwueyruaweyr,
    wekuryakwueyruaweyr,
    wekuryakwueyruaweyr
  |
  123
}
`
    );
  });
});
