// Regenerate TanStack Router routeTree.gen.ts by invoking the plugin's generator directly.
// Usage: node scripts/regen-routes.mjs
import path from 'node:path'
import { generator } from '@tanstack/router-plugin/generator'

await generator({
  routesDirectory: path.resolve('src/routes'),
  generatedRouteTree: path.resolve('src/routeTree.gen.ts'),
  routeFileIgnorePrefix: '-',
  quoteStyle: 'single',
  semicolons: false,
})

console.log('routeTree.gen.ts regenerated')
