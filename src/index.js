// @flow

import React, { type Node, type Element } from 'react'
import type { Visitor, YieldFrame, Frame, AbstractElement } from './types'
import { visit, update, SHOULD_YIELD } from './visitor'
import { getChildrenArray } from './element'

import {
  setCurrentContextStore,
  setCurrentContextMap,
  setCurrentErrorFrame,
  getCurrentErrorFrame,
  Dispatcher
} from './internals'

const {
  ReactCurrentDispatcher
} = (React: any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

/** visitChildren walks all elements (depth-first) and while it walks the
    element tree some components will suspend and put a `Frame` onto
    the queue. Hence we recursively look at suspended components in
    this queue, wait for their promises to resolve, and continue
    calling visitChildren on their children. */
const updateWithFrame = (
  frame: Frame,
  queue: Frame[],
  visitor: Visitor
): Promise<void> => {
  if (SHOULD_YIELD && frame.kind === 'frame.yield') {
    frame.thenable = new Promise((resolve, reject) => {
      setImmediate(resolve)
    })
  }

  return Promise.resolve(frame.thenable)
    .catch((error) => {
      if (!frame.errorFrame) throw error
      frame.errorFrame.error = error
      update(frame, queue, visitor)
    })
    .then(() => {
      update(frame, queue, visitor)
    })
}

const flushFrames = (queue: Frame[], visitor: Visitor): Promise<void> => {
  const frame = queue.shift()
  if (!frame) return Promise.resolve()

  return updateWithFrame(frame, queue, visitor).then(() =>
    flushFrames(queue, visitor)
  )
}

const defaultVisitor = () => undefined

const renderPrepass = (element: Node, visitor?: Visitor): Promise<void> => {
  const queue: Frame[] = []
  const fn = visitor !== undefined ? visitor : defaultVisitor

  // Context state is kept globally and is modified in-place.
  // Before we start walking the element tree we need to reset
  // its current state
  setCurrentContextMap({})
  setCurrentContextStore(new Map())
  setCurrentErrorFrame(null)

  try {
    visit(getChildrenArray(element), queue, fn)
  } catch (error) {
    return Promise.reject(error)
  }

  return flushFrames(queue, fn)
}

export default renderPrepass
