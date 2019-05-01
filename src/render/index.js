// @flow

/** Every type of component here can suspend itself.
    This means it pushes a `Frame` to the queue.
    Components are first mounted in visitor.js,
    and if they have suspended after their promise
    resolves `update` is called instead for them,
    which preserves their previous mounted state
    and rerenders the component. */

export {
  mount as mountLazyComponent,
  update as updateLazyComponent
} from './lazyComponent'

export {
  mount as mountFunctionComponent,
  update as updateFunctionComponent
} from './functionComponent'

export {
  mount as mountClassComponent,
  update as updateClassComponent
} from './classComponent'

export {
  isStyledElement,
  mount as mountStyledComponent
} from './styledComponent'
