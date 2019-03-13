// @flow

import React, { type Node, type Element } from 'react'
import type { Frame, AbstractElement } from './types'
import { visitChildren } from './visitor'
import { getChildrenArray } from './element'

import {
  updateFunctionComponent,
  updateClassComponent,
  updateLazyComponent
} from './render'

import {
  setCurrentContextMap,
  getCurrentContextMap,
  Dispatcher
} from './internals'

const {
  ReactCurrentDispatcher
} = (React: any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

const visit = (children: AbstractElement[], queue: Frame[]) => {
  const prevDispatcher = ReactCurrentDispatcher.current
  ReactCurrentDispatcher.current = Dispatcher
  visitChildren(children, queue)
  ReactCurrentDispatcher.current = prevDispatcher
}

const flushFrames = (queue: Frame[]): Promise<void> => {
  if (queue.length === 0) {
    return Promise.resolve()
  }

  const frame = queue.shift()

  return frame.thenable.then(() => {
    let children = []
    if (frame.kind === 'frame.class') {
      children = getChildrenArray(updateClassComponent(queue, frame))
    } else if (frame.kind === 'frame.hooks') {
      children = getChildrenArray(updateFunctionComponent(queue, frame))
    } else if (frame.kind === 'frame.lazy') {
      children = getChildrenArray(updateLazyComponent(queue, frame))
    }

    visit(children, queue)
    return flushFrames(queue)
  })
}

const renderPrepass = (element: Node): Promise<void> => {
  const queue: Frame[] = []
  visit(getChildrenArray(element), queue)
  return flushFrames(queue)
}

export default renderPrepass
