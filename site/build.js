/**
 * Copy the ES modules that the playground imports into `site/vendor/`, and
 * write an import map for them to `site/_includes/importmap.html`.
 *
 * No bundler: the browser loads the same files that Node.js loads. Run
 * `pnpm run build` first, so the workspace packages have their `lib/` files.
 */

import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const site = path.join(root, 'site')
const vendor = path.join(site, 'vendor')

// The bare specifiers that `playground.js` imports.
const entries = [
  'micromark',
  'micromark-extension-ruby',
  'mdast-util-from-markdown',
  'mdast-util-ruby',
  'mdast-util-to-markdown'
]

/** @type {Map<string, {name: string, version: string, directory: string}>} */
const packages = new Map()
/** @type {Record<string, string>} */
const imports = {}
/** @type {Set<string>} */
const done = new Set()
/** @type {Array<string>} */
const queue = []

fs.rmSync(vendor, {force: true, recursive: true})

for (const specifier of entries) addBare(specifier, root)

while (queue.length > 0) {
  const file = /** @type {string} */ (queue.pop())
  if (done.has(file)) continue
  done.add(file)
  copy(file)
  const code = stripComments(fs.readFileSync(file, 'utf8'))
  for (const specifier of importSpecifiers(code)) {
    if (specifier.startsWith('.')) {
      queue.push(path.resolve(path.dirname(file), specifier))
    } else {
      addBare(specifier, path.dirname(file))
    }
  }
}

const map = JSON.stringify({imports: sortKeys(imports)}, null, 2)
fs.mkdirSync(path.join(site, '_includes'), {recursive: true})
fs.writeFileSync(
  path.join(site, '_includes', 'importmap.html'),
  '<script type="importmap">\n' + map + '\n</script>\n'
)

console.log(
  'Copied %d files from %d packages to site/vendor/.',
  done.size,
  packages.size
)

/**
 * @param {string} specifier
 * @param {string} from
 */
function addBare(specifier, from) {
  const parts = specifier.split('/')
  const name = specifier.startsWith('@')
    ? parts.slice(0, 2).join('/')
    : parts[0]
  const subpath = '.' + specifier.slice(name.length)
  const directory = findPackage(name, from)
  const manifest = JSON.parse(
    fs.readFileSync(path.join(directory, 'package.json'), 'utf8')
  )
  const known = packages.get(name)

  if (known && known.directory !== directory) {
    throw new Error(
      'Two versions of ' +
        name +
        ' (' +
        known.version +
        ', ' +
        manifest.version +
        '). An import map cannot hold both.'
    )
  }

  packages.set(name, {name, version: manifest.version, directory})
  const target = resolveExport(manifest, subpath)
  const file = path.join(directory, target)
  imports[specifier] = './' + vendorPath(file)
  queue.push(file)
}

/**
 * Find `node_modules/<name>` from `from` upwards. pnpm links each package
 * next to its own dependencies, so start from the real path.
 *
 * @param {string} name
 * @param {string} from
 * @returns {string}
 */
function findPackage(name, from) {
  let directory = fs.realpathSync(from)

  while (true) {
    const candidate = path.join(directory, 'node_modules', name)
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return fs.realpathSync(candidate)
    }

    const parent = path.dirname(directory)
    if (parent === directory) throw new Error('Cannot find ' + name)
    directory = parent
  }
}

/**
 * Resolve a subpath with the `browser` and `default` conditions.
 *
 * @param {{name: string, exports?: unknown, main?: string}} manifest
 * @param {string} subpath
 * @returns {string}
 */
function resolveExport(manifest, subpath) {
  let target = manifest.exports
  if (target === undefined) {
    if (subpath !== '.') throw new Error('No exports in ' + manifest.name)
    return manifest.main || 'index.js'
  }

  if (
    typeof target === 'object' &&
    target !== null &&
    Object.keys(target).some((key) => key.startsWith('.'))
  ) {
    target = /** @type {Record<string, unknown>} */ (target)[subpath]
  } else if (subpath !== '.') {
    target = undefined
  }

  while (typeof target === 'object' && target !== null) {
    const conditions = /** @type {Record<string, unknown>} */ (target)
    target = conditions.browser ?? conditions.default
  }

  if (typeof target !== 'string') {
    throw new Error('Cannot resolve ' + manifest.name + ' ' + subpath)
  }

  return target
}

/**
 * @param {string} file
 */
function copy(file) {
  const destination = path.join(site, vendorPath(file))
  fs.mkdirSync(path.dirname(destination), {recursive: true})
  fs.copyFileSync(file, destination)
}

/**
 * `vendor/<name>@<version>/<file>`.
 *
 * @param {string} file
 * @returns {string}
 */
function vendorPath(file) {
  for (const info of packages.values()) {
    if (file.startsWith(info.directory + path.sep)) {
      return path
        .join(
          'vendor',
          info.name + '@' + info.version,
          path.relative(info.directory, file)
        )
        .split(path.sep)
        .join('/')
    }
  }

  throw new Error('File outside known packages: ' + file)
}

/**
 * @param {string} code
 * @returns {string}
 */
function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')
}

/**
 * @param {string} code
 * @returns {Array<string>}
 */
function importSpecifiers(code) {
  const pattern =
    /\b(?:import|export)\b[^'";]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|^\s*import\s*['"]([^'"]+)['"]/gm
  return [...code.matchAll(pattern)].map(
    (match) => match[1] || match[2] || match[3]
  )
}

/**
 * @param {Record<string, string>} object
 * @returns {Record<string, string>}
 */
function sortKeys(object) {
  return Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => a.localeCompare(b))
  )
}
