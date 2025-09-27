#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test for terminology consistency
function testTerminologyConsistency() {
  console.log('\n🧪 Testing Terminology Consistency...');

  const specsPath = path.join(__dirname, '../../specs/006-i-need-you');
  const spec = fs.readFileSync(path.join(specsPath, 'spec.md'), 'utf8');
  const plan = fs.readFileSync(path.join(specsPath, 'plan.md'), 'utf8');
  const tasks = fs.readFileSync(path.join(specsPath, 'tasks.md'), 'utf8');

  const errors = [];

  // Check for consistent shadcn/ui usage
  const shadcnVariants = [
    { pattern: /shadcn(?!\/ui)/g, incorrect: 'shadcn (without /ui)' },
    { pattern: /Shadcn UI/g, incorrect: 'Shadcn UI' },
    { pattern: /shadcnUI/g, incorrect: 'shadcnUI' }
  ];

  const files = [
    { content: spec, name: 'spec.md' },
    { content: plan, name: 'plan.md' },
    { content: tasks, name: 'tasks.md' }
  ];

  files.forEach(file => {
    shadcnVariants.forEach(variant => {
      const matches = file.content.match(variant.pattern);
      if (matches) {
        errors.push(`❌ Found ${matches.length} instances of "${variant.incorrect}" in ${file.name}`);
      }
    });
  });

  // Check for proper usage of "shadcn/ui"
  const correctUsage = files.every(file => file.content.includes('shadcn/ui'));
  if (!correctUsage) {
    const missingFiles = files.filter(f => !f.content.includes('shadcn/ui')).map(f => f.name);
    errors.push(`❌ Missing "shadcn/ui" reference in: ${missingFiles.join(', ')}`);
  }

  // Check for consistent theme terminology
  const themeTerms = {
    'theme selector': 'theme selection',
    'theme switcher': 'theme selection',
    'theme picker': 'theme selection'
  };

  Object.entries(themeTerms).forEach(([incorrect, correct]) => {
    files.forEach(file => {
      if (file.content.toLowerCase().includes(incorrect)) {
        errors.push(`❌ Found "${incorrect}" in ${file.name} - should use "${correct}"`);
      }
    });
  });

  if (errors.length === 0) {
    console.log('✅ All terminology is consistent (shadcn/ui, theme selection, etc.)');
    return true;
  } else {
    errors.forEach(error => console.log(error));
    return false;
  }
}

// Run test
const result = testTerminologyConsistency();
process.exit(result ? 0 : 1);