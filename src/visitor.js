// @flow

import type { Node, ComponentType } from 'react'
import { typeOf, shouldConstruct, getChildrenArray } from './element'

import {
  mountFunctionComponent,
  mountClassComponent,
  mountLazyComponent
} from './render'

import type {
  Visitor,
  Frame,
  ContextMap,
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
  UserElement
} from './types'

import {
  maskContext,
  getCurrentContextMap,
  setCurrentContextMap,
  readContextMap,
  forkContextMap
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

const render = (
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps,
  queue: Frame[],
  visitor: Visitor,
  element?: UserElement
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
      const newContextMap = forkContextMap()
      const { value, children } = providerElement.props
      newContextMap.set(providerElement.type._context, value)
      return getChildrenArray(children)
    }

    case REACT_CONTEXT_TYPE: {
      const consumerElement = ((element: any): ConsumerElement)
      const { children } = consumerElement.props

      if (typeof children === 'function') {
        const value = readContextMap(consumerElement.type._context)
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

    case REACT_FORWARD_REF_TYPE: {
      const refElement = ((element: any): ForwardRefElement)
      const type = refElement.type.render
      const props = refElement.props
      const child = mountFunctionComponent(type, props, queue, visitor)
      return getChildrenArray(child)
    }

    case REACT_MEMO_TYPE: {
      const memoElement = ((element: any): MemoElement)
      const type = memoElement.type.type

      return getChildrenArray(
        render(type, memoElement.props, queue, visitor)
      )
    }

    case REACT_ELEMENT_TYPE: {
      const userElement = ((element: any): UserElement)
      const type = userElement.type
      return getChildrenArray(
        render(type, userElement.props, queue, visitor, userElement)
      )
    }

    case REACT_PORTAL_TYPE:
    // Portals are unsupported during SSR since they're DOM-only
    default:
      return []
  }
}

export const visitChildren = (
  children: AbstractElement[],
  queue: Frame[],
  visitor: Visitor
) => {
  if (children.length === 1) {
    visitChildren(visitElement(children[0], queue, visitor), queue, visitor)
  } else if (children.length > 1) {
    const contextMap = getCurrentContextMap()
    for (let i = 0, l = children.length; i < l; i++) {
      visitChildren(visitElement(children[i], queue, visitor), queue, visitor)
      setCurrentContextMap(contextMap)
    }
  }
}
