import memoizee from 'memoizee'
import { computed } from 'mobx'
import { match } from 'path-to-regexp'
import { parse as parseQueryString } from 'query-string'
import { getRoutingStore } from './routingStore'

const _emptyObject = {}

export const getComputedRouteParams = memoizee((routePatterns: string[]) => {
  const matchers = routePatterns.map(
    it => match(it, { decode: decodeURIComponent }))

  return computed(() => {
    let pathParams = {}
    let queryParams = parseQueryString(getRoutingStore().location.search)

    for (let match of matchers) {
      let matchResult: false | { params: any } = match(
        getRoutingStore().location.pathname)

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