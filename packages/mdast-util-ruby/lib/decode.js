// Keep in sync with `micromark-extension-ruby/dev/lib/decode.js`.
import {decodeString} from 'micromark-util-decode-string'

const fullWidthDelimiters = new Set(['｛', '｜', '｝'])

/**
 * Decode the source of a base or a reading: CommonMark escapes and character
 * references, and with `fullWidth`, `\｛`, `\｜` and `\｝`.
 *
 * @param {string} value
 * @param {boolean} fullWidth
 * @returns {string}
 */
export function decodeRuby(value, fullWidth) {
  if (!fullWidth) return decodeString(value)
  let result = ''
  let start = 0
  let index = 0

  while (index < value.length) {
    if (value.charAt(index) === '\\') {
      const next = value.charAt(index + 1)
      if (fullWidthDelimiters.has(next)) {
        result += decodeString(value.slice(start, index)) + next
        start = index + 2
      }

      // Keep a backslash and the next character together.
      index += 2
    } else {
      index++
    }
  }

  return result + decodeString(value.slice(start))
}
