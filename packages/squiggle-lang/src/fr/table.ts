import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import { namedInput } from "../library/registry/fnInput.js";
import { FnFactory } from "../library/registry/helpers.js";
import {
  tAny,
  tArray,
  tDict,
  tLambdaTyped,
  tString,
  tTableChart,
} from "../types/index.js";

const maker = new FnFactory({
  nameSpace: "Table",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "make",
    examples: [
      makeFnExample(
        `Table.make(
  [
    { name: "First Dist", value: normal(0, 1) },
    { name: "Second Dist", value: uniform(2, 4) },
    { name: "Third Dist", value: uniform(5, 6) },
  ],
  {
    columns: [
      { name: "Name", fn: {|d|d.name} },
      { name: "Mean", fn: {|d|mean(d.value)} },
      { name: "Std Dev", fn: {|d|variance(d.value)} },
      { name: "Dist", fn: {|d|d.value} },
    ],
  }
)`,
        { isInteractive: true }
      ),
      makeFnExample(
        `Table.make(
  [
    { name: "First Dist", value: Sym.lognormal({ p5: 1, p95: 10 }) },
    { name: "Second Dist", value: Sym.lognormal({ p5: 5, p95: 30 }) },
    { name: "Third Dist", value: Sym.lognormal({ p5: 50, p95: 90 }) },
  ],
  {
    columns: [
      { name: "Name", fn: {|d|d.name} },
      {
        name: "Plot",
        fn: {
          |d|
          Plot.dist(
            {
              dist: d.value,
              xScale: Scale.log({ min: 0.5, max: 100 }),
              showSummary: false,
            }
          )
        },
      },
    ],
  }
)`,
        { isInteractive: true }
      ),
    ],
    definitions: [
      makeDefinition(
        [
          namedInput("data", tArray(tAny({ genericName: "A" }))),
          namedInput(
            "params",
            tDict([
              "columns",
              tArray(
                tDict(
                  ["fn", tLambdaTyped([tAny({ genericName: "A" })], tAny())],
                  { key: "name", type: tString, optional: true }
                )
              ),
            ])
          ),
        ],
        tTableChart,
        ([data, params]) => {
          const { columns } = params ?? {};
          return {
            data,
            columns: columns.map(({ fn, name }) => ({
              fn,
              name: name ?? undefined,
            })),
          };
        }
      ),
      makeDefinition(
        [
          tDict(
            ["data", tArray(tAny({ genericName: "A" }))],
            [
              "columns",
              tArray(
                tDict(
                  ["fn", tLambdaTyped([tAny({ genericName: "A" })], tAny())],
                  { key: "name", type: tString, optional: true }
                )
              ),
            ]
          ),
        ],
        tTableChart,
        ([{ data, columns }]) => {
          return {
            data,
            columns: columns.map(({ fn, name }) => ({
              fn,
              name: name ?? undefined,
            })),
          };
        },
        { deprecated: "0.8.7" }
      ),
    ],
  }),
];
