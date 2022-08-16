{
  description = "Squiggle CI";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-22.05";
    gentype = {
      url = "github:quinn-dougherty/genType";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    hercules-ci-effects = {
      url = "github:hercules-ci/hercules-ci-effects";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils = {
      url = "github:numtide/flake-utils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, gentype, hercules-ci-effects, flake-utils, ... }:
    let
      commonFn = pkgs: {
        buildInputs = with pkgs; [ nodejs yarn ];
        prettier = with pkgs.nodePackages; [ prettier ];
        which = [ pkgs.which ];
      };
      langFn = { pkgs, ... }:
        import ./nix/squiggle-lang.nix { inherit pkgs commonFn gentype; };
      componentsFn = { pkgs, ... }:
        import ./nix/squiggle-components.nix { inherit pkgs commonFn langFn; };
      websiteFn = { pkgs, ... }:
        import ./nix/squiggle-website.nix {
          inherit pkgs commonFn langFn componentsFn;
        };

      # local machines
      localFlake = { pkgs }:
        let
          lang = langFn pkgs;
          components = componentsFn pkgs;
          website = websiteFn pkgs;
        in {
          # validating
          checks = flake-utils.lib.flattenTree {
            lang-lint = lang.lang-lint;
            lang-test = lang.lang-test;
            components-lint = components.components-lint;
            docusaurus-lint = website.website-lint;
          };
          # building
          packages = flake-utils.lib.flattenTree {
            default = website.website;
            lang-bundle = lang.lang-bundle;
            components = components.components-package-build;
            storybook = components.components-site-build;
            docs-site = website.website;
          };

          # developing
          devShells = flake-utils.lib.flattenTree {
            default = (import ./nix/shell.nix { inherit pkgs; }).shell;
          };
        };

      # ci
      herc = let
        hciSystem = "x86_64-linux";
        hciPkgs = import nixpkgs { system = hciSystem; };
        effects = hercules-ci-effects.lib.withPkgs hciPkgs;
        lang = langFn hciPkgs;
        components = componentsFn hciPkgs;
        website = websiteFn hciPkgs;
      in {
        # herc
        herculesCI = {
          ciSystems = [ hciSystem ];
          onPush = {
            lang.outputs = {
              squiggle-lang-lint = lang.lang-lint;
              squiggle-lang-build = lang.lang-build;
              squiggle-lang-test = lang.lang-test;
              squiggle-lang-bundle = lang.lang-bundle;
            };
            components.outputs = {
              squiggle-components = components.components-package-build;
              squiggle-components-lint =
                components.components-lint;
              squiggle-components-storybook =
                components.storybook;
            };
            docs-site.outputs = {
              squiggle-website = website.website;
              docusaurus-lint = website.docusaurus-lint;
            };
          };
        };

      };
    in flake-utils.lib.eachSystem [ "x86_64-linux" ] (system:
      let
        # globals
        pkgs = import nixpkgs {
          system = system;
          overlays = [
            (final: prev: {
              # set the node version here
              nodejs = prev.nodejs-16_x;
              # The override is the only way to get it into mkYarnModules
            })
          ];
        };

      in (localFlake { inherit pkgs; } )) // herc;
}
