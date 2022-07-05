module Module = Reducer_Category_Module

let internalStdLib = Module.emptyModule->SquiggleLibrary_Math.makeBindings

@genType
let externalStdLib = internalStdLib->Module.toTypeScriptBindings
