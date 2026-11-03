# unified-ruby

Ruby annotations (`{漢字|かんじ}`) for [unified][], with the syntax of
[DenDen Markdown][denden].

This syntax is the DenDen syntax only. Other ruby syntaxes, for example
Aozora (`｜漢字《かんじ》`) and `{base}^(text)`, are not supported.

## Packages

| Package                                                         | Use it when                                  |
| --------------------------------------------------------------- | -------------------------------------------- |
| [`remark-ruby-annotation`](packages/remark-ruby-annotation)     | You use remark or unified.                   |
| [`mdast-util-ruby`](packages/mdast-util-ruby)                   | You use `mdast-util-from-markdown` directly. |
| [`micromark-extension-ruby`](packages/micromark-extension-ruby) | You use `micromark` directly.                |

## Contribute

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Credits

The test cases of [`remark-denden-ruby`][remark-denden-ruby] (MIT, fabon) are
part of the test suite.

## Licence

[MIT](LICENSE) © Alex Wilson

[unified]: https://unifiedjs.com
[denden]: https://conv.denshochan.com/markdown
[remark-denden-ruby]: https://www.npmjs.com/package/remark-denden-ruby
