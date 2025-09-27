# Contract Tests

This directory contains contract tests for the Security Enhancement and System Hardening features. Contract tests validate that API endpoints conform to their OpenAPI specifications and handle requests/responses correctly.

## Test Structure

```
contracts/
├── test-utils.ts              # Shared utilities and validation helpers
├── vitest.config.ts          # Vitest configuration for contract tests
├── README.md                 # This file
├── auth/                     # Authentication-related contract tests
│   ├── mfa-enroll.test.ts    # MFA enrollment endpoint tests
│   ├── mfa-verify.test.ts    # MFA verification endpoint tests
│   ├── backup-codes.test.ts  # Backup codes endpoint tests
│   └── mfa-recover.test.ts   # MFA recovery endpoint tests
├── monitoring/               # Monitoring-related contract tests
│   ├── alerts.test.ts        # Alert management endpoint tests
│   ├── anomalies.test.ts     # Anomaly detection endpoint tests
│   └── health.test.ts        # Health check endpoint tests
├── export/                   # Export functionality contract tests
│   └── export.test.ts        # Export endpoint tests
├── analytics/                # Analytics contract tests
│   └── clustering.test.ts    # Clustering endpoint tests
├── accessibility/            # Accessibility contract tests
│   └── preferences.test.ts   # Accessibility preferences endpoint tests
└── security/                 # Security contract tests
    └── audit-logs.test.ts    # Audit logs endpoint tests
```

## Test Categories

### MFA Contract Tests (T009-T012)
- **T009**: MFA enrollment endpoint (`/auth/mfa/enroll`)
- **T010**: MFA verification endpoint (`/auth/mfa/verify`)
- **T011**: Backup codes endpoints (`/auth/mfa/backup-codes`)
- **T012**: MFA recovery endpoint (`/auth/mfa/recover`)

### Monitoring Contract Tests (T013-T015)
- **T013**: Alert management endpoints (`/monitoring/alerts`)
- **T014**: Anomaly detection endpoints (`/monitoring/anomalies`)
- **T015**: Health check endpoint (`/monitoring/health`)

### Feature Contract Tests (T016-T019)
- **T016**: Export endpoints (`/export`)
- **T017**: Clustering endpoint (`/analytics/cluster`)
- **T018**: Accessibility preferences endpoints (`/accessibility/preferences`)
- **T019**: Audit logs endpoint (`/audit/logs`)

## Running Contract Tests

### Prerequisites
1. Ensure the backend API server is running
2. Set up test environment variables:
   ```bash
   export TEST_API_URL=http://localhost:3001
   export SUPABASE_URL=http://localhost:54321
   export SUPABASE_ANON_KEY=your-test-key
   ```

### Run All Contract Tests
```bash
cd backend
npm run test:contracts
```

### Run Specific Test Categories
```bash
# MFA tests only
npm run test:contracts -- --grep "MFA"

# Monitoring tests only
npm run test:contracts -- --grep "Monitoring"

# Export tests only
npm run test:contracts -- --grep "Export"
```

### Run Individual Test Files
```bash
# MFA enrollment tests
npm run test:contracts backend/tests/contracts/auth/mfa-enroll.test.ts

# Alert management tests
npm run test:contracts backend/tests/contracts/monitoring/alerts.test.ts
```

## Test Configuration

Contract tests use the following configuration:
- **Timeout**: 30 seconds per test
- **Retries**: 2 attempts for failed tests
- **Parallel execution**: Enabled for better performance
- **Environment**: Node.js
- **Coverage**: Disabled (contract tests validate API contracts, not code coverage)

## Test Data

Contract tests use factory functions to create test data:
- `createTestUser()`: Creates test user data
- `createMFAEnrollmentRequest()`: Creates MFA enrollment request
- `createAlertConfigRequest()`: Creates alert configuration request
- `createExportRequest()`: Creates export request
- `createClusteringRequest()`: Creates clustering request
- `createAccessibilityPreferences()`: Creates accessibility preferences

## Validation Helpers

The `test-utils.ts` file provides validation helpers for each response type:
- `validateErrorResponse()`: Validates error response structure
- `validateMFAEnrollmentResponse()`: Validates MFA enrollment response
- `validateAlertConfiguration()`: Validates alert configuration response
- `validateHealthStatus()`: Validates health status response
- And many more...

## Bilingual Support

All contract tests validate that error messages are returned in both English and Arabic:
- `message`: English error message
- `message_ar`: Arabic error message

## Error Codes

Contract tests validate specific error codes for different scenarios:
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `BAD_REQUEST`: Invalid request data
- `TOO_MANY_REQUESTS`: Rate limiting
- And many more...

## TDD Approach

These contract tests follow Test-Driven Development principles:
1. **Red**: Tests fail initially (no implementation exists)
2. **Green**: Implementation makes tests pass
3. **Refactor**: Improve implementation while keeping tests green

## Integration with CI/CD

Contract tests are designed to run in CI/CD pipelines:
- Fast execution (parallel tests)
- Clear pass/fail status
- Detailed error reporting
- JSON output for programmatic analysis

## Maintenance

When updating API contracts:
1. Update the OpenAPI specification
2. Update corresponding contract tests
3. Ensure all tests pass
4. Update this documentation if needed

## Troubleshooting

### Common Issues

1. **Connection refused**: Ensure the API server is running
2. **Authentication errors**: Check test environment variables
3. **Timeout errors**: Increase test timeout or check server performance
4. **Test data conflicts**: Use unique test data or clean up between tests

### Debug Mode

Run tests with debug output:
```bash
DEBUG=* npm run test:contracts
```

### Verbose Output

Get detailed test output:
```bash
npm run test:contracts -- --reporter=verbose
```