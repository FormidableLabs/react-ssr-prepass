// @flow

import type { DOMElement, UserElement } from './element'

/** When encountering a class component this function can trigger an suspense */
export type Visitor = (
  element: DOMElement | UserElement,
  instance?: any
) => void | Promise<any>

export type VisitOptions = {
  visitAllComponentTypes?: boolean
}
