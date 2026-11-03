import assert from 'node:assert/strict'
import test from 'node:test'
import {toHtml} from 'hast-util-to-html'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {rubyFromMarkdown} from 'mdast-util-ruby'
import {toHast} from 'mdast-util-to-hast'
import {toString} from 'mdast-util-to-string'
import {ruby} from 'micromark-extension-ruby'
import {denden} from './cases.js'
import {parse, rubies} from './util.js'

test('fromMarkdown with only the micromark and mdast extensions', function () {
  for (const item of denden) {
    const tree = fromMarkdown(item.input, {
      extensions: [ruby()],
      mdastExtensions: [rubyFromMarkdown()]
    })
    assert.equal(toHtml(toHast(tree)), item.html, item.name)
  }
})

test('node shape', async function (t) {
  await t.test('group ruby', function () {
    const [node] = rubies(parse('{漢字|かんじ}'))
    assert.equal(node.type, 'ruby')
    assert.equal(node.value, '漢字')
    assert.deepEqual(node.readings, ['かんじ'])
    assert.equal(node.data?.hName, 'ruby')
  })

  await t.test('a split that does not match is kept', function () {
    const [node] = rubies(parse('{電子出版|でんし|しゅっぱん}'))
    assert.deepEqual(node.readings, ['でんし', 'しゅっぱん'])
  })

  await t.test('position covers the whole ruby', function () {
    const tree = fromMarkdown('a{漢字|かんじ}b', {
      extensions: [ruby()],
      mdastExtensions: [rubyFromMarkdown()]
    })
    const [node] = rubies(tree)
    assert.equal(node.position?.start.offset, 1)
    assert.equal(node.position?.end.offset, 9)
  })

  await t.test('`rp: true` puts `<rp>` in hChildren', function () {
    const tree = fromMarkdown('{a|b}', {
      extensions: [ruby()],
      mdastExtensions: [rubyFromMarkdown({rp: true})]
    })
    assert.equal(
      toHtml(toHast(tree)),
      '<p><ruby>a<rp>(</rp><rt>b</rt><rp>)</rp></ruby></p>'
    )
  })
})

test('mdast-util-to-string gives the base, not the readings', function () {
  assert.equal(toString(parse('今日は{学校|がっこう}に')), '今日は学校に')
})
