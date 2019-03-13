// @flow

import type { Node } from 'react'
import * as is from 'react-is'

/** Literal types representing the ReactSymbol values. These values do not actually match the values from react-is! */
export type ReactSymbol =
  | 'react.element' /* 0xeac7 | Symbol(react.element) */
  | 'react.portal' /* 0xeaca | Symbol(react.portal) */
  | 'react.fragment' /* 0xeacb | Symbol(react.fragment) */
  | 'react.strict_mode' /* 0xeacc | Symbol(react.strict_mode) */
  | 'react.profiler' /* 0xead2 | Symbol(react.profiler) */
  | 'react.provider' /* 0xeacd | Symbol(react.provider) */
  | 'react.context' /* 0xeace | Symbol(react.context) */
  | 'react.concurrent_mode' /* 0xeacf | Symbol(react.concurrent_mode) */
  | 'react.forward_ref' /* 0xead0 | Symbol(react.forward_ref) */
  | 'react.suspense' /* 0xead1 | Symbol(react.suspense) */
  | 'react.memo' /* 0xead3 | Symbol(react.memo) */
  | 'react.lazy' /* 0xead4 | Symbol(react.lazy) */

export const REACT_ELEMENT_TYPE: 'react.element' = is.Element
export const REACT_PORTAL_TYPE: 'react.portal' = is.Portal
export const REACT_FRAGMENT_TYPE: 'react.fragment' = is.Fragment
export const REACT_STRICT_MODE_TYPE: 'react.strict_mode' = is.StrictMode
export const REACT_PROFILER_TYPE: 'react.profiler' = is.Profiler
export const REACT_PROVIDER_TYPE: 'react.provider' = is.ContextProvider
export const REACT_CONTEXT_TYPE: 'react.context' = is.ContextConsumer
export const REACT_CONCURRENT_MODE_TYPE: 'react.concurrent_mode' =
  is.ConcurrentMode
export const REACT_FORWARD_REF_TYPE: 'react.forward_ref' = is.ForwardRef
export const REACT_SUSPENSE_TYPE: 'react.suspense' = is.Suspense
export const REACT_MEMO_TYPE: 'react.memo' = is.Memo
export const REACT_LAZY_TYPE: 'react.lazy' = is.Lazy
