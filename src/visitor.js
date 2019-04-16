// @flow

import type { Node, ComponentType } from 'react'
import { typeOf, shouldConstruct, getChildrenArray } from './element'

import {
  mountFunctionComponent,
  mountClassComponent,
  mountLazyComponent
} from './render'

import type {
  Options,
  YieldFrame,
  Frame,
  ContextMap,
  ContextEntry,
  DefaultProps,
  ComponentStatics,
  LazyElement,
  AbstractElement,
  ConsumerElement,
  ProviderElement,
  FragmentElement,
  SuspenseElement,
  ForwardRefElement,
  MemoElement,
  UserElement,
  DOMElement
} from './types'

import {
  getCurrentContextMap,
  getCurrentContextStore,
  setCurrentContextMap,
  setCurrentContextStore,
  flushPrevContextMap,
  flushPrevContextStore,
  restoreContextMap,
  restoreContextStore,
  readContextValue,
  setContextValue,
  setCurrentIdentity
} from './internals'

import {
  REACT_ELEMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_CONCURRENT_MODE_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE
} from './symbols'

const makeImmediatePromise = () => {
  return new Promise(resolve => {
    setImmediate(resolve)
  })
}

const render = (
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps,
  queue: Frame[],
  opts: Options,
  element?: UserElement
) => {
  return shouldConstruct(type)
    ? mountClassComponent(type, props, queue, opts, element)
    : mountFunctionComponent(type, props, queue, opts, element)
}

export const visitElement = (
  element: AbstractElement,
  queue: Frame[],
  opts: Options
): AbstractElement[] => {
  switch (typeOf(element)) {
    case REACT_SUSPENSE_TYPE:
    case REACT_STRICT_MODE_TYPE:
    case REACT_CONCURRENT_MODE_TYPE:
    case REACT_PROFILER_TYPE:
    case REACT_FRAGMENT_TYPE: {
      // These element types are simply traversed over but otherwise ignored
      const fragmentElement = ((element: any):
        | FragmentElement
        | SuspenseElement)
      return getChildrenArray(fragmentElement.props.children)
    }

    case REACT_PROVIDER_TYPE: {
      const providerElement = ((element: any): ProviderElement)
      // Add provider's value prop to context
      const { value, children } = providerElement.props
      setContextValue(providerElement.type._context, value)

      return getChildrenArray(children)
    }

    case REACT_CONTEXT_TYPE: {
      const consumerElement = ((element: any): ConsumerElement)
      const { children } = consumerElement.props

      // Read from context and call children, if it's been passed
      if (typeof children === 'function') {
        const type = (consumerElement.type: any)
        const context = typeof type._context === 'object' ? type._context : type
        const value = readContextValue(context)
        return getChildrenArray(children(value))
      } else {
        return []
      }
    }

    case REACT_LAZY_TYPE: {
      const lazyElement = ((element: any): LazyElement)
      const type = lazyElement.type
      const child = mountLazyComponent(type, lazyElement.props, queue)
      return getChildrenArray(child)
    }

    case REACT_MEMO_TYPE: {
      const memoElement = ((element: any): MemoElement)
      const type = memoElement.type.type
      const child = render(type, memoElement.props, queue, opts)
      return getChildrenArray(child)
    }

    case REACT_FORWARD_REF_TYPE: {
      const refElement = ((element: any): ForwardRefElement)
      // Treat inner type as the component instead of React.forwardRef itself
      const type = refElement.type.render
      const props = refElement.props
      const child = mountFunctionComponent(type, props, queue, opts)
      return getChildrenArray(child)
    }

    case REACT_ELEMENT_TYPE: {
      const el = ((element: any): UserElement | DOMElement)

      if (typeof el.type === 'string' || opts.shouldSkip(el) === true) {
        // String elements can be skipped, so we just return children
        return getChildrenArray(el.props.children)
      } else {
        const userElement = ((element: any): UserElement)
        const { type, props } = userElement
        const child = render(type, props, queue, opts, userElement)
        return getChildrenArray(child)
      }
    }

    case REACT_PORTAL_TYPE:
    // Portals are unsupported during SSR since they're DOM-only
    default:
      return []
  }
}

const visitLoop = (
  traversalChildren: AbstractElement[][],
  traversalIndex: number[],
  traversalMap: Array<void | ContextMap>,
  traversalStore: Array<void | ContextEntry>,
  queue: Frame[],
  opts: Options
) => {
  const start = Date.now()

  while (traversalChildren.length > 0 && Date.now() - start <= 10) {
    const currChildren = traversalChildren[traversalChildren.length - 1]
    const currIndex = traversalIndex[traversalIndex.length - 1]++

    if (currIndex < currChildren.length) {
      const element = currChildren[currIndex]
      const children = visitElement(element, queue, opts)

      traversalChildren.push(children)
      traversalIndex.push(0)
      traversalMap.push(flushPrevContextMap())
      traversalStore.push(flushPrevContextStore())
    } else {
      traversalChildren.pop()
      traversalIndex.pop()
      restoreContextMap(traversalMap.pop())
      restoreContextStore(traversalStore.pop())
    }
  }
}

export const visitChildren = (
  init: AbstractElement[],
  queue: Frame[],
  opts: Options
) => {
  const traversalChildren: AbstractElement[][] = [init]
  const traversalIndex: number[] = [0]
  const traversalMap: Array<void | ContextMap> = [undefined]
  const traversalStore: Array<void | ContextEntry> = [undefined]

  visitLoop(
    traversalChildren,
    traversalIndex,
    traversalMap,
    traversalStore,
    queue,
    opts
  )

  if (traversalChildren.length > 0) {
    queue.push({
      contextMap: getCurrentContextMap(),
      contextStore: getCurrentContextStore(),
      kind: 'frame.yield',
      thenable: makeImmediatePromise(),
      children: traversalChildren,
      index: traversalIndex,
      map: traversalMap,
      store: traversalStore
    })
  }
}

export const resumeVisitChildren = (
  frame: YieldFrame,
  queue: Frame[],
  opts: Options
) => {
  setCurrentIdentity(null)
  setCurrentContextMap(frame.contextMap)
  setCurrentContextMap(frame.contextStore)

  visitLoop(frame.children, frame.index, frame.map, frame.store, queue, opts)
}
