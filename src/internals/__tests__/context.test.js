import {
  setCurrentContextStore,
  setCurrentContextMap,
  readContextValue,
  maskContext
} from '../context'

describe('readContextValue', () => {
  it('returns values in a Map by key', () => {
    const map = new Map()
    const ctx = {}
    setCurrentContextStore(map)
    map.set(ctx, 'value')
    expect(readContextValue(ctx)).toBe('value')
  })

  it('returns default values when keys are unknown', () => {
    setCurrentContextMap(new Map())
    const ctx = { _currentValue: 'default' }
    expect(readContextValue(ctx)).toBe('default')
  })
})

describe('maskContext', () => {
  it('supports contextType', () => {
    const map = new Map()
    const ctx = {}
    setCurrentContextStore(map)
    map.set(ctx, 'value')
    expect(maskContext({ contextType: ctx })).toBe('value')
  })

  it('supports no context', () => {
    const map = new Map()
    setCurrentContextStore(map)
    expect(maskContext({})).toEqual({})
  })

  it('supports contextTypes', () => {
    const map = { a: 'a', b: 'b', c: 'c' }
    setCurrentContextMap(map)
    expect(maskContext({ contextTypes: { a: null, b: null } })).toEqual({
      a: 'a',
      b: 'b'
    })
  })
})
