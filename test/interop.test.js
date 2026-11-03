import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'
import {cjkFriendlyExtension} from 'micromark-extension-cjk-friendly'
import {gfm, gfmHtml} from 'micromark-extension-gfm'
import {ruby, rubyHtml} from 'micromark-extension-ruby'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkRubyAnnotation from 'remark-ruby-annotation'
import {unified} from 'unified'

/**
 * @param {string} value
 * @param {{cjk?: boolean, fullWidth?: boolean, withRuby?: boolean}} [settings]
 */
function withGfm(value, settings = {}) {
  const extensions = [gfm()]
  const htmlExtensions = [gfmHtml()]
  if (settings.withRuby !== false) {
    extensions.push(ruby({fullWidth: settings.fullWidth}))
    htmlExtensions.push(rubyHtml())
  }

  if (settings.cjk) extensions.push(cjkFriendlyExtension())
  return micromark(value, {extensions, htmlExtensions})
}

test('GFM strikethrough around ruby', function () {
  assert.equal(
    withGfm('~~{取消|とりけし}~~'),
    '<p><del><ruby>取消<rt>とりけし</rt></ruby></del></p>'
  )
})

test('strong around ruby, then kana', async function (t) {
  // `}` is punctuation and `で` is not, so CommonMark does not allow the
  // closing `**` here. This is the same without ruby: `**{強調}**です`.
  await t.test('GFM only: not strong (CommonMark flanking rules)', function () {
    assert.equal(
      withGfm('**{強調|きょうちょう}**です'),
      '<p>**<ruby>強調<rt>きょうちょう</rt></ruby>**です</p>'
    )
  })

  await t.test('GFM and cjk-friendly: strong', function () {
    assert.equal(
      withGfm('**{強調|きょうちょう}**です', {cjk: true}),
      '<p><strong><ruby>強調<rt>きょうちょう</rt></ruby></strong>です</p>'
    )
  })
})

test('GFM table cells', async function (t) {
  const head = '| a | b |\n| - | - |\n'

  await t.test('an ASCII `|` splits the cell first, so no ruby', function () {
    const value = head + '| {漢字|かんじ} | x |'
    assert.equal(withGfm(value), withGfm(value, {withRuby: false}))
  })

  await t.test('full-width delimiters work in a cell', function () {
    assert.match(
      withGfm(head + '| ｛漢字｜かんじ｝ | x |', {fullWidth: true}),
      /<td><ruby>漢字<rt>かんじ<\/rt><\/ruby><\/td>/
    )
  })

  // To do (implementation): find out what `| {漢字\|かんじ} | x |` gives,
  // add a test that pins it, and document it in the README.
})

test('remark-gfm and remark-ruby-annotation in either order', function () {
  const value = '~~{取消|とりけし}~~ and *{強|つよ}*'
  const expected =
    '<p><del><ruby>取消<rt>とりけし</rt></ruby></del> and <em><ruby>強<rt>つよ</rt></ruby></em></p>'

  for (const plugins of [
    [remarkGfm, remarkRubyAnnotation],
    [remarkRubyAnnotation, remarkGfm]
  ]) {
    const processor = unified().use(remarkParse)
    for (const plugin of plugins) processor.use(plugin)
    const html = String(
      processor.use(remarkRehype).use(rehypeStringify).processSync(value)
    )
    assert.equal(html, expected)
  }
})
