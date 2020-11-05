// @flow

import type { ClassFrame } from '../types'

/** The current error boundary frame determines where to continue rendering when an error is raised */
let currentErrorFrame: null | ClassFrame = null

export const getCurrentErrorFrame = (): ClassFrame | null => currentErrorFrame

export const setCurrentErrorFrame = (frame?: ClassFrame | null) => {
  currentErrorFrame = frame || null
}
