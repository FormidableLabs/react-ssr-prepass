// @flow

import { type Node, type ComponentType, createElement } from 'react'

import {
  typeOf,
  shouldConstruct,
  getChildrenArray,
  computeProps
} from './element'

import {
  mountFunctionComponent,
  mountClassComponent,
  mountLazyComponent,
  mountStyledComponent,
  isStyledElement
} from './render'

import type {
  Visitor,
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

// Time in ms after which the otherwise synchronous visitor yields so that
// the event loop is not interrupted for too long
const YIELD_AFTER_MS = process.env.NODE_ENV !== 'production' ? 20 : 5

const render = (
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps,
  queue: Frame[],
  visitor: Visitor,
  element: UserElement
) => {
  return shouldConstruct(type)
    ? mountClassComponent(type, props, queue, visitor, element)
    : mountFunctionComponent(type, props, queue, visitor, element)
}

export const visitElement = (
  element: AbstractElement,
  queue: Frame[],
  visitor: Visitor
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
      const fauxElement = (createElement((type: any), memoElement.props): any)
      const child = render(type, memoElement.props, queue, visitor, fauxElement)
      return getChildrenArray(child)
    }

    case REACT_FORWARD_REF_TYPE: {
      const refElement = ((element: any): ForwardRefElement)

      // If we find a StyledComponent, we trigger a specific optimisation
      // that allows quick rendering of them without computing styles
      if (isStyledElement(refElement)) {
        return mountStyledComponent(refElement)
      }

      const { render: type, defaultProps } = refElement.type
      const props = computeProps(refElement.props, defaultProps)
      const fauxElement = (createElement((render: any), props): any)
      const child = render(type, props, queue, visitor, fauxElement)
      return getChildrenArray(child)
    }

    case REACT_ELEMENT_TYPE: {
      const el = ((element: any): UserElement | DOMElement)
      if (typeof el.type === 'string') {
        // String elements can be skipped, so we just return children
        return getChildrenArray(el.props.children)
      } else {
        const userElement = ((element: any): UserElement)
        const { type, props } = userElement
        const child = render(type, props, queue, visitor, userElement)
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
  traversalMap: Array<void | ContextMap>,
  traversalStore: Array<void | ContextEntry>,
  queue: Frame[],
  visitor: Visitor
): boolean => {
  const start = Date.now()

  while (traversalChildren.length > 0) {
    const element = traversalChildren[traversalChildren.length - 1].shift()
    if (element !== undefined) {
      const children = visitElement(element, queue, visitor)
      traversalChildren.push(children)
      traversalMap.push(flushPrevContextMap())
      traversalStore.push(flushPrevContextStore())
    } else {
      traversalChildren.pop()
      restoreContextMap(traversalMap.pop())
      restoreContextStore(traversalStore.pop())
    }

    if (Date.now() - start > YIELD_AFTER_MS) {
      return true
    }
  }

  return false
}

const makeYieldFrame = (
  traversalChildren: AbstractElement[][],
  traversalMap: Array<void | ContextMap>,
  traversalStore: Array<void | ContextEntry>
): Frame => ({
  contextMap: getCurrentContextMap(),
  contextStore: getCurrentContextStore(),
  thenable: Promise.resolve(),
  kind: 'frame.yield',
  children: traversalChildren,
  map: traversalMap,
  store: traversalStore
})

export const visitChildren = (
  init: AbstractElement[],
  queue: Frame[],
  visitor: Visitor
) => {
  const traversalChildren: AbstractElement[][] = [init]
  const traversalMap: Array<void | ContextMap> = [flushPrevContextMap()]
  const traversalStore: Array<void | ContextEntry> = [flushPrevContextStore()]

  const hasYielded = visitLoop(
    traversalChildren,
    traversalMap,
    traversalStore,
    queue,
    visitor
  )

  if (hasYielded) {
    queue.unshift(
      makeYieldFrame(traversalChildren, traversalMap, traversalStore)
    )
  }
}

export const resumeVisitChildren = (
  frame: YieldFrame,
  queue: Frame[],
  visitor: Visitor
) => {
  setCurrentIdentity(null)
  setCurrentContextMap(frame.contextMap)
  setCurrentContextStore(frame.contextStore)

  const hasYielded = visitLoop(
    frame.children,
    frame.map,
    frame.store,
    queue,
    visitor
  )

  if (hasYielded) {
    queue.unshift(makeYieldFrame(frame.children, frame.map, frame.store))
  }
}
