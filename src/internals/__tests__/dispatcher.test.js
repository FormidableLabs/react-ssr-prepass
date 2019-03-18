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

describe('useCallback', () => {
  it('is an identity function', () => {
    const fn = () => {}
    expect(Dispatcher.useCallback(fn)).toBe(fn)
  })
})
