if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/react-ssr-prepass.production.min.js')
} else {
  module.exports = require('./dist/react-ssr-prepass.development.js')
}
