// @flow

import type { Node, Context, ComponentType } from 'react'

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
} from '../symbols'

export type AbstractContext = Context<mixed> & {
  $$typeof: typeof REACT_CONTEXT_TYPE,
  _currentValue: mixed,
  _threadCount: number
}

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
