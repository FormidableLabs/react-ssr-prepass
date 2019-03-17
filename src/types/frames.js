// @flow

import type { ComponentType } from 'react'
import type { Identity } from '../internals'
import type { LazyComponent } from '../types'
import type { DefaultProps, ComponentStatics } from './element'
import type { ContextMap, ContextStore, Hook } from './state'

export type BaseFrame = {
  contextMap: ContextMap,
  contextStore: ContextStore,
  thenable: Promise<any>
}

/** Description of suspended React.lazy components */
export type LazyFrame = BaseFrame & {
  kind: 'frame.lazy',
  type: LazyComponent,
  props: Object
}

/** Description of suspended React.Components */
export type ClassFrame = BaseFrame & {
  kind: 'frame.class',
  type: ComponentType<DefaultProps> & ComponentStatics,
  instance: any
}

/** Description of suspended function components with hooks state */
export type HooksFrame = BaseFrame & {
  kind: 'frame.hooks',
  type: ComponentType<DefaultProps> & ComponentStatics,
  props: Object,
  id: Identity,
  hook: Hook | null
}

export type Frame = ClassFrame | HooksFrame | LazyFrame
