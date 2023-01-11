import { FalsyValue, FormatFunction } from './__types'

export const getValueFormatted = (value: unknown, formatFn: FormatFunction, falsyValuesAllowed: FalsyValue[]) => {
  if (value) {
    return formatFn(value)
  }

  if (value === '' && falsyValuesAllowed.includes(FalsyValue.EmptyString)) {
    return formatFn(value)
  }

  if (value === false && falsyValuesAllowed.includes(FalsyValue.False)) {
    return formatFn(value)
  }

  if (Number.isNaN(value) && falsyValuesAllowed.includes(FalsyValue.NaN)) {
    return formatFn(value)
  }

  if (value === null && falsyValuesAllowed.includes(FalsyValue.Null)) {
    return formatFn(value)
  }

  if (value === undefined && falsyValuesAllowed.includes(FalsyValue.Undefined)) {
    return formatFn(value)
  }

  if (value === 0 && falsyValuesAllowed.includes(FalsyValue.Zero)) {
    return formatFn(value)
  }

  return value
}
