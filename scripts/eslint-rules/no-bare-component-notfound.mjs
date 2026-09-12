/**
 * NOTFOUND-COMPONENT-01 — a bare `notFound()` thrown from a COMPONENT never reaches the root
 * 404 page in @tanstack/react-router@1.170.8. The router sets a `defaultErrorComponent`
 * (frontend/src/router/index.tsx), which gives every match a CatchBoundary whose onCatch stamps
 * `error.routeId ??= <innermost match>` on the way up; the root then rejects a not-found that
 * claims a route with no notFoundComponent, and the user sees "Something went wrong" instead of
 * the 404. Pre-stamping with `{ routeId: rootRouteId }` makes the `??=` a no-op.
 *
 * Thrown from a route `loader` / `beforeLoad`, the bare form is CORRECT — the not-found is raised
 * before any match owns it. That ancestry is the only discriminator, and esquery has no
 * ancestor-negation combinator, so a `no-restricted-syntax` selector cannot express this rule
 * (it would false-positive on the loader form). Hence this walker.
 */

/** @param {import('estree').Node | undefined} key */
const keyName = (key, computed) => {
  if (computed || !key) return undefined
  if (key.type === 'Identifier') return key.name
  if (key.type === 'Literal') return String(key.value)
  return undefined
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require { routeId } on component-thrown notFound(); the bare form is only correct inside a route loader/beforeLoad.',
    },
    schema: [],
    messages: {
      bareComponentNotFound:
        'Component-thrown notFound() must pass { routeId } — a bare throw reaches the defaultErrorComponent, not the 404 page (NOTFOUND-COMPONENT-01).',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'notFound') return

        // Compliant: first argument is an object literal carrying a `routeId` property.
        // `{ global: true }` (the deprecated spelling) and any other argument are NOT compliant.
        const [first] = node.arguments
        const compliant =
          first?.type === 'ObjectExpression' &&
          first.properties.some(
            (p) => p.type === 'Property' && keyName(p.key, p.computed) === 'routeId',
          )
        if (compliant) return

        // Exempt the bare loader form: any ancestor Property keyed `loader` or `beforeLoad`.
        for (let current = node.parent; current; current = current.parent) {
          if (current.type !== 'Property') continue
          const name = keyName(current.key, current.computed)
          if (name === 'loader' || name === 'beforeLoad') return
        }

        context.report({ node, messageId: 'bareComponentNotFound' })
      },
    }
  },
}
