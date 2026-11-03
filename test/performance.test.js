import assert from 'node:assert/strict'
import test from 'node:test'
import {viaMicromark} from './util.js'

const budget = 100

const inputs = {
  'many `{`': '{'.repeat(100_000),
  'many `{a|`': '{a|'.repeat(33_334),
  'one `{` and many `a|`': '{' + 'a|'.repeat(49_999) + 'a',
  'many `{a|b`': '{a|b'.repeat(25_000)
}

test('tokeniser stays linear on 100 000 characters', async function (t) {
  viaMicromark('warm up {a|b}')

  for (const [name, input] of Object.entries(inputs)) {
    await t.test(name, function () {
      const start = performance.now()
      viaMicromark(input)
      const time = performance.now() - start
      assert.ok(time < budget, name + ' took ' + time.toFixed(1) + 'ms')
    })
  }
})
