// @flow

import React, { type Node, type Element } from 'react'
import type { Visitor, Frame, AbstractElement } from './types'
import { visitChildren, resumeVisitChildren } from './visitor'
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

/** visitChildren walks all elements (depth-first) and while it walks the
    element tree some components will suspend and put a `Frame` onto
    the queue. Hence we recursively look at suspended components in
    this queue, wait for their promises to resolve, and continue
    calling visitChildren on their children. */
const flushFrames = (queue: Frame[], visitor: Visitor): Promise<void> => {
  if (queue.length === 0) {
    return Promise.resolve()
  }

  const frame = queue.shift()

  return frame.thenable.then(() => {
    prevDispatcher = ReactCurrentDispatcher.current
    ReactCurrentDispatcher.current = Dispatcher

    let children = []

    // Update the component after we've suspended to rerender it,
    // at which point we'll actually get its children and continue
    // walking the tree
    if (frame.kind === 'frame.class') {
      visitChildren(
        getChildrenArray(updateClassComponent(queue, frame)),
        queue,
        visitor
      )
    } else if (frame.kind === 'frame.hooks') {
      visitChildren(
        getChildrenArray(updateFunctionComponent(queue, frame)),
        queue,
        visitor
      )
    } else if (frame.kind === 'frame.lazy') {
      visitChildren(
        getChildrenArray(updateLazyComponent(queue, frame)),
        queue,
        visitor
      )
    } else if (frame.kind === 'frame.yield') {
      resumeVisitChildren(frame, queue, visitor)
    }

    ReactCurrentDispatcher.current = prevDispatcher
    return flushFrames(queue, visitor)
  })
}

const defaultVisitor = () => {}

const renderPrepass = (element: Node, visitor?: Visitor): Promise<void> => {
  const queue: Frame[] = []
  let fn = visitor !== undefined ? visitor : defaultVisitor

  // Context state is kept globally and is modified in-place.
  // Before we start walking the element tree we need to reset
  // its current state
  setCurrentContextMap({})
  setCurrentContextStore(new Map())

  try {
    // The "Dispatcher" is what handles hook calls and
    // a React internal that needs to be set to our
    // dispatcher and reset after we're done
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
