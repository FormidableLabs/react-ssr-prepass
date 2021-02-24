// @flow

import { createElement, type Node } from 'react'
import type {
  LazyComponent,
  LazyComponentPayload,
  DefaultProps,
  LazyFrame,
  Frame
} from '../types'
import { getChildrenArray } from '../element'

import {
  setCurrentIdentity,
  setCurrentContextStore,
  getCurrentContextStore,
  setCurrentContextMap,
  getCurrentContextMap,
  setCurrentErrorFrame,
  getCurrentErrorFrame
} from '../internals'

const resolve = (type: LazyComponent): Promise<void> => {
  const payload = (type._payload || type: any)
  if (payload._status === 0) {
    return payload._result
  } else if (payload._status === 1) {
    return Promise.resolve(payload._result)
  } else if (payload._status === 2) {
    return Promise.reject(payload._result)
  }

  payload._status = 0 /* PENDING */

  return (payload._result = (payload._ctor || payload._result)()
    .then((Component) => {
      payload._result = Component
      if (typeof Component === 'function') {
        payload._status = 1 /* SUCCESSFUL */
      } else if (
        Component !== null &&
        typeof Component === 'object' &&
        typeof Component.default === 'function'
      ) {
        payload._result = Component.default
        payload._status = 1 /* SUCCESSFUL */
      } else {
        payload._status = 2 /* FAILED */
      }
    })
    .catch((error) => {
      payload._status = 2 /* FAILED */
      payload._result = error
      return Promise.reject(error)
    }))
}

const render = (
  type: LazyComponent,
  props: DefaultProps,
  queue: Frame[]
): Node => {
  // Component has previously been fetched successfully,
  // so create the element with passed props and return it
  const payload = ((type._payload || type: any): LazyComponentPayload)
  if (payload._status === 1) {
    return createElement(payload._result, props)
  }

  return null
}

export const mount = (
  type: LazyComponent,
  props: DefaultProps,
  queue: Frame[]
): Node => {
  // If the component has not been fetched yet, suspend this component
  const payload = ((type._payload || type: any): LazyComponentPayload)
  if (payload._status <= 0) {
    queue.push({
      kind: 'frame.lazy',
      contextMap: getCurrentContextMap(),
      contextStore: getCurrentContextStore(),
      errorFrame: getCurrentErrorFrame(),
      thenable: resolve(type),
      props,
      type
    })

    return null
  }

  return render(type, props, queue)
}

export const update = (queue: Frame[], frame: LazyFrame): Node => {
  setCurrentIdentity(null)
  setCurrentContextMap(frame.contextMap)
  setCurrentContextStore(frame.contextStore)
  setCurrentErrorFrame(frame.errorFrame)
  return render(frame.type, frame.props, queue)
}
