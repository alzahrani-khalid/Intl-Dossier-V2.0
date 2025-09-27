#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test for WCAG compliance specifics
function testWCAGCompliance() {
  console.log('\n🧪 Testing WCAG Compliance Specifics...');

  const specsPath = path.join(__dirname, '../../specs/006-i-need-you');
  const spec = fs.readFileSync(path.join(specsPath, 'spec.md'), 'utf8');

  const errors = [];

  // Check FR-009 for specific WCAG ratios
  const fr009Match = spec.match(/FR-009[\s\S]*?(?=FR-|##|$)/);
  if (fr009Match) {
    const content = fr009Match[0];

    // Check for specific WCAG 2.1 AA mention
    if (!content.includes('WCAG 2.1 AA')) {
      errors.push('❌ FR-009 does not specify "WCAG 2.1 AA" compliance level');
    }

    // Check for specific contrast ratios
    if (!content.includes('4.5:1')) {
      errors.push('❌ FR-009 does not specify 4.5:1 ratio for normal text');
    }

    if (!content.includes('3:1')) {
      errors.push('❌ FR-009 does not specify 3:1 ratio for large text');
    }
  } else {
    errors.push('❌ FR-009 not found in spec.md');
  }

  // Check for keyboard navigation requirements
  if (!spec.match(/keyboard.*navigat|tab.*order|focus.*visible/i)) {
    errors.push('❌ Missing keyboard navigation requirements');
  }

  // Check for screen reader requirements
  if (!spec.match(/screen.*reader|aria|accessible.*name/i)) {
    errors.push('❌ Missing screen reader support requirements');
  }

  // Check for focus indicators
  if (!spec.match(/focus.*indicator|focus.*visible|outline/i)) {
    errors.push('❌ Missing focus indicator requirements');
  }

  if (errors.length === 0) {
    console.log('✅ WCAG 2.1 AA compliance with specific contrast ratios (4.5:1, 3:1) is documented');
    return true;
  } else {
    errors.forEach(error => console.log(error));
    return false;
  }
}

// Run test
const result = testWCAGCompliance();
process.exit(result ? 0 : 1);