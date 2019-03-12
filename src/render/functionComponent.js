// @flow

import type { Node } from 'react'
import { makeIdentity, setCurrentIdentity } from '../state'
import { renderWithHooks } from '../dispatcher'

export const renderFunctionComponent = (
  Component: any,
  props: any,
  context: any
): Node => {
  const id = makeIdentity()
  setCurrentIdentity(id)
  const child = renderWithHooks(Component, props, context)
  setCurrentIdentity(null)
  return (child: Node)
}
