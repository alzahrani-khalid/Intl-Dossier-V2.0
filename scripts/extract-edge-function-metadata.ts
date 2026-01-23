#!/usr/bin/env -S deno run --allow-read
/**
 * Edge Function Metadata Extraction Script
 * Feature: 019-create-comprehensive-edge-functions-api-reference
 *
 * Analyzes all Edge Functions in supabase/functions/ to extract:
 * - Function name and path
 * - HTTP methods supported
 * - Request/response interfaces
 * - JSDoc comments and API documentation
 * - Dependencies on _shared utilities
 * - Authentication requirements
 *
 * Usage:
 *   deno run --allow-read scripts/extract-edge-function-metadata.ts [options]
 *
 * Options:
 *   --help              Show this help message
 *   --output <file>     Write JSON output to file (default: stdout)
 *   --validate          Validate all functions were successfully parsed
 *   --verbose           Show detailed parsing information
 */

import { parse } from 'https://deno.land/std@0.208.0/flags/mod.ts';
import { walk } from 'https://deno.land/std@0.208.0/fs/walk.ts';
import { join, relative } from 'https://deno.land/std@0.208.0/path/mod.ts';

// ============================================================================
// Types
// ============================================================================

interface FunctionMetadata {
  name: string;
  path: string;
  relativePath: string;
  httpMethods: string[];
  description?: string;
  endpoint?: string;
  queryParams: ParameterInfo[];
  bodyParams: ParameterInfo[];
  responseType?: string;
  interfaces: InterfaceInfo[];
  sharedDependencies: string[];
  hasAuth: boolean;
  hasCors: boolean;
  hasRateLimit: boolean;
  jsdocComments: string[];
  feature?: string;
  errors: string[];
}

interface ParameterInfo {
  name: string;
  type?: string;
  required: boolean;
  description?: string;
}

interface InterfaceInfo {
  name: string;
  properties: PropertyInfo[];
  lineNumber: number;
}

interface PropertyInfo {
  name: string;
  type: string;
  optional: boolean;
}

interface ExtractionResult {
  totalFunctions: number;
  successfullyParsed: number;
  failed: number;
  functions: FunctionMetadata[];
  extractedAt: string;
  summary: {
    byMethod: Record<string, number>;
    byFeature: Record<string, number>;
    withAuth: number;
    withRateLimit: number;
    totalInterfaces: number;
  };
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

const args = parse(Deno.args, {
  boolean: ['help', 'validate', 'verbose'],
  string: ['output'],
  alias: {
    h: 'help',
    o: 'output',
    v: 'verbose',
  },
});

if (args.help) {
  console.log(`
Usage: extract-edge-function-metadata [options]

Extract metadata from Supabase Edge Functions for API documentation.

Options:
  -h, --help              Show this help message
  -o, --output <file>     Write JSON output to file (default: stdout)
      --validate          Validate all functions were successfully parsed
  -v, --verbose           Show detailed parsing information

Examples:
  # Display metadata as JSON
  deno run --allow-read scripts/extract-edge-function-metadata.ts

  # Save to file
  deno run --allow-read scripts/extract-edge-function-metadata.ts --output docs/api/.metadata/functions-inventory.json

  # Validate extraction
  deno run --allow-read scripts/extract-edge-function-metadata.ts --validate
  `);
  Deno.exit(0);
}

// ============================================================================
// Metadata Extraction Functions
// ============================================================================

/**
 * Extract JSDoc comments from file content
 */
function extractJSDocComments(content: string): string[] {
  const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
  const comments: string[] = [];
  let match;

  while ((match = jsdocRegex.exec(content)) !== null) {
    comments.push(match[1].trim());
  }

  return comments;
}

/**
 * Extract endpoint information from JSDoc comments
 */
function extractEndpoint(jsdocComments: string[]): string | undefined {
  for (const comment of jsdocComments) {
    const endpointMatch = comment.match(/@endpoint\s+(GET|POST|PUT|PATCH|DELETE)\s+(.+)/);
    if (endpointMatch) {
      return `${endpointMatch[1]} ${endpointMatch[2].trim()}`;
    }
  }
  return undefined;
}

/**
 * Extract description from JSDoc comments
 */
function extractDescription(jsdocComments: string[]): string | undefined {
  if (jsdocComments.length === 0) return undefined;

  // First comment block, before any @tags
  const firstComment = jsdocComments[0];
  const lines = firstComment.split('\n');
  const descriptionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.replace(/^\s*\*\s?/, '').trim();
    if (trimmed.startsWith('@')) break;
    if (trimmed) descriptionLines.push(trimmed);
  }

  return descriptionLines.length > 0 ? descriptionLines.join(' ') : undefined;
}

/**
 * Extract feature tag from JSDoc comments
 */
