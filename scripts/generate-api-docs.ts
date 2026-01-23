#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * API Documentation Generator Script
 * Feature: 019-create-comprehensive-edge-functions-api-reference
 *
 * Generates comprehensive markdown documentation for Edge Functions using:
 * - functions-inventory.json (metadata from extract-edge-function-metadata.ts)
 * - category-mapping.json (functional categorization)
 *
 * Follows patterns from:
 * - docs/api/authentication.md
 * - docs/api/unified-work-management.md
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-api-docs.ts [options]
 *
 * Options:
 *   --help                Show this help message
 *   --category <id>       Generate docs for specific category (e.g., "positions", "intake")
 *   --all                 Generate docs for all categories
 *   --output <dir>        Output directory (default: docs/api/categories/)
 *   --format <type>       Output format: markdown (default), json
 *   --verbose             Show detailed generation information
 */

import { parse } from 'https://deno.land/std@0.208.0/flags/mod.ts';
import { ensureDir } from 'https://deno.land/std@0.208.0/fs/ensure_dir.ts';
import { join } from 'https://deno.land/std@0.208.0/path/mod.ts';

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
  lineNumber?: number;
}

interface PropertyInfo {
  name: string;
  type: string;
  optional: boolean;
}

interface FunctionInventory {
  totalFunctions: number;
  successfullyParsed: number;
  failed: number;
  functions: FunctionMetadata[];
  extractedAt?: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  priority: number;
  functions: string[];
  count: number;
}

interface CategoryMapping {
  version: string;
  description: string;
  lastUpdated: string;
  totalFunctions: number;
  categories: Category[];
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

const args = parse(Deno.args, {
  boolean: ['help', 'all', 'verbose'],
  string: ['category', 'output', 'format'],
  alias: {
    h: 'help',
    c: 'category',
    o: 'output',
    a: 'all',
    v: 'verbose',
  },
  default: {
    output: 'docs/api/categories',
    format: 'markdown',
  },
});

if (args.help) {
  console.log(`
Usage: generate-api-docs [options]

Generate comprehensive API documentation from Edge Function metadata.

Options:
  --help                Show this help message
  --category <id>       Generate docs for specific category (e.g., "positions", "intake")
  --all                 Generate docs for all categories
  --output <dir>        Output directory (default: docs/api/categories/)
  --format <type>       Output format: markdown (default), json
  --verbose             Show detailed generation information

Examples:
  # Generate docs for positions category
  deno run --allow-read --allow-write scripts/generate-api-docs.ts --category positions

  # Generate docs for all categories
  deno run --allow-read --allow-write scripts/generate-api-docs.ts --all

  # Generate with custom output directory
  deno run --allow-read --allow-write scripts/generate-api-docs.ts --all --output ./docs/api/custom
  `);
  Deno.exit(0);
}

// ============================================================================
// Utility Functions
// ============================================================================

function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const prefix = {
    info: 'ℹ',
    success: '✓',
    error: '✗',
    warn: '⚠',
  }[level];
  console.error(`${prefix} ${message}`);
}

function verbose(message: string) {
  if (args.verbose) {
    log(message, 'info');
  }
}

function formatTypeName(type: string): string {
  // Clean up type names for readability
  return type
    .replace(/\s+/g, ' ')
    .replace(/\|\s+/g, ' | ')
    .trim();
}

function generatePropertyTable(properties: PropertyInfo[]): string {
  if (properties.length === 0) return '';

  const rows = properties.map((prop) => {
    const name = prop.name;
    const type = `\`${formatTypeName(prop.type)}\``;
    const required = prop.optional ? 'No' : 'Yes';
    return `| \`${name}\` | ${type} | ${required} |`;
  });

  return `
| Parameter | Type | Required |
|-----------|------|----------|
${rows.join('\n')}
`;
}

