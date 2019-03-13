// @flow

import { Children, type Node, type Element, type ComponentType } from 'react'
import type { AbstractContext, AbstractElement } from './types'
import * as ReactIs from 'react-is'

import {
  type ReactSymbol,
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

/** Is a given Component a class component */
export const shouldConstruct = (Comp: ComponentType<*>): boolean %checks =>
  (Comp: any).prototype && (Comp: any).prototype.isReactComponent

/** Determine the type of element using react-is with applied fixes */
export const typeOf = (x: AbstractElement): ReactSymbol | void => {
  switch (x.$$typeof) {
    case REACT_LAZY_TYPE:
      return REACT_LAZY_TYPE
    case REACT_PORTAL_TYPE:
      return REACT_PORTAL_TYPE

    case REACT_ELEMENT_TYPE:
      switch (x.type) {
        case REACT_CONCURRENT_MODE_TYPE:
          return REACT_CONCURRENT_MODE_TYPE
        case REACT_FRAGMENT_TYPE:
          return REACT_FRAGMENT_TYPE
        case REACT_PROFILER_TYPE:
          return REACT_PROFILER_TYPE
        case REACT_STRICT_MODE_TYPE:
          return REACT_STRICT_MODE_TYPE
        case REACT_SUSPENSE_TYPE:
          return REACT_SUSPENSE_TYPE

        default: {
          switch (x.type && ((x.type: any).$$typeof: ReactSymbol)) {
            case REACT_MEMO_TYPE:
              return REACT_MEMO_TYPE
            case REACT_CONTEXT_TYPE:
              return REACT_CONTEXT_TYPE
            case REACT_PROVIDER_TYPE:
              return REACT_PROVIDER_TYPE
            case REACT_FORWARD_REF_TYPE:
              return REACT_FORWARD_REF_TYPE
            default:
              return REACT_ELEMENT_TYPE
          }
        }
      }

    default:
      return undefined
  }
}

type ScalarNode = null | boolean | string | number

/** Rebound Children.toArray with modified AbstractElement types */
const toArray: (node?: Node) => Array<ScalarNode | AbstractElement> =
  Children.toArray

/** Checks whether the `node` is an AbstractElement */
const isAbstractElement = (
  node: ScalarNode | AbstractElement
): boolean %checks =>
  node !== null && typeof node === 'object' && typeof node.type !== 'string'

/** Returns a flat AbstractElement array for a given AbstractElement node */
export const getChildrenArray = (node?: Node): AbstractElement[] => {
  // $FlowFixMe
  return toArray(node).filter(isAbstractElement)
}

/** Returns merged props given a props and defaultProps object */
export const computeProps = (props: Object, defaultProps: void | Object) => {
  return typeof defaultProps === 'object'
    ? Object.assign({}, defaultProps, props)
    : props
}
