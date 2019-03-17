import React, { Fragment, Component, createElement, createContext, useContext, useState } from 'react'

import renderPrepass from '..'

describe('renderPrepass', () => {
  describe('function components', () => {
    it('supports suspending subtrees', () => {
      const value = {}
      const getValue = jest.fn()
        .mockImplementationOnce(() => { throw Promise.resolve() })
        .mockImplementationOnce(() => value)

      const Inner = jest.fn(props => {
        expect(props.value).toBe(value)
        // We expect useState to work across suspense
        expect(props.state).toBe('test')
      })

      const Outer = jest.fn(() => {
        const [state] = useState('test')
        expect(state).toBe('test')
        return <Inner value={getValue()} state={state} />
      })

      const Wrapper = jest.fn(() => <Outer />)
      const render$ = renderPrepass(<Wrapper />)

      // We've synchronously walked the tree and expect a suspense
      // queue to have now built up
      expect(getValue).toHaveBeenCalledTimes(1)
      expect(Inner).not.toHaveBeenCalled()
      expect(Outer).toHaveBeenCalledTimes(1)

      return render$.then(() => {
        // After suspense we expect a rerender of the suspended subtree to
        // have happened
        expect(getValue).toHaveBeenCalledTimes(2)
        expect(Outer).toHaveBeenCalledTimes(2)
        expect(Inner).toHaveBeenCalledTimes(1)

        // Since only the subtree rerenders, we expect the Wrapper to have
        // only renderer once
        expect(Wrapper).toHaveBeenCalledTimes(1)
      })
    })

    it('ignores thrown non-promises', () => {
      const Outer = () => { throw new Error('test') }
      const render$ = renderPrepass(<Outer />)
      expect(render$).rejects.toThrow('test')
    })

    it('supports promise visitors', () => {
      const Inner = jest.fn(() => null)
      const Outer = jest.fn(() => <Inner />)

      const visitor = jest.fn(element => {
        if (element.type === Inner) return Promise.resolve()
      });

      const render$ = renderPrepass(<Outer />, visitor)

      // We expect the visitor to have returned a promise
      // which is now queued
      expect(Inner).not.toHaveBeenCalled()
      expect(Outer).toHaveBeenCalledTimes(1)

      return render$.then(() => {
        // After suspense we expect Inner to then have renderer
        // and the visitor to have been called for both elements
        expect(Outer).toHaveBeenCalledTimes(1)
        expect(Inner).toHaveBeenCalledTimes(1)
        expect(visitor).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('class components', () => {
    it('supports suspending subtrees', () => {
      const value = {}
      const getValue = jest.fn()
        .mockImplementationOnce(() => { throw Promise.resolve() })
        .mockImplementationOnce(() => value)

      const Inner = jest.fn(props => expect(props.value).toBe(value))

      class Outer extends Component {
        render() { return <Inner value={getValue()} /> }
      }

      const render$ = renderPrepass(<Outer />)

      // We've synchronously walked the tree and expect a suspense
      // queue to have now built up
      expect(getValue).toHaveBeenCalledTimes(1)
      expect(Inner).not.toHaveBeenCalled()

      return render$.then(() => {
        // After suspense we expect a rerender of the suspended subtree to
        // have happened
        expect(getValue).toHaveBeenCalledTimes(2)
        expect(Inner).toHaveBeenCalledTimes(1)
      })
    })

    it('ignores thrown non-promises', () => {
      class Outer extends Component {
        render() { throw new Error('test') }
      }

      const render$ = renderPrepass(<Outer />)
      expect(render$).rejects.toThrow('test')
    })

    it('supports promise visitors', () => {
      const Inner = jest.fn(() => null)

      class Outer extends Component {
        render() { return <Inner /> }
      }

      const visitor = jest.fn((element, instance) => {
        if (element.type === Outer) {
          expect(instance).toEqual(expect.any(Outer))
          return Promise.resolve()
        }
      });

      const render$ = renderPrepass(<Outer />, visitor)

      // We expect the visitor to have returned a promise
      // which is now queued
      expect(Inner).not.toHaveBeenCalled()

      return render$.then(() => {
        // After suspense we expect Inner to then have renderer
        // and the visitor to have been called for both elements
        expect(Inner).toHaveBeenCalledTimes(1)
        expect(visitor).toHaveBeenCalledTimes(2)
      })
    })

    it('supports unconventional updates via the visitor', () => {
      const newState = { value: 'test' }

      class Outer extends Component {
        constructor() {
          super()
          this.state = { value: 'initial' }
        }

        render() {
          expect(this.state).toEqual(newState)
          return null
        }
      }

      const visitor = jest.fn((element, instance) => {
        if (element.type === Outer) {
          expect(instance.updater.isMounted(instance)).toBe(false)
          instance.updater.enqueueForceUpdate(instance)
          instance.updater.enqueueReplaceState(instance, newState)
        }
      });

      renderPrepass(<Outer />, visitor)
      expect(visitor).toHaveBeenCalledTimes(1)
    })
  })

  describe('lazy components', () => {
    it('supports resolving lazy components', () => {
      const value = {}
      const Inner = jest.fn(props => expect(props.value).toBe(value))
      const loadInner = jest.fn().mockResolvedValueOnce(Inner)

      const Outer = React.lazy(loadInner)
      // Initially React sets the lazy component's status to -1
      expect(Outer._status).toBe(-1 /* INITIAL */)

      const render$ = renderPrepass(<Outer value={value} />)

      // We've synchronously walked the tree and expect a suspense
      // queue to have now built up
      expect(Inner).not.toHaveBeenCalled()
      expect(loadInner).toHaveBeenCalledTimes(1)

      // The lazy component's state should be updated with some initial
      // progress
      expect(Outer._status).toBe(0 /* PENDING */)

      return render$.then(() => {
        // Afterwards we can expect Inner to have loaded and rendered
        expect(Inner).toHaveBeenCalledTimes(1)

        // The lazy component's state should reflect this
        expect(Outer._status).toBe(1 /* SUCCESSFUL */)
      })
    })

    it('supports resolving ES exported components', () => {
      const Inner = jest.fn(() => null)
      const loadInner = jest.fn().mockResolvedValueOnce({ default: Inner })
      const Outer = React.lazy(loadInner)
      const render$ = renderPrepass(<Outer />)

      expect(Inner).not.toHaveBeenCalled()
      expect(loadInner).toHaveBeenCalledTimes(1)
      expect(Outer._status).toBe(0 /* PENDING */)

      return render$.then(() => {
        expect(Inner).toHaveBeenCalledTimes(1)
        expect(Outer._status).toBe(1 /* SUCCESSFUL */)
      })
    })

    it('supports skipping rejecting lazy components', () => {
      const Inner = jest.fn(() => null)
      const loadInner = jest.fn().mockRejectedValueOnce(new Error('test'))
      const Outer = React.lazy(loadInner)
      const render$ = renderPrepass(<Outer />)

      expect(Inner).not.toHaveBeenCalled()
      expect(loadInner).toHaveBeenCalledTimes(1)
      expect(Outer._status).toBe(0 /* PENDING */)

      return render$.then(() => {
        expect(Inner).toHaveBeenCalledTimes(0)
        // The lazy component's state should reflect the rejected promise
        expect(Outer._status).toBe(2 /* FAILED */)
      })
    })

    it('supports skipping invalid components', () => {
      const loadInner = jest.fn().mockResolvedValueOnce({})
      const Outer = React.lazy(loadInner)
      const render$ = renderPrepass(<Outer />)

      expect(loadInner).toHaveBeenCalledTimes(1)
      expect(Outer._status).toBe(0 /* PENDING */)

      return render$.then(() => {
        expect(Outer._status).toBe(2 /* FAILED */)
      })
    })

    it('supports rendering previouslt resolved lazy components', () => {
      const Inner = jest.fn(() => null)
      const loadInner = jest.fn().mockResolvedValueOnce(Inner)
      const Outer = React.lazy(loadInner)

      Outer._status = 1 /* SUCCESSFUL */
      Outer._result = Inner /* SUCCESSFUL */

      renderPrepass(<Outer />)

      expect(loadInner).toHaveBeenCalledTimes(0)
      expect(Inner).toHaveBeenCalled()
    })
  })

  it('correctly tracks context values across subtress and suspenses', () => {
    const Context = createContext('default')
    let hasSuspended = false

    const TestA = jest.fn(() => {
      expect(useContext(Context)).toBe('a')
      return null
    })

    const TestB = jest.fn(() => {
      expect(useContext(Context)).toBe('b')
      return null
    })

    const TestC = jest.fn(() => {
      expect(useContext(Context)).toBe('c')
      if (!hasSuspended) {
        throw Promise.resolve().then(() => hasSuspended = true)
      }

      return null
    })

    const Wrapper = () => (
      <Fragment>
        <Context.Provider value="a">
          <TestA />
        </Context.Provider>
        <Context.Provider value="b">
          <TestB />
        </Context.Provider>
        <Context.Provider value="c">
          <TestC />
        </Context.Provider>
      </Fragment>
    );

    const render$ = renderPrepass(<Wrapper />)
    expect(TestC).toHaveBeenCalledTimes(1)

    return render$.then(() => {
      expect(TestA).toHaveBeenCalledTimes(1)
      expect(TestB).toHaveBeenCalledTimes(1)
      expect(TestC).toHaveBeenCalledTimes(2)
    })
  })
})
