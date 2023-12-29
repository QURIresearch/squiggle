// auto-generated by `publish-all.ts`, don't touch
export const squiggleVersions = ["0.8.6", "0.8.5", "0.9.0", "dev"] as const;
export type SquiggleVersion = (typeof squiggleVersions)[number];

// auto-generated by `publish-all.ts`, don't touch
export const defaultSquiggleVersion: SquiggleVersion = "0.9.0";
export function checkSquiggleVersion(
  version: string
): version is SquiggleVersion {
  return (squiggleVersions as readonly string[]).includes(version);
}

function excludeVersions<const T extends SquiggleVersion[]>(skipVersions: T) {
  const guard = <Arg extends { version: SquiggleVersion }>(
    arg: Arg
  ): arg is Extract<
    Arg,
    {
      version: Exclude<SquiggleVersion, T[number]>;
    }
  > => !skipVersions.includes(arg.version);

  return guard;
}

/*
 * This is an example of a type predicate (https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
 * that's useful for setting component props conditionally.
 * See `EditSquiggleSnippetModel` in the Squiggle Hub source code for an example how it's used.
 */
export const versionSupportsDropdownMenu = excludeVersions(["0.8.5"]);

export const versionSupportsExports = excludeVersions(["0.8.5", "0.8.6"]);
