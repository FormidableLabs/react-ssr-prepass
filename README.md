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
