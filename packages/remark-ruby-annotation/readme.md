# remark-ruby-annotation

[remark][] plugin to support ruby annotations (`{漢字|かんじ}`) with the
syntax of [DenDen Markdown][denden].

This package supports the DenDen syntax only. It does not support other ruby
syntaxes, for example Aozora (`｜漢字《かんじ》`) or `{base}^(text)`.

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

This plugin adds ruby support to remark. It adds
[`micromark-extension-ruby`][micromark-extension-ruby] to the parser and
[`mdast-util-ruby`][mdast-util-ruby] to the parser and the serializer. It does
nothing else.

## When to use this

Use this plugin if you use remark or unified. If you do not use unified, use
the two packages above directly.

## Install

This package is [ESM only][esm]. Install with npm:

```sh
npm install remark-ruby-annotation
```

## Use

```js
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkRubyAnnotation from 'remark-ruby-annotation'
import {unified} from 'unified'

const file = await unified()
  .use(remarkParse)
  .use(remarkRubyAnnotation)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process('今日は{学校|がっこう}に行った。')

console.log(String(file))
```

Result:

```html
<p>
  今日は<ruby>学校<rt>がっこう</rt></ruby
  >に行った。
</p>
```

You can use this plugin with `remark-gfm`, in any order.

## API

This package has no named exports. The default export is
`remarkRubyAnnotation`.

### `unified().use(remarkRubyAnnotation[, options])`

Add support for ruby annotations.

- `options` ([`Options`](#options), optional): configuration.

Returns nothing (`undefined`).

### `Options`

Configuration (TypeScript type).

- `fullWidth` (`boolean`, default: `false`): whether `｛`, `｜` and `｝` also
  act as delimiters. With this option, the serializer also escapes `｛`, `｜`
  and `｝`. It always writes ASCII delimiters.
- `rp` (`boolean`, default: `false`): whether to add `<rp>` elements around
  each `<rt>`.

## Syntax

See the [Syntax section of `micromark-extension-ruby`][syntax]. That section
also lists the differences from the DenDen converter, and what happens in GFM
tables.

## Syntax tree

See the [Syntax tree section of `mdast-util-ruby`][syntax-tree].

## HTML

See the [HTML section of `micromark-extension-ruby`][html].

## Types

This package is typed with [TypeScript][]. It exports the type
[`Options`](#options).

## Compatibility

This package works with the maintained versions of Node.js. CI tests
each of them.

This plugin works with `unified` 11, `remark-parse` 11 and
`remark-stringify` 11.

## Security

Ruby makes only `ruby`, `rt` and `rp` elements, with no properties. The base
and the readings are always encoded as text.

## Related

- [`remark-gfm`][remark-gfm]: GFM support. It works with this plugin.
- [`remark-denden-ruby`][remark-denden-ruby]: an earlier plugin for the same
  syntax. Its test cases are part of the test suite of this package.

## Contribute

See [`CONTRIBUTING.md`][contributing].

## Licence

[MIT][licence] © Alex Wilson

[remark]: https://github.com/remarkjs/remark
[denden]: https://conv.denshochan.com/markdown
[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
[typescript]: https://www.typescriptlang.org
[remark-gfm]: https://github.com/remarkjs/remark-gfm
[remark-denden-ruby]: https://www.npmjs.com/package/remark-denden-ruby
[micromark-extension-ruby]: https://github.com/alexwilson/unified-ruby/tree/main/packages/micromark-extension-ruby
[mdast-util-ruby]: https://github.com/alexwilson/unified-ruby/tree/main/packages/mdast-util-ruby
[syntax]: https://github.com/alexwilson/unified-ruby/tree/main/packages/micromark-extension-ruby#syntax
[syntax-tree]: https://github.com/alexwilson/unified-ruby/tree/main/packages/mdast-util-ruby#syntax-tree
[html]: https://github.com/alexwilson/unified-ruby/tree/main/packages/micromark-extension-ruby#html
[contributing]: https://github.com/alexwilson/unified-ruby/blob/main/CONTRIBUTING.md
[licence]: https://github.com/alexwilson/unified-ruby/blob/main/packages/remark-ruby-annotation/license
