# Contributing

This guide is for all contributors: people and coding agents. The same rules
apply to both.

## Requirements

- A maintained version of Node.js (22, 24 or 26 on 2026-11-04).
- pnpm, the version in `packageManager` in `package.json`. To get it, run
  `corepack enable`.

## Set up

1. Clone the repository.
2. If your Node.js does not include Corepack (Node.js 25 and later), run
   `npm install --global corepack`.
3. Run `corepack enable`.
4. Run `pnpm install`.
5. Run `pnpm test`. All tests must pass before you start a change.

Corepack installs the pnpm version in `packageManager` in `package.json`,
and checks the download against the `sha512` hash in that field.

## Commands

| Command           | What it does                                                     |
| ----------------- | ---------------------------------------------------------------- |
| `pnpm run build`  | Makes the `.d.ts` files and the production `lib/` files.         |
| `pnpm run check`  | Checks the format (Prettier) and the types (`tsc`).              |
| `pnpm run format` | Formats all files.                                               |
| `pnpm test`       | Builds, checks the test types, and runs all tests with coverage. |

`pnpm test` runs each test two times: one time with the `development`
condition and one time with the `production` condition. Coverage must be
100 % for lines and branches.

## Repository layout

```
packages/
  micromark-extension-ruby/  Syntax and HTML for micromark.
    dev/                     Source. Edit these files.
    lib/, index.js           Made by `micromark-build`. Do not edit.
  mdast-util-ruby/           Tokens to mdast, mdast to markdown, and types.
  remark-ruby-annotation/    The remark plugin. It adds the two packages above.
test/                        Tests for all packages.
  cases.js                   Shared test cases with the expected HTML.
  fixtures/                  The CommonMark 0.31.2 examples (CC-BY-SA 4.0).
```

The layout and the API names follow `micromark-extension-gfm-strikethrough`,
`mdast-util-gfm-strikethrough` and `remark-gfm`. Use these packages as a
reference for new code.

## How to make a change

1. Write a test that fails. The test must show the behaviour that you want.
2. Run `pnpm test`. Make sure that the new test fails for the correct reason.
3. Change the code.
4. Run `pnpm test`. Make sure that all tests pass.
5. Run `pnpm run check`.
6. Commit. Make one commit for each logical change.

Do not change the expected value in a test only to make the test pass. If you
think that an expected value is wrong, write the reason in the pull request.

## Syntax decisions

The README of each package has a Syntax section. That section is the
reference for the syntax. Do not change a syntax decision in the code without
a change to the README in the same commit.

## Dependencies

There are two sides with different rules:

- **The repository side** (the lockfile, CI, the release) is strict. Only
  this project pays for it.
- **The published side** (`dependencies` in each `package.json`) is loose.
  Each consumer pays for each limit there. The lockfile and the policy of the
  consumer protect the consumer. Our ranges cannot.

### Rules for published dependencies

1. Declare what the shipped files import. Declare nothing else. A package
   goes in `dependencies` if a shipped `.js` or `.d.ts` file imports it. A
   JSDoc `@import` tag is a comment. It does not count.
2. Use caret ranges (`^x.y.z`). Do not use an exact version, `*`, `latest`,
   a git URL or a tarball URL.
3. Use the lowest version that works as the lower bound. Do not raise a
   lower bound only because a newer version exists. Raise it only when the
   code needs a newer version. Write the reason in the commit body.
4. Do not use `peerDependencies`.
5. Do not set `engines`. Each README says that the package works with the
   maintained versions of Node.js. CI tests those versions.
6. Do not ship install scripts (`preinstall`, `install`, `postinstall`,
   `prepare`).
7. Keep the `files` list. Do not ship tests, fixtures or source maps.

`test/package.test.js` checks rules 1, 4, 5, 6 and 7 on the real tarballs.
The `lowest versions` CI job checks rule 3: it installs the lowest version
in each range and runs the tests.

### Rules for a new dependency

Before you add a runtime dependency, do all of these steps. Write the
results in the commit body.

1. Make sure that you need it. If the same code is fewer than 30 lines,
   write the code.
2. Use a package from the unified collective, syntax-tree or micromark
   organisations. For a package from a different source, ask a maintainer
   first.
3. Examine the provenance of the version:
   `npm view <package>@<version> dist.attestations`. It must come from the
   official repository of the package.
4. Make sure that the package has no install scripts.
5. Count the new transitive packages with `pnpm why <package>` after the
   install. If the count is more than 5, ask a maintainer first.

For a development dependency, do steps 3, 4 and 5.

### Repository settings

The supply-chain settings are in `pnpm-workspace.yaml`. Do not lower them.

- `minimumReleaseAge` blocks versions that are less than 7 days old.
- `trustPolicy: no-downgrade` blocks a version that has less trust evidence
  (for example, no provenance) than an earlier version.
- `allowBuilds: {}` permits no dependency to run build scripts.

If the install stops because of these settings, do these steps:

1. Find the package and the version that causes the problem.
2. Examine the provenance: `npm view <package>@<version> dist.attestations`.
3. Make sure that the build comes from the official repository of the
   package.
4. Add the exact version (not a range or a name) to the applicable exclude
   list.
5. Add a comment above the entry. Write the reason and the result of the
   check.

Do not add `dangerouslyAllowAllBuilds`. Do not add a name without a version
to an exclude list.

## Writing rules

Write all documentation, specifications, comments, commit messages and pull
requests in Simplified Technical English (ASD-STE100). The main rules are:

- Use short sentences. Procedural sentences: 20 words or fewer. Descriptive
  sentences: 25 words or fewer.
- Write one instruction in each sentence.
- Use the imperative for instructions ("Run the tests").
- Use the active voice.
- Use one word for one meaning. Do not change the term for the same thing.
- Do not use idioms, metaphors or slang.
- Write a list for a sequence of steps.

Write specifications in the same way. Each requirement must be a clear
statement that a test can check.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):
`type(scope): summary`.

- The types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore` and `revert`.
- The scope is the package name without the prefix: `micromark`, `mdast` or
  `remark`. Do not use a scope for changes to more than one package.
- Write the summary in the imperative, in lowercase, with no full stop, in
  50 characters or fewer.
- Write a body only if the reason for the change is not clear from the diff.

release-please uses these messages to make the version numbers and the
changelogs. A `feat` commit makes a minor release. A `fix` commit makes a
patch release.

## Releases

Releases are automatic. Do not publish by hand, except for the first publish
(see below).

1. When commits go into `main`, release-please opens or updates a release
   pull request.
2. A maintainer merges the release pull request.
3. The `release` workflow publishes the released packages to npm with
   provenance. The `pack` job builds, tests and packs with read-only
   permissions. The `publish` job has the npm permission. It does not check
   out the repository or install packages. It checks the SHA-256 sums of the
   tarballs, then runs `npm publish`.

### First publish of a new package

npm trusted publishing works only for a package that already exists. For
each new package, a maintainer does these steps one time:

1. Run `pnpm test`.
2. In the package folder, run `pnpm pack`.
3. Run `npm publish <tarball> --access public`. Use your npm account and 2FA.
4. On npmjs.com, open the package settings.
5. Add a trusted publisher. Use these values: this repository,
   the workflow file `release.yml`, and the environment `npm`.
6. Set "Publishing access" to "Require two-factor authentication and
   disallow tokens".
