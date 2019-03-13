// @flow

import { createElement, type Node } from 'react'
import type { LazyComponent, DefaultProps, LazyFrame, Frame } from '../types'
import { getChildrenArray } from '../element'

import {
  setCurrentIdentity,
  setCurrentContextMap,
  getCurrentContextMap
} from '../internals'

const resolve = (type: LazyComponent): Promise<void> => {
  type._status = 0;

  return type._ctor()
    .then(Component => {
      if (
        Component !== null &&
        (typeof Component === 'function'
          || typeof Component === 'object')
      ) {
        type._result = Component
        type._status = 1
      } else {
        type._status = 2
      }
    })
    .catch(() => {
      type._status = 2
    })
}

const render = (
  type: LazyComponent,
  props: DefaultProps,
  queue: Frame[]
): Node => {
  if (type._status === 1) {
    let Component = type._result
    if (Component.default) {
      Component = Component.default
    }

    return createElement(Component, props)
  }

  return null
}

export const mount = (
  type: LazyComponent,
  props: DefaultProps,
  queue: Frame[]
): Node => {
  if (type._status !== 2 && type._status !== 1) {
    queue.push({
      contextMap: getCurrentContextMap(),
      kind: 'frame.lazy',
      thenable: resolve(type),
      props,
      type
    })

    return null
  }

  return render(type, props, queue)
}

export const update = (
  queue: Frame[],
  frame: LazyFrame
): Node => {
  setCurrentIdentity(null)
  setCurrentContextMap(frame.contextMap)
  return render(frame.type, frame.props, queue)
}
