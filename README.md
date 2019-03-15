# react-ssr-prepass 🌲

`react-ssr-prepass` is a partial server-side React renderer that is meant
to do a prepass on a React tree and await all suspended promises. It also
accepts a visitor function that can be used to await on custom promises.

It's meant to be used for fetching data before executing `renderToString`
or `renderToNodeStream` and provides a crude way to support suspense during
SSR today. ✨

> ⚠️ **Disclaimer:** Suspense is unstable and experimental. Its API may change
> and hence this library may break. Awaiting promises is only part of the
> story and does not mean that any data will be rehydrated on the client
> automatically. There be dragons!

## Quick Start Guide

First install `react-ssr-prepass` alongside `react` and `react-dom`:

```sh
yarn add react-ssr-prepass
# or
npm install --save react-ssr-prepass
```

In your SSR code you may now add it in front of your usual `renderToString`
or `renderToNodeStream` code:

```js
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

import ssrPrepass from 'react-ssr-prepass'

const renderApp = async App => {
  const element = createElement(App)
  await ssrPrepass(element)

  return renderToString(element)
}
```

You should also be aware that `react-ssr-prepass` does not handle any
data rehydration. In most cases it's fine to collect data from your cache
or store after running `ssrPrepass`, turn it into JSON, and send it
down in your HTML result.

## Prior Art

This library is mostly based on `react-dom`'s `ReactPartialRenderer`
implementation. Its API and purpose is based on `react-apollo`'s
`getDataFromTree` function and hence it's also a successor to
`react-tree-walker`.
