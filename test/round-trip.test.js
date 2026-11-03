/**
 * @import {Root} from 'mdast'
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {denden, remarkDendenRuby} from './cases.js'
import {parse, serialize} from './util.js'

const positive = [
  ...denden.map((d) => d.input),
  ...remarkDendenRuby.map((d) => d.input),
  '{Hello, world!|ハロー}',
  '{a{b|c}',
  '{a\\|b|c}',
  '{a\\}b|c}',
  '{a\\{b|c}',
  '{a\\\\|b}',
  '{a|b\\|c}',
  '{a\\*b|c}',
  '{a\\b|c}',
  '{**強**|つよ}',
  '{a|*b*}',
  '*{a|b}*',
  '**{強|つよ}**',
  '{𠮷野|よ|し|の}',
  'x{ 漢字 | かんじ }x',
  '[{東京|とうきょう}](/tokyo)',
  '{a`|`b}',
  '{[a](/u)|b}',
  '{a\\||b}',
  '{\\\\|\\\\}',
  '{ and | and }'
]

const lookalikes = [
  '{|a}',
  '{a|}',
  '{a\\|b}',
  '\\{a|b\\}',
  '{a|b',
  'a|b}',
  '{a}',
  'a { b',
  '`{a|b}`'
]

for (const [name, inputs] of /** @type {const} */ ([
  ['ruby', positive],
  ['text that looks like ruby', lookalikes]
])) {
  test('parse, serialize, parse: ' + name, async function (t) {
    for (const input of inputs) {
      await t.test(input, function () {
        const tree = parse(input)
        const again = parse(serialize(tree))
        assert.deepEqual(again, tree)
      })
    }
  })
}

test('full-width input serializes with ASCII delimiters', function () {
  const tree = parse('｛漢字｜かん｜じ｝', {fullWidth: true})
  assert.equal(serialize(tree, {fullWidth: true}), '{漢字|かん|じ}\n')
})

test('serializer output', async function (t) {
  /**
   * @param {string} value
   * @param {Array<string>} readings
   */
  function one(value, readings) {
    /** @type {Root} */
    const tree = {
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'ruby', value, readings}]}
      ]
    }
    return serialize(tree)
  }

  await t.test('group', function () {
    assert.equal(one('漢字', ['かんじ']), '{漢字|かんじ}\n')
  })

  await t.test('mono', function () {
    assert.equal(one('漢字', ['かん', 'じ']), '{漢字|かん|じ}\n')
  })

  await t.test('delimiters in the base are escaped', function () {
    assert.equal(one('a|b', ['c']), '{a\\|b|c}\n')
    assert.equal(one('a}b', ['c']), '{a\\}b|c}\n')
    assert.equal(one('a{b', ['c']), '{a\\{b|c}\n')
  })

  await t.test('delimiters in a reading are escaped', function () {
    assert.equal(one('a', ['b|c']), '{a|b\\|c}\n')
  })

  await t.test('a trailing backslash is escaped', function () {
    assert.equal(one('a\\', ['b']), '{a\\\\|b}\n')
  })

  await t.test('a lone `{` in text is not escaped', function () {
    assert.equal(serialize(parse('a { b')), 'a { b\n')
    assert.equal(serialize(parse('{a}')), '{a}\n')
  })

  await t.test('text that would parse as ruby is escaped', function () {
    assert.notEqual(serialize(parse('{a\\|b}')), '{a|b}\n')
  })
})
