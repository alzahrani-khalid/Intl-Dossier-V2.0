#!/usr/bin/env python3
"""
Edge Function Metadata Extraction Script
Feature: 019-create-comprehensive-edge-functions-api-reference

Analyzes all Edge Functions in supabase/functions/ to extract:
- Function name and path
- HTTP methods supported
- Request/response interfaces
- JSDoc comments and API documentation
- Dependencies on _shared utilities
- Authentication requirements

Usage:
  python3 scripts/extract-edge-function-metadata.py [options]

Options:
  --help              Show this help message
  --output <file>     Write JSON output to file (default: stdout)
  --validate          Validate all functions were successfully parsed
  --verbose           Show detailed parsing information
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional, Set


class ParameterInfo:
    def __init__(self, name: str, description: str = "", required: bool = False, param_type: str = ""):
        self.name = name
        self.type = param_type
        self.required = required
        self.description = description

    def to_dict(self):
        return {
            "name": self.name,
            "type": self.type,
            "required": self.required,
            "description": self.description
        }


class PropertyInfo:
    def __init__(self, name: str, prop_type: str, optional: bool = False):
        self.name = name
        self.type = prop_type
        self.optional = optional

    def to_dict(self):
        return {
            "name": self.name,
            "type": self.type,
            "optional": self.optional
        }


class InterfaceInfo:
    def __init__(self, name: str, properties: List[PropertyInfo], line_number: int):
        self.name = name
        self.properties = properties
        self.line_number = line_number

    def to_dict(self):
        return {
            "name": self.name,
            "properties": [prop.to_dict() for prop in self.properties],
            "lineNumber": self.line_number
        }


class FunctionMetadata:
    def __init__(self, name: str, path: str, relative_path: str):
        self.name = name
        self.path = path
        self.relative_path = relative_path
        self.http_methods: List[str] = []
        self.description: Optional[str] = None
        self.endpoint: Optional[str] = None
        self.query_params: List[ParameterInfo] = []
        self.body_params: List[ParameterInfo] = []
        self.response_type: Optional[str] = None
        self.interfaces: List[InterfaceInfo] = []
        self.shared_dependencies: List[str] = []
        self.has_auth = False
        self.has_cors = False
        self.has_rate_limit = False
        self.jsdoc_comments: List[str] = []
        self.feature: Optional[str] = None
        self.errors: List[str] = []

    def to_dict(self):
        return {
            "name": self.name,
            "path": self.path,
            "relativePath": self.relative_path,
            "httpMethods": self.http_methods,
            "description": self.description,
            "endpoint": self.endpoint,
            "queryParams": [p.to_dict() for p in self.query_params],
            "bodyParams": [p.to_dict() for p in self.body_params],
            "responseType": self.response_type,
            "interfaces": [i.to_dict() for i in self.interfaces],
            "sharedDependencies": self.shared_dependencies,
            "hasAuth": self.has_auth,
            "hasCors": self.has_cors,
            "hasRateLimit": self.has_rate_limit,
            "jsdocComments": self.jsdoc_comments,
            "feature": self.feature,
            "errors": self.errors
        }


def extract_jsdoc_comments(content: str) -> List[str]:
    """Extract JSDoc comments from file content"""
    jsdoc_regex = re.compile(r'/\*\*([\s\S]*?)\*/', re.MULTILINE)
    matches = jsdoc_regex.findall(content)
    return [match.strip() for match in matches]


def extract_endpoint(jsdoc_comments: List[str]) -> Optional[str]:
    """Extract endpoint information from JSDoc comments"""
    for comment in jsdoc_comments:
        match = re.search(r'@endpoint\s+(GET|POST|PUT|PATCH|DELETE)\s+(.+)', comment)
        if match:
            return f"{match.group(1)} {match.group(2).strip()}"
    return None


def extract_description(jsdoc_comments: List[str]) -> Optional[str]:
    """Extract description from JSDoc comments"""
    if not jsdoc_comments:
        return None

    # First comment block, before any @tags
    first_comment = jsdoc_comments[0]
    lines = first_comment.split('\n')
    description_lines = []

    for line in lines:
        trimmed = re.sub(r'^\s*\*\s?', '', line).strip()
        if trimmed.startswith('@'):
            break
        if trimmed:
            description_lines.append(trimmed)

    return ' '.join(description_lines) if description_lines else None


def extract_feature(jsdoc_comments: List[str]) -> Optional[str]:
    """Extract feature tag from JSDoc comments"""
    for comment in jsdoc_comments:
        match = re.search(r'Feature:\s*([^\n]+)', comment, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None


def extract_query_params(jsdoc_comments: List[str]) -> List[ParameterInfo]:
    """Extract query parameters from JSDoc comments"""
    params = []

    for comment in jsdoc_comments:
        lines = comment.split('\n')
        for line in lines:
            match = re.search(r'@query\s+(\w+)\s*-\s*(.+?)(?:\s*\((required|optional)\))?$', line, re.IGNORECASE)
            if match:
                name = match.group(1)
                description = match.group(2).strip()
                requirement = match.group(3)
                required = (requirement and requirement.lower() == 'required') or '(required)' in description
                params.append(ParameterInfo(name, description, required))

    return params


def extract_http_methods(content: str) -> List[str]:
    """Extract HTTP methods from code"""
    methods: Set[str] = set()

    # Check for explicit method checks
    method_checks = re.finditer(r"req\.method\s*===\s*['\"](\w+)['\"]", content)
    for match in method_checks:
        methods.add(match.group(1))

    # Check for method validation
    allowed_methods = re.finditer(r"allowed.*methods?.*['\"](\w+)['\"]", content, re.IGNORECASE)
    for match in allowed_methods:
        methods.add(match.group(1).upper())

    # If no methods found but serve() exists, check JSDoc for method
    if not methods and 'serve(' in content:
        endpoint_match = re.search(r'@endpoint\s+(GET|POST|PUT|PATCH|DELETE)', content)
        if endpoint_match:
            methods.add(endpoint_match.group(1))

    # Remove OPTIONS as it's just for CORS
    methods.discard('OPTIONS')

    return sorted(list(methods))


def extract_interfaces(content: str) -> List[InterfaceInfo]:
    """Extract TypeScript interfaces from code"""
    interfaces = []
    interface_regex = re.compile(r'interface\s+(\w+)\s*\{([^}]+)\}', re.MULTILINE)

    for match in interface_regex.finditer(content):
        name = match.group(1)
        body = match.group(2)
        properties = []

        # Parse interface properties
        property_lines = body.split('\n')
        for line in property_lines:
            prop_match = re.match(r'^\s*(\w+)(\?)?:\s*(.+?);?\s*$', line)
            if prop_match:
                prop_name = prop_match.group(1)
                optional = prop_match.group(2) == '?'
                prop_type = prop_match.group(3).strip()
                properties.append(PropertyInfo(prop_name, prop_type, optional))

        # Find line number
        line_number = content[:match.start()].count('\n') + 1

        interfaces.append(InterfaceInfo(name, properties, line_number))

    return interfaces


def extract_shared_dependencies(content: str) -> List[str]:
    """Extract shared dependencies"""
    dependencies: Set[str] = set()
    import_regex = re.compile(r"from\s+['\"]\.\.?\/_shared\/([^'\"]+)['\"]")

    for match in import_regex.finditer(content):
        dep = match.group(1).replace('.ts', '')
        dependencies.add(dep)

    return sorted(list(dependencies))


def has_authentication(content: str) -> bool:
    """Check for authentication requirements"""
    return any([
        'auth.getUser()' in content,
        'validateJWT' in content,
        'createUserClient' in content,
        'Authorization' in content
    ])


def has_cors(content: str) -> bool:
    """Check for CORS headers"""
    return 'corsHeaders' in content or 'CORS' in content


def has_rate_limiting(content: str) -> bool:
    """Check for rate limiting"""
    return any([
        'rate-limit' in content,
        'rateLimit' in content,
        'RateLimiter' in content
    ])


def extract_function_metadata(function_path: Path, function_name: str, base_path: Path) -> FunctionMetadata:
    """Extract metadata from a single Edge Function"""
    relative_path = str(function_path.relative_to(base_path))
    metadata = FunctionMetadata(function_name, str(function_path), relative_path)

    try:
        # Read index.ts file
        index_path = function_path / 'index.ts'
        content = index_path.read_text(encoding='utf-8')

        # Extract JSDoc comments
        metadata.jsdoc_comments = extract_jsdoc_comments(content)

        # Extract endpoint and description
        metadata.endpoint = extract_endpoint(metadata.jsdoc_comments)
        metadata.description = extract_description(metadata.jsdoc_comments)
        metadata.feature = extract_feature(metadata.jsdoc_comments)

        # Extract parameters
        metadata.query_params = extract_query_params(metadata.jsdoc_comments)

        # Extract HTTP methods
        metadata.http_methods = extract_http_methods(content)

        # Extract interfaces
        metadata.interfaces = extract_interfaces(content)

        # Extract dependencies
        metadata.shared_dependencies = extract_shared_dependencies(content)

        # Check for features
        metadata.has_auth = has_authentication(content)
        metadata.has_cors = has_cors(content)
        metadata.has_rate_limit = has_rate_limiting(content)

    except Exception as e:
        metadata.errors.append(f"Failed to parse: {str(e)}")

    return metadata


def extract_all_metadata(functions_dir: Path, verbose: bool = False) -> Dict[str, Any]:
    """Extract metadata from all Edge Functions"""
    functions = []
    successfully_parsed = 0
    failed = 0

    # Walk through functions directory
    for entry in sorted(functions_dir.iterdir()):
        if not entry.is_dir() or entry.name.startswith('_'):
            continue

        if verbose:
            print(f"Processing: {entry.name}", file=sys.stderr)

        metadata = extract_function_metadata(entry, entry.name, functions_dir)
        functions.append(metadata)

        if not metadata.errors:
            successfully_parsed += 1
        else:
            failed += 1
            if verbose:
                print(f"  Errors: {', '.join(metadata.errors)}", file=sys.stderr)

    # Generate summary statistics
    by_method: Dict[str, int] = {}
    by_feature: Dict[str, int] = {}
    with_auth = 0
    with_rate_limit = 0
    total_interfaces = 0

    for func in functions:
        # Count by method
        for method in func.http_methods:
            by_method[method] = by_method.get(method, 0) + 1

        # Count by feature
        if func.feature:
            by_feature[func.feature] = by_feature.get(func.feature, 0) + 1

        # Count auth and rate limiting
        if func.has_auth:
            with_auth += 1
        if func.has_rate_limit:
            with_rate_limit += 1

        # Count interfaces
        total_interfaces += len(func.interfaces)

    return {
        "totalFunctions": len(functions),
        "successfullyParsed": successfully_parsed,
        "failed": failed,
        "functions": [f.to_dict() for f in sorted(functions, key=lambda x: x.name)],
        "extractedAt": datetime.utcnow().isoformat() + 'Z',
        "summary": {
            "byMethod": by_method,
            "byFeature": by_feature,
            "withAuth": with_auth,
            "withRateLimit": with_rate_limit,
            "totalInterfaces": total_interfaces
        }
    }


def main():
    parser = argparse.ArgumentParser(
        description='Extract metadata from Supabase Edge Functions for API documentation.'
    )
    parser.add_argument('--output', '-o', type=str, help='Write JSON output to file (default: stdout)')
    parser.add_argument('--validate', action='store_true', help='Validate all functions were successfully parsed')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show detailed parsing information')

    args = parser.parse_args()

    functions_dir = Path('./supabase/functions')

    # Check if directory exists
    if not functions_dir.exists():
        print(f"Error: Directory not found: {functions_dir}", file=sys.stderr)
        print("Make sure you are running this script from the project root.", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print('Extracting metadata from Edge Functions...\n', file=sys.stderr)

    # Extract metadata
    result = extract_all_metadata(functions_dir, args.verbose)

    # Validate if requested
    if args.validate:
        print('\n=== Validation Results ===', file=sys.stderr)
        print(f"Total functions: {result['totalFunctions']}", file=sys.stderr)
        print(f"Successfully parsed: {result['successfullyParsed']}", file=sys.stderr)
        print(f"Failed: {result['failed']}", file=sys.stderr)

        if result['failed'] > 0:
            print('\nFunctions with errors:', file=sys.stderr)
            for func in result['functions']:
                if func['errors']:
                    print(f"  - {func['name']}: {', '.join(func['errors'])}", file=sys.stderr)
            sys.exit(1)
        else:
            print('\n✓ All functions successfully parsed', file=sys.stderr)
            sys.exit(0)

    # Output JSON
    json_output = json.dumps(result, indent=2)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json_output, encoding='utf-8')
        if args.verbose:
            print(f"\n✓ Metadata written to: {args.output}", file=sys.stderr)
    else:
        print(json_output)

    # Summary in verbose mode
    if args.verbose:
        print('\n=== Summary ===', file=sys.stderr)
        print(f"Total functions: {result['totalFunctions']}", file=sys.stderr)
        print(f"Successfully parsed: {result['successfullyParsed']}", file=sys.stderr)
        print(f"HTTP Methods: {json.dumps(result['summary']['byMethod'], indent=2)}", file=sys.stderr)
        print(f"With Auth: {result['summary']['withAuth']}", file=sys.stderr)
        print(f"With Rate Limiting: {result['summary']['withRateLimit']}", file=sys.stderr)
        print(f"Total Interfaces: {result['summary']['totalInterfaces']}", file=sys.stderr)


if __name__ == '__main__':
    main()
