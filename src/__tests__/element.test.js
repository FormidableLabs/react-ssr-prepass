import * as is from 'react-is'
import { typeOf } from '../element'

import {
  REACT_ELEMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_CONCURRENT_MODE_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE
} from '../symbols'

describe('typeOf', () => {
  it('correctly identifies all elements', () => {
    expect(typeOf({})).toBe(undefined)

    expect(typeOf({
      $$typeof: is.Portal
    })).toBe(REACT_PORTAL_TYPE)

    expect(typeOf({
      $$typeof: is.Element,
      type: is.ConcurrentMode
    })).toBe(REACT_CONCURRENT_MODE_TYPE)

    expect(typeOf({
      $$typeof: is.Element,
      type: is.Fragment
    })).toBe(REACT_FRAGMENT_TYPE)

    expect(typeOf({
      $$typeof: is.Element,
      type: is.Profiler
    })).toBe(REACT_PROFILER_TYPE)

    expect(typeOf({
      $$typeof: is.Element,
      type: is.StrictMode
    })).toBe(REACT_STRICT_MODE_TYPE)
  })
})
