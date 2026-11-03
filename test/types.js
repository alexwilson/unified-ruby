/**
 * Type contract checks. `pnpm run test-types` fails if these do not
 * type-check. This file has no runtime tests.
 *
 * @import {PhrasingContent, RootContent} from 'mdast'
 * @import {Ruby} from 'mdast-util-ruby'
 * @import {Options} from 'micromark-extension-ruby'
 * @import {TokenType} from 'micromark-util-types'
 */

/** @type {Ruby} */
const node = {type: 'ruby', value: '漢字', readings: ['かんじ']}
/** @type {PhrasingContent} */
export const phrasing = node
/** @type {RootContent} */
export const root = node
/** @type {Array<TokenType>} */
export const tokens = ['ruby', 'rubyMarker', 'rubyBase', 'rubyText']
/** @type {Options} */
export const options = {fullWidth: true, rp: true}
