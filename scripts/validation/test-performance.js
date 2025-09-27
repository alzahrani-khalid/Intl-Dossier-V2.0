#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test for performance metric consistency
function testPerformanceMetrics() {
  console.log('\n🧪 Testing Performance Metric Consistency...');

  const specsPath = path.join(__dirname, '../../specs/006-i-need-you');
  const spec = fs.readFileSync(path.join(specsPath, 'spec.md'), 'utf8');
  const plan = fs.readFileSync(path.join(specsPath, 'plan.md'), 'utf8');
  const tasks = fs.readFileSync(path.join(specsPath, 'tasks.md'), 'utf8');

  const errors = [];

  // Check FR-008 in spec.md for exact performance metric
  const fr008Match = spec.match(/FR-008[^\n]*\n[^\n]*/);
  if (fr008Match && !fr008Match[0].includes('<100ms without page reload')) {
    errors.push('❌ FR-008 does not specify "<100ms without page reload"');
  }

  // Check Performance Goals in plan.md
  const perfGoalMatch = plan.match(/Performance Goals[^\n]*\n[^\n]*/i);
  if (perfGoalMatch && !perfGoalMatch[0].includes('<100ms')) {
    errors.push('❌ Performance Goals in plan.md does not match "<100ms"');
  }

  // Check for inconsistent use of "immediate" vs specific metrics
  if (spec.match(/immediate(?!ly)/i) && !spec.includes('<100ms')) {
    const immediateCount = (spec.match(/immediate/gi) || []).length;
    errors.push(`❌ Found ${immediateCount} uses of "immediate" without specific metric in spec.md`);
  }

  // Check tasks for consistency - immediate is OK if it's about localStorage
  const taskLines = tasks.split('\n');
  const hasInconsistentTaskRefs = taskLines.some(line => {
    return line.toLowerCase().includes('immediate') &&
           !line.toLowerCase().includes('localstorage') &&
           !line.includes('<100ms');
  });

  if (hasInconsistentTaskRefs) {
    errors.push('❌ Tasks.md contains "immediate" without specific metric or localStorage context');
  }

  if (errors.length === 0) {
    console.log('✅ All performance metrics are consistent (<100ms without page reload)');
    return true;
  } else {
    errors.forEach(error => console.log(error));
    return false;
  }
}

// Run test
const result = testPerformanceMetrics();
process.exit(result ? 0 : 1);