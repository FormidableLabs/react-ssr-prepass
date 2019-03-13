// @flow

import React, { type Node, type Element } from 'react'
import type { AbstractElement } from './element'
import { visitElement } from './visitor'
import { getChildrenArray } from './children'
import { setCurrentContextMap, getCurrentContextMap } from './state'
import { Dispatcher } from './dispatcher'

import {
  updateFunctionComponent,
  updateClassComponent,
  type Frame
} from './render'

const {
  ReactCurrentDispatcher
} = (React: any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

const visitChildren = (children: AbstractElement[], queue: Frame[]) => {
  if (children.length === 1) {
    visitChildren(visitElement(children[0], queue), queue)
  } else if (children.length > 1) {
    const contextMap = getCurrentContextMap()
    for (let i = 0, l = children.length; i < l; i++) {
      visitChildren(visitElement(children[i], queue), queue)
      setCurrentContextMap(contextMap)
    }
  }
}

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
