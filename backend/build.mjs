import * as esbuild from 'esbuild';
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';

// Collect all TypeScript files recursively, excluding test files and Deno edge functions
function getAllTsFiles(dir, files = []) {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, tests, and edge function directories
      if (!['node_modules', 'dist', 'tests', '__tests__'].includes(item)) {
        getAllTsFiles(fullPath, files);
      }
    } else if (
      item.endsWith('.ts') &&
      !item.endsWith('.test.ts') &&
      !item.endsWith('.spec.ts') &&
      !item.endsWith('.d.ts')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

// Collect all JS files in dist directory
function getAllJsFiles(dir, files = []) {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      getAllJsFiles(fullPath, files);
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Resolve the correct path for an import
function resolveImportPath(importPath, currentFilePath) {
  const currentDir = dirname(currentFilePath);

  // Convert dist path back to what it would be (remove leading dist/)
  const relativeDist = currentDir.replace(/^dist\/?/, '');

  // Calculate the full path the import is pointing to
  let fullImportPath;
  if (importPath.startsWith('./')) {
    fullImportPath = join('dist', relativeDist, importPath.slice(2));
  } else if (importPath.startsWith('../')) {
    fullImportPath = join('dist', relativeDist, importPath);
  } else {
    return importPath; // Not a relative import
  }

  // Check if it's a directory with index.js
  if (existsSync(fullImportPath) && statSync(fullImportPath).isDirectory()) {
    if (existsSync(join(fullImportPath, 'index.js'))) {
      return importPath + '/index.js';
    }
  }

  // Check if adding .js makes it a valid file
  if (existsSync(fullImportPath + '.js')) {
    return importPath + '.js';
  }

  // Fallback: just add .js
  return importPath + '.js';
}

// Add .js extension to relative imports
function addJsExtensions(filePath) {
  let content = readFileSync(filePath, 'utf8');

  // Match import/export statements with relative paths that don't have extensions
  const importRegex = /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g;
  const dynamicImportRegex = /(import\s*\(\s*['"])(\.\.?\/[^'"]+?)(['"]\s*\))/g;

  content = content.replace(importRegex, (match, prefix, path, suffix) => {
    // Don't modify if it already has an extension
    if (path.match(/\.(js|json|mjs|cjs|node)$/)) {
      return match;
    }
    const resolvedPath = resolveImportPath(path, filePath);
    return `${prefix}${resolvedPath}${suffix}`;
  });

  content = content.replace(dynamicImportRegex, (match, prefix, path, suffix) => {
    // Don't modify if it already has an extension
    if (path.match(/\.(js|json|mjs|cjs|node)$/)) {
      return match;
    }
    const resolvedPath = resolveImportPath(path, filePath);
    return `${prefix}${resolvedPath}${suffix}`;
  });

  writeFileSync(filePath, content);
}

// Files to exclude (Deno edge functions and problematic files)
const excludePatterns = [
  'src/api/ai-extraction/',
  'src/api/pdf-generation/',
  'src/utils/session-invalidator.ts',
  'src/graphql/',
  'src/jobs/index.ts',
  'src/middleware/rateLimiter.ts',
  'src/middleware/rate-limit.middleware.ts',
  'src/realtime/WebSocketServer.ts',
  'src/services/IntelligenceSourceService.ts',
];

const srcDir = 'src';
const allFiles = getAllTsFiles(srcDir);

// Filter out excluded files
const entryPoints = allFiles.filter(file => {
  const relativePath = relative('.', file);
  return !excludePatterns.some(pattern => relativePath.includes(pattern));
});

console.log(`Building ${entryPoints.length} files...`);

try {
  await esbuild.build({
    entryPoints,
    bundle: false,
    outdir: 'dist',
    platform: 'node',
    target: 'node20',
    format: 'esm',
    sourcemap: true,
    // Preserve directory structure
    outbase: 'src',
    // Ignore type errors
    logLevel: 'warning',
  });

  console.log('Build completed, adding .js extensions to imports...');

  // Post-process: Add .js extensions to all relative imports
  const distFiles = getAllJsFiles('dist');
  for (const file of distFiles) {
    addJsExtensions(file);
  }

  console.log(`Processed ${distFiles.length} files. Build completed successfully!`);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
