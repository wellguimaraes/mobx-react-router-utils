import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import memoizee from 'memoizee'
import { computed } from 'mobx'
import { RouterStore } from 'mobx-react-router'
import { IComputedValue } from 'mobx/lib/internal'
import { compile, Key, match, pathToRegexp } from 'path-to-regexp'
import { parse as parseQueryString, stringify as toQueryString } from 'query-string'

type ComputedRouteOptions<T = string> = {
  patterns: string[]
  parse?: (it: string) => T
  format?: (it: any) => string
  defaultValue?: T
}

type SetRouteParamOptions = {
  pattern?: string | undefined | null | false
  cleanParams?: boolean | ComputedRouteParam<any>[]
}

type ComputedRouteParam<T> = IComputedValue<T> & { push: RouteParamSetter; replace: RouteParamSetter; _paramName: string }

type RouteParamSetter = (newValue: any, options?: SetRouteParamOptions) => void

let _emptyObject = {}
let _routingStore: RouterStore

export const setRoutingStore = (routingStore: RouterStore) => (_routingStore = routingStore)

const getLocationQuery = () => parseQueryString(window.location.search)

const ensureLeft = (str: string, prefix: string) => {
  if (str.startsWith(prefix)) return str
  return prefix + str
}

const getComputedRouteParams = memoizee((routePatterns: string[]) => {
  const matchers = routePatterns.map(it => match(it, { decode: decodeURIComponent }))

  return computed(() => {
    let pathParams = {}
    let queryParams = parseQueryString(_routingStore.location.search)

    for (let match of matchers) {
      let matchResult: false | { params: any } = match(_routingStore.location.pathname)

      if (matchResult === false) continue

      pathParams = matchResult.params
    }

    const pathParamsIsEmpty = Object.keys(pathParams).length === 0
    const queryParamsIsEmpty = Object.keys(queryParams).length === 0

    return pathParamsIsEmpty && queryParamsIsEmpty
      ? _emptyObject
      : {
          ...pathParams,
          ...queryParams,
        }
  })
})

export const interpolateUrl = (pattern: string, params: any) => {
  const pathKeys = [] as Key[]

  pathToRegexp(pattern, pathKeys)
  const toPath = compile(pattern)
  const namesOfPathKeys = pathKeys.map(it => it.name)

  const queryParams = omit(params, namesOfPathKeys)
  const pathParams = pick(params, namesOfPathKeys)

  const query = toQueryString({
    ...omitBy(queryParams, value => !value && value !== false),
    ...pickBy(getLocationQuery(), (value, key: string) => key.startsWith('utm')),
  })

  return toPath(pathParams) + (query && ensureLeft(query, '?'))
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

  computedValue._paramName = paramName

  const setRouteParamWith = (setter: (url: string) => void) => (newValue: any, options = {} as SetRouteParamOptions) => {
    let currentPattern

    if (options && options.pattern) {
      currentPattern = { pattern: options.pattern }
    } else {
      switch (routePatterns.length) {
        case 0:
          currentPattern = { pattern: _routingStore.location.pathname }
          break

        case 1:
          currentPattern = routePatternsWithRegex[0]
          break

        default:
          currentPattern = routePatternsWithRegex.find(it => it.regex.test(_routingStore.location.pathname))
          break
      }
    }

    const params: any = routeParams.get()
    const newValueFormatted = format && newValue ? format(newValue) : newValue
    const currentParams = Array.isArray(options.cleanParams)
      ? omit(
          params,
          options.cleanParams.map(it => it._paramName)
        )
      : options.cleanParams === true
      ? {}
      : params

    currentPattern && setter(interpolateUrl(currentPattern!.pattern, { ...currentParams, [paramName]: newValueFormatted }))
  }

  computedValue.push = setRouteParamWith(_routingStore.history.push)
  computedValue.replace = setRouteParamWith(_routingStore.history.replace)

  return computedValue
}

const toDate = (d: string | Date) => (d instanceof Date ? d : new Date(d))

computedRouteParam.date = (
  paramName: string,
  { patterns, defaultValue }: Omit<ComputedRouteOptions<Date>, 'format' | 'parse'>
) => {
  return computedRouteParam(paramName, {
    patterns,
    parse: d => new Date(d),
    format: d =>
      toDate(d)
        .toISOString()
        .substr(0, 10),
    defaultValue,
  })
}

computedRouteParam.int = (
  paramName: string,
  { patterns, defaultValue }: Omit<ComputedRouteOptions<number>, 'format' | 'parse'>
) => {
  return computedRouteParam(paramName, {
    patterns,
    parse: parseInt,
    defaultValue,
  })
}

computedRouteParam.float = (
  paramName: string,
  { patterns, defaultValue }: Omit<ComputedRouteOptions<number>, 'format' | 'parse'>
) => {
  return computedRouteParam(paramName, {
    patterns,
    parse: parseFloat,
    defaultValue,
  })
}
