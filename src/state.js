// @flow

import type { AbstractContext } from './types'
import type { UserElement } from './element'

import invariant from 'invariant'

export opaque type Identity = {}
export type ContextMap = Map<string | AbstractContext, mixed>

let currentIdentity: Identity | null = null
let currentContextMap: ContextMap = new Map()

export const makeIdentity = (): Identity => ({})

export const setCurrentIdentity = (id: Identity | null) => {
  currentIdentity = id
}

export const getCurrentIdentity = (): Identity => {
  invariant(
    currentIdentity !== null,
    'Hooks can only be called inside the body of a function component. ' +
      '(https://fb.me/react-invalid-hook-call)'
  )

  // NOTE: The warning that is used in ReactPartialRendererHooks is obsolete
  // in a prepass, since it'll be caught by a subsequent renderer anyway
  // https://github.com/facebook/react/blob/c21c41e/packages/react-dom/src/server/ReactPartialRendererHooks.js#L63-L71

  return (currentIdentity: Identity)
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
