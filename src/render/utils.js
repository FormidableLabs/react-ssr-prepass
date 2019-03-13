// @flow

export const computeProps = (props: Object, defaultProps: void | Object) => {
  return typeof defaultProps === 'object'
    ? Object.assign({}, defaultProps, props)
    : props
}
