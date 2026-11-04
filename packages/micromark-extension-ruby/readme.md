# micromark-extension-ruby

[micromark][] extensions to support ruby annotations (`{漢字|かんじ}`) with
the syntax of [DenDen Markdown][denden].

This package supports the DenDen syntax only. It does not support other ruby
syntaxes, for example Aozora (`｜漢字《かんじ》`) or `{base}^(text)`.

## Contents

- [What is this?](#what-is-this)
- [When to use this](#when-to-use-this)
- [Install](#install)
- [Use](#use)
- [API](#api)
- [Syntax](#syntax)
- [Differences from the DenDen converter](#differences-from-the-denden-converter)
- [Syntax tree](#syntax-tree)
- [HTML](#html)
- [Types](#types)
- [Compatibility](#compatibility)
- [Security](#security)
- [Related](#related)
- [Contribute](#contribute)
- [Licence](#licence)

## What is this?

This package contains two extensions:

- `ruby` adds the syntax to `micromark`.
- `rubyHtml` compiles the syntax to HTML.

## When to use this

Use this package if you use `micromark` directly, or if you write a
`mdast-util-from-markdown` setup without unified.

If you use remark or unified, use
[`remark-ruby-annotation`][remark-ruby-annotation]. If you need a syntax tree,
use [`mdast-util-ruby`][mdast-util-ruby] with this package.

## Install

This package is [ESM only][esm]. Install with npm:

```sh
npm install micromark-extension-ruby
```

## Use

```js
import {micromark} from 'micromark'
import {ruby, rubyHtml} from 'micromark-extension-ruby'

const output = micromark('今日は{学校|がっこう}に行った。', {
  extensions: [ruby()],
  htmlExtensions: [rubyHtml()]
})

console.log(output)
```

Result:

```html
<p>
  今日は<ruby>学校<rt>がっこう</rt></ruby
  >に行った。
</p>
```

## API

This package exports the identifiers `ruby` and `rubyHtml`. There is no
default export.

### `ruby(options?)`

Create an extension for `micromark` to enable ruby syntax.

- `options` ([`Options`](#options), optional): configuration.

Returns an extension for `micromark` (`Extension`). Give it in
`extensions`.

### `rubyHtml(options?)`

Create an extension for `micromark` to compile ruby to HTML.

- `options` ([`Options`](#options), optional): configuration.

Returns an extension for `micromark` (`HtmlExtension`). Give it in
`htmlExtensions`.

### `Options`

Configuration (TypeScript type).

- `fullWidth` (`boolean`, default: `false`): whether `｛`, `｜` and `｝` also
  act as `{`, `|` and `}`. Only `ruby` uses this option.
- `rp` (`boolean`, default: `false`): whether to add `<rp>(</rp>` before each
  `<rt>` and `<rp>)</rp>` after it. Only `rubyHtml` uses this option.

Give the same options to both functions.

### `micromark-extension-ruby/util`

Helpers for packages that compile ruby tokens, for example
[`mdast-util-ruby`][mdast-util-ruby]. Most users do not need them.

```js
import {decodeRuby, rubySegments} from 'micromark-extension-ruby/util'
```

#### `decodeRuby(value, fullWidth?)`

Decode the source of a `rubyBase` or `rubyText` token.

- `value` (`string`): the source text of the token.
- `fullWidth` (`boolean`, default: `false`): whether `\｛`, `\｜` and `\｝`
  are decoded.

Returns the decoded value (`string`). CommonMark escapes and character
references are decoded.

#### `rubySegments(base, readings)`

Pair the base with the readings, by the rules for mono and group ruby.

- `base` (`string`): the decoded base.
- `readings` (`Array<string>`): the decoded readings.

Returns an array of `[text, reading]` pairs: one pair for each character for
mono ruby, or one pair for group ruby.

## Syntax

Group ruby puts one reading over the full base:

```markdown
{電子出版|でんししゅっぱん}
```

Mono ruby puts one reading over each character of the base:

```markdown
{電子出版|でん|し|しゅっ|ぱん}
```

The rules:

1. Ruby starts with `{`. Then comes the base, then `|`, then one or more
   readings separated by `|`, then `}`.
2. The base has one or more characters. It can contain `{` and `}`. It cannot
   contain an unescaped `|` or a line ending.
3. The first character of the base cannot be a space or a tab.
   `{ 漢字|かんじ}` is not ruby.
4. A reading can contain `{`. It cannot contain an unescaped `|`, an
   unescaped `}` or a line ending.
5. At least one character must follow the first `|`. `{漢字|}` is not ruby.
   After that, a reading can be empty: `{漢字||}` is mono ruby with two empty
   readings.
6. If the number of readings is equal to the number of characters in the
   base, the result is mono ruby. If not, the result is group ruby, and the
   readings are joined. `{電子出版|でんし|しゅっぱん}` is group ruby with
   the reading `でんししゅっぱん`.
7. A character is a Unicode code point. `{𠮷野家|よし|の|や}` is mono ruby.
   Grapheme clusters do not count: `👍🏽` is two characters.
8. Spaces are kept as written, except for rule 3. `{漢字 | かんじ }` has the
   base `漢字 ` and the reading `かんじ`.
9. Backslash escapes work as in CommonMark. An escaped delimiter is content:
   - `{Info\|Warning}` is not ruby.
   - `{a\|b|c}` is ruby with the base `a|b`.
   - `{a\\|b}` is ruby with the base `a\`.
10. Character references are decoded. `{&amp;|x}` has the base `&`. A
    reference is never a delimiter: `{a&#x7C;b|c}` has the base `a|b`.
11. The base and the readings are plain text. Markup inside them is not
    parsed. `{**強**|つよ}` has the base `**強**`.
12. Markup can be around ruby: `**{強|つよ}**`, `[{東京|とうきょう}](/tokyo)`.
13. A construct that starts before the `{` wins. Ruby inside a code span, an
    autolink or raw HTML is not ruby.
14. After the `{`, ruby wins. Backticks, `<` and link syntax inside the braces
    are content. ``{a`|`b}`` is ruby with the base ``a` ``.

With the `fullWidth` option:

- `｛`, `｜` and `｝` also act as delimiters. You can mix the two widths in
  one ruby, for example `{漢字｜かんじ｝`.
- Inside ruby, `\｛`, `\｜` and `\｝` are escapes. CommonMark does not have
  these escapes, so they work only inside ruby and only with this option.

### GFM tables

A GFM table splits a row into cells at each `|` before it parses the cells.
So `| {漢字|かんじ} |` gives two cells and no ruby. `| {漢字\|かんじ} |` gives
the text `{漢字|かんじ}`. To use ruby in a table cell, use the `fullWidth`
option and write `｛漢字｜かんじ｝`.

### Emphasis next to Japanese text

`**{強調|きょうちょう}**です` is not strong. This is not caused by ruby.
CommonMark does not let `**` close after punctuation (`}`) when a letter
(`で`) follows. Use [`micromark-extension-cjk-friendly`][cjk-friendly] to
change this.

## Differences from the DenDen converter

The syntax follows the [DenDen converter][denden-converter], with these
differences:

1. The converter parses markup inside the base and the readings. This package
   does not (rule 11).
2. In the converter, a code span inside the braces wins: ``{a`|`b}`` is not
   ruby. In this package, ruby wins (rule 14).

## Syntax tree

`ruby` makes these tokens:

- `ruby`: the full ruby.
- `rubyMarker`: each `{`, `|` and `}` (and the full-width forms).
- `rubyBase`: the base, before decoding.
- `rubyText`: each reading that is not empty, before decoding.

For an mdast syntax tree, see [`mdast-util-ruby`][mdast-util-ruby].

## HTML

Group ruby:

```html
<ruby>電子出版<rt>でんししゅっぱん</rt></ruby>
```

Mono ruby:

```html
<ruby>電<rt>でん</rt>子<rt>し</rt>出<rt>しゅっ</rt>版<rt>ぱん</rt></ruby>
```

With `rp: true`:

```html
<ruby>学校<rp>(</rp><rt>がっこう</rt><rp>)</rp></ruby>
```

This is the same HTML as the DenDen converter. The converter does not make
`<rp>`.

## Types

This package is typed with [TypeScript][]. It exports the type
[`Options`](#options). It also registers the token types in
`micromark-util-types`.

## Compatibility

This package works with the maintained versions of Node.js. CI tests
each of them.

This package works with `micromark` 4.

## Security

The base and the readings are always encoded as text. Ruby makes only
`ruby`, `rt` and `rp` elements, with no attributes. `{<script>|x}` gives
`<ruby>&lt;script&gt;<rt>x</rt></ruby>`.

The tokeniser runs in linear time. Input like `{{{{…` or `{a|{a|…` does not
make it slow.

### Supply chain

This package is published from GitHub Actions with npm provenance. To check
the packages that you installed, run `npm audit signatures`.

The dependency ranges of this package are wide on purpose, so that your
package manager can share one copy of each dependency. Your lockfile decides
what you install. To protect your project against a bad version of a
dependency, commit your lockfile and set a minimum release age (for example,
`minimumReleaseAge` in pnpm).

## Related

- [`mdast-util-ruby`][mdast-util-ruby]: mdast support.
- [`remark-ruby-annotation`][remark-ruby-annotation]: remark plugin.
- [`remark-denden-ruby`][remark-denden-ruby]: an earlier remark plugin for
  the same syntax. Its test cases are part of the test suite of this
  package.

## Contribute

See [`CONTRIBUTING.md`][contributing].

## Licence

[MIT][licence] © Alex Wilson

[micromark]: https://github.com/micromark/micromark
[denden]: https://conv.denshochan.com/markdown
[denden-converter]: https://conv.denshochan.com/
[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[typescript]: https://www.typescriptlang.org
[cjk-friendly]: https://www.npmjs.com/package/micromark-extension-cjk-friendly
[remark-denden-ruby]: https://www.npmjs.com/package/remark-denden-ruby
[mdast-util-ruby]: https://github.com/alexwilson/unified-ruby/tree/main/packages/mdast-util-ruby
[remark-ruby-annotation]: https://github.com/alexwilson/unified-ruby/tree/main/packages/remark-ruby-annotation
[contributing]: https://github.com/alexwilson/unified-ruby/blob/main/CONTRIBUTING.md
[licence]: https://github.com/alexwilson/unified-ruby/blob/main/packages/micromark-extension-ruby/license
