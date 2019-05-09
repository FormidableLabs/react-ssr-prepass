// @flow

import React from 'react'
import { Dispatcher } from './dispatcher'

type ReactCurrentDispatcher = {
  current: null | typeof Dispatcher
}

type SecretInternals = {
  ReactCurrentDispatcher: ReactCurrentDispatcher
}

const internals: void | SecretInternals = (React: any)
  .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

let prevDispatcher: null | typeof Dispatcher

export const hasReactInternals: boolean = internals !== undefined

// This is called before visiting children, so that function
// components can execute hooks
export const setupDispatcher = () => {
  if (internals !== undefined) {
    prevDispatcher = internals.ReactCurrentDispatcher.current
    internals.ReactCurrentDispatcher.current = Dispatcher
  }
}

// After visiting children the dispatcher is restored
export const restoreDispatcher = () => {
  if (internals !== undefined) {
    internals.ReactCurrentDispatcher.current = prevDispatcher
  }
}
