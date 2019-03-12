// @flow

import type { Context } from 'react'
import { REACT_CONTEXT_TYPE } from './symbols'

export type AbstractContext = Context<mixed> & {
  $$typeof: typeof REACT_CONTEXT_TYPE,
  _currentValue: mixed,
  _threadCount: number
}

export type Dispatch<A> = A => void
export type BasicStateAction<S> = (S => S) | S
