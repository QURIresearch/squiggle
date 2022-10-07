_The current document was written quickly and not exhaustively, yet, it's unfinished. [Template here](https://mozillascience.github.io/working-open-workshop/contributing/)_

# Contributing to Squiggle

We welcome contributions from developers, especially people in react/typescript, rescript, and interpreters/parsers. We also are keen to hear issues filed by users!

Squiggle is currently pre-alpha.

# Quick links

- [Roadmap to the alpha](https://github.com/orgs/quantified-uncertainty/projects/1)
- The team presently communicates via the **EA Forecasting and Epistemics** slack (channels `#squiggle` and `#squiggle-ops`), you can track down an invite by reaching out to Ozzie Gooen
- [Squiggle documentation](https://www.squiggle-language.com/docs/Language)
- [Rescript documentation](https://rescript-lang.org/docs/manual/latest/introduction)
- You can email `quinn@quantifieduncertainty.org` if you need assistance in onboarding or if you have questions

# Bug reports

Anyone (with a github account) can file an issue at any time. Please allow Slava, Sam, and Ozzie to triage, but otherwise just follow the suggestions in the issue templates.

# Project structure

Squiggle is a **monorepo** with three **packages**.

- **components** is where we improve reactive interfacing with Squiggle
- **squiggle-lang** is where the magic happens: probability distributions, the interpreter, etc.
- **website** is the site `squiggle-language.com`

# Deployment ops

We use Vercel, and it should only concern Slava, Sam, and Ozzie.

# Development environment, building, testing, dev server

You need `yarn`.

Being a monorepo, where packages are connected by dependency, it's important to follow `README.md`s closely. Each package has it's own `README.md`, which is where the bulk of information is.

We aspire for `ci.yaml` and `README.md`s to be in one-to-one correspondence.

## If you're on NixOS

You can't run `yarn` outside of a FHS shell. Additionally, you need to `patchelf` some things. A script does everything for you.

```sh
./nixos.sh
```

Reasons for this are comments in the script. Then, you should be able to do all the package-level `yarn run` commands/scripts.

# Try not to push directly to develop

If you absolutely must, please prefix your commit message with `hotfix: `.

# Pull request protocol

Please work against `develop` branch. **Do not** work against `master`.

- For rescript code: Slava and Ozzie are reviewers
- For js or typescript code: Sam and Ozzie are reviewers
- For ops code (i.e. yaml, package.json): Slava and Sam are reviewers

Autopings are set up: if you are not autopinged, you are welcome to comment, but please do not use the formal review feature, send approvals, rejections, or merges.

# Code Quality

- Aim for at least 8/10\* quality in `/packages/squiggle-lang`, and 7/10 quality in `/packages/components`.
- If you submit a PR that is under a 7, for some reason, describe the reasoning for this in the PR.

* This quality score is subjective.

# Rescript Style

**Use `->` instead of `|>`**  
Note: Our codebase used to use `|>`, so there's a lot of that in the system. We'll gradually change it.

**Use `x -> y -> z` instead of `let foo = y(x); let bar = z(foo)`**

**Don't use anonymous functions with over three lines**  
Bad:

```rescript
  foo
  -> E.O.fmap(r => {
    let a = 34;
    let b = 35;
    let c = 48;
    r + a + b + c
  }
```

Good:

```rescript
  let addingFn = (r => {
    let a = 34;
    let b = 35;
    let c = 48;
    r + a + b + c
  }
  foo -> addingFn
```

**Write out types for everything, even if there's an interface file**  
We'll try this for one month (ending May 5, 2022), then revisit.

**Use the Rescript optional default syntax**  
Rescript is clever about function inputs. There's custom syntax for default and optional arguments. In the cases where this applies, use it.

From https://rescript-lang.org/docs/manual/latest/function:

```rescript
// radius can be omitted
let drawCircle = (~color, ~radius=?, ()) => {
  setColor(color)
  switch radius {
  | None => startAt(1, 1)
  | Some(r_) => startAt(r_, r_)
  }
}
```

**Use named arguments**  
If a function is called externally (in a different file), and has either:

1. Two arguments of the same type
2. Three paramaters or more.

**Module naming: Use x_y as module names**  
For example: `Myname_Myproject_Add.res`. Rescript/Ocaml both require files to have unique names, so long names are needed to keep different parts separate from each other.

See [this page](https://dev.to/yawaramin/a-modular-ocaml-project-structure-1ikd) for more information. (Though note that they use two underscores, and we do one. We might refactor that later.

**Module naming: Don't rename modules**
We have some of this in the Reducer code, but generally discourage it.

**Use interface files (.resi) for files with very public interfaces**

### Recommended Rescript resources

- https://dev.to/yawaramin/a-modular-ocaml-project-structure-1ikd
- https://github.com/avohq/reasonml-code-style-guide
- https://cs.brown.edu/courses/cs017/content/docs/reasonml-style.pdf
- https://github.com/ostera/reason-design-patterns/
