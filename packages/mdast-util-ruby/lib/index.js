/**
 * @import {ElementContent} from 'hast'
 * @import {Options, Ruby} from 'mdast-util-ruby'
 * @import {
 *   CompileContext,
 *   Extension as FromMarkdownExtension,
 *   Handle as FromMarkdownHandle
 * } from 'mdast-util-from-markdown'
 * @import {
 *   ConstructName,
 *   Handle as ToMarkdownHandle,
 *   Options as ToMarkdownExtension
 * } from 'mdast-util-to-markdown'
 * @import {} from 'mdast-util-to-hast'
 */

import {ok as assert} from 'devlop'
import {decodeRuby} from './decode.js'

/**
 * Constructs in phrasing where ruby is not parsed, so no escape is needed.
 * The same list as `mdast-util-gfm-strikethrough`.
 *
 * @type {Array<ConstructName>}
 */
const constructsWithoutRuby = [
  'autolink',
  'destinationLiteral',
  'destinationRaw',
  'reference',
  'titleQuote',
  'titleApostrophe'
]

/**
 * Create an extension for `mdast-util-from-markdown` to enable DenDen ruby.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown`.
 */
export function rubyFromMarkdown(options) {
  const fullWidth = Boolean(options && options.fullWidth)
  const rp = Boolean(options && options.rp)

  return {
    enter: {ruby: enterRuby},
    exit: {
      ruby: exitRuby,
      rubyBase: exitRubyBase,
      rubyMarker: exitRubyMarker,
      rubyText: exitRubyText
    }
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function enterRuby(token) {
    this.enter({type: 'ruby', value: '', readings: []}, token)
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitRubyBase(token) {
    current(this).value = decodeRuby(this.sliceSerialize(token), fullWidth)
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitRubyMarker(token) {
    const value = this.sliceSerialize(token)
    if (value === '|' || value === '｜') current(this).readings.push('')
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitRubyText(token) {
    const readings = current(this).readings
    readings[readings.length - 1] = decodeRuby(
      this.sliceSerialize(token),
      fullWidth
    )
  }

  /**
   * @this {CompileContext}
   * @type {FromMarkdownHandle}
   */
  function exitRuby(token) {
    const node = current(this)
    const characters = [...node.value]
    /** @type {Array<ElementContent>} */
    const children = []

    if (characters.length === node.readings.length) {
      for (const [index, character] of characters.entries()) {
        children.push({type: 'text', value: character})
        annotation(children, node.readings[index])
      }
    } else {
      children.push({type: 'text', value: node.value})
      annotation(children, node.readings.join(''))
    }

    node.data = {hName: 'ruby', hChildren: children}
    this.exit(token)
  }

  /**
   * @param {Array<ElementContent>} children
   * @param {string} value
   */
  function annotation(children, value) {
    if (rp) children.push(paren('('))
    children.push({
      type: 'element',
      tagName: 'rt',
      properties: {},
      children: [{type: 'text', value}]
    })
    if (rp) children.push(paren(')'))
  }
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable DenDen ruby.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown`.
 */
export function rubyToMarkdown(options) {
  const fullWidth = Boolean(options && options.fullWidth)
  const pipe = fullWidth ? '|｜' : '|'
  const close = fullWidth ? '}｝' : '}'
  // Text after a `{` that could make ruby. A `$` means the text continues
  // in a sibling that this pattern cannot see, so escape to be safe.
  const after =
    '(?=(?![ \\t\\r\\n])[^\\r\\n' +
    pipe +
    ']*(?:$|[' +
    pipe +
    '](?![' +
    close +
    '])[^\\r\\n' +
    close +
    ']*(?:[' +
    close +
    ']|$)))'
  const escape = fullWidth
    ? /[\\{|}｛｜｝\r\n]|&(?=#?[\da-z]+;)/gi
    : /[\\{|}\r\n]|&(?=#?[\da-z]+;)/gi

  handleRuby.peek = peekRuby

  /** @type {ToMarkdownExtension['unsafe']} */
  const unsafe = [
    {
      character: '{',
      after,
      inConstruct: 'phrasing',
      notInConstruct: constructsWithoutRuby
    }
  ]

  if (fullWidth) {
    unsafe.push({
      character: '｛',
      after,
      inConstruct: 'phrasing',
      notInConstruct: constructsWithoutRuby
    })
  }

  return {handlers: {ruby: handleRuby}, unsafe}

  /**
   * @type {ToMarkdownHandle}
   * @param {Ruby} node
   */
  function handleRuby(node, _, state, info) {
    const tracker = state.createTracker(info)
    let value = tracker.move('{')
    value += tracker.move(encode(node.value).replace(/^[ \t]/, reference))

    for (const reading of node.readings) {
      value += tracker.move('|' + encode(reading))
    }

    value += tracker.move('}')
    return value
  }

  /**
   * @param {string} value
   * @returns {string}
   */
  function encode(value) {
    return value.replace(escape, function (match) {
      return match === '\r' || match === '\n' ? reference(match) : '\\' + match
    })
  }
}

/**
 * @returns {string}
 */
function peekRuby() {
  return '{'
}

/**
 * @param {string} character
 * @returns {string}
 */
function reference(character) {
  return '&#x' + character.charCodeAt(0).toString(16).toUpperCase() + ';'
}

/**
 * @param {string} value
 * @returns {ElementContent}
 */
function paren(value) {
  return {
    type: 'element',
    tagName: 'rp',
    properties: {},
    children: [{type: 'text', value}]
  }
}

/**
 * @param {CompileContext} context
 * @returns {Ruby}
 */
function current(context) {
  const node = context.stack[context.stack.length - 1]
  assert(node.type === 'ruby', 'expected `ruby` node')
  return node
}
