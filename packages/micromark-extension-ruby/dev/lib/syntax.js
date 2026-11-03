/**
 * @import {Options} from 'micromark-extension-ruby'
 * @import {
 *   Code,
 *   Construct,
 *   Extension,
 *   ParseContext,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

import {ok as assert} from 'devlop'
import {
  asciiPunctuation,
  markdownLineEnding,
  markdownLineEndingOrSpace
} from 'micromark-util-character'
import {codes} from 'micromark-util-symbol'

const fullWidthLeftCurlyBrace = 0xff_5b
const fullWidthVerticalBar = 0xff_5c
const fullWidthRightCurlyBrace = 0xff_5d

/**
 * Create an extension for `micromark` to enable DenDen ruby syntax.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions`.
 */
export function ruby(options) {
  const fullWidth = Boolean(options && options.fullWidth)
  /**
   * Per document: the offset before which no ruby can start, because an
   * earlier try failed on the same line. This keeps the tokeniser linear.
   *
   * @type {WeakMap<ParseContext, number>}
   */
  const failedUntil = new WeakMap()

  /** @type {Construct} */
  const construct = {name: 'ruby', tokenize: tokenizeRuby}

  /** @type {Extension['text']} */
  const text = {[codes.leftCurlyBrace]: construct}
  if (fullWidth) text[fullWidthLeftCurlyBrace] = construct

  return {text}

  /**
   * @this {TokenizeContext}
   * @type {Tokenizer}
   */
  function tokenizeRuby(effects, ok, nok) {
    const self = this
    let readingCount = 0

    return start

    /**
     * At `{`.
     *
     * @type {State}
     */
    function start(code) {
      assert(
        code === codes.leftCurlyBrace || code === fullWidthLeftCurlyBrace,
        'expected `{`'
      )

      if (self.now().offset < (failedUntil.get(self.parser) || 0)) {
        return nok(code)
      }

      effects.enter('ruby')
      effects.enter('rubyMarker')
      effects.consume(code)
      effects.exit('rubyMarker')
      return baseStart
    }

    /**
     * After `{`, at the first character of the base.
     *
     * @type {State}
     */
    function baseStart(code) {
      if (
        code === codes.eof ||
        markdownLineEndingOrSpace(code) ||
        isVerticalBar(code)
      ) {
        return nok(code)
      }

      effects.enter('rubyBase')
      return base(code)
    }

    /**
     * In the base.
     *
     * @type {State}
     */
    function base(code) {
      if (isVerticalBar(code)) {
        effects.exit('rubyBase')
        return separator(code)
      }

      return content(code, base)
    }

    /**
     * At `|`.
     *
     * @type {State}
     */
    function separator(code) {
      readingCount++
      effects.enter('rubyMarker')
      effects.consume(code)
      effects.exit('rubyMarker')
      return readingStart
    }

    /**
     * After `|`, at the first character of a reading.
     *
     * @type {State}
     */
    function readingStart(code) {
      if (isRightCurlyBrace(code)) {
        // Something must follow the first `|`. Later readings may be empty.
        if (readingCount === 1) return fail(code)
        return end(code)
      }

      if (isVerticalBar(code)) return separator(code)
      effects.enter('rubyText')
      return reading(code)
    }

    /**
     * In a reading.
     *
     * @type {State}
     */
    function reading(code) {
      if (isRightCurlyBrace(code)) {
        effects.exit('rubyText')
        return end(code)
      }

      if (isVerticalBar(code)) {
        effects.exit('rubyText')
        return separator(code)
      }

      return content(code, reading)
    }

    /**
     * At `}`.
     *
     * @type {State}
     */
    function end(code) {
      effects.enter('rubyMarker')
      effects.consume(code)
      effects.exit('rubyMarker')
      effects.exit('ruby')
      return ok
    }

    /**
     * A character in the base or a reading.
     *
     * @param {Code} code
     * @param {State} next
     * @returns {State | undefined}
     */
    function content(code, next) {
      if (code === codes.eof || markdownLineEnding(code)) return fail(code)

      effects.consume(code)

      if (code === codes.backslash) {
        return function (code) {
          return escaped(code, next)
        }
      }

      return next
    }

    /**
     * After a backslash.
     *
     * @param {Code} code
     * @param {State} next
     * @returns {State | undefined}
     */
    function escaped(code, next) {
      if (
        asciiPunctuation(code) ||
        (fullWidth &&
          (code === fullWidthLeftCurlyBrace ||
            code === fullWidthVerticalBar ||
            code === fullWidthRightCurlyBrace))
      ) {
        effects.consume(code)
        return next
      }

      return next(code)
    }

    /**
     * Fail, and remember where. Every `{` before this point on the same line
     * fails for the same reason.
     *
     * @param {Code} code
     * @returns {State | undefined}
     */
    function fail(code) {
      failedUntil.set(self.parser, self.now().offset)
      return nok(code)
    }
  }

  /**
   * @param {Code} code
   * @returns {boolean}
   */
  function isVerticalBar(code) {
    return (
      code === codes.verticalBar || (fullWidth && code === fullWidthVerticalBar)
    )
  }

  /**
   * @param {Code} code
   * @returns {boolean}
   */
  function isRightCurlyBrace(code) {
    return (
      code === codes.rightCurlyBrace ||
      (fullWidth && code === fullWidthRightCurlyBrace)
    )
  }
}
