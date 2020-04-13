// @flow

import React, { type Node, type Element } from 'react'
import type { Visitor, YieldFrame, Frame, AbstractElement } from './types'
import { visitChildren, resumeVisitChildren, update } from './visitor'
import { getChildrenArray } from './element'

import {
  setCurrentContextStore,
  setCurrentContextMap,
  Dispatcher
} from './internals'

// `isServer` will be `true` in node & jest, & `false` in
// the browser where the bundler shims the `process` object
const isServer = !process.browser

const {
  ReactCurrentDispatcher
} = (React: any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

/** wrapWithDispatcher accepts a function and wraps it
  in one that sets up our ReactCurrentDispatcher and
  resets it afterwards */
function wrapWithDispatcher<T: Function>(exec: T): T {
  // $FlowFixMe
  return (...args) => {
    const prevDispatcher = ReactCurrentDispatcher.current

    try {
      // The "Dispatcher" is what handles hook calls and
      // a React internal that needs to be set to our dispatcher
      ReactCurrentDispatcher.current = Dispatcher
      return exec(...args)
    } finally {
      // We're resetting the dispatcher after we're done
      ReactCurrentDispatcher.current = prevDispatcher
    }
  }
}

const resumeWithDispatcher = wrapWithDispatcher(resumeVisitChildren)
const visitWithDispatcher = wrapWithDispatcher(visitChildren)
const updateWithDispatcher = wrapWithDispatcher(update)

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
    return new Promise((resolve, reject) => {
      const resume = () => {
        try {
          resumeWithDispatcher(frame, queue, visitor)
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      isServer ? setImmediate(resume) : resume()
    })
  }

  return frame.thenable.then(() => {
    // Update the component after we've suspended to rerender it,
    // at which point we'll actually get its children
    const children = updateWithDispatcher(frame, queue)
    // Now continue walking the previously suspended component's
    // children (which might also suspend)
    visitWithDispatcher(getChildrenArray(children), queue, visitor)
  })
}

const flushFrames = (queue: Frame[], visitor: Visitor): Promise<void> => {
  const frame = queue.shift()
  return frame
    ? updateWithFrame(frame, queue, visitor).then(() =>
        flushFrames(queue, visitor)
      )
    : Promise.resolve()
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

  try {
    visitWithDispatcher(getChildrenArray(element), queue, fn)
  } catch (error) {
    return Promise.reject(error)
  }

  return flushFrames(queue, fn)
}

export default renderPrepass
