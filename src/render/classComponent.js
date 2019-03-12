// @flow

import type { Node } from 'react'
import { forkContextMap } from '../state'

const canCallUnmount: WeakMap<any, boolean> = new WeakMap()
const forceUnmount = (Component: any, instance: any) => {
  if (canCallUnmount.get(Component) !== false) {
    try {
      instance.componentWillUnmount()
      canCallUnmount.set(Component, true)
    } catch (_err) {
      // Don't attempt to call unmount again
      canCallUnmount.set(Component, false)
    }
  }
}

export const renderClassComponent = (
  Component: any,
  props: any,
  context: any
): Node => {
  let queue = []
  let replace = false
  let updater = {
    isMounted: () => false,
    enqueueForceUpdate: () => null,
    enqueueReplaceState: (_instance, completeState) => {
      replace = true
      queue = [completeState]
    },
    enqueueSetState: (_instance, currentPartialState) => {
      if (queue === null) return null
      queue.push(currentPartialState)
    }
  }

  const instance = new Component(props, context, updater)

  let hasDerivedStateFromProps = false
  let hasRunComponentWillMount = false

  if (typeof Component.getDerivedStateFromProps === 'function') {
    hasDerivedStateFromProps = true
    const partialState = Component.getDerivedStateFromProps(
      props,
      instance.state
    )
    if (partialState !== null && partialState !== undefined) {
      instance.state = Object.assign({}, instance.state, partialState)
    }
  }

  instance.props = props
  instance.context = context
  instance.updater = updater
  instance.state = instance.state !== undefined ? instance.state : null

  if (
    !hasDerivedStateFromProps &&
    typeof instance.componentWillMount === 'function'
  ) {
    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
    instance.componentWillMount()
    hasRunComponentWillMount = true
  }

  if (
    !hasDerivedStateFromProps &&
    typeof instance.UNSAFE_componentWillMount === 'function'
  ) {
    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
    instance.UNSAFE_componentWillMount()
    hasRunComponentWillMount = true
  }

  // See: https://github.com/facebook/react/blob/13645d2/packages/react-dom/src/server/ReactPartialRenderer.js#L581-L611
  // This update logic is taken from ReactPartialRenderer for a close match with react-dom itself
  if (queue.length > 0) {
    let oldQueue = queue
    let oldReplace = replace
    queue = null
    replace = false

    if (oldReplace && oldQueue.length === 1) {
      instance.state = oldQueue[0]
    } else {
      let nextState = oldReplace ? oldQueue[0] : instance.state
      let dontMutate = true
      for (let i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
        let partial = oldQueue[i]
        let partialState =
          typeof partial === 'function'
            ? partial.call(instance, nextState, props, context)
            : partial
        if (partialState != null) {
          if (dontMutate) {
            dontMutate = false
            nextState = Object.assign({}, nextState, partialState)
          } else {
            Object.assign(nextState, partialState)
          }
        }
      }

      instance.state = nextState
    }
  } else {
    queue = null
  }

  const child = instance.render()

  if (
    typeof instance.componentWillUnmount === 'function' &&
    hasRunComponentWillMount
  ) {
    // Some legacy components will allocate data in componentWillMount which
    // can cause memory leaks if componentWillUnmount is not called.
    // To prevent the leaks componentWillUnmount is defensively called but
    // wrapped in a try/catch to prevent errors when browser APIs are used
    forceUnmount(Component, instance)
  }

  if (
    Component.childContextTypes !== undefined &&
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

  return child
}
