/**
 * @import {Options} from 'mdast-util-ruby'
 * @import {Extension as FromMarkdownExtension} from 'mdast-util-from-markdown'
 * @import {Options as ToMarkdownExtension} from 'mdast-util-to-markdown'
 */

/**
 * Create an extension for `mdast-util-from-markdown` to enable DenDen ruby.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown`.
 */
export function rubyFromMarkdown(options) {
  return {}
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
  return {}
}
