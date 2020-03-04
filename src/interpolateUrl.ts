import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import { compile, Key, pathToRegexp } from 'path-to-regexp'
import { parse as parseQueryString, stringify as toQueryString } from 'query-string'
import { CLEAN_SYMBOL } from './constants'

const getLocationQuery = () => parseQueryString(window.location.search)

const ensureLeft = (str: string, prefix: string) => {
  if (str.startsWith(prefix)) return str
  return prefix + str
}

export const interpolateUrl = (pattern: string, params: any) => {
  const pathKeys = [] as Key[]

  pathToRegexp(pattern, pathKeys)
  const toPath = compile(pattern)
  const namesOfPathKeys = pathKeys.map(it => it.name)

  const queryParams = omit(params, namesOfPathKeys)
  const pathParams = pick(params, namesOfPathKeys)

  const isIgnorable = (value: any) =>
    value === null || value === undefined || value === '' || value === CLEAN_SYMBOL || value === 'false' || value === false

  const query = toQueryString({
    ...omitBy(queryParams, isIgnorable),
    ...pickBy(getLocationQuery(), (value, key: string) => key.startsWith('utm')),
  })

  return toPath(pathParams) + (query && ensureLeft(query, '?'))
}
