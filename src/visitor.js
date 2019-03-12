// @flow

import { type Node } from 'react'

import {
  typeOf,
  shouldConstruct,
  type AbstractElement,
  type ConsumerElement,
  type ProviderElement,
  type VirtualElement,
  type UserElement
} from './element'

import {
  maskContext,
  setCurrentContextMap,
  readContextMap,
  forkContextMap,
  type ContextMap
} from './state'

import { renderClassComponent, renderFunctionComponent } from './render'

import { getChildrenArray } from './children'

import {
  REACT_ELEMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_ASYNC_MODE_TYPE,
  REACT_CONCURRENT_MODE_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE
} from './symbols'

const computeProps = (props: mixed, defaultProps: void | Object) => {
  if (typeof defaultProps === 'object') {
    return Object.assign({}, defaultProps, props)
  }

  return props
}

const visitComponent = (
  Component: $PropertyType<UserElement, 'type'>,
  props: mixed
): Node => {
  const context = maskContext(Component)
  if (!shouldConstruct(Component)) {
    return renderFunctionComponent(Component, props, context)
  } else {
    return renderClassComponent(Component, props, context)
  }
}

export const visitElement = (element: AbstractElement) => {
  switch (typeOf(element)) {
    case REACT_PORTAL_TYPE: {
      // These element types are unsupported and will not be traversed
      return
    }

    case REACT_STRICT_MODE_TYPE:
    case REACT_CONCURRENT_MODE_TYPE:
    case REACT_ASYNC_MODE_TYPE:
    case REACT_PROFILER_TYPE:
    case REACT_FRAGMENT_TYPE: {
      // These element types are simply traversed over but otherwise ignored
      return getChildrenArray((element.props: any).children)
    }

    case REACT_SUSPENSE_TYPE: {
      // TODO: Store fallback and watch for thrown promise
      return getChildrenArray((element.props: any).children)
    }

    case REACT_LAZY_TYPE: {
      // TODO: Execute promise and await it
      return
    }

    case REACT_PROVIDER_TYPE: {
      // $FlowFixMe
      const providerElement = (element: ProviderElement)
      const newContextMap = forkContextMap()
      const value = (providerElement.props: any).value
      newContextMap.set(providerElement.type._context, value)
      return getChildrenArray(providerElement)
    }

    case REACT_CONTEXT_TYPE: {
      // $FlowFixMe
      const consumerElement = (element: ConsumerElement)
      const children = (consumerElement.props: any).children

      if (typeof children === 'function') {
        const value = readContextMap(consumerElement.type._context)
        return getChildrenArray(children(value))
      } else {
        return []
      }
    }

    case REACT_FORWARD_REF_TYPE:
    case REACT_MEMO_TYPE: {
      // React.forwardRef and React.memo are not treated differently during a prepass,
      // but they will still need to be unwrapped and are hence a special case
      // $FlowFixMe
      const virtualElement = (element: VirtualElement)
      const Component = virtualElement.type.type
      const props = computeProps(virtualElement.props, Component.defaultProps)
      return getChildrenArray(visitComponent(Component, props))
    }

    case REACT_ELEMENT_TYPE: {
      // $FlowFixMe
      const userElement = (element: UserElement)
      const Component = userElement.type
      const props = computeProps(userElement.props, Component.defaultProps)
      return getChildrenArray(visitComponent(Component, props))
    }
  }
}
