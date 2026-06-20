import * as esbuild from 'esbuild'
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join, relative, dirname } from 'path'

// agent-runtime build (mirrors backend/build.mjs): transpile each .ts under src/ to
// ESM in dist/ with esbuild (bundle:false), then post-process relative imports to
// carry explicit .js extensions so Node's ESM loader resolves them at runtime.

function getAllTsFiles(dir, files = []) {
  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'tests', '__tests__', '__scaffold__'].includes(item)) {
        getAllTsFiles(fullPath, files)
      }
    } else if (
      item.endsWith('.ts') &&
      !item.endsWith('.test.ts') &&
      !item.endsWith('.spec.ts') &&
      !item.endsWith('.d.ts')
    ) {
      files.push(fullPath)
    }
  }
  return files
}

function getAllJsFiles(dir, files = []) {
  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      getAllJsFiles(fullPath, files)
    } else if (item.endsWith('.js')) {
      files.push(fullPath)
    }
  }
  return files
}

function resolveImportPath(importPath, currentFilePath) {
  const currentDir = dirname(currentFilePath)
  const relativeDist = currentDir.replace(/^dist\/?/, '')
  let fullImportPath
  if (importPath.startsWith('./')) {
    fullImportPath = join('dist', relativeDist, importPath.slice(2))
  } else if (importPath.startsWith('../')) {
    fullImportPath = join('dist', relativeDist, importPath)
  } else {
    return importPath
  }
  if (existsSync(fullImportPath) && statSync(fullImportPath).isDirectory()) {
    if (existsSync(join(fullImportPath, 'index.js'))) {
      return importPath + '/index.js'
    }
  }
  if (existsSync(fullImportPath + '.js')) {
    return importPath + '.js'
  }
  return importPath + '.js'
}

function addJsExtensions(filePath) {
  let content = readFileSync(filePath, 'utf8')
  const importRegex = /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g
  const dynamicImportRegex = /(import\s*\(\s*['"])(\.\.?\/[^'"]+?)(['"]\s*\))/g
  content = content.replace(importRegex, (match, prefix, path, suffix) => {
    if (path.match(/\.(js|json|mjs|cjs|node)$/)) return match
    return `${prefix}${resolveImportPath(path, filePath)}${suffix}`
  })
  content = content.replace(dynamicImportRegex, (match, prefix, path, suffix) => {
    if (path.match(/\.(js|json|mjs|cjs|node)$/)) return match
    return `${prefix}${resolveImportPath(path, filePath)}${suffix}`
  })
  writeFileSync(filePath, content)
}

const entryPoints = getAllTsFiles('src')
console.log(`Building ${entryPoints.length} files...`)

try {
  await esbuild.build({
    entryPoints,
    bundle: false,
    outdir: 'dist',
    platform: 'node',
    target: 'node22',
    format: 'esm',
    sourcemap: true,
    outbase: 'src',
    logLevel: 'warning',
  })
  console.log('Build completed, adding .js extensions to imports...')
  const distFiles = getAllJsFiles('dist')
  for (const file of distFiles) {
    addJsExtensions(file)
  }
  console.log(`Processed ${distFiles.length} files. Build completed successfully!`)
} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}
