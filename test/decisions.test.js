/**
 * One positive and at least one negative test per row of the decisions
 * table in the README Syntax section.
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'
import {ruby, rubyHtml} from 'micromark-extension-ruby'
import {parse, rubies, viaMicromark} from './util.js'

/**
 * @param {string} input
 * @param {import('micromark-extension-ruby').Options} [options]
 */
function only(input, options) {
  const found = rubies(parse(input, options))
  assert.equal(found.length, 1, 'expected exactly one ruby node')
  return {value: found[0].value, readings: found[0].readings}
}

test('characters: base is anything except `|`, readings anything except `}`', async function (t) {
  await t.test(
    'positive: ASCII, spaces and punctuation in the base',
    function () {
      assert.deepEqual(only('{Hello, world!|ハロー}'), {
        value: 'Hello, world!',
        readings: ['ハロー']
      })
    }
  )

  await t.test('positive: `{` in the base (converter)', function () {
    assert.deepEqual(only('{a{b|c}'), {value: 'a{b', readings: ['c']})
  })

  await t.test('positive: `}` in the base (converter)', function () {
    assert.deepEqual(only('{a}b|c}'), {value: 'a}b', readings: ['c']})
  })

  await t.test('positive: `{` in a reading (converter)', function () {
    assert.deepEqual(only('{a|b{c}'), {value: 'a', readings: ['b{c']})
  })

  await t.test(
    'negative: the first `}` after the `|` ends the ruby',
    function () {
      assert.equal(viaMicromark('{a|b}c}'), '<p><ruby>a<rt>b</rt></ruby>c}</p>')
    }
  )

  await t.test('negative: a line ending in the base', function () {
    assert.equal(viaMicromark('{漢\n字|かんじ}'), '<p>{漢\n字|かんじ}</p>')
  })

  await t.test('negative: a line ending in the reading', function () {
    assert.equal(viaMicromark('{漢字|かん\nじ}'), '<p>{漢字|かん\nじ}</p>')
  })
})

test('empty readings (converter)', async function (t) {
  await t.test('positive: all readings empty', function () {
    assert.equal(
      viaMicromark('{漢字||}'),
      '<p><ruby>漢<rt></rt>字<rt></rt></ruby></p>'
    )
    assert.deepEqual(only('{漢字||}'), {value: '漢字', readings: ['', '']})
  })

  await t.test('positive: one reading empty', function () {
    assert.deepEqual(only('{漢字||じ}'), {value: '漢字', readings: ['', 'じ']})
  })

  await t.test('positive: empty readings count for mono ruby', function () {
    assert.equal(
      viaMicromark('{漢字|かん||}'),
      '<p><ruby>漢字<rt>かん</rt></ruby></p>'
    )
    assert.deepEqual(only('{漢字|かん||}'), {
      value: '漢字',
      readings: ['かん', '', '']
    })
  })

  await t.test('negative: nothing after the first `|`', function () {
    assert.equal(viaMicromark('{漢字|}'), '<p>{漢字|}</p>')
  })
})

test('backslash escapes: an escaped delimiter is content', async function (t) {
  await t.test('negative: `{a\\|b}` has no unescaped `|`', function () {
    assert.equal(viaMicromark('{a\\|b}'), '<p>{a|b}</p>')
    assert.equal(rubies(parse('{a\\|b}')).length, 0)
  })

  await t.test('positive: `{a\\|b|c}`', function () {
    assert.deepEqual(only('{a\\|b|c}'), {value: 'a|b', readings: ['c']})
  })

  await t.test('positive: `{a\\}b|c}`', function () {
    assert.deepEqual(only('{a\\}b|c}'), {value: 'a}b', readings: ['c']})
  })

  await t.test('positive: `{a\\{b|c}`', function () {
    assert.deepEqual(only('{a\\{b|c}'), {value: 'a{b', readings: ['c']})
  })

  await t.test('positive: `{a\\\\|b}` (escaped backslash)', function () {
    assert.deepEqual(only('{a\\\\|b}'), {value: 'a\\', readings: ['b']})
  })

  await t.test('positive: `{a|b\\|c}` is group ruby', function () {
    assert.deepEqual(only('{a|b\\|c}'), {value: 'a', readings: ['b|c']})
  })

  await t.test(
    'positive: other ASCII punctuation escapes are decoded',
    function () {
      assert.deepEqual(only('{a\\*b|c}'), {value: 'a*b', readings: ['c']})
    }
  )

  await t.test('negative: a backslash before a letter stays', function () {
    assert.deepEqual(only('{a\\b|c}'), {value: 'a\\b', readings: ['c']})
  })
})

