export {default} from './lib/index.js'

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
   * Whether to add `<rp>` elements around each `<rt>` (default: `false`).
   */
  rp?: boolean | null | undefined
}
