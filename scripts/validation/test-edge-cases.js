#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test for edge case definitions
function testEdgeCaseDefinitions() {
  console.log('\n🧪 Testing Edge Case Definitions...');

  const specsPath = path.join(__dirname, '../../specs/006-i-need-you');
  const spec = fs.readFileSync(path.join(specsPath, 'spec.md'), 'utf8');

  const errors = [];

  // Check for question marks in edge cases section
  const edgeCaseSection = spec.match(/## Edge Cases[\s\S]*?(?=##|$)/);
  if (edgeCaseSection) {
    const questions = edgeCaseSection[0].match(/\?(?!\s*\))/g);
    if (questions) {
      errors.push(`❌ Found ${questions.length} questions in Edge Cases section - should be concrete statements`);
    }
  }

  // Check for specific edge case requirements
  const requiredEdgeCases = [
    { name: 'localStorage unavailable', pattern: /localStorage.*unavailable|fallback.*sessionStorage/i },
    { name: 'Cookies disabled', pattern: /cookies.*disabled|fallback.*memory/i },
    { name: 'Network failure', pattern: /network.*fail|offline.*behavior/i },
    { name: 'Slow connection', pattern: /slow.*connection|loading.*indicator/i },
    { name: 'System preference conflicts', pattern: /system.*preference.*conflict|precedence/i }
  ];

  requiredEdgeCases.forEach(edgeCase => {
    if (!spec.match(edgeCase.pattern)) {
      errors.push(`❌ Missing concrete behavior for edge case: ${edgeCase.name}`);
    }
  });

  // Check for default behavior precedence
  if (!spec.includes('Stored') || !spec.includes('System') || !spec.includes('Application')) {
    errors.push('❌ Default behavior precedence not clearly defined (Stored → System → Application)');
  }

  // Check FR-007 for location specification
  const fr007Match = spec.match(/FR-007[^\n]*\n[^\n]*/);
  if (fr007Match && !fr007Match[0].includes('header') && !fr007Match[0].includes('navigation bar')) {
    errors.push('❌ FR-007 does not specify location as "persistent in application header/navigation bar"');
  }

  if (errors.length === 0) {
    console.log('✅ All edge cases have concrete definitions with expected behaviors');
    return true;
  } else {
    errors.forEach(error => console.log(error));
    return false;
  }
}

// Run test
const result = testEdgeCaseDefinitions();
process.exit(result ? 0 : 1);