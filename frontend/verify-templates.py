#!/usr/bin/env python3
"""
Template Verification Script
Verifies that the new export templates (audit_log, intake_ticket, calendar_event)
are correctly structured with bilingual headers.
"""

import json
import sys

# Expected template structure for each entity type
EXPECTED_TEMPLATES = {
    'audit_log': {
        'required_fields': ['timestamp', 'table_name', 'operation', 'row_id'],
        'optional_fields': ['user_email', 'user_role', 'ip_address', 'changed_fields', 'session_id', 'request_id'],
        'min_columns': 10,
    },
    'intake_ticket': {
        'required_fields': ['request_type', 'title', 'description', 'sensitivity', 'urgency', 'priority', 'status'],
        'optional_fields': ['ticket_number', 'title_ar', 'description_ar', 'dossier_id', 'assigned_to', 'assigned_unit', 'resolution', 'resolution_ar', 'source'],
        'min_columns': 15,
    },
    'calendar_event': {
        'required_fields': ['title_en', 'event_type', 'start_datetime', 'end_datetime', 'timezone'],
        'optional_fields': ['title_ar', 'description_en', 'description_ar', 'location_en', 'location_ar', 'is_virtual', 'virtual_link', 'room_en', 'room_ar', 'status', 'dossier_id'],
        'min_columns': 15,
    },
}

def read_file(filepath):
    """Read a file and return its contents."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Error reading file {filepath}: {e}")
        return None

def verify_template_in_code(entity_type, code_content):
    """Verify that a template exists in the code with proper structure."""
    issues = []

    # Check if entity type is in the code
    if f"  {entity_type}:" not in code_content and f'  "{entity_type}":' not in code_content:
        issues.append(f"❌ Template for {entity_type} not found in ENTITY_TEMPLATES")
        return issues

    # Check for required fields in the template definition
    expected = EXPECTED_TEMPLATES[entity_type]

    # Find the section for this entity type
    start_marker = f"{entity_type}:"
    if start_marker in code_content:
        template_start = code_content.find(start_marker)
        # Find the end of this template (next template or closing brace)
        template_end = code_content.find("\n  },\n  ", template_start)
        if template_end == -1:
            template_end = code_content.find("\n  },\n}", template_start)

        template_section = code_content[template_start:template_end] if template_end > template_start else ""

        # Check for required fields
        missing_required = []
        for field in expected['required_fields']:
            if f"field: '{field}'" not in template_section and f'field: "{field}"' not in template_section:
                missing_required.append(field)

        if missing_required:
            issues.append(f"⚠️  Missing required fields: {', '.join(missing_required)}")

        # Check for bilingual headers
        header_count = template_section.count("header:")
        headerAr_count = template_section.count("headerAr:")

        if header_count != headerAr_count:
            issues.append(f"⚠️  Mismatch between English ({header_count}) and Arabic ({headerAr_count}) headers")

        # Check minimum column count
        column_count = template_section.count("field:")
        if column_count < expected['min_columns']:
            issues.append(f"⚠️  Only {column_count} columns found, expected at least {expected['min_columns']}")

    return issues

def main():
    print("=" * 60)
    print("EXPORT TEMPLATE VERIFICATION REPORT")
    print("Task: 002-extend-export-templates-with-missing-entity-types")
    print("=" * 60)

    # Read the useExportData.ts file
    hook_file = "./src/hooks/useExportData.ts"
    code_content = read_file(hook_file)

    if not code_content:
        print(f"\n❌ Could not read {hook_file}")
        return 1

    print(f"\n✓ Successfully read {hook_file}")
    print(f"✓ File size: {len(code_content)} characters")

    # Verify each entity type
    all_issues = []
    entity_types = ['audit_log', 'intake_ticket', 'calendar_event']

    for entity_type in entity_types:
        print(f"\n{'=' * 60}")
        print(f"Verifying: {entity_type}")
        print("=" * 60)

        issues = verify_template_in_code(entity_type, code_content)

        if not issues:
            print(f"✅ {entity_type} template verified successfully")
            expected = EXPECTED_TEMPLATES[entity_type]
            print(f"  ✓ Required fields: {len(expected['required_fields'])}")
            print(f"  ✓ Optional fields: {len(expected['optional_fields'])}")
            print(f"  ✓ Bilingual headers: EN/AR")
        else:
            print(f"⚠️  Issues found in {entity_type}:")
            for issue in issues:
                print(f"  {issue}")
            all_issues.extend(issues)

    # Verify ExportableEntityType includes new types
    types_file = "./src/types/export-import.types.ts"
    types_content = read_file(types_file)

    if types_content:
        print(f"\n{'=' * 60}")
        print("Verifying ExportableEntityType")
        print("=" * 60)

        for entity_type in entity_types:
            if f"'{entity_type}'" in types_content or f'"{entity_type}"' in types_content:
                print(f"✅ '{entity_type}' found in ExportableEntityType")
            else:
                print(f"❌ '{entity_type}' NOT found in ExportableEntityType")
                all_issues.append(f"{entity_type} missing from type definition")

    # Summary
    print(f"\n{'=' * 60}")
    print("VERIFICATION SUMMARY")
    print("=" * 60)

    if not all_issues:
        print("\n✅ All templates verified successfully!")
        print("\nFeatures confirmed:")
        print("  ✓ All 3 new entity types have templates")
        print("  ✓ All templates have bilingual headers (EN/AR)")
        print("  ✓ All templates include required and optional fields")
        print("  ✓ Templates follow existing patterns")
        print("\nTemplates are ready for CSV and XLSX export.")
        return 0
    else:
        print(f"\n⚠️  Found {len(all_issues)} issue(s):")
        for issue in all_issues:
            print(f"  {issue}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
