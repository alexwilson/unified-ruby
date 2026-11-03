/**
 * Checks on the real tarballs that `pnpm pack` makes. Run `pnpm run build`
 * first (`pnpm test` does).
 */

import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import {builtinModules} from 'node:module'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {publint} from 'publint'
import {formatMessage} from 'publint/utils'

const root = new URL('../packages/', import.meta.url)

/** @type {Record<string, Array<string>>} */
const expectedFiles = {
  'micromark-extension-ruby': [
    'dev/index.d.ts',
    'dev/index.js',
    'dev/lib/html.d.ts',
    'dev/lib/html.js',
    'dev/lib/syntax.d.ts',
    'dev/lib/syntax.js',
    'dev/lib/util.d.ts',
    'dev/lib/util.js',
    'dev/util.d.ts',
    'dev/util.js',
    'index.d.ts',
    'index.js',
    'lib/html.d.ts',
    'lib/html.js',
    'lib/syntax.d.ts',
    'lib/syntax.js',
    'lib/util.d.ts',
    'lib/util.js',
    'license',
    'package.json',
    'readme.md',
    'util.d.ts',
    'util.js'
  ],
  'mdast-util-ruby': [
    'index.d.ts',
    'index.js',
    'lib/index.d.ts',
    'lib/index.js',
    'license',
    'package.json',
    'readme.md'
  ],
  'remark-ruby-annotation': [
    'index.d.ts',
    'index.js',
    'lib/index.d.ts',
    'lib/index.js',
    'license',
    'package.json',
    'readme.md'
  ]
}

const installScripts = ['preinstall', 'install', 'postinstall', 'prepare']
const builtins = new Set(builtinModules)

for (const name of Object.keys(expectedFiles)) {
  test('package contents: ' + name, async function (t) {
    const {tarball, unpacked} = pack(name)
    const manifest = JSON.parse(
      fs.readFileSync(path.join(unpacked, 'package.json'), 'utf8')
    )
    /** @type {Record<string, string>} */
    const dependencies = manifest.dependencies || {}

    await t.test('publint finds nothing', async function () {
      const buffer = fs.readFileSync(tarball)
      const result = await publint({
        pack: {
          tarball: buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
          )
        },
        level: 'suggestion',
        strict: true
      })
      assert.deepEqual(
        result.messages.map((message) => formatMessage(message, result.pkg)),
        []
      )
    })

    await t.test('file list', function () {
      assert.deepEqual(listFiles(unpacked), expectedFiles[name])
    })

    await t.test('no `workspace:` ranges', function () {
      for (const field of [
        'dependencies',
        'peerDependencies',
        'optionalDependencies'
      ]) {
        for (const [key, range] of Object.entries(manifest[field] || {})) {
          assert.ok(!range.startsWith('workspace:'), field + ': ' + key)
        }
      }
    })

    await t.test('no install scripts', function () {
      for (const script of installScripts) {
        assert.ok(!(manifest.scripts && script in manifest.scripts), script)
      }
    })

    await t.test('no `engines` and no `peerDependencies`', function () {
      assert.equal(manifest.engines, undefined)
      assert.equal(manifest.peerDependencies, undefined)
    })

    const imported = new Set()

    for (const file of expectedFiles[name]) {
      if (!/\.(js|d\.ts)$/.test(file)) continue
      const code = stripComments(
        fs.readFileSync(path.join(unpacked, file), 'utf8')
      )
      for (const specifier of importSpecifiers(code)) {
        const bare = packageName(specifier)
        if (bare) imported.add(bare)
      }
    }

    await t.test('each import is declared', function () {
      for (const bare of imported) {
        if (bare === name || builtins.has(bare)) continue
        assert.ok(
          bare in dependencies || typesPackage(bare) in dependencies,
          'not in dependencies: ' + bare
        )
      }
    })

    await t.test('each dependency is imported', function () {
      for (const dependency of Object.keys(dependencies)) {
        assert.ok(
          imported.has(dependency) ||
            [...imported].some((bare) => typesPackage(bare) === dependency),
          'not imported by a shipped file: ' + dependency
        )
      }
    })
  })
}

/**
 * @param {string} name
 * @returns {{tarball: string, unpacked: string}}
 */
function pack(name) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-' + name))
  const output = execFileSync(
    'pnpm',
    ['pack', '--json', '--pack-destination', directory],
    {cwd: new URL(name + '/', root), encoding: 'utf8'}
  )
  const tarball = JSON.parse(output.slice(output.indexOf('{'))).filename
  execFileSync('tar', ['-xzf', tarball, '-C', directory])
  return {tarball, unpacked: path.join(directory, 'package')}
}

/**
 * @param {string} directory
 * @returns {Array<string>}
 */
function listFiles(directory) {
  return fs
    .readdirSync(directory, {recursive: true, withFileTypes: true})
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path
        .relative(directory, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join('/')
    )
    .sort()
}

/**
 * JSDoc `@import` tags are comments. They do not load a package.
 *
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
 * @param {string} specifier
 * @returns {string | undefined}
 */
function packageName(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('node:')) return
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

/**
 * The `@types` package for a bare name, for type-only packages like `mdast`.
 *
 * @param {string} bare
 * @returns {string}
 */
function typesPackage(bare) {
  return '@types/' + bare.replace(/^@/, '').replace('/', '__')
}
