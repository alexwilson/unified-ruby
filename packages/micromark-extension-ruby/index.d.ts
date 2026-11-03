export {rubyHtml} from './lib/html.js'
export {ruby} from './lib/syntax.js'

/**
 * Configuration (optional).
 */
export interface Options {
  /**
   * Whether `｛`, `｜` and `｝` also act as delimiters (default: `false`).
   *
   * Only affects the syntax extension.
   */
  fullWidth?: boolean | null | undefined
  /**
   * Whether to add `<rp>(</rp>` and `<rp>)</rp>` around each `<rt>`
   * (default: `false`).
   *
   * Only affects the HTML extension.
   */
  rp?: boolean | null | undefined
}

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    ruby: 'ruby'
    rubyMarker: 'rubyMarker'
    rubyBase: 'rubyBase'
    rubyText: 'rubyText'
  }
}
