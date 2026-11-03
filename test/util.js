/**
 * @import {Nodes, Root} from 'mdast'
 * @import {Ruby} from 'mdast-util-ruby'
 * @import {Options} from 'micromark-extension-ruby'
 */

import {fromMarkdown} from 'mdast-util-from-markdown'
import {rubyFromMarkdown, rubyToMarkdown} from 'mdast-util-ruby'
import {toMarkdown} from 'mdast-util-to-markdown'
import {micromark} from 'micromark'
import {ruby, rubyHtml} from 'micromark-extension-ruby'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkRubyAnnotation from 'remark-ruby-annotation'
import {unified} from 'unified'
import {removePosition} from 'unist-util-remove-position'
import {visit} from 'unist-util-visit'

/**
 * @param {string} value
 * @param {Options | undefined} [options]
 * @returns {string}
 */
export function viaMicromark(value, options) {
  return micromark(value, {
    extensions: [ruby(options)],
    htmlExtensions: [rubyHtml(options)]
  })
}

/**
 * @param {string} value
 * @param {Options | undefined} [options]
 * @returns {string}
 */
export function viaRemark(value, options) {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkRubyAnnotation, options)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(value)
  )
}

/**
 * Parse without unified, with positions removed.
 *
 * @param {string} value
 * @param {Options | undefined} [options]
 * @returns {Root}
 */
export function parse(value, options) {
  const tree = fromMarkdown(value, {
    extensions: [ruby(options)],
    mdastExtensions: [rubyFromMarkdown(options)]
  })
  removePosition(tree, {force: true})
  return tree
}

/**
 * @param {Nodes} tree
 * @param {Options | undefined} [options]
 * @returns {string}
 */
export function serialize(tree, options) {
  return toMarkdown(tree, {extensions: [rubyToMarkdown(options)]})
}

/**
 * @param {Nodes} tree
 * @returns {Array<Ruby>}
 */
export function rubies(tree) {
  /** @type {Array<Ruby>} */
  const result = []
  visit(tree, 'ruby', function (node) {
    result.push(node)
  })
  return result
}
