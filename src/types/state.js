// @flow

import type { AbstractContext } from './element'

export type ContextStore = Map<AbstractContext, mixed>
export type ContextMap = { [name: string]: mixed }

export type Dispatch<A> = A => void

export type BasicStateAction<S> = (S => S) | S

export type Update<A> = {
  action: A,
  next: Update<A> | null
}

export type UpdateQueue<A> = {
  last: Update<A> | null,
  dispatch: any
}

export type Hook = {
  memoizedState: any,
  queue: UpdateQueue<any> | null,
  next: Hook | null
}
