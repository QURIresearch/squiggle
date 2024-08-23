import { frNumber } from "../library/FrType.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";

// Also, see version.ts for System.version.

const maker = new FnFactory({
  nameSpace: "System",
  requiresNamespace: true,
});

export const library = [
  // It might make sense to later make this a constant, as this number shouldn't change at runtime.
  maker.make({
    name: "sampleCount",
    description:
      "The number of samples set in the current environment. This variable can be modified in the Squiggle playground settings.",
    definitions: [
      makeDefinition(
        [],
        frNumber,
        (_, { environment }) => environment.sampleCount
      ),
    ],
  }),
];
