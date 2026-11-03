/**
 * @import {Options} from 'micromark-extension-ruby'
 * @import {CompileContext, HtmlExtension} from 'micromark-util-types'
 */

import {decodeRuby} from './decode.js'

/**
 * Create an HTML extension for `micromark` to support DenDen ruby when
 * serializing to HTML.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions`.
 */
export function rubyHtml(options) {
  const fullWidth = Boolean(options && options.fullWidth)
  const rp = Boolean(options && options.rp)
  let base = ''
  /** @type {Array<string>} */
  let readings = []

  return {
    enter: {
      ruby() {
        base = ''
        readings = []
      }
    },
    exit: {
      rubyBase(token) {
        base = decodeRuby(this.sliceSerialize(token), fullWidth)
      },
      rubyMarker(token) {
        const value = this.sliceSerialize(token)
        if (value === '|' || value === '｜') readings.push('')
      },
      rubyText(token) {
        readings[readings.length - 1] = decodeRuby(
          this.sliceSerialize(token),
          fullWidth
        )
      },
      ruby() {
        const characters = [...base]
        this.tag('<ruby>')

        if (characters.length === readings.length) {
          for (const [index, character] of characters.entries()) {
            this.raw(this.encode(character))
            annotation.call(this, readings[index])
          }
        } else {
          this.raw(this.encode(base))
          annotation.call(this, readings.join(''))
        }

        this.tag('</ruby>')
      }
    }
  }

  /**
   * @this {CompileContext}
   * @param {string} value
   */
  function annotation(value) {
    if (rp) this.tag('<rp>(</rp>')
    this.tag('<rt>')
    this.raw(this.encode(value))
    this.tag('</rt>')
    if (rp) this.tag('<rp>)</rp>')
  }
}
