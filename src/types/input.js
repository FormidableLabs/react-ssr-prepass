// @flow

import type { UserElement, DOMElement } from './element'

/** When encountering a class component this function can trigger an suspense */
export type Visitor = (
  element: UserElement,
  instance?: any
) => void | Promise<any>

/** When encountering an element it can be skipped when the predicate returns true */
export type SkipPredicate = (element: UserElement | DOMElement) => boolean

export type PrepassParams = {
  visitor?: Visitor,
  shouldSkip?: SkipPredicate
}

export type Options = {
  visitor: Visitor,
  shouldSkip: SkipPredicate
}