function generateRequestExample(func: FunctionMetadata): string {
  if (func.interfaces.length === 0) return '';

  const requestInterface = func.interfaces.find(
    (i) =>
      i.name.toLowerCase().includes('request') ||
      i.name.toLowerCase().includes('payload') ||
      i.name.toLowerCase().includes('body')
  );

  if (!requestInterface || requestInterface.properties.length === 0) {
    return '';
  }

  const exampleObj: Record<string, unknown> = {};
  requestInterface.properties.forEach((prop) => {
    if (!prop.optional) {
      // Generate example values based on type
      if (prop.type.includes('string')) {
        exampleObj[prop.name] = 'example-value';
      } else if (prop.type.includes('number')) {
        exampleObj[prop.name] = 123;
      } else if (prop.type.includes('boolean')) {
        exampleObj[prop.name] = true;
      } else if (prop.type.includes('[]')) {
        exampleObj[prop.name] = [];
      } else if (prop.type.includes('{')) {
        exampleObj[prop.name] = {};
      } else {
        exampleObj[prop.name] = null;
      }
    }
  });

  return `
**Request Body:**
\`\`\`json
${JSON.stringify(exampleObj, null, 2)}
\`\`\`
`;
}

function generateResponseExample(func: FunctionMetadata): string {
  const responseInterface = func.interfaces.find(
    (i) =>
      i.name.toLowerCase().includes('response') ||
      i.name.toLowerCase().includes('result') ||
      i.name.toLowerCase().includes('output')
  );

  if (!responseInterface || responseInterface.properties.length === 0) {
    return `
**Response (200 OK):**
\`\`\`json
{
  "success": true,
  "data": {}
}
\`\`\`
`;
  }

  const exampleObj: Record<string, unknown> = {};
  responseInterface.properties.forEach((prop) => {
    if (prop.type.includes('string')) {
      exampleObj[prop.name] = 'example-value';
    } else if (prop.type.includes('number')) {
      exampleObj[prop.name] = 123;
    } else if (prop.type.includes('boolean')) {
      exampleObj[prop.name] = true;
    } else if (prop.type.includes('[]')) {
      exampleObj[prop.name] = [];
    } else if (prop.type.includes('{')) {
      exampleObj[prop.name] = {};
    } else {
      exampleObj[prop.name] = null;
    }
  });

  return `
**Response (200 OK):**
\`\`\`json
${JSON.stringify(exampleObj, null, 2)}
\`\`\`
`;
}

