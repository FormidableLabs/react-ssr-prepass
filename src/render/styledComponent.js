// @flow

import { createElement, type ComponentType, type Node } from 'react'

import { getChildrenArray, computeProps } from '../element'
import { readContextValue } from '../internals'
import { mount as mountFunctionComponent } from './functionComponent'

import type {
  DefaultProps,
  ForwardRefElement,
  Frame,
  Visitor,
  ComponentStatics
} from '../types'

let styledComponents: any
try {
  styledComponents = require('styled-components')

  if (
    styledComponents.__DO_NOT_USE_OR_YOU_WILL_BE_HAUNTED_BY_SPOOKY_GHOSTS ===
      undefined ||
    styledComponents.ThemeContext === undefined
  ) {
    styledComponents = undefined
  }
} catch (_error) {}

type AttrsFn = (context: mixed) => DefaultProps
type Attr = void | AttrsFn | { [propName: string]: ?AttrsFn }

type StyledComponentStatics = {
  styledComponentId: string,
  attrs: Attr | Attr[],
  target: ComponentType<DefaultProps> & ComponentStatics
}

/** Computes a StyledComponent's props with attributes */
const computeAttrsProps = (
  input: Attr[],
  props: DefaultProps,
  theme: mixed
): any => {
  const executionContext = { ...props, theme }

  const attrs = input.reduce((acc, attr) => {
    if (typeof attr === 'function') {
      return Object.assign(acc, attr(executionContext))
    } else if (typeof attr !== 'object' || attr === null) {
      return acc
    }

    for (const key in attr) {
      const attrProp = attr[key]
      if (typeof attrProp === 'function') {
        acc[key] = attrProp(executionContext)
      } else if (attr.hasOwnProperty(key)) {
        acc[key] = attrProp
      }
    }

    return acc
  }, {})

  return Object.assign(attrs, props)
}

/** Checks whether a ForwardRefElement is a StyledComponent element */
export const isStyledElement = (element: ForwardRefElement): boolean %checks =>
  typeof element.type.styledComponentId === 'string'

/** This is an optimised faux mounting strategy for StyledComponents.
    It is only enabled when styled-components is installed and the component
    can safely be skipped */
export const mount = (
  element: ForwardRefElement,
  queue: Frame[],
  visitor: Visitor
): Node => {
  if (styledComponents === undefined) {
    // styled-components is not installed or incompatible, so the component will have to be
    // mounted normally
    const { render } = element.type
    return mountFunctionComponent(render, element.props, queue, visitor)
  }

  // Imitate styled-components' attrs props without computing styles
  const type = ((element.type: any): StyledComponentStatics)
  const theme = readContextValue(styledComponents.ThemeContext) || {}
  const attrs: Attr[] = Array.isArray(type.attrs) ? type.attrs : [type.attrs]
  const computedProps = computeProps(element.props, (type: any).defaultProps)
  const props = computeAttrsProps(attrs, computedProps, theme)
  const as = props.as || type.target

  if (typeof as !== 'function') {
    // StyledComponents rendering DOM elements can safely be skipped like normal DOM elements
    return element.props.children || null
  } else {
    return createElement((as: any), props)
  }
}
