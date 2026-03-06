/**
 * Shared test configuration
 *
 * Test credentials are loaded from environment variables only.
 * Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test or CI secrets.
 */

export const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
export const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

export function getTestCredentials(): { email: string; password: string } {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error(
      'Missing TEST_USER_EMAIL or TEST_USER_PASSWORD environment variables. ' +
        'See .env.test.example for setup instructions.'
    );
  }
  return { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD };
}
