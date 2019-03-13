// @flow

import type { Node, ComponentType } from 'react'
import type { Frame, ClassFrame } from './types'
import type { DefaultProps, ComponentStatics } from '../element'
import { computeProps } from './utils'

import {
  maskContext,
  forkContextMap,
  setCurrentIdentity,
  setCurrentContextMap,
  getCurrentContextMap,
  type Identity
} from '../state'

const createUpdater = () => {
  const queue = []

  return {
    queue,
    isMounted: () => false,
    enqueueForceUpdate: () => null,
    enqueueReplaceState: (instance, completeState) => {
      if (instance._isMounted) {
        queue.length = 0
        queue.push(completeState)
      }
    },
    enqueueSetState: (instance, currentPartialState) => {
      if (instance._isMounted) {
        queue.push(currentPartialState)
      }
    }
  }
}

const flushEnqueuedState = (instance: any) => {
  const queue = (instance.updater.queue: any[])

  if (queue.length > 0) {
    let nextState = Object.assign({}, instance.state)

    for (let i = 0, l = queue.length; i < l; i++) {
      const partial = queue[i]
      const partialState =
        typeof partial === 'function'
          ? partial.call(instance, nextState, instance.props, instance.context)
          : partial
      if (partialState !== null) {
        Object.assign(nextState, partialState)
      }
    }

    instance.state = nextState
    queue.length = 0
  }
}

const createInstance = (type: any, props: DefaultProps) => {
  const updater = createUpdater()
  const computedProps = computeProps(props, type.defaultProps)
  const context = maskContext(type)
  const instance = new type(computedProps, context, updater)

  instance.props = computedProps
  instance.context = context
  instance.updater = updater
  instance._isMounted = true

  if (instance.state === undefined) {
    instance.state = null
  }

  if (typeof type.getDerivedStateFromProps === 'function') {
    const { getDerivedStateFromProps } = type
    const state = getDerivedStateFromProps(instance.props, instance.state)
    if (state !== null && state !== undefined) {
      instance.state = Object.assign({}, instance.state, state)
    }
  } else if (typeof instance.componentWillMount === 'function') {
    instance.componentWillMount()
  } else if (typeof instance.UNSAFE_componentWillMount === 'function') {
    instance.UNSAFE_componentWillMount()
  }

  // Flush all queued up state changes
  flushEnqueuedState(instance)

  return instance
}

const render = (type: any, instance: any, queue: Frame[]) => {
  let child: Node = null

  try {
    child = instance.render()
  } catch (error) {
    if (typeof error.then !== 'function') {
      throw error
    }

    queue.push({
      contextMap: getCurrentContextMap(),
      thenable: error,
      kind: 'frame.class',
      instance,
      props: instance.props,
      type
    })

    return null
  } finally {
    instance._isMounted = false
  }

  if (
    type.childContextTypes !== undefined &&
    typeof instance.getChildContext === 'function'
  ) {
    const childContext = instance.getChildContext()
    if (childContext) {
      const contextMap = forkContextMap()
      for (const name in childContext) {
        contextMap.set(name, childContext[name])
      }
    }
  }

  if (
    typeof instance.getDerivedStateFromProps !== 'function' &&
    (typeof instance.componentWillMount === 'function' ||
      typeof instance.UNSAFE_componentWillMount === 'function') &&
    typeof instance.componentWillUnmount === 'function'
  ) {
    try {
      instance.componentWillUnmount()
    } catch (_err) {}
  }

  return child
}

/** Mount a class component */
export const mount = (
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps,
  queue: Frame[]
) => {
  setCurrentIdentity(null)
  const instance = createInstance(type, props)
  return render(type, instance, queue)
}

/** Update a previously suspended class component */
export const update = (queue: Frame[], frame: ClassFrame) => {
  setCurrentIdentity(null)
  setCurrentContextMap(frame.contextMap)
  return render(frame.type, frame.instance, queue)
}
