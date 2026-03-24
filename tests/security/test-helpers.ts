/**
 * Shared test fixtures for security tests.
 * Provides mock Express request/response/next factories and test org IDs.
 */
import { Request, Response, NextFunction } from 'express'
import { vi } from 'vitest'

export const TEST_ORG_A_ID = 'org-a-00000000-0000-0000-0000-000000000001'
export const TEST_ORG_B_ID = 'org-b-00000000-0000-0000-0000-000000000002'

type UserRole = 'super_admin' | 'admin' | 'manager' | 'editor' | 'viewer'

export const createMockUser = (
  overrides: Partial<NonNullable<Express.Request['user']>> = {},
): NonNullable<Express.Request['user']> => ({
  id: 'user-00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  role: 'viewer' as UserRole,
  organization_id: TEST_ORG_A_ID,
  clearance_level: 1,
  permissions: [],
  ...overrides,
})

export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  headers: {},
  ...overrides,
})

export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis() as unknown as Response['status'],
    json: vi.fn().mockReturnThis() as unknown as Response['json'],
    setHeader: vi.fn().mockReturnThis() as unknown as Response['setHeader'],
  }
  return res
}

export const createMockNext = (): NextFunction & ReturnType<typeof vi.fn> => vi.fn() as NextFunction & ReturnType<typeof vi.fn>
