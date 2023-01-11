import { IComputedValue } from 'mobx/dist/internal'

export enum FalsyValue {
  'EmptyString',
  'False',
  'NaN',
  'Null',
  'Undefined',
  'Zero',
}

export type FormatFunction = (it: any) => string
export type IRouteSetter = (url: string) => void
export type ComputedRouteOptions<T = string> = {
  patterns: string[]
  parse?: (it: string) => T
  format?: FormatFunction
  defaultValue?: T
  keepAlive?: boolean
}
export type SetRouteParamOptions = {
  enforce?: boolean
  enforcePattern?: string | undefined | null | false
  cleanParams?: boolean | ComputedRouteParam<any>[]
  falsyValuesAllowed?: FalsyValue[]
}
export type ComputedRouteParam<T> = IComputedValue<T> & {
  push: RouteParamSetter<T>
  replace: RouteParamSetter<T>
  __name: string
}
type RouteParamSetter<T> = (newValue: T | null | undefined, options?: SetRouteParamOptions) => Promise<string> | void

export type TypeComputedRouteOptions<T> = Omit<ComputedRouteOptions<T>, 'format' | 'parse'>
