import type {Data, Literal} from 'mdast'

export {rubyFromMarkdown, rubyToMarkdown} from './lib/index.js'

/**
 * Configuration (optional).
 */
export interface Options {
  /**
   * Whether `｛`, `｜` and `｝` also act as delimiters (default: `false`).
   *
   * The serializer always writes ASCII delimiters. With this option, it also
   * escapes `｛`, `｜` and `｝` in the base and the readings, and escapes a
   * `｛` in text that could start ruby.
   */
  fullWidth?: boolean | null | undefined
  /**
   * Whether `data.hChildren` includes `<rp>` elements (default: `false`).
   */
  rp?: boolean | null | undefined
}

/**
 * Ruby annotation.
 *
 * Mono ruby when the code point count of `value` equals
 * `readings.length`, otherwise group ruby with the readings joined.
 */
export interface Ruby extends Literal {
  /**
   * Node type of ruby annotations.
   */
  type: 'ruby'
  /**
   * Base text, decoded.
   */
  value: string
  /**
   * Readings as written: one for group ruby, more than one for mono ruby.
   */
  readings: Array<string>
  /**
   * Data associated with the mdast ruby annotation.
   */
  data?: RubyData | undefined
}

/**
 * Info associated with mdast ruby annotations by the ecosystem.
 */
export interface RubyData extends Data {}

declare module 'mdast' {
  interface PhrasingContentMap {
    /**
     * Ruby annotation.
     */
    ruby: Ruby
  }

  interface RootContentMap {
    /**
     * Ruby annotation.
     */
    ruby: Ruby
  }
}
