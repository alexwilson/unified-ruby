import {fromMarkdown} from 'mdast-util-from-markdown'
import {rubyFromMarkdown, rubyToMarkdown} from 'mdast-util-ruby'
import {toMarkdown} from 'mdast-util-to-markdown'
import {micromark} from 'micromark'
import {ruby, rubyHtml} from 'micromark-extension-ruby'

const examples = {
  'Group and mono ruby':
    '{電子出版|でんししゅっぱん} is group ruby: one reading over the full base.\n\n' +
    '{電子出版|でん|し|しゅっ|ぱん} is mono ruby: one reading over each character.\n\n' +
    'If the counts are not equal, the result is group ruby: {電子出版|でんし|しゅっぱん}.',
  'In running text':
    '今日は{学校|がっこう}に行った。{修学旅行|しゅう|がく|りょ|こう}の{準備|じゅんび}をした。\n\n' +
    '**{強調|きょうちょう}** and [{東京|とうきょう}](https://example.com/) also work.',
  'Not ruby':
    'An escaped pipe: {Info\\|Warning}\n\n' +
    'In code: `{a|b}`\n\n' +
    'An empty base: foo{|bar| bar.buz}\n\n' +
    'A space after the brace: { 漢字|かんじ}',
  'Full-width delimiters':
    'Turn on “Full-width delimiters” to make this ruby: ｛漢字｜かんじ｝\n\n' +
    'The widths can be mixed: {漢字｜かん｜じ｝'
}

const input = /** @type {HTMLTextAreaElement} */ (
  document.querySelector('#ruby-input')
)
const output = /** @type {HTMLElement} */ (
  document.querySelector('#ruby-output')
)
const form = /** @type {HTMLFormElement} */ (
  document.querySelector('#ruby-playground')
)
const select = /** @type {HTMLSelectElement} */ (
  document.querySelector('#ruby-example')
)

for (const name of Object.keys(examples)) {
  select.append(new Option(name, name))
}

select.addEventListener('change', function () {
  input.value = examples[/** @type {keyof typeof examples} */ (select.value)]
  render()
})

form.addEventListener('input', function (event) {
  if (event.target !== select) render()
})

input.value = examples['Group and mono ruby']
render()

function render() {
  const data = new FormData(form)
  const options = {
    fullWidth: data.get('fullWidth') === 'on',
    rp: data.get('rp') === 'on'
  }
  const view = data.get('view')
  const value = input.value

  if (view === 'preview') {
    // micromark encodes raw HTML by default, so this is safe for any input.
    output.innerHTML = micromark(value, {
      extensions: [ruby(options)],
      htmlExtensions: [rubyHtml(options)]
    })
    output.className = 'ruby-preview'
    return
  }

  let text = ''

  if (view === 'html') {
    text = micromark(value, {
      extensions: [ruby(options)],
      htmlExtensions: [rubyHtml(options)]
    })
  } else {
    const tree = fromMarkdown(value, {
      extensions: [ruby(options)],
      mdastExtensions: [rubyFromMarkdown(options)]
    })

    text =
      view === 'mdast'
        ? JSON.stringify(
            tree,
            (key, value) => (key === 'position' ? undefined : value),
            2
          )
        : toMarkdown(tree, {extensions: [rubyToMarkdown(options)]})
  }

  const pre = document.createElement('pre')
  pre.textContent = text
  output.replaceChildren(pre)
  output.className = 'ruby-source'
}