test('markup: base and readings are plain strings', async function (t) {
  await t.test('positive: strong markers in the base are literal', function () {
    assert.equal(
      viaMicromark('{**強**|つよ}'),
      '<p><ruby>**強**<rt>つよ</rt></ruby></p>'
    )
    assert.deepEqual(only('{**強**|つよ}'), {
      value: '**強**',
      readings: ['つよ']
    })
  })

  await t.test(
    'positive: emphasis markers in a reading are literal',
    function () {
      assert.deepEqual(only('{a|*b*}'), {value: 'a', readings: ['*b*']})
    }
  )

  await t.test('negative: markup around ruby is still parsed', function () {
    assert.equal(
      viaMicromark('*{a|b}*'),
      '<p><em><ruby>a<rt>b</rt></ruby></em></p>'
    )
  })
})

test('mono ruby counts Unicode code points', async function (t) {
  await t.test('positive: astral base character counts as one', function () {
    assert.equal(
      viaMicromark('{𠮷野家|よし|の|や}'),
      '<p><ruby>𠮷<rt>よし</rt>野<rt>の</rt>家<rt>や</rt></ruby></p>'
    )
  })

  await t.test('negative: UTF-16 length is not used', function () {
    // `𠮷野` is 3 UTF-16 units but 2 code points.
    assert.equal(
      viaMicromark('{𠮷野|よ|し|の}'),
      '<p><ruby>𠮷野<rt>よしの</rt></ruby></p>'
    )
  })

  await t.test('negative: grapheme clusters are not used', function () {
    // `👍🏽` is one grapheme but 2 code points.
    assert.equal(
      viaMicromark('{👍🏽|a|b}'),
      '<p><ruby>👍<rt>a</rt>🏽<rt>b</rt></ruby></p>'
    )
  })
})

test('whitespace is kept, except right after the opening `{`', async function (t) {
  await t.test(
    'positive: spaces at the end of the base and in the reading',
    function () {
      assert.equal(
        viaMicromark('x{漢字 | かんじ }x'),
        '<p>x<ruby>漢字 <rt> かんじ </rt></ruby>x</p>'
      )
    }
  )

  await t.test('positive: the node is not trimmed', function () {
    assert.deepEqual(only('x{漢字 | かんじ }x'), {
      value: '漢字 ',
      readings: [' かんじ ']
    })
  })

  await t.test('positive: a space counts for mono ruby', function () {
    assert.equal(
      viaMicromark('{漢 字|かん|じ}'),
      '<p><ruby>漢 字<rt>かんじ</rt></ruby></p>'
    )
  })

  await t.test('negative: a space right after `{` (converter)', function () {
    assert.equal(viaMicromark('x{ 漢字|かんじ}x'), '<p>x{ 漢字|かんじ}x</p>')
    assert.equal(
      viaMicromark('x{ 漢字 | かんじ }x'),
      '<p>x{ 漢字 | かんじ }x</p>'
    )
  })

  await t.test('negative: a tab right after `{`', function () {
    assert.equal(viaMicromark('x{\t漢字|かんじ}x'), '<p>x{\t漢字|かんじ}x</p>')
  })
})

test('character references are decoded (Q1)', async function (t) {
  await t.test('positive: named reference in the base', function () {
    assert.deepEqual(only('{&amp;|x}'), {value: '&', readings: ['x']})
  })

  await t.test('positive: numeric reference in a reading', function () {
    assert.deepEqual(only('{a|&#x3042;}'), {value: 'a', readings: ['あ']})
  })

  await t.test('negative: an unknown name stays as text', function () {
    assert.deepEqual(only('{&nosuch;|x}'), {value: '&nosuch;', readings: ['x']})
  })

  await t.test('negative: a reference is not a delimiter', function () {
    assert.deepEqual(only('{a&#x7C;b|c}'), {value: 'a|b', readings: ['c']})
  })
})

