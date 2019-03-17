// @flow

import type { AbstractContext, UserElement, ContextMap } from '../types'

const emptyMap: ContextMap = new Map()
let currentContextMap: ContextMap = emptyMap

export const clearCurrentContextMap = () => {
  currentContextMap = emptyMap
}

export const setCurrentContextMap = (map: ContextMap) => {
  currentContextMap = map
}

export const getCurrentContextMap = (): ContextMap => {
  return currentContextMap
}

export const readContextMap = (context: string | AbstractContext) => {
  if (currentContextMap.has(context)) {
    return currentContextMap.get(context)
  } else if (typeof context === 'string') {
    // A legacy context has no default value
    return undefined
  }

  // Return default if context has no value yet
  return context._currentValue
}

export const forkContextMap = (): ContextMap => {
  // Create cloned ContextMap of currentContextMap
  const newContextMap: ContextMap = new Map(currentContextMap)
  setCurrentContextMap(newContextMap)
  return newContextMap
}

const emptyContext = {}

export const maskContext = (type: $PropertyType<UserElement, 'type'>) => {
  const { contextType, contextTypes } = type

  if (contextType) {
    return readContextMap(contextType)
  } else if (!contextTypes) {
    return emptyContext
  }

  const maskedContext = {}
  for (const name in contextTypes) {
    maskedContext[name] = readContextMap(name)
  }

  return maskedContext
}
