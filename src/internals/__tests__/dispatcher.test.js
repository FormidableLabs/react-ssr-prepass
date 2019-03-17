import { Dispatcher } from '../dispatcher'

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
