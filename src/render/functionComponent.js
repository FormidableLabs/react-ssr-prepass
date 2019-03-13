// @flow

import type { Node, ComponentType } from 'react'
import type { Frame, HooksFrame } from './types'
import type { DefaultProps, ComponentStatics } from '../element'
import { computeProps } from './utils'

import {
  maskContext,
  makeIdentity,
  setCurrentIdentity,
  setCurrentContextMap,
  getCurrentIdentity,
  getCurrentContextMap,
  type Identity
} from '../state'

import {
  renderWithHooks,
  setFirstHook,
  getFirstHook,
  type Hook
} from '../dispatcher'

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

    queue.push({
      contextMap: getCurrentContextMap(),
      id: getCurrentIdentity(),
      hook: getFirstHook(),
      kind: 'frame.hooks',
      thenable: error,
      props,
      type
    })

    return null
  } finally {
    setCurrentIdentity(null)
  }
}

/** Mount a function component */
export const mount = (
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps,
  queue: Frame[]
): Node => {
  setFirstHook(null)
  setCurrentIdentity(makeIdentity())
  return render(type, props, queue)
}

/** Update a previously suspended function component */
export const update = (queue: Frame[], frame: HooksFrame) => {
  setFirstHook(frame.hook)
  setCurrentIdentity(frame.id)
  setCurrentContextMap(frame.contextMap)
  return render(frame.type, frame.props, queue)
}
