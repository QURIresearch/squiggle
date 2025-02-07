"use client";

// squiggle-components are not RSC-friendly
import { FC } from "react";
import { type SqLinker as SqLinkerV1 } from "squiggle-lang-0.9.5";

import { type SqLinker as SqLinkerDev } from "@quri/squiggle-lang";

import { makeTw3Proxy } from "./Tw3Proxy.js";
import { SquiggleLangPackageTypes } from "./versionedSquiggleLang.js";
import { SquiggleVersion } from "./versions.js";

/**
 * We extend components props to allow any version of `SqProject` and other common squiggle-lang classes.
 * This makes them less type-safe, but matching squiggle-lang object versions with components verisons is almost impossible without this.
 */

type SqLinkerV2 = Omit<SqLinkerDev, "loadModule"> & {
  // Relax the type of `loadModule` - various versions of `SqModule` return type
  // are not compatible, even if they're identical
  // (because of "Types have separate declarations of a private property '_ast'" error.)
  loadModule: (sourceId: string, hash?: string) => Promise<unknown>;
};

type AnySqProject = InstanceType<
  SquiggleLangPackageTypes[SquiggleVersion]["SqProject"]
>;
type AnySqValuePath = InstanceType<
  SquiggleLangPackageTypes[SquiggleVersion]["SqValuePath"]
>;
type AnySqLinker = SqLinkerV1 | SqLinkerV2;
type PatchSqType<Prop> = Prop extends AnySqProject
  ? AnySqProject
  : Prop extends AnySqValuePath
    ? AnySqValuePath
    : Prop extends AnySqLinker
      ? AnySqLinker
      : Prop;
type PatchSqTypesInProps<Props> =
  Props extends Record<string, unknown>
    ? { [k in keyof Props]: PatchSqType<Props[k]> }
    : Props;
type PatchSqTypesInFC<T> =
  T extends FC<infer Props> ? FC<PatchSqTypesInProps<Props>> : T;
type PatchSqTypes<Exports extends Record<string, unknown>> = {
  [k in keyof Exports]: PatchSqTypesInFC<Exports[k]>;
};

// This type helper is named identically here and in `versionedSquiggleLang.ts`.
// This allows us to use the same code in `patch-js.ts` to update the list for both files.
type GetImportType<T extends Record<string, unknown>> = PatchSqTypes<
  Awaited<T>
>;

function wrapWithTw3Proxy<T>(lib: T): T {
  return {
    ...lib,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SquigglePlayground: makeTw3Proxy((lib as any).SquigglePlayground),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SquiggleChart: makeTw3Proxy((lib as any).SquiggleChart),
  } as T;
}

// Auto-generated, don't touch.
export type SquiggleComponentsPackageTypes = {
  "0.8.5": GetImportType<typeof import("squiggle-components-0.8.5")>;
  "0.8.6": GetImportType<typeof import("squiggle-components-0.8.6")>;
  "0.9.0": GetImportType<typeof import("squiggle-components-0.9.0")>;
  "0.9.2": GetImportType<typeof import("squiggle-components-0.9.2")>;
  "0.9.3": GetImportType<typeof import("squiggle-components-0.9.3")>;
  "0.9.4": GetImportType<typeof import("squiggle-components-0.9.4")>;
  "0.9.5": GetImportType<typeof import("squiggle-components-0.9.5")>;
  "0.10.0": GetImportType<typeof import("squiggle-components-0.10.0")>;
  dev: GetImportType<typeof import("@quri/squiggle-components")>;
};
export async function squiggleComponentsByVersion<T extends SquiggleVersion>(
  version: T
): Promise<SquiggleComponentsPackageTypes[T]> {
  // Auto-generated, don't touch.
  // Enumerating all imports is necessary; `await import(version)` won't be enough.
  switch (version) {
    case "0.8.5":
      return wrapWithTw3Proxy(
        (await import(
          "squiggle-components-0.8.5"
        )) as unknown as SquiggleComponentsPackageTypes[T]
      );
    case "0.8.6":
      return wrapWithTw3Proxy(
        (await import(
          "squiggle-components-0.8.6"
        )) as unknown as SquiggleComponentsPackageTypes[T]
      );
    case "0.9.0":
      return wrapWithTw3Proxy(
        (await import(
          "squiggle-components-0.9.0"
        )) as unknown as SquiggleComponentsPackageTypes[T]
      );
    case "0.9.2":
      return wrapWithTw3Proxy(
        (await import(
          "squiggle-components-0.9.2"
        )) as unknown as SquiggleComponentsPackageTypes[T]
      );
    case "0.9.3":
      return wrapWithTw3Proxy(
        (await import(
          "squiggle-components-0.9.3"
        )) as unknown as SquiggleComponentsPackageTypes[T]
      );
    case "0.9.4":
      return wrapWithTw3Proxy(
        (await import(
          "squiggle-components-0.9.4"
        )) as unknown as SquiggleComponentsPackageTypes[T]
      );
    case "0.9.5":
      return wrapWithTw3Proxy(
        (await import(
          "squiggle-components-0.9.5"
        )) as unknown as SquiggleComponentsPackageTypes[T]
      );
    case "0.10.0":
      return wrapWithTw3Proxy(
        (await import(
          "squiggle-components-0.10.0"
        )) as unknown as SquiggleComponentsPackageTypes[T]
      );
    case "dev":
      return (await import(
        "@quri/squiggle-components"
      )) as unknown as SquiggleComponentsPackageTypes[T];
    default:
      throw new Error(`Unkonwn version ${version satisfies never}`);
  }
}
