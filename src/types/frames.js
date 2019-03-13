// @flow

import type { ComponentType } from 'react'
import type { Identity } from '../internals'
import type { LazyComponent } from '../types'
import type { DefaultProps, ComponentStatics } from './element'
import type { ContextMap, Hook } from './state'

export type BaseFrame = {
  contextMap: ContextMap,
  thenable: Promise<any>
}

export type LazyFrame = BaseFrame & {
  kind: 'frame.lazy',
  type: LazyComponent,
  props: Object
}

export type ClassFrame = BaseFrame & {
  kind: 'frame.class',
  type: ComponentType<DefaultProps> & ComponentStatics,
  instance: any
}

export type HooksFrame = BaseFrame & {
  kind: 'frame.hooks',
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: Object,
  id: Identity,
  hook: Hook | null
}

export type Frame = ClassFrame | HooksFrame | LazyFrame