function generateImplementationExample(func: FunctionMetadata): string {
  const endpoint = func.endpoint || `/functions/v1/${func.relativePath}`;
  const method = func.httpMethods[0] || 'POST';
  const functionName = func.name
    .split('-')
    .map((word, idx) => (idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');

  return `
**Implementation Example:**
\`\`\`typescript
const ${functionName} = async () => {
  const response = await fetch('${endpoint}', {
    method: '${method}',
    headers: {
      'Authorization': \`Bearer \${supabaseToken}\`,
      'Content-Type': 'application/json'
    },${method !== 'GET' ? `
    body: JSON.stringify({
      // Add request parameters here
    })` : ''}
  });

  if (!response.ok) {
    throw new Error(\`Error: \${response.statusText}\`);
  }

  const data = await response.json();
  return data;
};
\`\`\`
`;
}

function generateFunctionDocumentation(func: FunctionMetadata): string {
  const title = func.name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const endpoint = func.endpoint || `/functions/v1/${func.relativePath}`;
  const method = func.httpMethods[0] || 'POST';
  const description = func.description || 'No description available';

  let doc = `### ${title}\n\n`;
  doc += `${description}\n\n`;
  doc += `**Endpoint:** \`${method} ${endpoint}\`\n\n`;

  // Authentication
  if (func.hasAuth) {
    doc += `**Authentication:** Required (Supabase JWT)\n\n`;
  }

  // Rate limiting
  if (func.hasRateLimit) {
    doc += `**Rate Limiting:** Yes\n\n`;
  }

  // Request parameters
  const requestInterface = func.interfaces.find(
    (i) =>
      i.name.toLowerCase().includes('request') ||
      i.name.toLowerCase().includes('payload') ||
      i.name.toLowerCase().includes('body')
  );

  if (requestInterface && requestInterface.properties.length > 0) {
    doc += `**Request Parameters:**\n`;
    doc += generatePropertyTable(requestInterface.properties);
    doc += '\n';
  }

  // Request example
  doc += generateRequestExample(func);

  // Response example
  doc += generateResponseExample(func);

  // Error responses
  doc += `
**Error Responses:**
- \`400 Bad Request\` - Invalid request parameters
- \`401 Unauthorized\` - Missing or invalid authentication${
    func.hasRateLimit ? `\n- \`429 Too Many Requests\` - Rate limit exceeded` : ''
  }
- \`500 Internal Server Error\` - Server error

`;

  // Implementation example
  doc += generateImplementationExample(func);

  // Shared dependencies
  if (func.sharedDependencies.length > 0) {
    doc += `**Shared Dependencies:**\n`;
    func.sharedDependencies.forEach((dep) => {
      doc += `- \`${dep}\`\n`;
    });
    doc += '\n';
  }

  doc += '---\n\n';

  return doc;
}

function generateCategoryDocumentation(
  category: Category,
  functionsMap: Map<string, FunctionMetadata>
): string {
  let doc = `# ${category.name}\n\n`;
  doc += `## Overview\n\n`;
  doc += `${category.description}\n\n`;
  doc += `**Total Functions:** ${category.count}\n\n`;

  // Table of contents
  doc += `## Functions\n\n`;
  category.functions.forEach((funcName) => {
    const func = functionsMap.get(funcName);
    if (func) {
      const title = funcName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const anchor = funcName.toLowerCase().replace(/\s+/g, '-');
      doc += `- [${title}](#${anchor})\n`;
    }
  });
  doc += '\n';

  // Common authentication section
  doc += `## Authentication\n\n`;
  doc += `All endpoints require authentication via Supabase JWT Bearer token:\n\n`;
  doc += `\`\`\`http\n`;
  doc += `Authorization: Bearer <supabase-jwt-token>\n`;
  doc += `Content-Type: application/json\n`;
  doc += `\`\`\`\n\n`;

  // Individual function documentation
  doc += `## Endpoints\n\n`;
  category.functions.forEach((funcName) => {
    const func = functionsMap.get(funcName);
    if (func) {
      doc += generateFunctionDocumentation(func);
    } else {
      verbose(`Warning: Function "${funcName}" not found in inventory`);
    }
  });

  return doc;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  try {
    // Load function inventory
    verbose('Loading function inventory...');
    const inventoryPath = 'docs/api/.metadata/functions-inventory.json';
    const inventoryText = await Deno.readTextFile(inventoryPath);
    const inventory: FunctionInventory = JSON.parse(inventoryText);
    log(`Loaded ${inventory.totalFunctions} functions from inventory`, 'success');

    // Load category mapping
    verbose('Loading category mapping...');
    const mappingPath = 'docs/api/.metadata/category-mapping.json';
    const mappingText = await Deno.readTextFile(mappingPath);
    const mapping: CategoryMapping = JSON.parse(mappingText);
    log(`Loaded ${mapping.categories.length} categories`, 'success');

    // Create function lookup map
    const functionsMap = new Map<string, FunctionMetadata>();
    inventory.functions.forEach((func) => {
      functionsMap.set(func.name, func);
    });

    // Ensure output directory exists
    await ensureDir(args.output);

    // Determine which categories to generate
    let categoriesToGenerate: Category[] = [];

    if (args.all) {
      categoriesToGenerate = mapping.categories;
      log('Generating documentation for all categories', 'info');
    } else if (args.category) {
      const category = mapping.categories.find((c) => c.id === args.category);
      if (!category) {
        log(`Category "${args.category}" not found`, 'error');
        log(`Available categories: ${mapping.categories.map((c) => c.id).join(', ')}`, 'info');
        Deno.exit(1);
      }
      categoriesToGenerate = [category];
      log(`Generating documentation for category: ${category.name}`, 'info');
    } else {
      log('Please specify --category <id> or --all', 'error');
      log('Use --help for usage information', 'info');
      Deno.exit(1);
    }

    // Generate documentation for each category
    let generatedCount = 0;
    for (const category of categoriesToGenerate) {
      verbose(`Generating documentation for ${category.name}...`);

      const markdown = generateCategoryDocumentation(category, functionsMap);
      const outputPath = join(args.output, `${category.id}.md`);

      await Deno.writeTextFile(outputPath, markdown);
      generatedCount++;
      log(`Generated: ${outputPath}`, 'success');
    }

    log(
      `\nSuccessfully generated ${generatedCount} documentation file(s)`,
      'success'
    );
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    if (args.verbose) {
      console.error(error);
    }
    Deno.exit(1);
  }
}

// Run main function
if (import.meta.main) {
  main();
}
