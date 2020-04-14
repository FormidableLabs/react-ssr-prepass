// @flow
// Source: https://github.com/facebook/react/blob/c21c41e/packages/react-dom/src/server/ReactPartialRendererHooks.js

import is from 'object-is'
import { readContextValue } from './context'

import type {
  AbstractContext,
  BasicStateAction,
  Dispatch,
  Update,
  UpdateQueue,
  Hook
} from '../types'

export opaque type Identity = {}

let currentIdentity: Identity | null = null

export const makeIdentity = (): Identity => ({})

export const setCurrentIdentity = (id: Identity | null) => {
  currentIdentity = id
}

export const getCurrentIdentity = (): Identity => {
  if (currentIdentity === null) {
    throw new Error(
      '[react-ssr-prepass] Hooks can only be called inside the body of a function component. ' +
        '(https://fb.me/react-invalid-hook-call)'
    )
  }

  // NOTE: The warning that is used in ReactPartialRendererHooks is obsolete
  // in a prepass, since it'll be caught by a subsequent renderer anyway
  // https://github.com/facebook/react/blob/c21c41e/packages/react-dom/src/server/ReactPartialRendererHooks.js#L63-L71

  return (currentIdentity: Identity)
}

let firstWorkInProgressHook: Hook | null = null
let workInProgressHook: Hook | null = null
// Whether an update was scheduled during the currently executing render pass.
let didScheduleRenderPhaseUpdate: boolean = false
// Lazily created map of render-phase updates
let renderPhaseUpdates: Map<UpdateQueue<any>, Update<any>> | null = null
// Counter to prevent infinite loops.
let numberOfReRenders: number = 0
const RE_RENDER_LIMIT = 25

export const getFirstHook = (): Hook | null => firstWorkInProgressHook

export const setFirstHook = (hook: Hook | null) => {
  firstWorkInProgressHook = hook
}

function areHookInputsEqual(
  nextDeps: Array<mixed>,
  prevDeps: Array<mixed> | null
) {
  // NOTE: The warnings that are used in ReactPartialRendererHooks are obsolete
  // in a prepass, since these issues will be caught by a subsequent renderer anyway
  if (prevDeps === null) return false

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (!is(nextDeps[i], prevDeps[i])) return false
  }

  return true
}

function createHook(): Hook {
  return {
    memoizedState: null,
    queue: null,
    next: null
  }
}

function createWorkInProgressHook(): Hook {
  if (workInProgressHook === null) {
    // This is the first hook in the list
    if (firstWorkInProgressHook === null) {
      return (firstWorkInProgressHook = workInProgressHook = createHook())
    } else {
      // There's already a work-in-progress. Reuse it.
      return (workInProgressHook = firstWorkInProgressHook)
    }
  } else {
    if (workInProgressHook.next === null) {
      // Append to the end of the list
      return (workInProgressHook = workInProgressHook.next = createHook())
    } else {
      // There's already a work-in-progress. Reuse it.
      return (workInProgressHook = workInProgressHook.next)
    }
  }
}

export function renderWithHooks(
  Component: any,
  props: any,
  refOrContext: any
): any {
  workInProgressHook = null
  let children = Component(props, refOrContext)

  // NOTE: Excessive rerenders won't throw but will instead abort rendering
  // since a subsequent renderer can throw when this issue occurs instead
  while (numberOfReRenders < RE_RENDER_LIMIT && didScheduleRenderPhaseUpdate) {
    // Updates were scheduled during the render phase. They are stored in
    // the `renderPhaseUpdates` map. Call the component again, reusing the
    // work-in-progress hooks and applying the additional updates on top. Keep
    // restarting until no more updates are scheduled.
    didScheduleRenderPhaseUpdate = false
    numberOfReRenders += 1
    // Start over from the beginning of the list
    workInProgressHook = null
    children = Component(props, refOrContext)
  }

  // This will be reset by renderer
  // firstWorkInProgressHook = null

  numberOfReRenders = 0
  renderPhaseUpdates = null
  workInProgressHook = null

  return children
}

function readContext(context: AbstractContext, _: void | number | boolean) {
  // NOTE: The warning that is used in ReactPartialRendererHooks is obsolete
  // in a prepass, since it'll be caught by a subsequent renderer anyway
  // https://github.com/facebook/react/blob/c21c41e/packages/react-dom/src/server/ReactPartialRendererHooks.js#L215-L223
  return readContextValue(context)
}

