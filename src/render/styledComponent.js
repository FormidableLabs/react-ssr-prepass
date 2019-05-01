// @flow

import { createElement, type ComponentType, type Node } from 'react'

import { getChildrenArray, computeProps } from '../element'
import { readContextValue } from '../internals'
import { mount as mountFunctionComponent } from './functionComponent'

import type {
  DefaultProps,
  ForwardRefElement,
  Frame,
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
  target: ComponentType<DefaultProps> & ComponentStatics,
  defaultProps?: Object
}

/** Determines a StyledComponent's theme taking defaults into account */
const computeTheme = (props: Object, defaultProps: Object): Object => {
  const defaultTheme = defaultProps ? defaultProps.theme : undefined
  const isDefaultTheme = defaultTheme ? props.theme === defaultTheme : false

  if (props.theme && !isDefaultTheme) {
    return props.theme
  } else {
    const contextTheme = readContextValue(styledComponents.ThemeContext)
    return contextTheme || defaultTheme
  }
}

/** Computes a StyledComponent's props with attributes */
const computeAttrsProps = (input: Attr[], props: any, theme: any): any => {
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

  const newProps = (Object.assign(attrs, props): any)
  newProps.className = props.className || ''
  newProps.style = props.style
    ? Object.assign({}, attrs.style, props.style)
    : attrs.style
  return newProps
}

/** Checks whether a ForwardRefElement is a StyledComponent element */
export const isStyledElement = (element: ForwardRefElement): boolean %checks =>
  styledComponents !== undefined &&
  typeof element.type.target !== undefined &&
  typeof element.type.styledComponentId === 'string'

/** This is an optimised faux mounting strategy for StyledComponents.
    It is only enabled when styled-components is installed and the component
    can safely be skipped */
export const mount = (element: ForwardRefElement): Node => {
  // Imitate styled-components' attrs props without computing styles
  const type = ((element.type: any): StyledComponentStatics)
  const attrs: Attr[] = Array.isArray(type.attrs) ? type.attrs : [type.attrs]
  const computedProps = computeProps(element.props, type.defaultProps)
  const theme = computeTheme(element.props, type)
  const props = computeAttrsProps(attrs, computedProps, theme)
  const as = props.as || type.target
  const children = computedProps.children || null

  // StyledComponents rendering DOM elements can safely be skipped like normal DOM elements
  if (typeof as === 'string') {
    return children
  } else {
    delete props.as
    return createElement((as: any), props, children)
  }
}
