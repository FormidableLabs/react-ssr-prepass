import React, {
  Component,
  Fragment,
  Suspense,
  StrictMode,
  Profiler,
  createContext,
  useReducer,
  useContext,
  useState
} from 'react'

import { createPortal } from 'react-dom'
import styled from 'styled-components'

import {
  Dispatcher,
  setCurrentContextStore,
  setCurrentContextMap,
  getCurrentContextMap,
  getCurrentContextStore,
  flushPrevContextMap,
  flushPrevContextStore,
  readContextValue
} from '../internals'

import { visitElement } from '../visitor'

const {
  ReactCurrentDispatcher
} = (React: any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

const {
  StyleSheet
} = require('styled-components').__DO_NOT_USE_OR_YOU_WILL_BE_HAUNTED_BY_SPOOKY_GHOSTS

let prevDispatcher = null

beforeEach(() => {
  prevDispatcher = ReactCurrentDispatcher.current
  ReactCurrentDispatcher.current = Dispatcher

  setCurrentContextMap({})
  setCurrentContextStore(new Map())
})

afterEach(() => {
  ReactCurrentDispatcher.current = prevDispatcher
})

const Noop = () => null

describe('visitElement', () => {
  beforeEach(() => {
    StyleSheet.reset(true)
  })

  it('walks Fragments', () => {
    const element = (
      <Fragment>
        <Noop />
        {null}
        <Noop />
      </Fragment>
    )
    const children = visitElement(element, [], () => {})
    expect(children.length).toBe(2)
    expect(children[0].type).toBe(Noop)
    expect(children[1].type).toBe(Noop)
  })

  it('walks misc. mode-like components', () => {
    const assert = element => {
      const children = visitElement(element, [], () => {})
      expect(children.length).toBe(1)
      expect(children[0].type).toBe(Noop)
    }

    assert(
      <Suspense fallback={null}>
        <Noop />
      </Suspense>
    )
    assert(
      <StrictMode>
        <Noop />
      </StrictMode>
    )
    assert(
      <Profiler>
        <Noop />
      </Profiler>
    )
  })

  it('walks DOM elements', () => {
    const element = (
      <div>
        <Noop />
        {null}
        <Noop />
      </div>
    )
    const children = visitElement(element, [], () => {})
    expect(children.length).toBe(2)
    expect(children[0].type).toBe(Noop)
    expect(children[1].type).toBe(Noop)
  })

  it('walks StyledComponent DOM elements', () => {
    const Comp = styled.div``
    const children = visitElement(
      <Comp>
        <Noop />
      </Comp>,
      [],
      () => {}
    )

    expect(children.length).toBe(1)
    expect(children[0].type).toBe(Noop)
    expect(StyleSheet.master.tags.length).toBe(1)

    const tag = StyleSheet.master.tags[0]
    expect(tag.css().trim()).toBe('')

    expect(Object.keys(StyleSheet.master.deferred)).toEqual([
      expect.any(String)
    ])
  })

  it('walks StyledComponent wrapper elements', () => {
    const Comp = styled(Noop)``
    const children = visitElement(<Comp />, [], () => {})

    expect(children.length).toBe(1)
    expect(StyleSheet.master.tags.length).toBe(1)

    const tag = StyleSheet.master.tags[0]
    expect(tag.css().trim()).toBe('')

    expect(Object.keys(StyleSheet.master.deferred)).toEqual([
      expect.any(String)
    ])
  })

  it('walks Providers and Consumers', () => {
    const Context = createContext('default')
    const leaf = jest.fn().mockReturnValue(null)

    const makeChild = value => (
      <Context.Provider value={value}>
        <Context.Consumer>{leaf}</Context.Consumer>
      </Context.Provider>
    )

    for (let i = 0, child = makeChild('testA'); i <= 3 && child; i++) {
      child = visitElement(child, [], () => {})[0]
    }

    expect(readContextValue(Context)).toBe('testA')
    expect(flushPrevContextStore()).toEqual([Context, undefined])
    expect(leaf).toHaveBeenCalledWith('testA')

    for (let i = 0, child = makeChild('testB'); i <= 3 && child; i++) {
      child = visitElement(child, [], () => {})[0]
    }

    expect(readContextValue(Context)).toBe('testB')
    expect(flushPrevContextStore()).toEqual([Context, 'testA'])
    expect(leaf).toHaveBeenCalledWith('testB')
  })

  it('skips over invalid Consumer components', () => {
    const Context = createContext('default')
    const children = visitElement(<Context.Consumer />, [], () => {})
    expect(children.length).toBe(0)
  })

  it('resolves lazy components', () => {
    const defer = jest.fn().mockImplementation(() => {
      return Promise.resolve().then(() => Noop)
    })

    const Test = React.lazy(defer)
    const queue = []
    const children = visitElement(<Test />, queue, () => {})

    expect(children.length).toBe(0)
    expect(queue.length).toBe(1)
    expect(defer).toHaveBeenCalled()

    expect(queue[0]).toMatchObject({
      contextMap: getCurrentContextMap(),
      contextStore: getCurrentContextStore(),
      thenable: expect.any(Promise),
      kind: 'frame.lazy',
      type: Test,
      props: {}
    })
  })

  it('walks over forwardRef components', () => {
    const Test = React.forwardRef(() => <Noop />)
    const children = visitElement(<Test />, [], () => {})
    expect(children.length).toBe(1)
    expect(children[0].type).toBe(Noop)
  })

  it('walks over memo components', () => {
    const Test = React.memo(Noop)
    const children = visitElement(<Test />, [], () => {})
    expect(children.length).toBe(1)
    expect(children[0].type).toBe(Noop)
  })

  it('returns nothing for portal components', () => {
    const portal = createPortal(<Noop />, document.createElement('div'))
    const children = visitElement(portal, [], () => {})
    expect(children.length).toBe(0)
  })

  it('renders class components with getDerivedStateFromProps', () => {
    const onUnmount = jest.fn()

    class Test extends Component {
      static getDerivedStateFromProps() {
        return { value: 'b' }
      }

      constructor() {
        super()
        this.state = { value: 'a' }
      }

      componentWillUnmount() {
        onUnmount()
      }

      render() {
        return <Noop>{this.state.value}</Noop>
      }
    }

    const visitor = jest.fn()
    const children = visitElement(<Test />, [], visitor)

    expect(children.length).toBe(1)
    expect(children[0].type).toBe(Noop)
    expect(children[0].props.children).toBe('b')
    expect(onUnmount).not.toHaveBeenCalled()
    expect(visitor).toHaveBeenCalledWith(<Test />, expect.any(Test))
  })

  it('renders class components with componentWillMount', () => {
    ;['componentWillMount', 'UNSAFE_componentWillMount'].forEach(methodName => {
      const onUnmount = jest.fn()

      class Test extends Component {
        constructor() {
          super()

          this.state = { value: 'a' }
          this[methodName] = function() {
            this.setState({ value: 'b' })
          }
        }

        componentWillUnmount() {
          onUnmount()
        }

        render() {
          return <Noop>{this.state.value}</Noop>
        }
      }

      const children = visitElement(<Test />, [], () => {})
      expect(children.length).toBe(1)
      expect(children[0].type).toBe(Noop)
      expect(children[0].props.children).toBe('b')
      expect(onUnmount).toHaveBeenCalled()
    })
  })

  it('renders class components with legacy context', () => {
    class Inner extends Component {
      render() {
        return <Noop>{this.context.value}</Noop>
      }
    }

    Inner.contextTypes = { value: Noop }

    class Outer extends Component {
      getChildContext() {
        return { value: 'test' }
      }

      render() {
        return <Inner />
      }
    }

    Outer.childContextTypes = { value: Noop }

    // We first populate the context
    visitElement(<Outer />, [], () => {})

    // Then manually mount Inner afterwards
    const children = visitElement(<Inner />, [], () => {})

    expect(flushPrevContextMap()).toEqual({ value: undefined })
    expect(children.length).toBe(1)
    expect(children[0].type).toBe(Noop)
    expect(children[0].props.children).toBe('test')
  })

  it('renders function components', () => {
    const Test = () => {
      const [value, setValue] = useState('a')
      if (value === 'a') {
        setValue('b')
        setValue('c')
        setValue('d')
      }

      return <Noop>{value}</Noop>
    }

    const visitor = jest.fn()
    const children = visitElement(<Test />, [], visitor)
    expect(children.length).toBe(1)
    expect(children[0].type).toBe(Noop)
    expect(children[0].props.children).toBe('d')
    expect(visitor).toHaveBeenCalledWith(<Test />)
  })

  it('renders function components with reducers', () => {
    const reducer = (prev, action) => (action === 'increment' ? prev + 1 : prev)

    const Test = () => {
      const [value, dispatch] = useReducer(reducer, 0)
      if (value === 0) dispatch('increment')
      return <Noop>{value}</Noop>
    }

    const visitor = jest.fn()
    const children = visitElement(<Test />, [], visitor)
    expect(children.length).toBe(1)
    expect(children[0].type).toBe(Noop)
    expect(children[0].props.children).toBe(1)
    expect(visitor).toHaveBeenCalledWith(<Test />)
  })

  it('renders function components with context', () => {
    const Context = createContext('default')
    const Test = () => {
      const value = useContext(Context)
      return <Noop>{value}</Noop>
    }

    // We first populate the context
    visitElement(<Context.Provider value="test" />, [], () => {})
    // Then manually mount Test afterwards
    const children = visitElement(<Test />, [], () => {})
    expect(children.length).toBe(1)
    expect(children[0].type).toBe(Noop)
    expect(children[0].props.children).toBe('test')
  })

  it('renders function components with default props', () => {
    const Test = props => <Noop>{props.value}</Noop>

    Test.defaultProps = { value: 'default' }

    const childA = visitElement(<Test />, [], () => {})[0]
    expect(childA.props.children).toBe('default')

    const childB = visitElement(<Test value="test" />, [], () => {})[0]
    expect(childB.props.children).toBe('test')
  })
})
