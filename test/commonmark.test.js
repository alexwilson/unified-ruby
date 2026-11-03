import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {micromark} from 'micromark'
import {ruby, rubyHtml} from 'micromark-extension-ruby'

/**
 * @typedef Example
 * @property {string} markdown
 * @property {string} html
 * @property {number} example
 * @property {string} section
 */

/** @type {Array<Example>} */
const examples = JSON.parse(
  await fs.readFile(
    new URL('fixtures/commonmark-0.31.2.json', import.meta.url),
    'utf8'
  )
)

/**
 * Examples that contain a valid ruby and so may change, with the reason.
 * CommonMark 0.31.2 has no such examples, so this list stays empty unless
 * the syntax changes.
 *
 * @type {Map<number, string>}
 */
const expectedChanges = new Map()

for (const fullWidth of [false, true]) {
  test('CommonMark 0.31.2 with `fullWidth: ' + fullWidth + '`', function () {
    const options = {fullWidth}
    /** @type {Array<number>} */
    const changed = []

    for (const item of examples) {
      const actual = micromark(item.markdown, {
        allowDangerousHtml: true,
        allowDangerousProtocol: true,
        extensions: [ruby(options)],
        htmlExtensions: [rubyHtml(options)]
      })

      if (actual !== item.html) changed.push(item.example)
    }

    assert.equal(examples.length, 652)
    assert.deepEqual(changed, [...expectedChanges.keys()])
  })
}
