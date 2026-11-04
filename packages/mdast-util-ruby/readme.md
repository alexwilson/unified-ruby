# mdast-util-ruby

[mdast][] extensions to parse and serialize ruby annotations
(`{漢字|かんじ}`) with the syntax of [DenDen Markdown][denden].

This package supports the DenDen syntax only. It does not support other ruby
syntaxes, for example Aozora (`｜漢字《かんじ》`) or `{base}^(text)`. The node
is called `ruby`. Other syntaxes could make the same node.

## Contents

- [What is this?](#what-is-this)
- [When to use this](#when-to-use-this)
- [Install](#install)
- [Use](#use)
- [API](#api)
- [Syntax](#syntax)
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

- `rubyFromMarkdown` for [`mdast-util-from-markdown`][from-markdown]. It
  makes `ruby` nodes from the tokens of
  [`micromark-extension-ruby`][micromark-extension-ruby].
- `rubyToMarkdown` for [`mdast-util-to-markdown`][to-markdown]. It writes
  `ruby` nodes as Markdown.

## When to use this

Use this package if you use `mdast-util-from-markdown` or
`mdast-util-to-markdown` directly, without unified.

If you use remark or unified, use
[`remark-ruby-annotation`][remark-ruby-annotation].

## Install

This package is [ESM only][esm]. Install with npm:

```sh
npm install mdast-util-ruby micromark-extension-ruby
```

## Use

```js
import {fromMarkdown} from 'mdast-util-from-markdown'
import {rubyFromMarkdown, rubyToMarkdown} from 'mdast-util-ruby'
import {toMarkdown} from 'mdast-util-to-markdown'
import {ruby} from 'micromark-extension-ruby'

const tree = fromMarkdown('{漢字|かん|じ}', {
  extensions: [ruby()],
  mdastExtensions: [rubyFromMarkdown()]
})

console.log(tree.children[0].children[0])

console.log(toMarkdown(tree, {extensions: [rubyToMarkdown()]}))
```

Result:

```js
{
  type: 'ruby',
  value: '漢字',
  readings: ['かん', 'じ'],
  data: {hName: 'ruby', hChildren: [/* … */]},
  position: {/* … */}
}
```

```markdown
{漢字|かん|じ}
```

## API

This package exports the identifiers `rubyFromMarkdown` and
`rubyToMarkdown`. There is no default export.

### `rubyFromMarkdown(options?)`

Create an extension for `mdast-util-from-markdown`.

- `options` ([`Options`](#options), optional): configuration.

Returns an extension for `mdast-util-from-markdown`. Give it in
`mdastExtensions`.

### `rubyToMarkdown(options?)`

Create an extension for `mdast-util-to-markdown`.

- `options` ([`Options`](#options), optional): configuration.

Returns an extension for `mdast-util-to-markdown`. Give it in `extensions`.

The serializer always writes ASCII delimiters. It escapes `\`, `{`, `|` and
`}` in the base and the readings. It writes a space or a tab at the start of
the base, and line endings, as character references (`&#x20;`). In text, it
escapes a `{` only when the text after it could make ruby. A lone `{` is not
escaped.

### `Options`

Configuration (TypeScript type).

- `fullWidth` (`boolean`, default: `false`): whether `｛`, `｜` and `｝` also
  act as delimiters. Use the same value as for `ruby()` in
  `micromark-extension-ruby`. With this option, the serializer also escapes
  `｛`, `｜` and `｝`.
- `rp` (`boolean`, default: `false`): whether `data.hChildren` includes `<rp>`
  elements.

## Syntax

See the [Syntax section of `micromark-extension-ruby`][syntax]. That section
also lists the differences from the DenDen converter.

## Syntax tree

### `Ruby`

```ts
interface Ruby extends Literal {
  type: 'ruby'
  value: string
  readings: Array<string>
}
```

**Ruby** (**[Literal][dfn-literal]**) is a ruby annotation. It can be used
where **[phrasing][dfn-phrasing-content]** content is expected.

- `value` is the base, decoded.
- `readings` holds the readings as written: one for group ruby, more for
  mono ruby. A reading can be an empty string. A split that does not match
  the base is kept, so the tree serializes to the same Markdown.

The node is mono ruby when the number of code points in `value` is equal to
`readings.length`. If not, it is group ruby.

`value` holds the base, so [`mdast-util-to-string`][to-string] gives the base
and not the readings. This is correct for search and for word counts.

## HTML

`rubyFromMarkdown` sets `data.hName` and `data.hChildren`. Thus
[`mdast-util-to-hast`][to-hast] and `remark-rehype` make the correct HTML
with no extra handler. For the HTML, see the
[HTML section of `micromark-extension-ruby`][html].

## Types

This package is typed with [TypeScript][]. It exports the types
[`Options`](#options), `Ruby` and `RubyData`. It also registers `ruby` in
`PhrasingContentMap` and `RootContentMap` of `@types/mdast`.

## Compatibility

This package works with the maintained versions of Node.js. CI tests
each of them.

This package works with `mdast-util-from-markdown` 2 and
`mdast-util-to-markdown` 2.

## Security

The base and the readings are text nodes in `data.hChildren`. They are
always encoded in HTML. Ruby makes only `ruby`, `rt` and `rp` elements, with
no properties.

## Related

- [`micromark-extension-ruby`][micromark-extension-ruby]: the syntax.
- [`remark-ruby-annotation`][remark-ruby-annotation]: remark plugin.

## Contribute

See [`CONTRIBUTING.md`][contributing].

## Licence

[MIT][licence] © Alex Wilson

[mdast]: https://github.com/syntax-tree/mdast
[denden]: https://conv.denshochan.com/markdown
[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[typescript]: https://www.typescriptlang.org
[from-markdown]: https://github.com/syntax-tree/mdast-util-from-markdown
[to-markdown]: https://github.com/syntax-tree/mdast-util-to-markdown
[to-hast]: https://github.com/syntax-tree/mdast-util-to-hast
[to-string]: https://github.com/syntax-tree/mdast-util-to-string
[dfn-literal]: https://github.com/syntax-tree/mdast#literal
[dfn-phrasing-content]: https://github.com/syntax-tree/mdast#phrasingcontent
[micromark-extension-ruby]: https://github.com/alexwilson/unified-ruby/tree/main/packages/micromark-extension-ruby
[remark-ruby-annotation]: https://github.com/alexwilson/unified-ruby/tree/main/packages/remark-ruby-annotation
[syntax]: https://github.com/alexwilson/unified-ruby/tree/main/packages/micromark-extension-ruby#syntax
[html]: https://github.com/alexwilson/unified-ruby/tree/main/packages/micromark-extension-ruby#html
[contributing]: https://github.com/alexwilson/unified-ruby/blob/main/CONTRIBUTING.md
[licence]: https://github.com/alexwilson/unified-ruby/blob/main/packages/mdast-util-ruby/license
