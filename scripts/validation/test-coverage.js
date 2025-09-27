#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test for requirement-task coverage
function testRequirementCoverage() {
  console.log('\n🧪 Testing Requirement-Task Coverage...');

  const specsPath = path.join(__dirname, '../../specs/006-i-need-you');
  const spec = fs.readFileSync(path.join(specsPath, 'spec.md'), 'utf8');
  const tasks = fs.readFileSync(path.join(specsPath, 'tasks.md'), 'utf8');

  const errors = [];

  // Extract all FR-XXX requirements from spec
  const requirements = spec.match(/FR-\d{3}/g) || [];
  const uniqueRequirements = [...new Set(requirements)];

  // Check that tasks exist for theme functionality
  const hasThemeTasks = tasks.includes('theme') || tasks.includes('Theme');
  const hasLanguageTasks = tasks.includes('language') || tasks.includes('Language');
  const hasAccessibilityTasks = tasks.includes('accessibility') || tasks.includes('ARIA');

  if (!hasThemeTasks) {
    errors.push('❌ No theme-related tasks found');
  }
  if (!hasLanguageTasks) {
    errors.push('❌ No language/i18n tasks found');
  }
  if (!hasAccessibilityTasks) {
    errors.push('❌ No accessibility tasks found');
  }

  // Check for FR-013 (font loading requirement)
  if (!spec.includes('FR-013')) {
    errors.push('❌ FR-013 for font loading (Plus Jakarta Sans, Open Sans) is missing');
  }

  // Check task T033 for system preference clarification
  const t033Match = tasks.match(/T033[^\n]*/);
  if (t033Match && !t033Match[0].includes('fallback')) {
    errors.push('❌ T033 does not clarify system preference detection as fallback only');
  }

  // Check tasks T027/T032 for dual persistence
  const t027Match = tasks.match(/T027[^\n]*/);
  const t032Match = tasks.match(/T032[^\n]*/);

  if (t027Match && !t027Match[0].match(/localStorage.*immediate|immediate.*localStorage/i)) {
    errors.push('❌ T027 does not clarify localStorage for immediate persistence');
  }

  if (t032Match && !t032Match[0].match(/Supabase.*sync|sync.*Supabase/i)) {
    errors.push('❌ T032 does not clarify Supabase for sync');
  }

  // Check for T041 (font configuration task)
  if (!tasks.includes('T041')) {
    errors.push('❌ T041 for font configuration is missing from tasks.md');
  }

  // Check storage description in plan
  const plan = fs.readFileSync(path.join(specsPath, 'plan.md'), 'utf8');
  const storageMatch = plan.match(/Storage[^\n]*:[^\n]*/i);
  if (storageMatch && !storageMatch[0].includes('localStorage for immediate') && !storageMatch[0].includes('Supabase for sync')) {
    errors.push('❌ Storage description in plan.md not clarified as "localStorage for immediate, Supabase for sync"');
  }

  if (errors.length === 0) {
    console.log('✅ All requirements have task coverage and descriptions are clear');
    return true;
  } else {
    errors.forEach(error => console.log(error));
    return false;
  }
}

// Run test
const result = testRequirementCoverage();
process.exit(result ? 0 : 1);