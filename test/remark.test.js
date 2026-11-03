import assert from 'node:assert/strict'
import test from 'node:test'
import {remark} from 'remark'
import remarkRubyAnnotation from 'remark-ruby-annotation'
import {viaRemark} from './util.js'

test('remark: parse and stringify', function () {
  assert.equal(
    String(remark().use(remarkRubyAnnotation).processSync('{a\\|b|c}')),
    '{a\\|b|c}\n'
  )
})

test('remark: options pass through', function () {
  assert.equal(
    viaRemark('｛漢字｜かんじ｝', {fullWidth: true}),
    '<p><ruby>漢字<rt>かんじ</rt></ruby></p>'
  )
  assert.equal(
    viaRemark('{a|b}', {rp: true}),
    '<p><ruby>a<rp>(</rp><rt>b</rt><rp>)</rp></ruby></p>'
  )
})
