import React, { Component } from 'react'
import renderPrepass from '..'

it('returns to the next componentDidCatch boundary on erroring', () => {
  const Throw = jest.fn(() => {
    throw new Error()
  })
  const Inner = jest.fn(() => null)

  class Outer extends Component {
    constructor() {
      super()
      this.state = { error: false }
    }

    componentDidCatch(error) {
      this.setState({ error: true })
    }

    render() {
      return this.state.error ? <Inner /> : <Throw />
    }
  }

  const render$ = renderPrepass(<Outer />)
  expect(Throw).toHaveBeenCalledTimes(1)
  expect(Inner).not.toHaveBeenCalled()

  return render$.then(() => {
    expect(Inner).toHaveBeenCalledTimes(1)
  })
})

it('returns to the next getDerivedStateFromError boundary on erroring', () => {
  const Throw = jest.fn(() => {
    throw new Error()
  })
  const Inner = jest.fn(() => null)

  class Outer extends Component {
    static getDerivedStateFromProps() {
      return { error: false }
    }

    static getDerivedStateFromError() {
      return { error: true }
    }

    render() {
      return this.state.error ? <Inner /> : <Throw />
    }
  }

  const render$ = renderPrepass(<Outer />)
  expect(Throw).toHaveBeenCalledTimes(1)
  expect(Inner).not.toHaveBeenCalled()

  return render$.then(() => {
    expect(Inner).toHaveBeenCalledTimes(1)
  })
})

it('guards against infinite render loops', () => {
  const Throw = jest.fn(() => {
    throw new Error()
  })

  class Outer extends Component {
    componentDidCatch() {} // NOTE: This doesn't actually recover from errors
    render() {
      return <Throw />
    }
  }

  return renderPrepass(<Outer />).then(() => {
    expect(Throw).toHaveBeenCalledTimes(25)
  })
})

it('returns to the next error boundary on a suspense error', () => {
  const Inner = jest.fn(() => null)

  const Throw = jest.fn(() => {
    throw Promise.reject(new Error('Suspense!'))
  })

  class Outer extends Component {
    static getDerivedStateFromProps() {
      return { error: false }
    }

    static getDerivedStateFromError(error) {
      expect(error).not.toBeInstanceOf(Promise)
      return { error: true }
    }

    render() {
      return this.state.error ? <Inner /> : <Throw />
    }
  }

  const render$ = renderPrepass(<Outer />)
  expect(Throw).toHaveBeenCalledTimes(1)
  expect(Inner).not.toHaveBeenCalled()

  return render$.then(() => {
    expect(Inner).toHaveBeenCalledTimes(1)
  })
})

it('returns to the next error boundary on a nested error', () => {
  const Throw = jest.fn(({ depth }) => {
    if (depth >= 4) {
      throw new Error('' + depth)
    }

    return <Throw depth={depth + 1} />
  })

  class Outer extends Component {
    static getDerivedStateFromProps() {
      return { error: false }
    }

    static getDerivedStateFromError(error) {
      expect(error.message).toBe('4')
      return { error: true }
    }

    render() {
      return !this.state.error ? <Throw depth={1} /> : null
    }
  }

  renderPrepass(<Outer />).then(() => {
    expect(Throw).toHaveBeenCalledTimes(4)
  })
})

it('always returns to the correct error boundary', () => {
  const values = []

  const Inner = jest.fn(({ value, depth }) => {
    values.push({ value, depth })
    return value
  })

  const Throw = jest.fn(({ value }) => {
    throw new Error('' + value)
  })

  class Outer extends Component {
    static getDerivedStateFromProps(props) {
      return { value: null }
    }

    static getDerivedStateFromError(error) {
      return { value: error.message }
    }

    render() {
      return [
        this.state.value ? (
          <Inner value={this.state.value} depth={this.props.depth} />
        ) : (
          <Throw value={this.props.depth} />
        ),
        this.props.depth < 4 ? <Outer depth={this.props.depth + 1} /> : null
      ]
    }
  }

  return renderPrepass(<Outer depth={1} />).then(() => {
    expect(Throw).toHaveBeenCalledTimes(4)
    expect(Inner).toHaveBeenCalledTimes(4)
    expect(values).toMatchInlineSnapshot(`
      Array [
        Object {
          "depth": 1,
          "value": "1",
        },
        Object {
          "depth": 2,
          "value": "2",
        },
        Object {
          "depth": 3,
          "value": "3",
        },
        Object {
          "depth": 4,
          "value": "4",
        },
      ]
    `)
  })
})
