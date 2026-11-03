export {default} from './lib/index.js'

/**
 * Configuration (optional).
 */
export interface Options {
  /**
   * Whether `｛`, `｜` and `｝` also act as delimiters (default: `false`).
   */
  fullWidth?: boolean | null | undefined
  /**
   * Whether to add `<rp>` elements around each `<rt>` (default: `false`).
   */
  rp?: boolean | null | undefined
}
