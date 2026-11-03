import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'
import {viaMicromark} from './util.js'

// Linear time means 10 times the input takes about 10 times as long. A
// quadratic tokeniser takes about 100 times as long. The limits use ratios,
// so a slow machine does not fail the test.
const maximumGrowth = 30
// Checked first on the small input, so a quadratic tokeniser fails in
// seconds and does not hang the run.
const maximumSlowdown = 50
const margin = 20

const patterns = {
  'many `{`': (/** @type {number} */ length) => '{'.repeat(length),
  'many `{a|`': (/** @type {number} */ length) => '{a|'.repeat(length / 3),
  'one `{` and many `a|`': (/** @type {number} */ length) =>
    '{' + 'a|'.repeat(length / 2),
  'many `{a|b`': (/** @type {number} */ length) => '{a|b'.repeat(length / 4),
  'many `{a}`': (/** @type {number} */ length) => '{a}'.repeat(length / 3)
}

/**
 * Best time of 5 runs, in milliseconds.
 *
 * @param {() => unknown} run
 */
function time(run) {
  let best = Infinity
  for (let index = 0; index < 5; index++) {
    const start = performance.now()
    run()
    best = Math.min(best, performance.now() - start)
  }

  return best
}

test('tokeniser stays linear up to 100 000 characters', async function (t) {
  viaMicromark('warm up {a|b}')

  for (const [name, make] of Object.entries(patterns)) {
    await t.test(name, function () {
      const small = make(10_000)
      const large = make(100_000)
      const baseline = time(() => micromark(small))
      const smallTime = time(() => viaMicromark(small))

      assert.ok(
        smallTime < baseline * maximumSlowdown + margin,
        name +
          ': 10 000 characters took ' +
          smallTime.toFixed(1) +
          'ms (micromark alone ' +
          baseline.toFixed(1) +
          'ms)'
      )

      const largeTime = time(() => viaMicromark(large))

      assert.ok(
        largeTime < smallTime * maximumGrowth,
        name +
          ': 10 times the input took ' +
          (largeTime / smallTime).toFixed(1) +
          ' times as long'
      )
    })
  }
})
