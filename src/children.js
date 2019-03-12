// @flow

import { Children, type Node } from 'react'
import { REACT_CONTEXT_TYPE } from './symbols'
import { typeOf, type AbstractElement } from './element'

type ScalarNode = null | boolean | string | number

/** Rebound Children.toArray with modified AbstractElement types */
const toArray: (node?: Node) => Array<ScalarNode | AbstractElement> =
  Children.toArray

/** Checks whether the `node` is an AbstractElement */
const isAbstractElement = (
  node: ScalarNode | AbstractElement
): boolean %checks => node !== null && typeof node === 'object'

/** Returns a flat AbstractElement array for a given AbstractElement node */
export const getChildrenArray = (node?: Node): AbstractElement[] => {
  // $FlowFixMe
  return toArray(node).filter(isAbstractElement)
}
