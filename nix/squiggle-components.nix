{ pkgs, commonFn, mcCacheFn, langFn }:

rec {
  common = commonFn pkgs;
  mcCache = mcCacheFn pkgs;
  lang = langFn pkgs;
  componentsPackageJson = let
    raw = pkgs.lib.importJSON ../packages/components/package.json;
    modified =
      pkgs.lib.recursiveUpdate raw { dependencies.react-dom = "^18.2.0"; };
    packageJsonString = builtins.toJSON modified;
  in pkgs.writeText "packages/components/patched-package.json"
  packageJsonString;
  yarn-source = pkgs.mkYarnPackage {
    name = "squiggle-components_source";
    buildInputs = common.buildInputs;
    src = ../packages/components;
    packageJSON = componentsPackageJson;
    yarnLock = ../yarn.lock;
    packageResolutions."@quri/squiggle-lang" = lang.build;
  };
  lint = pkgs.stdenv.mkDerivation {
    name = "squiggle-components-lint";
    src = yarn-source
      + "/libexec/@quri/squiggle-components/deps/@quri/squiggle-components";
    buildInputs = common.buildInputs ++ common.prettier;
    buildPhase = "yarn lint";
    installPhase = "mkdir -p $out";
  };
  package-build = pkgs.stdenv.mkDerivation {
    name = "squiggle-components-package-build";
    src = yarn-source + "/libexec/@quri/squiggle-components";
    buildInputs = common.buildInputs;
    buildPhase = ''
      cp -r node_modules/@quri/squiggle-lang deps/@quri
      pushd deps/@quri/squiggle-components

      yarn --offline build:cjs
      yarn --offline build:css
      popd
    '';
    installPhase = ''
      mkdir -p $out

      # annoying hack because permissions on transitive dependencies later on
      mv deps/@quri/squiggle-components/node_modules deps/@quri/squiggle-components/NODE_MODULES
      mv node_modules deps/@quri/squiggle-components

      # patching .gitignore so flake keeps build artefacts
      sed -i /dist/d deps/@quri/squiggle-components/.gitignore
      cp -r deps/@quri/squiggle-components/. $out
    '';
  };
  site-build = pkgs.stdenv.mkDerivation {
    name = "squiggle-components-storybook";
    src = package-build;
    buildInputs = common.buildInputs;
    buildPhase = "yarn build:storybook";
    installPhase = ''
      mkdir -p $out

      # patching .gitignore so flake keeps build artefacts
      sed -i /build/d .gitignore
      sed -i /storybook-static/d .gitignore
    '';
  };
}
