// @flow

import { createElement, type Node } from 'react'
import type { LazyComponent, DefaultProps, LazyFrame, Frame } from '../types'
import { getChildrenArray } from '../element'

import {
  setCurrentIdentity,
  setCurrentContextStore,
  getCurrentContextStore,
  setCurrentContextMap,
  getCurrentContextMap
} from '../internals'

const resolve = (type: LazyComponent): Promise<void> => {
  type._status = 0 /* PENDING */

  return type
    ._ctor()
    .then(Component => {
      if (typeof Component === 'function') {
        type._result = Component
        type._status = 1 /* SUCCESSFUL */
      } else if (
        Component !== null &&
        typeof Component === 'object' &&
        typeof Component.default === 'function'
      ) {
        type._result = Component.default
        type._status = 1 /* SUCCESSFUL */
      } else {
        type._status = 2 /* FAILED */
      }
    })
    .catch(() => {
      type._status = 2 /* FAILED */
    })
}

const render = (
  type: LazyComponent,
  props: DefaultProps,
  queue: Frame[]
): Node => {
  // Component has previously been fetched successfully,
  // so create the element with passed props and return it
  if (type._status === 1) {
    return createElement(type._result, props)
  }

  return null
}

export const mount = (
  type: LazyComponent,
  props: DefaultProps,
  queue: Frame[]
): Node => {
  // If the component has not been fetched yet, suspend this component
  if (type._status !== 2 && type._status !== 1) {
    queue.push({
      contextMap: getCurrentContextMap(),
      contextStore: getCurrentContextStore(),
      kind: 'frame.lazy',
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
  return render(frame.type, frame.props, queue)
}
