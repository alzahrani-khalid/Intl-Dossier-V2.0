/**
 * Canonical static resolver for react-i18next useTranslation namespace bindings.
 *
 * The shipped application uses all three supported forms:
 *   useTranslation('feature')
 *   useTranslation(['feature', 'common'])
 *   useTranslation()
 *
 * Keep source instruments on this module. A copied regular expression was the
 * generation-zero defect fixed by P99-04: it retained only the first array
 * namespace and did not recognise a bare binding.
 */

export const I18NEXT_DEFAULT_NAMESPACE = 'translation'

const isIdentifierPart = (character) => /[A-Za-z0-9_$]/.test(character ?? '')

const skipQuoted = (source, start) => {
  const quote = source[start]
  let escaped = false
  for (let index = start + 1; index < source.length; index++) {
    const character = source[index]
    if (escaped) {
      escaped = false
    } else if (character === '\\') {
      escaped = true
    } else if (character === quote) {
      return index + 1
    }
  }
  return source.length
}

const skipLineComment = (source, start) => {
  const newline = source.indexOf('\n', start + 2)
  return newline === -1 ? source.length : newline + 1
}

const skipBlockComment = (source, start) => {
  const close = source.indexOf('*/', start + 2)
  return close === -1 ? source.length : close + 2
}

const findClosingParen = (source, open) => {
  let depth = 0
  for (let index = open; index < source.length; index++) {
    const character = source[index]
    const next = source[index + 1]
    if (character === "'" || character === '"' || character === '`') {
      index = skipQuoted(source, index) - 1
    } else if (character === '/' && next === '/') {
      index = skipLineComment(source, index) - 1
    } else if (character === '/' && next === '*') {
      index = skipBlockComment(source, index) - 1
    } else if (character === '(') {
      depth++
    } else if (character === ')' && --depth === 0) {
      return index
    }
  }
  return -1
}

const staticStringAt = (source, start) => {
  const quote = source[start]
  if (quote !== "'" && quote !== '"') return undefined
  let value = ''
  let escaped = false
  for (let index = start + 1; index < source.length; index++) {
    const character = source[index]
    if (escaped) {
      value += character
      escaped = false
    } else if (character === '\\') {
      escaped = true
    } else if (character === quote) {
      return { value, end: index + 1 }
    } else {
      value += character
    }
  }
  return undefined
}

const parseCall = (argumentSource, start, end) => {
  const leadingWhitespace = argumentSource.match(/^\s*/)?.[0].length ?? 0
  const first = leadingWhitespace
  if (first === argumentSource.length) {
    return { shape: 'bare', namespaces: [I18NEXT_DEFAULT_NAMESPACE], start, end }
  }

  const named = staticStringAt(argumentSource, first)
  if (named) return { shape: 'string', namespaces: [named.value], start, end }

  if (argumentSource[first] === '[') {
    const close = argumentSource.lastIndexOf(']')
    if (close === -1) return { shape: 'dynamic', namespaces: [], start, end }
    const namespaces = []
    for (let index = first + 1; index < close; index++) {
      const literal = staticStringAt(argumentSource, index)
      if (literal) {
        namespaces.push(literal.value)
        index = literal.end - 1
      }
    }
    return { shape: 'array', namespaces: [...new Set(namespaces)], start, end }
  }

  return { shape: 'dynamic', namespaces: [], start, end }
}

/** Parse real useTranslation calls while ignoring comments and string literals. */
export const findUseTranslationBindings = (source) => {
  const calls = []
  for (let index = 0; index < source.length; index++) {
    const character = source[index]
    const next = source[index + 1]
    if (character === "'" || character === '"' || character === '`') {
      index = skipQuoted(source, index) - 1
      continue
    }
    if (character === '/' && next === '/') {
      index = skipLineComment(source, index) - 1
      continue
    }
    if (character === '/' && next === '*') {
      index = skipBlockComment(source, index) - 1
      continue
    }

    const token = 'useTranslation'
    if (!source.startsWith(token, index)) continue
    if (isIdentifierPart(source[index - 1]) || isIdentifierPart(source[index + token.length]))
      continue
    let open = index + token.length
    while (/\s/.test(source[open] ?? '')) open++
    if (source[open] !== '(') continue
    const close = findClosingParen(source, open)
    if (close === -1) continue
    calls.push(parseCall(source.slice(open + 1, close), index, close + 1))
    index = close
  }
  return calls
}

/**
 * Resolve the effective per-file namespace population used by the static audits.
 * Multiple hooks are unioned because the existing instruments audit literal t(...)
 * sites file-by-file. Files with no local hook retain i18next's default binding.
 */
export const resolveI18nBinding = (source) => {
  const calls = findUseTranslationBindings(source)
  const namespaces = [...new Set(calls.flatMap((call) => call.namespaces))]
  return {
    calls,
    namespaces: namespaces.length > 0 ? namespaces : [I18NEXT_DEFAULT_NAMESPACE],
    shapes: Object.fromEntries(
      ['string', 'array', 'bare', 'dynamic'].map((shape) => [
        shape,
        calls.filter((call) => call.shape === shape).length,
      ]),
    ),
  }
}

/**
 * Reproduce the superseded resolver from the already-parsed canonical calls.
 * This exists only to make the binding defect measurable in controls and reports;
 * consumers never parse useTranslation a second way.
 */
export const defectiveBindingFrom = (binding) => {
  const namespaces = []
  for (const call of binding.calls) {
    if (call.shape === 'string') namespaces.push(...call.namespaces)
    if (call.shape === 'array' && call.namespaces.length > 0) namespaces.push(call.namespaces[0])
    // The defective resolver did not recognise bare calls.
  }
  const unique = [...new Set(namespaces)]
  return {
    namespaces: unique.length > 0 ? unique : [I18NEXT_DEFAULT_NAMESPACE],
    arrayNamespacesDropped: binding.calls
      .filter((call) => call.shape === 'array')
      .reduce((total, call) => total + Math.max(0, call.namespaces.length - 1), 0),
    bareCallsUnrecognised: binding.calls.filter((call) => call.shape === 'bare').length,
  }
}
