import { z } from 'zod';

/**
 * Valid theme options
 */
export const ThemeEnum = z.enum(['gastat', 'blue-sky']);
export type Theme = z.infer<typeof ThemeEnum>;

/**
 * Valid color mode options
 */
export const ColorModeEnum = z.enum(['light', 'dark']);
export type ColorMode = z.infer<typeof ColorModeEnum>;

/**
 * Valid language options
 */
export const LanguageEnum = z.enum(['en', 'ar']);
export type Language = z.infer<typeof LanguageEnum>;

/**
 * User preference schema for validation
 */
export const UserPreferenceSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().min(1),
  theme: ThemeEnum.default('gastat'),
  colorMode: ColorModeEnum.default('light'),
  language: LanguageEnum.default('en'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

/**
 * Schema for preference updates (partial)
 */
export const UserPreferenceUpdateSchema = z.object({
  theme: ThemeEnum.optional(),
  colorMode: ColorModeEnum.optional(),
  language: LanguageEnum.optional()
});

/**
 * TypeScript type for UserPreference
 */
export type UserPreference = z.infer<typeof UserPreferenceSchema>;

/**
 * TypeScript type for UserPreference updates
 */
export type UserPreferenceUpdate = z.infer<typeof UserPreferenceUpdateSchema>;

/**
 * Database table name
 */
export const USER_PREFERENCES_TABLE = 'user_preferences';

/**
 * Default preferences for new users
 */
export const DEFAULT_PREFERENCES: Omit<UserPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: 'gastat',
  colorMode: 'light',
  language: 'en'
};

/**
 * Convert database row to UserPreference object
 * Maps snake_case database fields to camelCase
 */
export function mapDatabaseToUserPreference(row: any): UserPreference {
  return {
    id: row.id,
    userId: row.user_id,
    theme: row.theme,
    colorMode: row.color_mode,
    language: row.language,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Convert UserPreference object to database row
 * Maps camelCase fields to snake_case database fields
 */
export function mapUserPreferenceToDatabase(preference: UserPreference | UserPreferenceUpdate): any {
  const mapped: any = {};
  
  if ('id' in preference && preference.id) mapped.id = preference.id;
  if ('userId' in preference && preference.userId) mapped.user_id = preference.userId;
  if ('theme' in preference && preference.theme) mapped.theme = preference.theme;
  if ('colorMode' in preference && preference.colorMode) mapped.color_mode = preference.colorMode;
  if ('language' in preference && preference.language) mapped.language = preference.language;
  if ('createdAt' in preference && preference.createdAt) mapped.created_at = preference.createdAt;
  if ('updatedAt' in preference && preference.updatedAt) mapped.updated_at = preference.updatedAt;
  
  return mapped;
}

/**
 * Validate user ID format
 * Prevents path traversal and other injection attacks
 */
export function validateUserId(userId: string): boolean {
  // Check for basic format (alphanumeric, hyphens, underscores)
  const validFormat = /^[a-zA-Z0-9_-]+$/.test(userId);
  
  // Check for path traversal attempts
  const noPathTraversal = !userId.includes('..') && !userId.includes('/') && !userId.includes('\\');
  
  // Check reasonable length
  const validLength = userId.length > 0 && userId.length <= 100;
  
  return validFormat && noPathTraversal && validLength;
}