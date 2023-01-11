import fromPairs from 'lodash/fromPairs'
import toPairs from 'lodash/toPairs'
import { computed } from 'mobx'
import memoize from 'moize'
import { pathToRegexp } from 'path-to-regexp'
import { ComputedRouteOptions, ComputedRouteParam, IRouteSetter, SetRouteParamOptions, TypeComputedRouteOptions } from './__types'
import { CLEAN_SYMBOL } from './constants'
import { getComputedRouteParams } from './getComputedRouteParams'
import { getValueFormatted } from './getValueFormatted'
import { requestRouteUpdate } from './routeUpdate'
import { getRoutingStore } from './routingStore'

function sanitizeParams(currentParams: any = {}, cleanParams?: boolean | ComputedRouteParam<any>[]) {
  const cleaningKeys = Array.isArray(cleanParams) ? fromPairs(cleanParams.map(it => [it.__name])) : {}

  const newParams = toPairs(currentParams).map(([k, v]) =>
    cleanParams === true ? [k, CLEAN_SYMBOL] : cleaningKeys.hasOwnProperty(k) ? [k, CLEAN_SYMBOL] : [k, v]
  )

  return fromPairs(newParams)
}

export const computedRouteParam = <T = string>(
  paramName: string,
  { patterns: routePatterns, parse: _parse, format, defaultValue, keepAlive }: ComputedRouteOptions<T>
) => {
  const parse = _parse && memoize(_parse)
  const routeParams = getComputedRouteParams(routePatterns)
  const routePatternsWithRegex = routePatterns.map(it => ({ pattern: it, regex: pathToRegexp(it) }))

  const computedValue = computed(
    () => {
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
    },
    {
      keepAlive,
    }
  ) as ComputedRouteParam<T>

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

  const setRouteParamWith = (setter: IRouteSetter) => (newValue: T | undefined | null, options?: SetRouteParamOptions) => {
    const {
      cleanParams,
      enforce,
      enforcePattern,
      falsyValuesAllowed = [],
    }: SetRouteParamOptions = { falsyValuesAllowed: [], ...options }

    const applicablePatterns = getCurrentRoutePattern(enforcePattern)
    const currentParams = routeParams.get() || {}
    const newValueFormatted = format ? getValueFormatted(newValue, format, falsyValuesAllowed) : newValue
    const newParams = sanitizeParams(currentParams as any, cleanParams)
    const currentValueFormatted = format
      ? getValueFormatted(computedValue.get(), format, falsyValuesAllowed)
      : computedValue.get()
    const hasParamsToClean = cleanParams === true || (cleanParams as any[])?.length
    const valueDidNotChange = (newValueFormatted ?? null) === (currentValueFormatted ?? null)

    if (valueDidNotChange && !hasParamsToClean && !enforce) {
      return
    }

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
    parse: (d: string) => new Date(d + 'T12:00:00.000Z'),
    format: d => (d ? (d instanceof Date ? d : new Date(d)).toISOString().substr(0, 10) : ''),
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
