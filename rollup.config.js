import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import buble from '@rollup/plugin-buble'
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import compiler from '@ampproject/rollup-plugin-closure-compiler'

const pkg = require('./package.json')

const externalModules = [
  'dns',
  'fs',
  'path',
  'url',
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {})
]

const externalPredicate = new RegExp(`^(${externalModules.join('|')})($|/)`)
const externalTest = (id) => {
  if (id === 'babel-plugin-transform-async-to-promises/helpers') {
    return false
  }

  return externalPredicate.test(id)
}

const plugins = [
  babel({
    babelrc: false,
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    presets: [],
    plugins: ['@babel/plugin-transform-flow-strip-types']
  }),
  resolve({
    dedupe: externalModules,
    mainFields: ['module', 'jsnext', 'main'],
    browser: true
  }),
  commonjs({
    ignoreGlobal: true,
    include: /\/node_modules\//,
    namedExports: {
      react: Object.keys(require('react'))
    }
  }),
  buble({
    transforms: {
      unicodeRegExp: false,
      dangerousForOf: true,
      dangerousTaggedTemplateString: true
    },
    objectAssign: 'Object.assign',
    exclude: 'node_modules/**'
  }),
  babel({
    babelrc: false,
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    presets: [],
    plugins: [
      'babel-plugin-closure-elimination',
      '@babel/plugin-transform-object-assign',
      [
        'babel-plugin-transform-async-to-promises',
        {
          inlineHelpers: true,
          externalHelpers: true
        }
      ]
    ]
  }),
  compiler({
    compilation_level: 'SIMPLE_OPTIMIZATIONS'
  }),
  terser({
    warnings: true,
    ecma: 5,
    keep_fnames: true,
    ie8: false,
    compress: {
      pure_getters: true,
      toplevel: true,
      booleans_as_integers: false,
      keep_fnames: true,
      keep_fargs: true,
      if_return: false,
      ie8: false,
      sequences: false,
      loops: false,
      conditionals: false,
      join_vars: false
    },
    mangle: false,
    output: {
      beautify: true,
      braces: true,
      indent_level: 2
    }
  })
]

export default {
  input: './src/index.js',
  onwarn: () => {},
  external: externalTest,
  treeshake: {
    propertyReadSideEffects: false
  },
  plugins,
  output: [
    {
      sourcemap: true,
      freeze: false,
      // NOTE: *.mjs files will lead to issues since react is still a non-ESM package
      // the same goes for package.json:exports
      file: './dist/react-ssr-prepass.es.js',
      format: 'esm'
    },
    {
      sourcemap: true,
      freeze: false,
      file: './dist/react-ssr-prepass.js',
      format: 'cjs'
    }
  ]
}
