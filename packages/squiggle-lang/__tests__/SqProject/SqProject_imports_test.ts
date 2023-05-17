import { SqProject } from "../../src/index.js";

describe("Parse imports", () => {
  const project = SqProject.create({ resolver: (name) => name });
  project.setSource(
    "main",
    `
import './common' as common
import "./myModule" as myVariable
x=1`
  );
  project.parseImports("main");

  test("dependencies", () => {
    expect(project.getDependencies("main")).toEqual(["./common", "./myModule"]);
  });

  test("dependents", () => {
    expect(project.getDependents("main")).toEqual([]);
  });

  test("getImports", () => {
    const mainImportIds = project.getImportIds("main");
    if (mainImportIds.ok) {
      expect(mainImportIds.value).toEqual(["./common", "./myModule"]);
    } else {
      fail(mainImportIds.value.toString());
    }
  });

  test("continues", () => {
    expect(project.getContinues("main")).toEqual([]);
  });

  test("import as variables", () => {
    expect(project.getImports("main")).toEqual({
      ok: true,
      value: [
        { variable: "common", sourceId: "./common" },
        { variable: "myVariable", sourceId: "./myModule" },
      ],
    });
  });
});
