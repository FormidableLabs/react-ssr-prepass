// @flow

import { type Node, type Element } from 'react'
import type {
  Visitor,
  YieldFrame,
  Frame,
  AbstractElement,
  RendererState
} from './types'
import { visit, update, SHOULD_YIELD } from './visitor'
import { getChildrenArray } from './element'

import {
  setCurrentContextStore,
  setCurrentContextMap,
  setCurrentErrorFrame,
  getCurrentErrorFrame,
  setCurrentRendererState,
  initRendererState,
  Dispatcher
} from './internals'

/** visit() walks all elements (depth-first) and while it walks the
    element tree some components will suspend and put a `Frame` onto
    the queue. Hence we recursively look at suspended components in
    this queue, wait for their promises to resolve, and continue
    calling visit() on their children. */
const flushFrames = (
  queue: Frame[],
  visitor: Visitor,
  state: RendererState
): Promise<void> => {
  const frame = queue.shift()
  if (!frame) {
    return Promise.resolve()
  }

  if (SHOULD_YIELD && frame.kind === 'frame.yield') {
    frame.thenable = new Promise((resolve, reject) => {
      setImmediate(resolve)
    })
  }

  return Promise.resolve(frame.thenable).then(
    () => {
      setCurrentRendererState(state)
      update(frame, queue, visitor)
      return flushFrames(queue, visitor, state)
    },
    (error: Error) => {
      if (!frame.errorFrame) throw error
      frame.errorFrame.error = error
      update(frame.errorFrame, queue, visitor)
    }
  )
}

const defaultVisitor = () => undefined

const renderPrepass = (element: Node, visitor?: Visitor): Promise<void> => {
  if (!visitor) visitor = defaultVisitor

  const queue: Frame[] = []
  // Renderer state is kept globally but restored and
  // passed around manually since it isn't dependent on the
  // render tree
  const state = initRendererState()
  // Context state is kept globally and is modified in-place.
  // Before we start walking the element tree we need to reset
  // its current state
  setCurrentContextMap({})
  setCurrentContextStore(new Map())
  setCurrentErrorFrame(null)

  try {
    visit(getChildrenArray(element), queue, visitor)
  } catch (error) {
    return Promise.reject(error)
  }

  return flushFrames(queue, visitor, state)
}

export default renderPrepass
