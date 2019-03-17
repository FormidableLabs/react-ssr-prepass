// @flow

import React, { type Node, type Element } from 'react'
import type { Visitor, Frame, AbstractElement } from './types'
import { visitChildren } from './visitor'
import { getChildrenArray } from './element'

import {
  updateFunctionComponent,
  updateClassComponent,
  updateLazyComponent
} from './render'

import {
  setCurrentContextStore,
  setCurrentContextMap,
  Dispatcher
} from './internals'

const {
  ReactCurrentDispatcher
} = (React: any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

let prevDispatcher = ReactCurrentDispatcher.current

const flushFrames = (queue: Frame[], visitor: Visitor): Promise<void> => {
  if (queue.length === 0) {
    return Promise.resolve()
  }

  const frame = queue.shift()

  return frame.thenable.then(() => {
    prevDispatcher = ReactCurrentDispatcher.current
    ReactCurrentDispatcher.current = Dispatcher

    let children = []
    if (frame.kind === 'frame.class') {
      children = getChildrenArray(updateClassComponent(queue, frame))
    } else if (frame.kind === 'frame.hooks') {
      children = getChildrenArray(updateFunctionComponent(queue, frame))
    } else if (frame.kind === 'frame.lazy') {
      children = getChildrenArray(updateLazyComponent(queue, frame))
    }

    visitChildren(children, queue, visitor)
    ReactCurrentDispatcher.current = prevDispatcher

    return flushFrames(queue, visitor)
  })
}

const defaultVisitor = () => {}

const renderPrepass = (element: Node, visitor?: Visitor): Promise<void> => {
  const queue: Frame[] = []
  let fn = visitor !== undefined ? visitor : defaultVisitor

  setCurrentContextMap({})
  setCurrentContextStore(new Map())

  try {
    prevDispatcher = ReactCurrentDispatcher.current
    ReactCurrentDispatcher.current = Dispatcher
    visitChildren(getChildrenArray(element), queue, fn)
  } catch (error) {
    return Promise.reject(error)
  } finally {
    ReactCurrentDispatcher.current = prevDispatcher
  }

  return flushFrames(queue, fn)
}

export default renderPrepass
