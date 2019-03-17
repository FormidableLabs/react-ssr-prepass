// @flow

import type {
  AbstractContext,
  UserElement,
  ContextMap,
  ContextStore
} from '../types'

type ContextEntry = [AbstractContext, mixed]

let currentContextStore: ContextStore = new Map()
let currentContextMap: ContextMap = {}

let prevContextMap: void | ContextMap = undefined
let prevContextEntry: void | ContextEntry = undefined

export const getCurrentContextMap = (): ContextMap =>
  Object.assign({}, currentContextMap)
export const getCurrentContextStore = (): ContextStore =>
  new Map(currentContextStore)

export const flushPrevContextMap = (): void | ContextMap => {
  const prev = prevContextMap
  prevContextMap = undefined
  return prev
}

export const flushPrevContextStore = (): void | ContextEntry => {
  const prev = prevContextEntry
  prevContextEntry = undefined
  return prev
}

export const restoreContextMap = (prev: ContextMap) => {
  Object.assign(currentContextMap, prev)
}

export const restoreContextStore = (prev: ContextEntry) => {
  currentContextStore.set(prev[0], prev[1])
}

export const setCurrentContextMap = (map: ContextMap) => {
  prevContextMap = undefined
  currentContextMap = map
}

export const setCurrentContextStore = (store: ContextStore) => {
  prevContextEntry = undefined
  currentContextStore = store
}

export const assignContextMap = (map: ContextMap) => {
  prevContextMap = {}
  for (const name in map) {
    prevContextMap[name] = currentContextMap[name]
    currentContextMap[name] = map[name]
  }
}

export const setContextValue = (context: AbstractContext, value: mixed) => {
  prevContextEntry = [context, currentContextStore.get(context)]
  currentContextStore.set(context, value)
}

export const readContextValue = (context: AbstractContext) => {
  const value = currentContextStore.get(context)
  if (value !== undefined) {
    return value
  }

  // Return default if context has no value yet
  return context._currentValue
}

const emptyContext = {}

export const maskContext = (type: $PropertyType<UserElement, 'type'>) => {
  const { contextType, contextTypes } = type

  if (contextType) {
    return readContextValue(contextType)
  } else if (!contextTypes) {
    return emptyContext
  }

  const maskedContext = {}
  for (const name in contextTypes) {
    maskedContext[name] = currentContextMap[name]
  }

  return maskedContext
}
