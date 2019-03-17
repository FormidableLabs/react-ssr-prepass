// @flow

import type { UserElement } from './element'

/** When encountering a class component this function can trigger an suspense */
export type Visitor = (
  element: UserElement,
  instance?: any
) => void | Promise<any>
