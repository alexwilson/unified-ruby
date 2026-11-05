---
layout: default
title: unified-ruby
---

Ruby annotations for [unified][], with the syntax of [DenDen Markdown][denden].
Write `{漢字|かんじ}` and get <ruby>漢字<rt>かんじ</rt></ruby>.

The packages work with `micromark`, `mdast-util-from-markdown` and remark. The
output contains only `ruby`, `rt` and `rp` elements, and the text is always
encoded, so it is safe to render text from users.

## Try it

{% include importmap.html %}

<form id="ruby-playground" autocomplete="off">
  <fieldset>
    <label>Example
      <select id="ruby-example" name="example"></select>
    </label>
  </fieldset>
  <textarea id="ruby-input" name="input" lang="ja" spellcheck="false" aria-label="Markdown"></textarea>
  <fieldset>
    <label><input type="checkbox" name="fullWidth"> Full-width delimiters</label>
    <label><input type="checkbox" name="rp"> Add <code>&lt;rp&gt;</code></label>
  </fieldset>
  <fieldset>
    <label><input type="radio" name="view" value="preview" checked> Preview</label>
    <label><input type="radio" name="view" value="html"> HTML</label>
    <label><input type="radio" name="view" value="mdast"> mdast</label>
    <label><input type="radio" name="view" value="markdown"> Markdown</label>
  </fieldset>
  <div id="ruby-output" lang="ja" aria-live="polite">
    <p class="ruby-noscript">The editor needs JavaScript.</p>
  </div>
</form>

<script type="module" src="playground.js"></script>

The editor runs the packages from the `main` branch in your browser. The
Markdown view writes the syntax tree back to Markdown.

## Install

Use the package for the layer that you use:

| You use                    | Install                                                |
| -------------------------- | ------------------------------------------------------ |
| remark or unified          | `npm install remark-ruby-annotation`                   |
| `mdast-util-from-markdown` | `npm install mdast-util-ruby micromark-extension-ruby` |
| `micromark`                | `npm install micromark-extension-ruby`                 |

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
  .process('{漢字|かんじ}')
```

## Syntax

- Group ruby: `{電子出版|でんししゅっぱん}`.
- Mono ruby: `{電子出版|でん|し|しゅっ|ぱん}`. If the number of readings is
  not the number of characters, the result is group ruby.
- Escape a delimiter with a backslash: `{Info\|Warning}` is not ruby.
- With the `fullWidth` option, `｛`, `｜` and `｝` also work.

The [full rules][syntax] also list the differences from the DenDen converter,
and what happens in GFM tables.

[unified]: https://unifiedjs.com
[denden]: https://conv.denshochan.com/markdown
[syntax]: https://github.com/alexwilson/unified-ruby/tree/main/packages/micromark-extension-ruby#syntax
