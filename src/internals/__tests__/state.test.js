import { setCurrentContextMap, readContextMap, maskContext } from '../state'

describe('readContextMap', () => {
  it('returns values in a Map by key', () => {
    const map = new Map()
    const ctx = {}
    setCurrentContextMap(map)
    map.set('key', 'value')
    map.set(ctx, 'value')
    expect(readContextMap('key')).toBe('value')
    expect(readContextMap(ctx)).toBe('value')
  })

  it('returns default values when keys are unknown', () => {
    setCurrentContextMap(new Map())
    const ctx = { _currentValue: 'default' }
    expect(readContextMap('key')).toBe(undefined)
    expect(readContextMap(ctx)).toBe('default')
  })
})

describe('maskContext', () => {
  it('supports contextType', () => {
    const map = new Map()
    const ctx = {}
    setCurrentContextMap(map)
    map.set(ctx, 'value')
    expect(maskContext({ contextType: ctx })).toBe('value')
  })

  it('supports no context', () => {
    const map = new Map()
    setCurrentContextMap(map)
    expect(maskContext({})).toEqual({})
  })

  it('supports contextTypes', () => {
    const map = new Map()
    setCurrentContextMap(map)
    map.set('a', 'a')
    map.set('b', 'b')
    map.set('c', 'c')
    expect(maskContext({ contextTypes: { a: null, b: null } })).toEqual({
      a: 'a',
      b: 'b'
    })
  })
})
