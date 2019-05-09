// @flow

import React, { type Node, type Element } from 'react'
import type { Visitor, YieldFrame, Frame, AbstractElement } from './types'
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
  hasReactInternals,
  setupDispatcher,
  restoreDispatcher
} from './internals'

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
        setupDispatcher()
        resumeVisitChildren(yieldFrame, queue, visitor)
        restoreDispatcher()
        resolve()
      })
    })
  }

  return frame.thenable.then(() => {
    let children = []
    setupDispatcher()

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
    restoreDispatcher()
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

const renderPrepass = (element: Node, visitor?: Visitor): Promise<void> => {
  // If React has been replaced with a compat package that is
  // unsupported by react-ssr-prepass, it bails early on
  if (!hasReactInternals) {
    return Promise.resolve()
  }

  const queue: Frame[] = []
  const fn = visitor !== undefined ? visitor : defaultVisitor

  // Context state is kept globally and is modified in-place.
  // Before we start walking the element tree we need to reset
  // its current state
  setCurrentContextMap({})
  setCurrentContextStore(new Map())

  try {
    setupDispatcher()
    visitChildren(getChildrenArray(element), queue, fn)
  } catch (error) {
    return Promise.reject(error)
  } finally {
    restoreDispatcher()
  }

  return flushFrames(queue, fn)
}

export default renderPrepass
