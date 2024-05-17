import { isBindingStatement } from "../../ast/utils.js";
import { defaultEnv, Env } from "../../dists/env.js";
import { getStdLib } from "../../library/index.js";
import { BaseRunner } from "../../runners/BaseRunner.js";
import { getDefaultRunner } from "../../runners/index.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import * as Result from "../../utility/result.js";
import { vDict, VDict } from "../../value/VDict.js";
import { vString } from "../../value/VString.js";
import { SqError, SqOtherError } from "../SqError.js";
import { SqLinker } from "../SqLinker.js";
import { SqValue, wrapValue } from "../SqValue/index.js";
import { SqDict } from "../SqValue/SqDict.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValuePath, ValuePathRoot } from "../SqValuePath.js";
import { SqOutputResult } from "../types.js";
import {
  type Externals,
  Import,
  ProjectItem,
  ProjectItemOutput,
} from "./ProjectItem.js";

function getNeedToRunError() {
  return new SqOtherError("Need to run");
}

type Options = {
  linker?: SqLinker;
  environment?: Env;
  runner?: BaseRunner;
};

export class SqProject {
  private readonly items: Map<string, ProjectItem>;
  private environment: Env;
  private linker?: SqLinker; // if not present, imports are forbidden
  public runner: BaseRunner;

  // Direct graph of dependencies is maintained inside each ProjectItem,
  // while the inverse one is stored in this variable.
  // We need to update it every time we update the list of direct dependencies:
  // - when sources are deleted
  // - on `setContinues`
  // - on `parseImports`
  // (this list might be incomplete)
  private inverseGraph: Map<string, Set<string>> = new Map();

  constructor(options?: Options) {
    this.items = new Map();
    this.environment = options?.environment ?? defaultEnv;
    this.linker = options?.linker;
    this.runner = options?.runner ?? getDefaultRunner();
  }

  static create(options?: Options) {
    return new SqProject(options);
  }

  getEnvironment(): Env {
    return this.environment;
  }

  getStdLib() {
    return getStdLib();
  }

  setEnvironment(environment: Env) {
    // TODO - should we invalidate all outputs?
    this.environment = environment;
  }

  setRunner(runner: BaseRunner) {
    // TODO - should we invalidate all outputs?
    this.runner = runner;
  }

  getSourceIds(): string[] {
    return Array.from(this.items.keys());
  }

  private getItem(sourceId: string): ProjectItem {
    const item = this.items.get(sourceId);
    if (!item) {
      throw new Error(`Source ${sourceId} not found`);
    }
    return item;
  }

  private cleanDependents(initialSourceId: string) {
    // Traverse dependents recursively and call "clean" on each.
    const visited = new Set<string>();
    const inner = (currentSourceId: string) => {
      visited.add(currentSourceId);
      if (currentSourceId !== initialSourceId) {
        this.clean(currentSourceId);
      }
      for (const sourceId of this.getDependents(currentSourceId)) {
        if (visited.has(sourceId)) {
          continue;
        }
        inner(sourceId);
      }
    };
    inner(initialSourceId);
  }

  getDependents(sourceId: string): string[] {
    return [...(this.inverseGraph.get(sourceId)?.values() ?? [])];
  }

  getDependencies(sourceId: string): string[] {
    this.parseImports(sourceId);
    return this.getItem(sourceId).getDependencies();
  }

  // Removes only explicit imports (not continues).
  // Useful on source changes.
  private removeImportEdges(fromSourceId: string) {
    const item = this.getItem(fromSourceId);
    if (item.imports?.ok) {
      for (const importData of item.imports.value) {
        this.inverseGraph.get(importData.sourceId)?.delete(fromSourceId);
      }
    }
  }

  touchSource(sourceId: string) {
    this.removeImportEdges(sourceId);
    this.getItem(sourceId).touchSource();
    this.cleanDependents(sourceId);
  }

  setSource(sourceId: string, value: string) {
    if (this.items.has(sourceId)) {
      this.removeImportEdges(sourceId);
      this.getItem(sourceId).setSource(value);
      this.cleanDependents(sourceId);
    } else {
      this.items.set(sourceId, new ProjectItem({ sourceId, source: value }));
    }
  }

