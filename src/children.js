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

/** Checks whether `node` has `children` which is only needed in extreme cases */
const hasChildren = (node: AbstractElement): boolean %checks =>
  typeof node.props === 'object' &&
  node.props !== null &&
  node.props.children !== undefined

/** Returns a flat AbstractElement array for a given AbstractElement node */
export const getChildrenArray = (node: AbstractElement): AbstractElement[] => {
  // We only expect AbstractElement but props technically don't have to contain `children`
  if (!hasChildren(node)) {
    return []
  }

  const type = typeOf(node)
  if (type === undefined || type === REACT_CONTEXT_TYPE) {
    return []
  }

  const children = toArray(node.props.children)
  const elements = children.filter(isAbstractElement)
  // $FlowFixMe: isAbstractElement doesn't seem to be narrowing down the type
  return (elements: AbstractElement[])
}
