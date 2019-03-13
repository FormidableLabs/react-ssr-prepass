// @flow

import type { ComponentType } from 'react'
import type { DefaultProps, ComponentStatics } from '../element'
import type { Identity, ContextMap } from '../state'
import type { Hook } from '../dispatcher'

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
