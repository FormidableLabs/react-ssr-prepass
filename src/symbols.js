// @flow

import type { Node } from 'react'
import * as ReactIs from 'react-is'

export type ReactSymbol =
  | 0xeac7 /* Symbol(react.element) */
  | 0xeaca /* Symbol(react.portal) */
  | 0xeacb /* Symbol(react.fragment) */
  | 0xeacc /* Symbol(react.strict_mode) */
  | 0xead2 /* Symbol(react.profiler) */
  | 0xeacd /* Symbol(react.provider) */
  | 0xeace /* Symbol(react.context) */
  | 0xeacf /* Symbol(react.async_mode) DEPRECATED */
  | 0xeacf /* Symbol(react.concurrent_mode) */
  | 0xead0 /* Symbol(react.forward_ref) */
  | 0xead1 /* Symbol(react.suspense) */
  | 0xead3 /* Symbol(react.memo) */
  | 0xead4 /* Symbol(react.lazy) */

export const REACT_ELEMENT_TYPE: 0xeac7 = ReactIs.REACT_ELEMENT_TYPE
export const REACT_PORTAL_TYPE: 0xeaca = ReactIs.REACT_PORTAL_TYPE
export const REACT_FRAGMENT_TYPE: 0xeacb = ReactIs.REACT_FRAGMENT_TYPE
export const REACT_STRICT_MODE_TYPE: 0xeacc = ReactIs.REACT_STRICT_MODE_TYPE
export const REACT_PROFILER_TYPE: 0xead2 = ReactIs.REACT_PROFILER_TYPE
export const REACT_PROVIDER_TYPE: 0xeacd = ReactIs.REACT_PROVIDER_TYPE
export const REACT_CONTEXT_TYPE: 0xeace = ReactIs.REACT_CONTEXT_TYPE
export const REACT_ASYNC_MODE_TYPE: 0xeacf = ReactIs.REACT_ASYNC_MODE_TYPE
export const REACT_CONCURRENT_MODE_TYPE: 0xeacf =
  ReactIs.REACT_CONCURRENT_MODE_TYPE
export const REACT_FORWARD_REF_TYPE: 0xead0 = ReactIs.REACT_FORWARD_REF_TYPE
export const REACT_SUSPENSE_TYPE: 0xead1 = ReactIs.REACT_SUSPENSE_TYPE
export const REACT_MEMO_TYPE: 0xead3 = ReactIs.REACT_MEMO_TYPE
export const REACT_LAZY_TYPE: 0xead4 = ReactIs.REACT_LAZY_TYPE
