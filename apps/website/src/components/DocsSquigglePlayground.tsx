"use client";
import { FC } from "react";

import { SquigglePlayground } from "@quri/squiggle-components";

export const DocsSquigglePlayground: FC<
  Parameters<typeof SquigglePlayground>[0]
> = (props) => (
  <div className="mt-6 rounded-md border border-gray-200 bg-white p-2">
    <SquigglePlayground {...props} />
  </div>
);
