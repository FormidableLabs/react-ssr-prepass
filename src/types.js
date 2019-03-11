// @flow

import type { Context, Ref } from 'react'

export type AbstractContext = Context<mixed> & {
  _currentValue: mixed,
  _threadCount: number
}

export type Dispatch<A> = A => void
export type BasicStateAction<S> = (S => S) | S

export type Dispatcher = {
  readContext(
    context: AbstractContext,
    observedBits: void | number | boolean
  ): mixed,

  useState<S>(initialState: (() => S) | S): [S, Dispatch<BasicStateAction<S>>],

  useReducer<S, I, A>(
    reducer: (S, A) => S,
    initialArg: I,
    init?: (I) => S
  ): [S, Dispatch<A>],

  useContext(
    context: AbstractContext,
    observedBits: void | number | boolean
  ): mixed,

  useRef<T>(initialValue: T): { current: T },

  useEffect(
    create: () => (() => void) | void,
    deps: Array<mixed> | void | null
  ): void,

  useLayoutEffect(
    create: () => (() => void) | void,
    deps: Array<mixed> | void | null
  ): void,

  useCallback<T>(callback: T, deps: Array<mixed> | void | null): T,

  useMemo<T>(nextCreate: () => T, deps: Array<mixed> | void | null): T,

  useImperativeHandle<T>(
    ref: Ref<T> | ((inst: T | null) => mixed) | null | void,
    create: () => T,
    deps: Array<mixed> | void | null
  ): void,

  useDebugValue<T>(value: T, formatterFn: ?(value: T) => mixed): void
}
