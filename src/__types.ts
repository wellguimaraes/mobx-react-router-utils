import { IComputedValue } from 'mobx/lib/internal'

export type IRouteSetter = (url: string) => void
export type ComputedRouteOptions<T = string> = {
  patterns: string[]
  parse?: (it: string) => T
  format?: (it: any) => string
  defaultValue?: T
}
export type SetRouteParamOptions = {
  enforcePattern?: string | undefined | null | false
  cleanParams?: boolean | ComputedRouteParam<any>[]
}
export type ComputedRouteParam<T> =
  IComputedValue<T>
  & { push: RouteParamSetter<T>; replace: RouteParamSetter<T>, __name: string }
type RouteParamSetter<T> = (newValue: T | null | undefined, options?: SetRouteParamOptions) => Promise<string> | void

export type TypeComputedRouteOptions<T> = Omit<ComputedRouteOptions<T>, 'format' | 'parse'>