  removeSource(sourceId: string) {
    if (!this.items.has(sourceId)) {
      return;
    }
    this.cleanDependents(sourceId);
    this.removeImportEdges(sourceId);
    this.setContinues(sourceId, []);
    this.items.delete(sourceId);
  }

  getSource(sourceId: string) {
    return this.items.get(sourceId)?.source;
  }

  clean(sourceId: string) {
    this.getItem(sourceId).clean();
  }

  cleanAll() {
    this.getSourceIds().forEach((id) => this.clean(id));
  }

  getImportIds(sourceId: string): Result.result<string[], SqError> {
    const imports = this.getImports(sourceId);
    if (!imports) {
      return Result.Err(getNeedToRunError());
    }
    return Result.fmap(imports, (imports) => imports.map((i) => i.sourceId));
  }

  getImports(sourceId: string): Result.result<Import[], SqError> | undefined {
    return this.getItem(sourceId).imports;
  }

  getContinues(sourceId: string): string[] {
    return this.getItem(sourceId).continues;
  }

  setContinues(sourceId: string, continues: string[]): void {
    for (const continueId of this.getContinues(sourceId)) {
      this.inverseGraph.get(continueId)?.delete(sourceId);
    }
    for (const continueId of continues) {
      if (!this.inverseGraph.has(continueId)) {
        this.inverseGraph.set(continueId, new Set());
      }
      this.inverseGraph.get(continueId)?.add(sourceId);
    }
    this.getItem(sourceId).setContinues(continues);
    this.cleanDependents(sourceId);
  }

  private getInternalOutput(
    sourceId: string
  ): Result.result<ProjectItemOutput, SqError> {
    return this.getItem(sourceId).output ?? Result.Err(getNeedToRunError());
  }

  private parseImports(sourceId: string): void {
    // linker can be undefined; in this case parseImports will fail if there are any imports
    const item = this.getItem(sourceId);
    if (item.imports) {
      // already set, shortcut so that we don't have to update `inverseGraph`
      return;
    }

    item.parseImports(this.linker);
    for (const dependencyId of item.getDependencies()) {
      if (!this.inverseGraph.has(dependencyId)) {
        this.inverseGraph.set(dependencyId, new Set());
      }
      this.inverseGraph.get(dependencyId)?.add(sourceId);
    }
  }

  getOutput(sourceId: string): SqOutputResult {
    const internalOutputR = this.getInternalOutput(sourceId);
    if (!internalOutputR.ok) {
      return internalOutputR;
    }

    const runContext = internalOutputR.value.context;
    const { externals, ast } = runContext;
    const {
      runOutput: { result, bindings, exports },
    } = internalOutputR.value;

    const lastStatement = ast.statements.at(-1);

    const hasEndExpression =
      !!lastStatement && !isBindingStatement(lastStatement);

    const newContext = (root: ValuePathRoot) => {
      const isResult = root === "result";
      return new SqValueContext({
        runContext,
        valueAst: isResult && hasEndExpression ? lastStatement : ast,
        valueAstIsPrecise: isResult ? hasEndExpression : true,
        path: new SqValuePath({
          root,
          edges: [],
        }),
      });
    };

    const wrapSqDict = (innerDict: VDict, root: ValuePathRoot): SqDict => {
      return new SqDict(innerDict, newContext(root));
    };

    return Result.Ok({
      result: wrapValue(result, newContext("result")),
      bindings: wrapSqDict(bindings, "bindings"),
      exports: wrapSqDict(
        exports.mergeTags({ name: vString(sourceId) }),
        // In terms of context, exports are the same as bindings.
        "bindings"
      ),
      imports: wrapSqDict(externals.explicitImports, "imports"),
      raw: internalOutputR.value,
    });
  }

  getResult(sourceId: string): Result.result<SqValue, SqError> {
    return Result.fmap(this.getOutput(sourceId), ({ result }) => result);
  }

  getBindings(sourceId: string): Result.result<SqDict, SqError> {
    return Result.fmap(this.getOutput(sourceId), ({ bindings }) => bindings);
  }

