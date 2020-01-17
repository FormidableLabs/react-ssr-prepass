import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useRef,
  useCallback
} from 'react'
import renderPrepass from '..'

const CONCURRENCY = 2

const Context = createContext({ test: 3, promise: null, resolved: false })

function makeApp() {
  return <App />
}

function App() {
  const [state, setState] = useState(() => ({
    test: Math.random(),
    promise: null,
    resolved: false
  }))
  const refresh = () =>
    setState({ test: Math.random(), promise: null, resolved: false })

  return (
    <Context.Provider value={{ ...state, refresh }}>
      <Outer />
    </Context.Provider>
  )
}

function Outer() {
  useRef({
    test: 1
  })

  const [, refresh] = useSuspenseHook()

  useMemo(() => {
    return { a: 1, b: 2 }
  }, [])

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <Inner />
    </div>
  )
}

function useSuspenseHook() {
  const context = useContext(Context)

  useRef({
    test: 1
  })

  if (!context.resolved && !context.promise) {
    context.promise = new Promise(resolve =>
      setTimeout(resolve, Math.floor(30 + Math.random() * 50))
    ).then(() => {
      context.resolved = true
      context.promise = null
    })
  }

  if (context.promise) throw context.promise

  return [true, context.refresh]
}

function Inner() {
  const [state] = useState({ a: 3 })

  useCallback(() => {
    return state
  }, [state])

  return <h4>Inner</h4>
}

test('concurrency', () => {
  return expect(
    Promise.all(
      new Array(CONCURRENCY).fill(0).map(() => renderPrepass(makeApp()))
    )
  ).resolves.not.toThrow()
})
