# Contributing

This guide is for all contributors: people and coding agents. The same rules
apply to both.

## Requirements

- Node.js 22 or later.
- pnpm, the version in `packageManager` in `package.json`. To get it, run
  `corepack enable`.

## Set up

1. Clone the repository.
2. Run `corepack enable`.
3. Run `pnpm install`.
4. Run `pnpm test`. All tests must pass before you start a change.

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

The supply-chain settings are in `pnpm-workspace.yaml`:

- `minimumReleaseAge` blocks versions that are less than 7 days old.
- `trustPolicy: no-downgrade` blocks a version that has less trust evidence
  (for example, no provenance) than an earlier version.

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
   provenance.

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