test('precedence', async function (t) {
  await t.test('positive: ruby inside strong', function () {
    assert.equal(
      viaMicromark('**{強|つよ}**'),
      '<p><strong><ruby>強<rt>つよ</rt></ruby></strong></p>'
    )
  })

  await t.test('positive: ruby inside link text', function () {
    assert.equal(
      viaMicromark('[{東京|とうきょう}](/tokyo)'),
      '<p><a href="/tokyo"><ruby>東京<rt>とうきょう</rt></ruby></a></p>'
    )
  })

  await t.test('negative: code span that starts first wins', function () {
    assert.equal(viaMicromark('`{a|b}`'), '<p><code>{a|b}</code></p>')
  })

  await t.test('negative: autolink that starts first wins', function () {
    assert.equal(
      viaMicromark('<https://example.com/{a|b}>'),
      '<p><a href="https://example.com/%7Ba%7Cb%7D">https://example.com/{a|b}</a></p>'
    )
  })

  await t.test('negative: raw HTML that starts first wins', function () {
    const html = micromark('<span title="{a|b}">x</span>', {
      allowDangerousHtml: true,
      extensions: [ruby()],
      htmlExtensions: [rubyHtml()]
    })
    assert.equal(html, '<p><span title="{a|b}">x</span></p>')
  })

  await t.test('ruby wins inside its braces: backticks', function () {
    assert.deepEqual(only('{a`|`b}'), {value: 'a`', readings: ['`b']})
  })

  await t.test('ruby wins inside its braces: angle brackets', function () {
    assert.equal(
      viaMicromark('{a|<b>}'),
      '<p><ruby>a<rt>&lt;b&gt;</rt></ruby></p>'
    )
  })

  await t.test('ruby wins inside its braces: link syntax', function () {
    assert.deepEqual(only('{[a](/u)|b}'), {value: '[a](/u)', readings: ['b']})
  })
})

test('full-width delimiters', async function (t) {
  const fullWidth = {fullWidth: true}

  await t.test('positive: all full-width', function () {
    assert.equal(
      viaMicromark('｛漢字｜かんじ｝', fullWidth),
      '<p><ruby>漢字<rt>かんじ</rt></ruby></p>'
    )
  })

  await t.test('positive: mixed widths in one ruby', function () {
    assert.deepEqual(only('{漢字｜かんじ｝', fullWidth), {
      value: '漢字',
      readings: ['かんじ']
    })
    assert.deepEqual(only('｛漢字|かん｜じ}', fullWidth), {
      value: '漢字',
      readings: ['かん', 'じ']
    })
  })

  await t.test('positive: ASCII still works with the option on', function () {
    assert.deepEqual(only('{漢字|かんじ}', fullWidth), {
      value: '漢字',
      readings: ['かんじ']
    })
  })

  await t.test(
    'positive: escaped full-width delimiters are content (Q2)',
    function () {
      assert.deepEqual(only('｛a\\｜b｜c｝', fullWidth), {
        value: 'a｜b',
        readings: ['c']
      })
      assert.deepEqual(only('{a\\｛b\\｝c|d}', fullWidth), {
        value: 'a｛b｝c',
        readings: ['d']
      })
    }
  )

  await t.test(
    'negative: without the option, `\\｜` is not an escape',
    function () {
      assert.deepEqual(only('{a\\｜b|c}'), {value: 'a\\｜b', readings: ['c']})
    }
  )

  await t.test('negative: off by default', function () {
    assert.equal(viaMicromark('｛漢字｜かんじ｝'), '<p>｛漢字｜かんじ｝</p>')
  })

  await t.test('negative: full-width pipe is content by default', function () {
    assert.equal(viaMicromark('{漢字｜かんじ}'), '<p>{漢字｜かんじ}</p>')
  })
})
