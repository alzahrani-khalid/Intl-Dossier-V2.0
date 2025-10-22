/**
 * Global Test Setup
 * 
 * This file runs once before all tests and sets up the test environment.
 */

import { beforeAll, afterAll, afterEach } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // Verify required environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(
      `⚠️  Warning: Missing environment variables: ${missing.join(', ')}\n` +
      `   Some tests may fail. Create a .env.test file with test database credentials.`
    );
  }
  
  console.log('✅ Test environment ready');
});

// Global test teardown
afterAll(async () => {
  console.log('✅ Test environment cleaned up');
});

// Clean up after each test
afterEach(async () => {
  // Individual test cleanup if needed
});