  private async importToBindingResult(
    importBinding: Import,
    pendingIds: Set<string>
  ): Promise<Result.result<VDict, SqError>> {
    if (!this.items.has(importBinding.sourceId)) {
      if (!this.linker) {
        throw new Error(
          `Can't load source for ${importBinding.sourceId}, linker is missing`
        );
      }

      // We have got one of the new imports.
      // Let's load it and add it to the project.
      let newSource: string;
      try {
        newSource = await this.linker.loadSource(importBinding.sourceId);
      } catch (e) {
        return Result.Err(
          new SqOtherError(`Failed to load import ${importBinding.sourceId}`)
        );
      }
      this.setSource(importBinding.sourceId, newSource);
    }

    if (pendingIds.has(importBinding.sourceId)) {
      // Oh we have already visited this source. There is an import cycle.
      return Result.Err(
        new SqOtherError(`Cyclic import ${importBinding.sourceId}`)
      );
    }

    await this.innerRun(importBinding.sourceId, pendingIds);
    const outputR = this.getInternalOutput(importBinding.sourceId);
    if (!outputR.ok) {
      return outputR;
    }

    // TODO - check for name collisions?
    switch (importBinding.type) {
      case "flat":
        return Result.Ok(outputR.value.runOutput.bindings);
      case "named":
        return Result.Ok(
          vDict(
            ImmutableMap({
              [importBinding.variable]: outputR.value.runOutput.exports,
            })
          )
        );
      default:
        throw new Error(`Internal error, ${importBinding satisfies never}`);
    }
  }

  private async importsToBindings(
    pendingIds: Set<string>,
    imports: Import[]
  ): Promise<Result.result<VDict, SqError>> {
    let exports = VDict.empty();

    for (const importBinding of imports) {
      const loadResult = await this.importToBindingResult(
        importBinding,
        pendingIds
      );
      if (!loadResult.ok) return loadResult; // Early return for load/validation errors

      exports = exports.merge(loadResult.value);
    }
    return Result.Ok(exports);
  }

  // Includes implicit imports ("continues") and explicit imports.
  private async buildExternals(
    sourceId: string,
    pendingIds: Set<string>
  ): Promise<Result.result<Externals, SqError>> {
    this.parseImports(sourceId);

    const rImports = this.getImports(sourceId);
    if (!rImports) throw new Error("Internal logic error"); // Shouldn't happen, we just called parseImports.
    if (!rImports.ok) return rImports; // There's something wrong with imports, that's fatal.

    const implicitImports = await this.importsToBindings(
      pendingIds,
      this.getItem(sourceId).getImplicitImports()
    );

    if (!implicitImports.ok) return implicitImports;
    const explicitImports = await this.importsToBindings(
      pendingIds,
      rImports.value
    );
    if (!explicitImports.ok) return explicitImports;

    return Result.Ok({
      implicitImports: implicitImports.value,
      explicitImports: explicitImports.value,
    });
  }

  private async innerRun(sourceId: string, pendingIds: Set<string>) {
    pendingIds.add(sourceId);

    const cachedOutput = this.getItem(sourceId).output;
    if (!cachedOutput) {
      const rExternals = await this.buildExternals(sourceId, pendingIds);

      if (!rExternals.ok) {
        this.getItem(sourceId).failRun(rExternals.value);
      } else {
        await this.getItem(sourceId).run(
          this.getEnvironment(),
          rExternals.value,
          this
        );
      }
    }

    pendingIds.delete(sourceId);
  }

  async run(sourceId: string) {
    await this.innerRun(sourceId, new Set());
  }

  // Helper method for "Find in Editor" feature
  findValuePathByOffset(
    sourceId: string,
    offset: number
  ): Result.result<SqValuePath, SqError> {
    const { ast } = this.getItem(sourceId);
    if (!ast) {
      return Result.Err(new SqOtherError("Not parsed"));
    }
    if (!ast.ok) {
      return ast;
    }
    const found = SqValuePath.findByAstOffset({
      ast: ast.value,
      offset,
    });
    if (!found) {
      return Result.Err(new SqOtherError("Not found"));
    }
    return Result.Ok(found);
  }
}
