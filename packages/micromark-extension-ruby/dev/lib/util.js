import {decodeString} from 'micromark-util-decode-string'

const fullWidthDelimiters = new Set(['｛', '｜', '｝'])

/**
 * Decode the source of a base or a reading: CommonMark escapes and character
 * references, and with `fullWidth`, `\｛`, `\｜` and `\｝`.
 *
 * @param {string} value
 *   Source of a base or a reading, as in the `rubyBase` or `rubyText` token.
 * @param {boolean | null | undefined} [fullWidth=false]
 *   Whether full-width escapes are decoded (default: `false`).
 * @returns {string}
 *   Decoded value.
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

/**
 * Pair the base with the readings. Mono ruby when the number of code points
 * in `base` is equal to `readings.length`, otherwise group ruby with the
 * readings joined.
 *
 * @param {string} base
 *   Decoded base.
 * @param {ReadonlyArray<string>} readings
 *   Decoded readings.
 * @returns {Array<[text: string, reading: string]>}
 *   One pair for each character (mono ruby), or one pair (group ruby).
 */
export function rubySegments(base, readings) {
  const characters = [...base]

  if (characters.length === readings.length) {
    return characters.map(function (character, index) {
      return [character, readings[index]]
    })
  }

  return [[base, readings.join('')]]
}
