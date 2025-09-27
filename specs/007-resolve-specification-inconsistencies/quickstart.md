# Quickstart: Specification Consistency Resolution

**Feature**: Resolve Theme System Specification Inconsistencies
**Time Required**: 30 minutes

## Prerequisites

- Access to specification documents in `/specs/006-i-need-you/`
- Text editor with Markdown support
- Git for version control

## Quick Validation Steps

### 1. Performance Metrics Alignment (5 min)
```bash
# Check all performance references
grep -n "performance\|immediate\|100ms" specs/006-i-need-you/*.md

# Expected: All should reference "<100ms without page reload"
```

### 2. Terminology Consistency (5 min)
```bash
# Check shadcn references
grep -n "shadcn" specs/006-i-need-you/*.md

# Expected: All should use "shadcn/ui"
```

### 3. Default Behavior Verification (5 min)
```bash
# Check default behavior descriptions
grep -n "default\|GASTAT\|system preference" specs/006-i-need-you/*.md

# Expected: Clear precedence order documented
```

### 4. Edge Case Definitions (5 min)
```bash
# Check edge case handling
grep -n "edge case\|fallback\|localStorage" specs/006-i-need-you/*.md

# Expected: All edge cases have concrete behaviors
```

### 5. WCAG Compliance Specifics (5 min)
```bash
# Check accessibility requirements
grep -n "WCAG\|contrast\|ratio\|4.5:1\|3:1" specs/006-i-need-you/*.md

# Expected: Specific WCAG 2.1 AA ratios mentioned
```

### 6. Coverage Analysis (5 min)
```bash
# Check requirement-task mapping
grep -n "FR-[0-9]" specs/006-i-need-you/spec.md
grep -n "T[0-9]" specs/006-i-need-you/tasks.md

# Expected: Each FR-XXX has associated tasks
```

## Manual Update Checklist

### spec.md Updates
- [ ] FR-008: Change to "<100ms without page reload"
- [ ] FR-009: Add "WCAG 2.1 AA (4.5:1 normal, 3:1 large text)"
- [ ] FR-007: Change to "persistent in application header/navigation bar"
- [ ] Edge Cases: Convert questions to statements with expected behaviors
- [ ] Add new requirement for font loading (Plus Jakarta Sans, Open Sans)

### plan.md Updates
- [ ] Performance Goals: Ensure matches "<100ms" from spec
- [ ] Primary Dependencies: Change to "shadcn/ui" (not "shadcn")
- [ ] Storage: Clarify "localStorage for immediate, Supabase for sync"

### tasks.md Updates
- [ ] T033: Clarify system preference is fallback only
- [ ] T027/T032: Clarify dual persistence relationship
- [ ] Add new task T041 for font configuration
- [ ] T040: Remove reference to missing quickstart.md or create it

## Validation Script

Create and run this validation script:

```javascript
// validate-consistency.js
const fs = require('fs');

function validateConsistency() {
  const spec = fs.readFileSync('specs/006-i-need-you/spec.md', 'utf8');
  const plan = fs.readFileSync('specs/006-i-need-you/plan.md', 'utf8');
  const tasks = fs.readFileSync('specs/006-i-need-you/tasks.md', 'utf8');

  const issues = [];

  // Check performance consistency
  if (spec.includes('immediate') && !spec.includes('<100ms')) {
    issues.push('Performance metric not standardized in spec');
  }

  // Check terminology
  if (plan.includes('shadcn') && !plan.includes('shadcn/ui')) {
    issues.push('Terminology not consistent in plan');
  }

  // Check WCAG specifics
  if (!spec.includes('4.5:1') || !spec.includes('3:1')) {
    issues.push('WCAG ratios not specified in spec');
  }

  return issues;
}

const issues = validateConsistency();
if (issues.length > 0) {
  console.log('Issues found:', issues);
  process.exit(1);
} else {
  console.log('All consistency checks passed!');
}
```

## Expected Outcomes

After completing all updates:

1. **Unified Performance Target**: All documents reference <100ms
2. **Clear Precedence**: Stored → System → Default hierarchy documented
3. **Specific WCAG Requirements**: 4.5:1 and 3:1 ratios explicitly stated
4. **Consistent Terminology**: "shadcn/ui" used throughout
5. **Concrete Edge Cases**: All edge cases have defined behaviors
6. **Complete Coverage**: All requirements have associated tasks
7. **Font Configuration**: Explicit task for font loading added

## Troubleshooting

### If inconsistencies remain:
1. Re-run the grep commands to find missed occurrences
2. Check for indirect references (e.g., "theme library" instead of "shadcn/ui")
3. Verify cross-references between documents are aligned

### If new inconsistencies appear:
1. Document them in a new analysis report
2. Create additional requirements in spec.md if needed
3. Update this quickstart with new validation steps

## Success Criteria

- [ ] No contradictory performance metrics across documents
- [ ] No ambiguous edge case descriptions
- [ ] All terminology standardized
- [ ] All requirements have measurable criteria
- [ ] Coverage analysis shows 100% requirement coverage
- [ ] Validation script returns no issues

---
*Quickstart guide for specification consistency resolution*