import { computed } from 'mobx'
import { pathToRegexp } from 'path-to-regexp'
import { ComputedRouteOptions, ComputedRouteParam, IRouteSetter, SetRouteParamOptions, TypeComputedRouteOptions } from './__types'
import { CLEAN_SYMBOL } from './constants'
import { getComputedRouteParams } from './getComputedRouteParams'
import { requestRouteUpdate } from './routeUpdate'
import { getRoutingStore } from './routingStore'

function sanitizeParams(currentParams: any = {}, cleanParams?: boolean | ComputedRouteParam<any>[]) {
  const cleaningKeys = Array.isArray(cleanParams) ? Object.fromEntries(cleanParams.map(it => [it.__name])) : {}

  const newParams = Object.entries(currentParams).map(([k, v]) =>
    cleanParams === true ? [k, CLEAN_SYMBOL] : cleaningKeys.hasOwnProperty(k) ? [k, CLEAN_SYMBOL] : [k, v]
  )

  return Object.fromEntries(newParams)
}

export const computedRouteParam = <T = string>(
  paramName: string,
  { patterns: routePatterns, parse, format, defaultValue }: ComputedRouteOptions<T>
) => {
  const routeParams = getComputedRouteParams(routePatterns)
  const routePatternsWithRegex = routePatterns.map(it => ({ pattern: it, regex: pathToRegexp(it) }))

  const computedValue = computed(() => {
    const params: any = routeParams.get()
    const paramValue = params && params[paramName]

    let typedParamValue

    try {
      typedParamValue = paramValue && parse ? parse(paramValue) : paramValue
    } catch (err) {
      console.error(err)
    }

    const paramValueIsEmpty = typedParamValue === undefined || typedParamValue === '' || typedParamValue === null

    return paramValueIsEmpty ? defaultValue : typedParamValue
  }) as ComputedRouteParam<T>

  computedValue.__name = paramName

  const getCurrentRoutePattern = (enforcePattern?: string | undefined | null | false): { regex?: RegExp; pattern: string }[] => {
    if (enforcePattern) {
      return [{ pattern: enforcePattern }]
    }

    if (routePatterns.length === 0) {
      return [{ pattern: getRoutingStore().location.pathname }]
    }

    return routePatternsWithRegex
  }

  const setRouteParamWith = (setter: IRouteSetter) => (newValue: T | undefined | null, options = {} as SetRouteParamOptions) => {
    const applicablePatterns = getCurrentRoutePattern(options.enforcePattern)
    const currentParams = routeParams.get() || {}
    const newValueFormatted = format && newValue ? format(newValue) : newValue
    const newParams = sanitizeParams(currentParams as any, options.cleanParams)

    return requestRouteUpdate(setter, {
      key: paramName,
      value: newValueFormatted as string,
      patterns: applicablePatterns,
      params: newParams,
    })
  }

  computedValue.push = setRouteParamWith(getRoutingStore().history.push)
  computedValue.replace = setRouteParamWith(getRoutingStore().history.replace)

  return computedValue
}

computedRouteParam.date = (paramName: string, options: TypeComputedRouteOptions<Date>) =>
  computedRouteParam(paramName, {
    ...options,
    parse: d => new Date(d),
    format: d => (d instanceof Date ? d : new Date(d)).toISOString().substr(0, 10),
  })

computedRouteParam.int = (paramName: string, options: TypeComputedRouteOptions<number>) =>
  computedRouteParam(paramName, {
    ...options,
    parse: parseInt,
  })

computedRouteParam.float = (paramName: string, options: TypeComputedRouteOptions<number>) =>
  computedRouteParam(paramName, {
    ...options,
    parse: parseFloat,
  })

computedRouteParam.boolean = (paramName: string, options: TypeComputedRouteOptions<boolean>) =>
  computedRouteParam(paramName, {
    ...options,
    parse: Boolean,
  })

export { setRoutingStore } from './routingStore'
// export { interpolateUrl } from './interpolateUrl'
