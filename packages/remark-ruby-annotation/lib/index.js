/**
 * @import {Root} from 'mdast'
 * @import {Options} from 'remark-ruby-annotation'
 * @import {} from 'remark-parse'
 * @import {} from 'remark-stringify'
 * @import {Processor} from 'unified'
 */

import {rubyFromMarkdown, rubyToMarkdown} from 'mdast-util-ruby'
import {ruby} from 'micromark-extension-ruby'

/** @type {Options} */
const emptyOptions = {}

/**
 * Add support for DenDen ruby annotations (`{漢字|かんじ}`).
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {undefined}
 *   Nothing.
 */
export default function remarkRubyAnnotation(options) {
  // @ts-expect-error: TS is wrong about `this`.
  // eslint-disable-next-line unicorn/no-this-assignment
  const self = /** @type {Processor<Root>} */ (this)
  const settings = options || emptyOptions
  const data = self.data()

  const micromarkExtensions =
    data.micromarkExtensions || (data.micromarkExtensions = [])
  const fromMarkdownExtensions =
    data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
  const toMarkdownExtensions =
    data.toMarkdownExtensions || (data.toMarkdownExtensions = [])

  micromarkExtensions.push(ruby(settings))
  fromMarkdownExtensions.push(rubyFromMarkdown(settings))
  toMarkdownExtensions.push(rubyToMarkdown(settings))
}
