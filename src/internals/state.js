// @flow

import type { RendererState } from '../types'

/** The current global renderer state per render cycle */
export const rendererStateRef: {| current: RendererState |} = {
  current: { uniqueID: 0 }
}
export const initRendererState = (): RendererState =>
  (rendererStateRef.current = { uniqueID: 0 })
export const setCurrentRendererState = (state: RendererState) =>
  (rendererStateRef.current = state)
