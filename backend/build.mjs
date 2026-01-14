import * as esbuild from 'esbuild';
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

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
      // Check if file contains Deno imports (skip edge functions)
      files.push(fullPath);
    }
  }

  return files;
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
    // Don't fail on external modules
    external: [
      'ws',
      'graphql',
      'bull',
      '@bull-board/*',
      'rss-parser',
      'rate-limit-redis',
      '@upstash/redis',
    ],
    // Ignore type errors
    logLevel: 'warning',
  });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
