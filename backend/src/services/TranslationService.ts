import axios from 'axios';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';

export class TranslationService {
  private readonly cachePrefix = 'translation:';

  async translate(text: string, targetLang: 'ar' | 'en', sourceLang?: 'ar' | 'en') {
    try {
      const cacheKey = `${this.cachePrefix}${targetLang}:${text.substring(0, 50)}`;
      const cached = await cacheHelpers.get(cacheKey);
      if (cached) return cached;

      // Integration with translation API (Google Translate, DeepL, etc.)
      // For now, using a mock implementation
      const translated = this.mockTranslate(text, targetLang);

      await cacheHelpers.set(cacheKey, translated, 86400); // 24 hours
      return translated;
    } catch (error) {
      logError('Translation error', error as Error);
      return text; // Return original text as fallback
    }
  }

  async translateDocument(content: string, targetLang: 'ar' | 'en') {
    const paragraphs = content.split('\n\n');
    const translated = await Promise.all(
      paragraphs.map(p => this.translate(p, targetLang))
    );
    return translated.join('\n\n');
  }

  private mockTranslate(text: string, targetLang: 'ar' | 'en'): string {
    if (targetLang === 'ar') {
      return `[ترجمة عربية: ${text}]`;
    }
    return `[English translation: ${text}]`;
  }
}

export default TranslationService;
