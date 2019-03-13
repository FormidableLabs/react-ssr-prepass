// @flow

import type { ComponentType } from 'react'
import type { Identity } from '../internals'
import type { DefaultProps, ComponentStatics } from './element'
import type { ContextMap, Hook } from './state'

export type BaseFrame = {
  type: ComponentType<DefaultProps> & ComponentStatics,
  contextMap: ContextMap,
  props: Object,
  thenable: Promise<any>
}

export type ClassFrame = BaseFrame & {
  kind: 'frame.class',
  instance: any
}

export type HooksFrame = BaseFrame & {
  kind: 'frame.hooks',
  id: Identity,
  hook: Hook | null
}

export type Frame = ClassFrame | HooksFrame
