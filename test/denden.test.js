import assert from 'node:assert/strict'
import test from 'node:test'
import {denden, remarkDendenRuby} from './cases.js'
import {viaMicromark, viaRemark} from './util.js'

for (const [suite, cases] of /** @type {const} */ ([
  ['DenDen rules', denden],
  ['remark-denden-ruby 0.3.1 cases', remarkDendenRuby]
])) {
  test(suite, async function (t) {
    for (const item of cases) {
      await t.test(item.name + ' (micromark)', function () {
        assert.equal(viaMicromark(item.input, item.options), item.html)
      })

      await t.test(item.name + ' (remark-rehype)', function () {
        assert.equal(viaRemark(item.input, item.options), item.html)
      })
    }
  })
}

test('DenDen rule 7: no `<rp>` by default', function () {
  assert.doesNotMatch(viaMicromark('{漢字|かんじ}'), /<rp>/)
  assert.doesNotMatch(viaRemark('{漢字|かんじ}'), /<rp>/)
})

test('`rp: true` wraps each `<rt>` of mono ruby', function () {
  const html =
    '<p><ruby>漢<rp>(</rp><rt>かん</rt><rp>)</rp>字<rp>(</rp><rt>じ</rt><rp>)</rp></ruby></p>'
  assert.equal(viaMicromark('{漢字|かん|じ}', {rp: true}), html)
  assert.equal(viaRemark('{漢字|かん|じ}', {rp: true}), html)
})
