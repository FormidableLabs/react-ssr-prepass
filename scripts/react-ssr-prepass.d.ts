declare module 'react-ssr-prepass' {
  type Visitor = (
    element: React.ReactElement<any>,
    instance?: React.Component<any, any>
  ) => void | Promise<any>

  function ssrPrepass(node: React.ReactNode, visitor?: Visitor): Promise<void>

  export = ssrPrepass
}
