/**
 * @import {Root as HastRoot} from 'hast'
 * @import {Options} from 'micromark-extension-ruby'
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkRubyAnnotation from 'remark-ruby-annotation'
import {unified} from 'unified'
import {visit} from 'unist-util-visit'
import {viaMicromark, viaRemark} from './util.js'

test('HTML in a base or reading is escaped', async function (t) {
  for (const input of ['{<script>|x}', '{x|<img onerror=alert(1)>}']) {
    await t.test(input + ' (micromark)', function () {
      const html = viaMicromark(input)
      assert.match(html, /<ruby>/)
      assert.doesNotMatch(html, /<script|<img/)
      assert.match(html, /&lt;(script|img)/)
    })

    await t.test(input + ' (remark-rehype)', function () {
      const html = viaRemark(input)
      assert.match(html, /<ruby>/)
      assert.doesNotMatch(html, /<script|<img/)
    })
  }
})

/**
 * Small seeded PRNG (mulberry32), so failures can be reproduced.
 *
 * @param {number} seed
 */
function random(seed) {
  return function () {
    seed = (seed + 0x6d_2b_79_f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

const alphabet = [...'{|}\\<>&"\'a漢 `*｛｜｝']
// Ruby elements, plus what CommonMark itself makes from this alphabet.
const allowed = new Set([
  ...['ruby', 'rt', 'rp'],
  ...['blockquote', 'code', 'em', 'hr', 'li', 'p', 'pre', 'strong', 'ul']
])
const inputs = /** @type {Array<string>} */ ([])
const next = random(1)

for (let index = 0; index < 2000; index++) {
  let value = ''
  const length = 1 + Math.floor(next() * 20)
  while (value.length < length) {
    value += alphabet[Math.floor(next() * alphabet.length)]
  }

  inputs.push(value)
}

for (const options of /** @type {Array<Options>} */ ([
  {},
  {rp: true, fullWidth: true}
])) {
  test(
    'fuzz: only expected elements, ruby elements have no attributes ' +
      JSON.stringify(options),
    function () {
      for (const input of inputs) {
        const html = viaMicromark(input, options)
        for (const match of html.matchAll(/<\/?([a-z][a-z\d]*)([^>]*)>/g)) {
          assert.ok(allowed.has(match[1]), input + ' gave <' + match[1] + '>')
          assert.equal(match[2], '', input + ' gave attributes')
        }

        const processor = unified()
          .use(remarkParse)
          .use(remarkRubyAnnotation, options)
          .use(remarkRehype)
        const tree = /** @type {HastRoot} */ (
          processor.runSync(processor.parse(input))
        )
        visit(tree, 'element', function (node) {
          assert.ok(allowed.has(node.tagName), input + ' gave ' + node.tagName)
          if (['ruby', 'rt', 'rp'].includes(node.tagName)) {
            assert.deepEqual(node.properties, {}, input + ' gave properties')
          }
        })
      }
    }
  )
}
