#!/usr/bin/env node

const path = require('path')
const fs = require('fs')

fs.copyFileSync(
  path.resolve(__dirname, 'react-ssr-prepass.d.ts'),
  path.resolve(__dirname, '../dist/react-ssr-prepass.d.ts')
)

fs.copyFileSync(
  path.resolve(__dirname, 'react-ssr-prepass.js.flow'),
  path.resolve(__dirname, '../dist/react-ssr-prepass.js.flow')
)

fs.copyFileSync(
  path.resolve(__dirname, 'react-ssr-prepass.js.flow'),
  path.resolve(__dirname, '../dist/react-ssr-prepass.es.js.flow')
)
