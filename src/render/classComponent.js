// @flow

import type { Node, ComponentType } from 'react'
import { computeProps } from '../element'

import type {
  Visitor,
  Frame,
  ClassFrame,
  DefaultProps,
  ComponentStatics,
  UserElement
} from '../types'

import {
  maskContext,
  assignContextMap,
  setCurrentIdentity,
  setCurrentContextMap,
  getCurrentContextMap,
  setCurrentContextStore,
  getCurrentContextStore,
  setCurrentErrorFrame,
  getCurrentErrorFrame
} from '../internals'

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

  if (
    typeof instance.componentDidCatch === 'function' ||
    typeof type.getDerivedStateFromError === 'function'
  ) {
    const frame = makeFrame(type, instance, null)
    frame.errorFrame = frame
    setCurrentErrorFrame(frame)
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

  return instance
}

const makeFrame = (
  type: any,
  instance: any,
  thenable: Promise<any> | null
) => ({
  contextMap: getCurrentContextMap(),
  contextStore: getCurrentContextStore(),
  errorFrame: getCurrentErrorFrame(),
  thenable,
  kind: 'frame.class',
  error: null,
  instance,
  type
})

const render = (type: any, instance: any, queue: Frame[]) => {
  // Flush all queued up state changes
  flushEnqueuedState(instance)
  let child: Node = null

  try {
    child = instance.render()
  } catch (error) {
    if (typeof error.then !== 'function') {
      throw error
    }

    queue.push(makeFrame(type, instance, error))
    return null
  }

  if (
    type.childContextTypes !== undefined &&
    typeof instance.getChildContext === 'function'
  ) {
    const childContext = instance.getChildContext()
    if (childContext !== null && typeof childContext === 'object') {
      assignContextMap(childContext)
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

  instance._isMounted = false
  return child
}

/** Mount a class component */
export const mount = (
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps,
  queue: Frame[],
  visitor: Visitor,
  element: UserElement
) => {
  setCurrentIdentity(null)

  const instance = createInstance(type, props)
  const promise = visitor(element, instance)
  if (promise) {
    queue.push(makeFrame(type, instance, promise))
    return null
  }

  return render(type, instance, queue)
}

/** Update a previously suspended class component */
export const update = (queue: Frame[], frame: ClassFrame) => {
  setCurrentIdentity(null)
  setCurrentContextMap(frame.contextMap)
  setCurrentContextStore(frame.contextStore)
  setCurrentErrorFrame(frame.errorFrame)

  if (frame.error) {
    if (typeof frame.instance.componentDidCatch === 'function')
      frame.instance.componentDidCatch(frame.error)
    if (typeof frame.type.getDerivedStateFromError === 'function')
      frame.instance.updater.enqueueSetState(
        frame.type.getDerivedStateFromError(frame.error)
      )
  }

  return render(frame.type, frame.instance, queue)
}
