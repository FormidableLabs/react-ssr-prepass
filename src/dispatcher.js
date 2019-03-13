// @flow
// Source: https://github.com/facebook/react/blob/c21c41e/packages/react-dom/src/server/ReactPartialRendererHooks.js

import type { AbstractContext, BasicStateAction, Dispatch } from './types'

import invariant from 'invariant'
import warning from 'warning'
import is from 'object-is'

import { getCurrentIdentity, readContextMap, type Identity } from './state'

type Update<A> = {
  action: A,
  next: Update<A> | null
}

type UpdateQueue<A> = {
  last: Update<A> | null,
  dispatch: any
}

export type Hook = {
  memoizedState: any,
  queue: UpdateQueue<any> | null,
  next: Hook | null
}

let firstWorkInProgressHook: Hook | null = null
let workInProgressHook: Hook | null = null
// Whether the work-in-progress hook is a re-rendered hook
let isReRender: boolean = false
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
  if (prevDeps === null) {
    return false
  }

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (!is(nextDeps[i], prevDeps[i])) {
      return false
    }
  }

  return true
}

function createHook(): Hook {
  invariant(
    numberOfReRenders > 0,
    'Rendered more hooks than during the previous render'
  )

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
      isReRender = false
      firstWorkInProgressHook = workInProgressHook = createHook()
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true
      workInProgressHook = firstWorkInProgressHook
    }
  } else {
    if (workInProgressHook.next === null) {
      isReRender = false
      // Append to the end of the list
      workInProgressHook = workInProgressHook.next = createHook()
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true
      workInProgressHook = workInProgressHook.next
    }
  }
  return workInProgressHook
}

export function renderWithHooks(
  Component: any,
  props: any,
  refOrContext: any
): any {
  let children = Component(props, refOrContext)

  while (didScheduleRenderPhaseUpdate) {
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
  return readContextMap(context)
}

function useContext(context: AbstractContext, _: void | number | boolean) {
  getCurrentIdentity()
  return readContextMap(context)
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

  if (isReRender) {
    // This is a re-render. Apply the new render phase updates to the previous
    // current hook.
    const queue: UpdateQueue<A> = (workInProgressHook.queue: any)
    const dispatch: Dispatch<A> = (queue.dispatch: any)
    if (renderPhaseUpdates !== null) {
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

        return [newState, dispatch]
      }
    }
    return [workInProgressHook.memoizedState, dispatch]
  } else {
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
    const queue: UpdateQueue<A> = (workInProgressHook.queue = {
      last: null,
      dispatch: null
    })
    const dispatch: Dispatch<A> = (queue.dispatch = (dispatchAction.bind(
      null,
      id,
      queue
    ): any))
    return [workInProgressHook.memoizedState, dispatch]
  }
}

function useMemo<T>(nextCreate: () => T, deps: Array<mixed> | void | null): T {
  getCurrentIdentity()
  workInProgressHook = createWorkInProgressHook()

  const nextDeps = deps === undefined ? null : deps

  if (workInProgressHook !== null) {
    const prevState = workInProgressHook.memoizedState
    if (prevState !== null) {
      if (nextDeps !== null) {
        const prevDeps = prevState[1]
        if (areHookInputsEqual(nextDeps, prevDeps)) {
          return prevState[0]
        }
      }
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
    if (__DEV__) {
      Object.seal(ref)
    }
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
  invariant(
    numberOfReRenders < RE_RENDER_LIMIT,
    'Too many re-renders. React limits the number of renders to prevent ' +
      'an infinite loop.'
  )

  if (componentIdentity === getCurrentIdentity()) {
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
  // Callbacks are passed as they are in the server environment.
  return callback
}

function noop(): void {}

export const Dispatcher = {
  readContext,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
  useCallback,
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
