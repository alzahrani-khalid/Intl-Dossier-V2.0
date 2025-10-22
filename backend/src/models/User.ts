/**
 * User Model
 * Represents authenticated user information
 */

export interface User {
  id: string;
  email: string;
  clearance_level?: number;
  organization_id?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}