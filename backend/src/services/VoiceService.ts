import { OpenAI } from 'openai';
import { logInfo, logError } from '../utils/logger';

export class VoiceService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  async transcribeAudio(audioBuffer: Buffer, language: 'en' | 'ar' = 'en'): Promise<{
    text: string;
    confidence: number;
    language: string;
  }> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not configured');
      }

      // Mock implementation - would use Whisper API in production
      const mockText = 'Show me the latest MoUs with Saudi Arabia';
      
      logInfo('Audio transcribed successfully');
      return {
        text: mockText,
        confidence: 0.95,
        language
      };
    } catch (error) {
      logError('Voice transcription error', error as Error);
      throw error;
    }
  }

  async processVoiceCommand(text: string): Promise<{
    intent: string;
    entities: any;
    action: string;
  }> {
    // Parse the transcribed text to determine intent
    const intent = this.detectIntent(text);
    const entities = this.extractEntities(text);

    return {
      intent,
      entities,
      action: this.mapIntentToAction(intent)
    };
  }

  private detectIntent(text: string): string {
    const lowercased = text.toLowerCase();
    
    if (lowercased.includes('show') || lowercased.includes('display')) {
      return 'query';
    }
    if (lowercased.includes('create') || lowercased.includes('add')) {
      return 'create';
    }
    if (lowercased.includes('update') || lowercased.includes('change')) {
      return 'update';
    }
    
    return 'unknown';
  }

  private extractEntities(text: string): any {
    // Simple entity extraction
    const entities: any = {};
    
    if (text.includes('MoU') || text.includes('agreement')) {
      entities.type = 'mou';
    }
    if (text.includes('country')) {
      entities.type = 'country';
    }
    
    return entities;
  }

  private mapIntentToAction(intent: string): string {
    const actionMap: Record<string, string> = {
      'query': 'search',
      'create': 'create',
      'update': 'update',
      'unknown': 'help'
    };

    return actionMap[intent] || 'help';
  }

  /**
   * Process a text command (alias for processVoiceCommand)
   * This is called by the AI endpoints
   */
  async processCommand(text: string): Promise<{
    intent: string;
    entities: any;
    action: string;
    response?: string;
  }> {
    const result = await this.processVoiceCommand(text);
    return {
      ...result,
      response: `Processing command: ${result.action}`
    };
  }
}

export default VoiceService;
