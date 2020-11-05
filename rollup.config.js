import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import buble from '@rollup/plugin-buble'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import compiler from '@ampproject/rollup-plugin-closure-compiler'
import replace from 'rollup-plugin-replace'

const pkgInfo = require('./package.json')
const { peerDependencies, dependencies } = pkgInfo

let external = ['dns', 'fs', 'path', 'url']

if (pkgInfo.peerDependencies) {
  external.push(...Object.keys(peerDependencies))
}

if (pkgInfo.dependencies) {
  external.push(...Object.keys(dependencies))
}

const externalPredicate = new RegExp(`^(${external.join('|')})($|/)`)
const externalTest = (id) => {
  if (id === 'babel-plugin-transform-async-to-promises/helpers') {
    return false
  }

  return externalPredicate.test(id)
}

const terserPretty = terser({
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

const terserMinified = terser({
  warnings: true,
  ecma: 5,
  ie8: false,
  toplevel: true,
  compress: {
    keep_infinity: true,
    pure_getters: true,
    passes: 10
  },
  output: {
    comments: false
  }
})

const makePlugins = (isProduction = false) => [
  babel({
    babelrc: false,
    exclude: 'node_modules/**',
    presets: [],
    plugins: ['@babel/plugin-transform-flow-strip-types']
  }),
  nodeResolve({
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
  isProduction &&
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
  isProduction &&
    compiler({
      compilation_level: 'SIMPLE_OPTIMIZATIONS'
    }),
  isProduction ? terserMinified : terserPretty
]

const config = {
  input: './src/index.js',
  onwarn: () => {},
  external: externalTest,
  treeshake: {
    propertyReadSideEffects: false
  }
}

const name = 'react-ssr-prepass'

export default [
  {
    ...config,
    plugins: makePlugins(false),
    output: [
      {
        sourcemap: true,
        legacy: true,
        freeze: false,
        esModule: false,
        file: `./dist/${name}.development.js`,
        format: 'cjs'
      }
    ]
  },
  {
    ...config,
    plugins: makePlugins(true),
    output: [
      {
        sourcemap: true,
        legacy: true,
        freeze: false,
        file: `./dist/${name}.production.min.js`,
        format: 'cjs'
      }
    ]
  }
]
