// @flow

import type { Context, Ref } from 'react'

export type AbstractContext = Context<mixed> & {
  _currentValue: mixed,
  _threadCount: number
}

export type Dispatch<A> = A => void
export type BasicStateAction<S> = (S => S) | S
