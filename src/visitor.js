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
  UserElement,
  DOMElement
} from './types'

import {
  flushPrevContextMap,
  flushPrevContextStore,
  restoreContextMap,
  restoreContextStore,
  readContextValue,
  setContextValue
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
        const value = readContextValue(consumerElement.type._context)
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
      const child = render(type, memoElement.props, queue, visitor)
      return getChildrenArray(child)
    }

    case REACT_FORWARD_REF_TYPE: {
      const refElement = ((element: any): ForwardRefElement)
      // Treat inner type as the component instead of React.forwardRef itself
      const type = refElement.type.render
      const props = refElement.props
      const child = mountFunctionComponent(type, props, queue, visitor)
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

const visitChild = (
  child: AbstractElement,
  queue: Frame[],
  visitor: Visitor
) => {
  const children = visitElement(child, queue, visitor)
  // Flush the context changes
  const prevMap = flushPrevContextMap()
  const prevStore = flushPrevContextStore()

  visitChildren(children, queue, visitor)

  // Restore context changes after children have been walked
  if (prevMap !== undefined) {
    restoreContextMap(prevMap)
  }

  if (prevStore !== undefined) {
    restoreContextStore(prevStore)
  }
}

export const visitChildren = (
  children: AbstractElement[],
  queue: Frame[],
  visitor: Visitor
) => {
  for (let i = 0, l = children.length; i < l; i++) {
    visitChild(children[i], queue, visitor)
  }
}
