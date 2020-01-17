// @flow

import type { Node, ComponentType } from 'react'
import { computeProps } from '../element'

import type {
  Visitor,
  Hook,
  Frame,
  HooksFrame,
  DefaultProps,
  ComponentStatics,
  UserElement
} from '../types'

import {
  type Identity,
  maskContext,
  makeIdentity,
  setCurrentIdentity,
  getCurrentIdentity,
  setCurrentContextStore,
  getCurrentContextStore,
  setCurrentContextMap,
  getCurrentContextMap,
  renderWithHooks,
  setFirstHook,
  getFirstHook
} from '../internals'

const makeFrame = (
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps,
  thenable: Promise<any>
) => ({
  contextMap: getCurrentContextMap(),
  contextStore: getCurrentContextStore(),
  id: getCurrentIdentity(),
  hook: getFirstHook(),
  kind: 'frame.hooks',
  thenable,
  props,
  type
})

const render = (
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps,
  queue: Frame[]
): Node => {
  try {
    return renderWithHooks(
      type,
      computeProps(props, type.defaultProps),
      maskContext(type)
    )
  } catch (error) {
    if (typeof error.then !== 'function') {
      throw error
    }

    queue.push(makeFrame(type, props, error))
    return null
  }
}

/** Mount a function component */
export const mount = (
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps,
  queue: Frame[],
  visitor: Visitor,
  element: UserElement
): Node => {
  setFirstHook(null)
  setCurrentIdentity(makeIdentity())

  const promise = visitor(element)
  if (promise) {
    queue.push(makeFrame(type, props, promise))
    return null
  }

  return render(type, props, queue)
}

/** Update a previously suspended function component */
export const update = (queue: Frame[], frame: HooksFrame) => {
  setFirstHook(null)
  setCurrentIdentity(frame.id)
  setCurrentContextMap(frame.contextMap)
  setCurrentContextStore(frame.contextStore)
  return render(frame.type, frame.props, queue)
}
