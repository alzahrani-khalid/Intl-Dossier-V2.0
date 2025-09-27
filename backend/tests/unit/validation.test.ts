import { describe, it, expect } from 'vitest';

// Validation functions to test
export const validateTheme = (theme: string): boolean => {
  return ['gastat', 'blueSky'].includes(theme);
};

export const validateColorMode = (mode: string): boolean => {
  return ['light', 'dark', 'system'].includes(mode);
};

export const validateLanguage = (lang: string): boolean => {
  return ['en', 'ar'].includes(lang);
};

export const validatePreferenceUpdate = (update: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!update || typeof update !== 'object') {
    return { valid: false, errors: ['Invalid preference object'] };
  }
  
  // At least one field must be present
  const fields = ['theme', 'colorMode', 'language'];
  const hasField = fields.some(field => field in update);
  
  if (!hasField) {
    errors.push('At least one preference field must be provided');
  }
  
  // Validate theme if present
  if ('theme' in update && !validateTheme(update.theme)) {
    errors.push(`Invalid theme: ${update.theme}. Must be 'gastat' or 'blueSky'`);
  }
  
  // Validate colorMode if present
  if ('colorMode' in update && !validateColorMode(update.colorMode)) {
    errors.push(`Invalid colorMode: ${update.colorMode}. Must be 'light', 'dark', or 'system'`);
  }
  
  // Validate language if present
  if ('language' in update && !validateLanguage(update.language)) {
    errors.push(`Invalid language: ${update.language}. Must be 'en' or 'ar'`);
  }
  
  // Check for extra fields
  const allowedFields = ['theme', 'colorMode', 'language'];
  const extraFields = Object.keys(update).filter(key => !allowedFields.includes(key));
  
  if (extraFields.length > 0) {
    errors.push(`Extra fields not allowed: ${extraFields.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const sanitizePreferenceInput = (input: any): any => {
  if (!input || typeof input !== 'object') {
    return null;
  }
  
  const sanitized: any = {};
  
  // Only copy valid fields
  if ('theme' in input && validateTheme(input.theme)) {
    sanitized.theme = input.theme;
  }
  
  if ('colorMode' in input && validateColorMode(input.colorMode)) {
    sanitized.colorMode = input.colorMode;
  }
  
  if ('language' in input && validateLanguage(input.language)) {
    sanitized.language = input.language;
  }
  
  return Object.keys(sanitized).length > 0 ? sanitized : null;
};

describe('Theme Validation Unit Tests', () => {
  describe('validateTheme', () => {
    it('should accept valid themes', () => {
      expect(validateTheme('gastat')).toBe(true);
      expect(validateTheme('blueSky')).toBe(true);
    });

    it('should reject invalid themes', () => {
      expect(validateTheme('invalid')).toBe(false);
      expect(validateTheme('GASTAT')).toBe(false); // Case sensitive
      expect(validateTheme('blue-sky')).toBe(false);
      expect(validateTheme('')).toBe(false);
      expect(validateTheme('null')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateTheme('gastat ')).toBe(false); // With space
      expect(validateTheme(' gastat')).toBe(false); // With space
      expect(validateTheme('gas tat')).toBe(false); // With space in middle
    });
  });

  describe('validateColorMode', () => {
    it('should accept valid color modes', () => {
      expect(validateColorMode('light')).toBe(true);
      expect(validateColorMode('dark')).toBe(true);
      expect(validateColorMode('system')).toBe(true);
    });

    it('should reject invalid color modes', () => {
      expect(validateColorMode('auto')).toBe(false);
      expect(validateColorMode('Light')).toBe(false); // Case sensitive
      expect(validateColorMode('DARK')).toBe(false);
      expect(validateColorMode('')).toBe(false);
      expect(validateColorMode('undefined')).toBe(false);
    });
  });

  describe('validateLanguage', () => {
    it('should accept valid languages', () => {
      expect(validateLanguage('en')).toBe(true);
      expect(validateLanguage('ar')).toBe(true);
    });

    it('should reject invalid languages', () => {
      expect(validateLanguage('fr')).toBe(false);
      expect(validateLanguage('EN')).toBe(false); // Case sensitive
      expect(validateLanguage('en-US')).toBe(false);
      expect(validateLanguage('arabic')).toBe(false);
      expect(validateLanguage('')).toBe(false);
    });
  });

  describe('validatePreferenceUpdate', () => {
    it('should accept valid full updates', () => {
      const result = validatePreferenceUpdate({
        theme: 'gastat',
        colorMode: 'light',
        language: 'en',
      });
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid partial updates', () => {
      const themeOnly = validatePreferenceUpdate({ theme: 'blueSky' });
      expect(themeOnly.valid).toBe(true);
      expect(themeOnly.errors).toHaveLength(0);

      const colorModeOnly = validatePreferenceUpdate({ colorMode: 'dark' });
      expect(colorModeOnly.valid).toBe(true);
      expect(colorModeOnly.errors).toHaveLength(0);

      const languageOnly = validatePreferenceUpdate({ language: 'ar' });
      expect(languageOnly.valid).toBe(true);
      expect(languageOnly.errors).toHaveLength(0);
    });

    it('should reject empty objects', () => {
      const result = validatePreferenceUpdate({});
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one preference field must be provided');
    });

    it('should reject invalid theme values', () => {
      const result = validatePreferenceUpdate({ theme: 'invalid' });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid theme: invalid. Must be 'gastat' or 'blueSky'");
    });

    it('should reject invalid colorMode values', () => {
      const result = validatePreferenceUpdate({ colorMode: 'auto' });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid colorMode: auto. Must be 'light', 'dark', or 'system'");
    });

    it('should reject invalid language values', () => {
      const result = validatePreferenceUpdate({ language: 'fr' });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid language: fr. Must be 'en' or 'ar'");
    });

    it('should reject extra fields', () => {
      const result = validatePreferenceUpdate({
        theme: 'gastat',
        extraField: 'value',
        anotherExtra: 123,
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Extra fields not allowed: extraField, anotherExtra');
    });

    it('should collect multiple errors', () => {
      const result = validatePreferenceUpdate({
        theme: 'invalid',
        colorMode: 'wrong',
        language: 'unsupported',
        extra: 'field',
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain("Invalid theme: invalid. Must be 'gastat' or 'blueSky'");
      expect(result.errors).toContain("Invalid colorMode: wrong. Must be 'light', 'dark', or 'system'");
      expect(result.errors).toContain("Invalid language: unsupported. Must be 'en' or 'ar'");
      expect(result.errors).toContain('Extra fields not allowed: extra');
    });

    it('should handle null and undefined', () => {
      const nullResult = validatePreferenceUpdate(null);
      expect(nullResult.valid).toBe(false);
      expect(nullResult.errors).toContain('Invalid preference object');

      const undefinedResult = validatePreferenceUpdate(undefined);
      expect(undefinedResult.valid).toBe(false);
      expect(undefinedResult.errors).toContain('Invalid preference object');
    });

    it('should handle non-object types', () => {
      const stringResult = validatePreferenceUpdate('string');
      expect(stringResult.valid).toBe(false);
      expect(stringResult.errors).toContain('Invalid preference object');

      const numberResult = validatePreferenceUpdate(123);
      expect(numberResult.valid).toBe(false);
      expect(numberResult.errors).toContain('Invalid preference object');

      const arrayResult = validatePreferenceUpdate([]);
      expect(arrayResult.valid).toBe(false);
      expect(arrayResult.errors).toContain('At least one preference field must be provided');
    });
  });

  describe('sanitizePreferenceInput', () => {
    it('should sanitize valid input', () => {
      const input = {
        theme: 'gastat',
        colorMode: 'dark',
        language: 'ar',
      };
      
      const result = sanitizePreferenceInput(input);
      expect(result).toEqual(input);
    });

    it('should remove invalid fields', () => {
      const input = {
        theme: 'invalid',
        colorMode: 'dark',
        language: 'ar',
        extra: 'field',
      };
      
      const result = sanitizePreferenceInput(input);
      expect(result).toEqual({
        colorMode: 'dark',
        language: 'ar',
      });
      expect(result).not.toHaveProperty('theme');
      expect(result).not.toHaveProperty('extra');
    });

    it('should return null for completely invalid input', () => {
      expect(sanitizePreferenceInput(null)).toBeNull();
      expect(sanitizePreferenceInput(undefined)).toBeNull();
      expect(sanitizePreferenceInput('string')).toBeNull();
      expect(sanitizePreferenceInput(123)).toBeNull();
      expect(sanitizePreferenceInput([])).toBeNull();
    });

    it('should return null if all fields are invalid', () => {
      const input = {
        theme: 'wrong',
        colorMode: 'invalid',
        language: 'unsupported',
      };
      
      const result = sanitizePreferenceInput(input);
      expect(result).toBeNull();
    });

    it('should handle partial valid input', () => {
      const input = {
        theme: 'blueSky',
        colorMode: 'invalid',
        randomField: 'value',
      };
      
      const result = sanitizePreferenceInput(input);
      expect(result).toEqual({ theme: 'blueSky' });
    });
  });
});