// @flow

import React, { type Node, type Element } from 'react'

import type {
  VisitOptions,
  Visitor,
  YieldFrame,
  Frame,
  AbstractElement
} from './types'

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

const defaultVisitOptions: VisitOptions = {
  visitAllComponentTypes: false
}

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
  if (frame.kind === 'frame.yield') {
    const yieldFrame: YieldFrame = frame

    return new Promise(resolve => {
      setImmediate(() => {
        prevDispatcher = ReactCurrentDispatcher.current
        ReactCurrentDispatcher.current = Dispatcher
        resumeVisitChildren(yieldFrame, queue, visitor)
        ReactCurrentDispatcher.current = prevDispatcher
        resolve()
      })
    })
  }

  return frame.thenable.then(() => {
    prevDispatcher = ReactCurrentDispatcher.current
    ReactCurrentDispatcher.current = Dispatcher

    let children = []

    // Update the component after we've suspended to rerender it,
    // at which point we'll actually get its children
    if (frame.kind === 'frame.class') {
      children = updateClassComponent(queue, frame)
    } else if (frame.kind === 'frame.hooks') {
      children = updateFunctionComponent(queue, frame)
    } else if (frame.kind === 'frame.lazy') {
      children = updateLazyComponent(queue, frame)
    }

    // Now continue walking the previously suspended component's
    // children (which might also suspend)
    visitChildren(getChildrenArray(children), queue, visitor)
    ReactCurrentDispatcher.current = prevDispatcher
  })
}

const flushFrames = (queue: Frame[], visitor: Visitor): Promise<void> => {
  if (queue.length === 0) {
    return Promise.resolve()
  }

  return updateWithFrame(queue.shift(), queue, visitor).then(() =>
    flushFrames(queue, visitor)
  )
}

const defaultVisitor = () => undefined

const renderPrepass = (
  element: Node,
  visitor?: Visitor,
  visitOptions?: VisitOptions
): Promise<void> => {
  const queue: Frame[] = []
  const fn = visitor !== undefined ? visitor : defaultVisitor
  const opts = { ...defaultVisitOptions, ...visitOptions }

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

    visitChildren(getChildrenArray(element), queue, fn, opts)
  } catch (error) {
    return Promise.reject(error)
  } finally {
    ReactCurrentDispatcher.current = prevDispatcher
  }

  return flushFrames(queue, fn)
}

export default renderPrepass
