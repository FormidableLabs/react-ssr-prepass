// @flow

import type { Node, Element, ComponentType } from 'react'
import type { AbstractContext } from './types'
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

export type DefaultProps = {
  children?: Node
}

export type ComponentStatics = {
  getDerivedStateFromProps?: (props: Object, state: mixed) => mixed,
  contextType?: AbstractContext,
  contextTypes?: Object,
  childContextTypes?: Object,
  defaultProps?: Object
}

/** <Context.Consumer> */
export type ConsumerElement = {
  type: AbstractContext,
  props: { children?: (value: mixed) => Node },
  $$typeof: typeof REACT_ELEMENT_TYPE
}

/** <Context.Provider> */
export type ProviderElement = {
  type: {
    $$typeof: typeof REACT_PROVIDER_TYPE,
    _context: AbstractContext
  },
  props: DefaultProps & { value: mixed },
  $$typeof: typeof REACT_ELEMENT_TYPE
}

/** <Suspense> */
export type SuspenseElement = {
  type: typeof REACT_SUSPENSE_TYPE,
  props: DefaultProps & { fallback?: Node },
  $$typeof: typeof REACT_ELEMENT_TYPE
}

/** <ConcurrentMode>, <Fragment>, <Profiler>, <StrictMode> */
export type FragmentElement = {
  type:
    | typeof REACT_CONCURRENT_MODE_TYPE
    | typeof REACT_FRAGMENT_TYPE
    | typeof REACT_PROFILER_TYPE
    | typeof REACT_STRICT_MODE_TYPE,
  props: DefaultProps,
  $$typeof: typeof REACT_ELEMENT_TYPE
}

/** <React.lazy(Comp)> */
export type LazyElement = {
  $$typeof: typeof REACT_LAZY_TYPE,
  props: DefaultProps,
  type: {
    _ctor: () => Promise<{ default: mixed }>,
    _status: 0 | 1 | 2,
    _result: any
  }
}

/** <React.memo(Comp)>,  */
export type MemoElement = {
  type: {
    type: ComponentType<DefaultProps> & ComponentStatics,
    $$typeof: typeof REACT_MEMO_TYPE
  },
  props: DefaultProps,
  $$typeof: typeof REACT_ELEMENT_TYPE
}

/** <React.forwardRef(Comp)> */
export type ForwardRefElement = {
  type: {
    render: ComponentType<DefaultProps> & ComponentStatics,
    $$typeof: typeof REACT_FORWARD_REF_TYPE
  },
  props: DefaultProps,
  $$typeof: typeof REACT_ELEMENT_TYPE
}

/** Portal */
export type PortalElement = {
  $$typeof: typeof REACT_PORTAL_TYPE,
  containerInfo: any,
  children: Node
}

/** Normal Elements: <YourComponent>, <div>, ... */
export type UserElement = {
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps,
  $$typeof: typeof REACT_ELEMENT_TYPE
}

/** This is like React.Element<any> but with specific symbol fields */
export type AbstractElement =
  | ConsumerElement
  | ProviderElement
  | FragmentElement
  | LazyElement
  | ForwardRefElement
  | MemoElement
  | UserElement
  | PortalElement
  | SuspenseElement

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
