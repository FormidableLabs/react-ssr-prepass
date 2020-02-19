import { setCurrentContextStore } from '../context'
import { getCurrentIdentity, Dispatcher } from '../dispatcher'

describe('getCurrentIdentity', () => {
  it('throws when called outside of function components', () => {
    expect(getCurrentIdentity).toThrow()
  })
})

describe('readContext', () => {
  it('calls readContextValue', () => {
    const map = new Map()
    const ctx = {}
    setCurrentContextStore(map)
    map.set(ctx, 'value')
    expect(Dispatcher.readContext(ctx)).toBe('value')
  })
})

describe('useEffect', () => {
  it('is a noop', () => {
    expect(Dispatcher.useEffect).not.toThrow()
  })
})

describe('useTransition', () => {
  it('returns noop and false', () => {
    const result = Dispatcher.useTransition()
    expect(typeof result[0]).toBe('function')
    expect(result[1]).toBe(false)
  })
})

describe('useDeferredValue', () => {
  it('returns itself', () => {
    const value = {}
    expect(Dispatcher.useDeferredValue(value)).toBe(value)
  })
})
