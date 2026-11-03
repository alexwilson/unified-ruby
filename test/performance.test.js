import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'
import {viaMicromark} from './util.js'

// The budget is relative to micromark without the extension on the same
// machine, so a slow CI runner does not fail the test. A quadratic
// tokeniser is thousands of times slower on these inputs.
const factor = 3
// Absolute margin for timer noise on fast machines.
const margin = 5

const inputs = {
  'many `{`': '{'.repeat(100_000),
  'many `{a|`': '{a|'.repeat(33_334),
  'one `{` and many `a|`': '{' + 'a|'.repeat(49_999) + 'a',
  'many `{a|b`': '{a|b'.repeat(25_000)
}

/**
 * Best time of 3 runs, in milliseconds.
 *
 * @param {() => unknown} run
 */
function time(run) {
  let best = Infinity
  for (let index = 0; index < 3; index++) {
    const start = performance.now()
    run()
    best = Math.min(best, performance.now() - start)
  }

  return best
}

test('tokeniser stays linear on 100 000 characters', async function (t) {
  viaMicromark('warm up {a|b}')

  for (const [name, input] of Object.entries(inputs)) {
    await t.test(name, function () {
      const baseline = time(() => micromark(input))
      const actual = time(() => viaMicromark(input))
      const budget = baseline * factor + margin
      assert.ok(
        actual < budget,
        name +
          ' took ' +
          actual.toFixed(1) +
          'ms, budget ' +
          budget.toFixed(1) +
          'ms (micromark alone ' +
          baseline.toFixed(1) +
          'ms)'
      )
    })
  }
})