function extractFeature(jsdocComments: string[]): string | undefined {
  for (const comment of jsdocComments) {
    const featureMatch = comment.match(/Feature:\s*([^\n]+)/i);
    if (featureMatch) {
      return featureMatch[1].trim();
    }
  }
  return undefined;
}

/**
 * Extract query parameters from JSDoc comments
 */
function extractQueryParams(jsdocComments: string[]): ParameterInfo[] {
  const params: ParameterInfo[] = [];

  for (const comment of jsdocComments) {
    const lines = comment.split('\n');
    for (const line of lines) {
      const queryMatch = line.match(/@query\s+(\w+)\s*-\s*(.+?)(?:\s*\((required|optional)\))?$/i);
      if (queryMatch) {
        const [, name, description, requirement] = queryMatch;
        params.push({
          name,
          description: description.trim(),
          required: requirement?.toLowerCase() === 'required' || description.includes('(required)'),
        });
      }
    }
  }

  return params;
}

/**
 * Extract HTTP methods from code
 */
function extractHTTPMethods(content: string): string[] {
  const methods = new Set<string>();

  // Check for explicit method checks
  const methodChecks = content.matchAll(/req\.method\s*===\s*['"](\w+)['"]/g);
  for (const match of methodChecks) {
    methods.add(match[1]);
  }

  // Check for method validation
  const allowedMethods = content.matchAll(/allowed.*methods?.*['"](\w+)['"]/gi);
  for (const match of allowedMethods) {
    methods.add(match[1].toUpperCase());
  }

  // If no methods found but serve() exists, assume it handles the method internally
  if (methods.size === 0 && content.includes('serve(')) {
    // Check endpoint JSDoc for method
    const endpointMatch = content.match(/@endpoint\s+(GET|POST|PUT|PATCH|DELETE)/);
    if (endpointMatch) {
      methods.add(endpointMatch[1]);
    }
  }

  // Remove OPTIONS as it's just for CORS
  methods.delete('OPTIONS');

  return Array.from(methods);
}

/**
 * Extract TypeScript interfaces from code
 */
function extractInterfaces(content: string): InterfaceInfo[] {
  const interfaces: InterfaceInfo[] = [];
  const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;
  let match;

  while ((match = interfaceRegex.exec(content)) !== null) {
    const [, name, body] = match;
    const properties: PropertyInfo[] = [];

    // Parse interface properties
    const propertyLines = body.split('\n');
    for (const line of propertyLines) {
      const propMatch = line.match(/^\s*(\w+)(\?)?:\s*(.+?);?\s*$/);
      if (propMatch) {
        const [, propName, optional, type] = propMatch;
        properties.push({
          name: propName,
          type: type.trim(),
          optional: optional === '?',
        });
      }
    }

    // Find line number
    const lineNumber = content.substring(0, match.index).split('\n').length;

    interfaces.push({ name, properties, lineNumber });
  }

  return interfaces;
}

/**
 * Extract shared dependencies
 */
function extractSharedDependencies(content: string): string[] {
  const dependencies = new Set<string>();
  const importRegex = /from\s+['"]\.\.?\/_shared\/([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    dependencies.add(match[1].replace('.ts', ''));
  }

  return Array.from(dependencies);
}

/**
 * Check for authentication requirements
 */
function hasAuthentication(content: string): boolean {
  return (
    content.includes('auth.getUser()') ||
    content.includes('validateJWT') ||
    content.includes('createUserClient') ||
    content.includes('Authorization')
  );
}

/**
 * Check for CORS headers
 */
function hasCORS(content: string): boolean {
  return content.includes('corsHeaders') || content.includes('CORS');
}

/**
 * Check for rate limiting
 */
function hasRateLimiting(content: string): boolean {
  return (
    content.includes('rate-limit') ||
    content.includes('rateLimit') ||
    content.includes('RateLimiter')
  );
}

/**
 * Extract metadata from a single Edge Function
 */
async function extractFunctionMetadata(
  functionPath: string,
  functionName: string,
  basePath: string
): Promise<FunctionMetadata> {
  const metadata: FunctionMetadata = {
    name: functionName,
    path: functionPath,
    relativePath: relative(basePath, functionPath),
    httpMethods: [],
    queryParams: [],
    bodyParams: [],
    interfaces: [],
    sharedDependencies: [],
    hasAuth: false,
    hasCors: false,
    hasRateLimit: false,
    jsdocComments: [],
    errors: [],
  };

  try {
    // Read index.ts file
    const indexPath = join(functionPath, 'index.ts');
    const content = await Deno.readTextFile(indexPath);

    // Extract JSDoc comments
    metadata.jsdocComments = extractJSDocComments(content);

    // Extract endpoint and description
    metadata.endpoint = extractEndpoint(metadata.jsdocComments);
    metadata.description = extractDescription(metadata.jsdocComments);
    metadata.feature = extractFeature(metadata.jsdocComments);

    // Extract parameters
    metadata.queryParams = extractQueryParams(metadata.jsdocComments);

    // Extract HTTP methods
    metadata.httpMethods = extractHTTPMethods(content);

    // Extract interfaces
    metadata.interfaces = extractInterfaces(content);

    // Extract dependencies
    metadata.sharedDependencies = extractSharedDependencies(content);

    // Check for features
    metadata.hasAuth = hasAuthentication(content);
    metadata.hasCors = hasCORS(content);
    metadata.hasRateLimit = hasRateLimiting(content);
  } catch (error) {
    metadata.errors.push(`Failed to parse: ${error.message}`);
  }

  return metadata;
}

/**
 * Extract metadata from all Edge Functions
 */
async function extractAllMetadata(
  functionsDir: string
): Promise<ExtractionResult> {
  const functions: FunctionMetadata[] = [];
  let successfullyParsed = 0;
  let failed = 0;

  // Walk through functions directory
  for await (const entry of Deno.readDir(functionsDir)) {
    if (!entry.isDirectory || entry.name.startsWith('_')) {
      continue;
    }

    const functionPath = join(functionsDir, entry.name);

    if (args.verbose) {
      console.error(`Processing: ${entry.name}`);
    }

    const metadata = await extractFunctionMetadata(
      functionPath,
      entry.name,
      functionsDir
    );

    functions.push(metadata);

    if (metadata.errors.length === 0) {
      successfullyParsed++;
    } else {
      failed++;
      if (args.verbose) {
        console.error(`  Errors: ${metadata.errors.join(', ')}`);
      }
    }
  }

  // Generate summary statistics
  const byMethod: Record<string, number> = {};
  const byFeature: Record<string, number> = {};
  let withAuth = 0;
  let withRateLimit = 0;
  let totalInterfaces = 0;

  for (const func of functions) {
    // Count by method
    for (const method of func.httpMethods) {
      byMethod[method] = (byMethod[method] || 0) + 1;
    }

    // Count by feature
    if (func.feature) {
      byFeature[func.feature] = (byFeature[func.feature] || 0) + 1;
    }

    // Count auth and rate limiting
    if (func.hasAuth) withAuth++;
    if (func.hasRateLimit) withRateLimit++;

    // Count interfaces
    totalInterfaces += func.interfaces.length;
  }

  return {
    totalFunctions: functions.length,
    successfullyParsed,
    failed,
    functions: functions.sort((a, b) => a.name.localeCompare(b.name)),
    extractedAt: new Date().toISOString(),
    summary: {
      byMethod,
      byFeature,
      withAuth,
      withRateLimit,
      totalInterfaces,
    },
  };
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const functionsDir = './supabase/functions';

  // Check if directory exists
  try {
    await Deno.stat(functionsDir);
  } catch {
    console.error(`Error: Directory not found: ${functionsDir}`);
    console.error('Make sure you are running this script from the project root.');
    Deno.exit(1);
  }

  if (args.verbose) {
    console.error('Extracting metadata from Edge Functions...\n');
  }

  // Extract metadata
  const result = await extractAllMetadata(functionsDir);

  // Validate if requested
  if (args.validate) {
    console.error('\n=== Validation Results ===');
    console.error(`Total functions: ${result.totalFunctions}`);
    console.error(`Successfully parsed: ${result.successfullyParsed}`);
    console.error(`Failed: ${result.failed}`);

    if (result.failed > 0) {
      console.error('\nFunctions with errors:');
      for (const func of result.functions) {
        if (func.errors.length > 0) {
          console.error(`  - ${func.name}: ${func.errors.join(', ')}`);
        }
      }
      Deno.exit(1);
    } else {
      console.error('\n✓ All functions successfully parsed');
      Deno.exit(0);
    }
  }

  // Output JSON
  const jsonOutput = JSON.stringify(result, null, 2);

  if (args.output) {
    await Deno.writeTextFile(args.output, jsonOutput);
    if (args.verbose) {
      console.error(`\n✓ Metadata written to: ${args.output}`);
    }
  } else {
    console.log(jsonOutput);
  }

  // Summary in verbose mode
  if (args.verbose) {
    console.error('\n=== Summary ===');
    console.error(`Total functions: ${result.totalFunctions}`);
    console.error(`Successfully parsed: ${result.successfullyParsed}`);
    console.error(`HTTP Methods: ${JSON.stringify(result.summary.byMethod, null, 2)}`);
    console.error(`With Auth: ${result.summary.withAuth}`);
    console.error(`With Rate Limiting: ${result.summary.withRateLimit}`);
    console.error(`Total Interfaces: ${result.summary.totalInterfaces}`);
  }
}

// Run main function
if (import.meta.main) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    Deno.exit(1);
  });
}
