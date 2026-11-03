/**
 * Shared cases. Each `html` value is the expected output through both the
 * micromark path and the remark-rehype path, so these cases do not use
 * characters that the two paths encode differently (`<`, `&`, `"`).
 *
 * @typedef Case
 * @property {string} name
 * @property {string} input
 * @property {string} html
 * @property {import('micromark-extension-ruby').Options} [options]
 */

/**
 * The rules from https://conv.denshochan.com/markdown (ruby section).
 *
 * @type {Array<Case>}
 */
export const denden = [
  {
    name: 'rule 1: group ruby',
    input: '{電子出版|でんししゅっぱん}',
    html: '<p><ruby>電子出版<rt>でんししゅっぱん</rt></ruby></p>'
  },
  {
    name: 'rule 2: mono ruby',
    input: '{電子出版|でん|し|しゅっ|ぱん}',
    html: '<p><ruby>電<rt>でん</rt>子<rt>し</rt>出<rt>しゅっ</rt>版<rt>ぱん</rt></ruby></p>'
  },
  {
    name: 'rule 3: count mismatch gives group ruby, readings joined',
    input: '{電子出版|でんし|しゅっぱん}',
    html: '<p><ruby>電子出版<rt>でんししゅっぱん</rt></ruby></p>'
  },
  {
    name: 'rule 4: ruby in running text',
    input: '今日は{学校|がっこう}に行った。',
    html: '<p>今日は<ruby>学校<rt>がっこう</rt></ruby>に行った。</p>'
  },
  {
    name: 'rule 4: empty reading is not ruby',
    input: '{漢字|}',
    html: '<p>{漢字|}</p>'
  },
  {
    name: 'rule 4: empty second reading is not ruby',
    input: '{漢字|かん|}',
    html: '<p>{漢字|かん|}</p>'
  },
  {
    name: 'rule 4: no pipe is not ruby',
    input: '{漢字}',
    html: '<p>{漢字}</p>'
  },
  {
    name: 'rule 5: empty base is not ruby',
    input: 'foo{|bar| bar.buz}',
    html: '<p>foo{|bar| bar.buz}</p>'
  },
  {
    name: 'rule 6: escaped braces and pipe',
    input: '\\{Info\\|Warning\\}',
    html: '<p>{Info|Warning}</p>'
  },
  {
    name: 'rule 6: escaped pipe alone',
    input: '{Info\\|Warning}',
    html: '<p>{Info|Warning}</p>'
  },
  {
    name: 'rule 6: code span',
    input: '`{a|b}`',
    html: '<p><code>{a|b}</code></p>'
  }
]

/**
 * Test cases from `remark-denden-ruby` 0.3.1 (MIT, fabon). Upstream always
 * emits `<rp>`, so these run with `rp: true`.
 *
 * @type {Array<Case>}
 */
export const remarkDendenRuby = [
  {
    name: 'inline code',
    input: '`{a|b}`',
    html: '<p><code>{a|b}</code></p>'
  },
  {
    name: 'ruby',
    input: '今日は{学校|がっこう}に行った。',
    html: '<p>今日は<ruby>学校<rp>(</rp><rt>がっこう</rt><rp>)</rp></ruby>に行った。</p>'
  },
  {
    name: 'ruby next to ruby',
    input: '{学校|がっこう}{行事|ぎょうじ}',
    html: '<p><ruby>学校<rp>(</rp><rt>がっこう</rt><rp>)</rp></ruby><ruby>行事<rp>(</rp><rt>ぎょうじ</rt><rp>)</rp></ruby></p>'
  },
  {
    name: 'monoruby',
    input: '{修学旅行|しゅう|がく|りょ|こう}',
    html: '<p><ruby>修<rp>(</rp><rt>しゅう</rt><rp>)</rp>学<rp>(</rp><rt>がく</rt><rp>)</rp>旅<rp>(</rp><rt>りょ</rt><rp>)</rp>行<rp>(</rp><rt>こう</rt><rp>)</rp></ruby></p>'
  },
  {
    name: 'invalid monoruby',
    input: '{体育祭|たいいく|さい}',
    html: '<p><ruby>体育祭<rp>(</rp><rt>たいいくさい</rt><rp>)</rp></ruby></p>'
  },
  {
    name: 'surrogate pair',
    input: '{𠮷野家|よし|の|や}',
    html: '<p><ruby>𠮷<rp>(</rp><rt>よし</rt><rp>)</rp>野<rp>(</rp><rt>の</rt><rp>)</rp>家<rp>(</rp><rt>や</rt><rp>)</rp></ruby></p>'
  },
  {
    name: 'inside list item',
    input: '* {鳥|とり}かご',
    html: '<ul>\n<li><ruby>鳥<rp>(</rp><rt>とり</rt><rp>)</rp></ruby>かご</li>\n</ul>'
  },
  {
    name: 'inside strong',
    input: '**{鳥|とり}かご**',
    html: '<p><strong><ruby>鳥<rp>(</rp><rt>とり</rt><rp>)</rp></ruby>かご</strong></p>'
  }
].map(function (item) {
  return {...item, options: {rp: true}}
})