function useContext(context: AbstractContext, _: void | number | boolean) {
  getCurrentIdentity()
  return readContextValue(context)
}

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  // $FlowFixMe
  return typeof action === 'function' ? action(state) : action
}

function useState<S>(
  initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] {
  return useReducer(
    basicStateReducer,
    // useReducer has a special case to support lazy useState initializers
    (initialState: any)
  )
}

function useReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S
): [S, Dispatch<A>] {
  const id = getCurrentIdentity()
  workInProgressHook = createWorkInProgressHook()

  // In the case of a re-render after a suspense, the initial state
  // may not be set, so instead of initialising if `!isRerender`, we
  // check whether `queue` is set
  if (workInProgressHook.queue === null) {
    let initialState
    if (reducer === basicStateReducer) {
      // Special case for `useState`.
      initialState =
        typeof initialArg === 'function'
          ? ((initialArg: any): () => S)()
          : ((initialArg: any): S)
    } else {
      initialState =
        init !== undefined ? init(initialArg) : ((initialArg: any): S)
    }

    workInProgressHook.memoizedState = initialState
  }

  const queue: UpdateQueue<A> =
    workInProgressHook.queue ||
    (workInProgressHook.queue = { last: null, dispatch: null })
  const dispatch: Dispatch<A> =
    queue.dispatch || (queue.dispatch = dispatchAction.bind(null, id, queue))

  if (renderPhaseUpdates !== null) {
    // This is a re-render. Apply the new render phase updates to the previous
    // current hook.
    // Render phase updates are stored in a map of queue -> linked list
    const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue)
    if (firstRenderPhaseUpdate !== undefined) {
      renderPhaseUpdates.delete(queue)
      let newState = workInProgressHook.memoizedState
      let update = firstRenderPhaseUpdate
      do {
        // Process this render phase update. We don't have to check the
        // priority because it will always be the same as the current
        // render's.
        const action = update.action
        newState = reducer(newState, action)
        update = update.next
      } while (update !== null)

      workInProgressHook.memoizedState = newState
    }
  }

  return [workInProgressHook.memoizedState, dispatch]
}

function useMemo<T>(nextCreate: () => T, deps: Array<mixed> | void | null): T {
  getCurrentIdentity()
  workInProgressHook = createWorkInProgressHook()

  const nextDeps = deps === undefined ? null : deps
  const prevState = workInProgressHook.memoizedState
  if (prevState !== null && nextDeps !== null) {
    const prevDeps = prevState[1]
    if (areHookInputsEqual(nextDeps, prevDeps)) {
      return prevState[0]
    }
  }

  const nextValue = nextCreate()
  workInProgressHook.memoizedState = [nextValue, nextDeps]
  return nextValue
}

function useRef<T>(initialValue: T): { current: T } {
  getCurrentIdentity()
  workInProgressHook = createWorkInProgressHook()
  const previousRef = workInProgressHook.memoizedState
  if (previousRef === null) {
    const ref = { current: initialValue }
    workInProgressHook.memoizedState = ref
    return ref
  } else {
    return previousRef
  }
}

function dispatchAction<A>(
  componentIdentity: Identity,
  queue: UpdateQueue<A>,
  action: A
) {
  if (componentIdentity === currentIdentity) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdate = true
    const update: Update<A> = {
      action,
      next: null
    }
    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map()
    }
    const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue)
    if (firstRenderPhaseUpdate === undefined) {
      renderPhaseUpdates.set(queue, update)
    } else {
      // Append the update to the end of the list.
      let lastRenderPhaseUpdate = firstRenderPhaseUpdate
      while (lastRenderPhaseUpdate.next !== null) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next
      }
      lastRenderPhaseUpdate.next = update
    }
  } else {
    // This means an update has happened after the function component has
    // returned. On the server this is a no-op. In React Fiber, the update
    // would be scheduled for a future render.
  }
}

function useCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  return useMemo(() => callback, deps)
}

function noop(): void {}

function useTransition(): [(callback: () => void) => void, boolean] {
  const startTransition = callback => {
    callback()
  }
  return [startTransition, false]
}

function useDeferredValue<T>(input: T): T {
  return input
}

export const Dispatcher = {
  readContext,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
  useCallback,
  useTransition,
  useDeferredValue,
  // ignore useLayout effect completely as usage of it will be caught
  // in a subsequent render pass
  useLayoutEffect: noop,
  // useImperativeHandle is not run in the server environment
  useImperativeHandle: noop,
  // Effects are not run in the server environment.
  useEffect: noop,
  // Debugging effect
  useDebugValue: noop
}
