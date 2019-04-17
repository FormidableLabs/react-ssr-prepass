// @flow

import { createElement, type ComponentType, type Node } from 'react'

import { getChildrenArray } from '../element'
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
  if (
    styledComponents === undefined ||
    styledComponents.ThemeContext === undefined
  ) {
    // styled-components is not installed or incompatible, so the component will have to be
    // mounted normally
    const { render } = element.type
    return mountFunctionComponent(render, element.props, queue, visitor)
  } else if (typeof element.type.target !== 'function') {
    // StyledComponents rendering DOM elements can safely be skipped like normal DOM elements
    return element.props.children || null
  }

  const type = ((element.type: any): StyledComponentStatics)

  // Imitate styled-components' attrs props without computing styles
  const theme = readContextValue(styledComponents.ThemeContext) || {}
  const attrs: Attr[] = Array.isArray(type.attrs) ? type.attrs : [type.attrs]
  const props = computeAttrsProps(attrs, element.props, theme)

  return createElement((type.target: any), props)
}
