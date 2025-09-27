import { z } from 'zod';

export const ThemeSchema = z.enum(['gastat', 'blueSky']);
export const ColorModeSchema = z.enum(['light', 'dark', 'system']);
export const LanguageSchema = z.enum(['en', 'ar']);

export const UserPreferenceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  theme: ThemeSchema,
  colorMode: ColorModeSchema,
  language: LanguageSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PreferenceUpdateSchema = z.object({
  theme: ThemeSchema.optional(),
  colorMode: ColorModeSchema.optional(),
  language: LanguageSchema.optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one preference field must be provided",
});

export type Theme = z.infer<typeof ThemeSchema>;
export type ColorMode = z.infer<typeof ColorModeSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type UserPreference = z.infer<typeof UserPreferenceSchema>;
export type PreferenceUpdate = z.infer<typeof PreferenceUpdateSchema>;

export const DEFAULT_PREFERENCES: Omit<UserPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  theme: 'gastat',
  colorMode: 'light',
  language: 'en',
};