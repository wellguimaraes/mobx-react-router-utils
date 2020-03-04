import intersectionBy from 'lodash/intersectionBy'
import { IRouteSetter } from './__types'
import { CLEAN_SYMBOL } from './constants'
import { interpolateUrl } from './interpolateUrl'
import { getRoutingStore } from './routingStore'

let updateRouteTimeout = 0

const paramsToUpdate: {
  params: any
  key: string
  value: string
  patterns?: { regex?: RegExp; pattern: string }[]
}[] = []

export const getUpdatedRoute = (params: typeof paramsToUpdate = paramsToUpdate) => {
  if (!params.length) return ''

  const _paramsToUpdate = params.map(it => it)
  params.length = 0

  const keysToUpdate = Object.fromEntries(_paramsToUpdate.map(it => [it.key]))

  const newParams = _paramsToUpdate.reduce((prev, curr) => {
    Object.entries(curr.params).forEach(([k, v]) => {
      if (prev[k] !== CLEAN_SYMBOL && !keysToUpdate.hasOwnProperty(k)) {
        prev[k] = v
      }
    })

    prev[curr.key] = curr.value

    return prev
  }, {} as any)

  const commonPatterns = intersectionBy.apply(null, [..._paramsToUpdate.map(it => it.patterns), 'pattern'] as any) as {
    pattern: string
    regex?: RegExp
  }[]

  const newPattern = commonPatterns.find(it =>
    it.regex ? it.regex.test(getRoutingStore().location.pathname) : it.pattern === getRoutingStore().location.pathname
  ) || commonPatterns[0]

  if (!commonPatterns.length) {
    throw new Error("Couldn't define a common route for the update")
  }

  return interpolateUrl(newPattern.pattern, newParams)
}

export const requestRouteUpdate = (
  setter: IRouteSetter,
  params: typeof paramsToUpdate extends Array<infer U> ? U : typeof paramsToUpdate
) => {
  return new Promise<string>(resolve => {
    clearTimeout(updateRouteTimeout)

    paramsToUpdate.push(params)

    updateRouteTimeout = setTimeout(() => {
      const newRoute = getUpdatedRoute(paramsToUpdate)
      newRoute && setter(newRoute)
      resolve(newRoute)
    })
  })
}
