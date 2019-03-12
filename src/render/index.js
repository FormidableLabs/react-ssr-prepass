// @flow

import type { Node, ComponentType } from 'react'

import {
  shouldConstruct,
  type UserElement,
  type DefaultProps,
  type ComponentStatics
} from '../element'

import { maskContext } from '../state'
import { renderClassComponent } from './classComponent'
import { renderFunctionComponent } from './functionComponent'

const computeProps = (props: Object, defaultProps: void | Object) => {
  return typeof defaultProps === 'object'
    ? Object.assign({}, defaultProps, props)
    : props
}

export const render = (
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: DefaultProps
): Node => {
  const computedProps = computeProps(props, type.defaultProps)
  const context = maskContext(type)

  return !shouldConstruct(type)
    ? renderFunctionComponent(type, computedProps, context)
    : renderClassComponent(type, computedProps, context)
}
