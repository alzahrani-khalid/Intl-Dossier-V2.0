import { Mastra } from '@mastra/core'
import { aiConfig, AIProvider } from './config.js'
import logger from '../utils/logger.js'

export interface AgentTool<TInput = Record<string, unknown>, TOutput = unknown> {
  name: string
  description: string
  parameters: Record<
    string,
    {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array'
      description: string
      required?: boolean
      default?: unknown
    }
  >
  execute: (input: TInput) => Promise<TOutput>
}

export interface AgentConfig {
  name: string
  description: string
  systemPrompt: string
  tools: AgentTool[]
  model?: string
  provider?: AIProvider
  temperature?: number
  maxTokens?: number
}

class MastraRegistry {
  private agents: Map<string, AgentConfig> = new Map()
  private mastra: Mastra | null = null

  constructor() {
    this.initializeMastra()
  }

  private initializeMastra(): void {
    try {
      this.mastra = new Mastra({})
      logger.info('Mastra initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Mastra', { error })
    }
  }

  registerAgent(config: AgentConfig): void {
    if (this.agents.has(config.name)) {
      logger.warn(`Agent ${config.name} already registered, overwriting`)
    }
    this.agents.set(config.name, config)
    logger.info(`Agent ${config.name} registered`)
  }

  getAgent(name: string): AgentConfig | undefined {
    return this.agents.get(name)
  }

  listAgents(): string[] {
    return Array.from(this.agents.keys())
  }

  getDefaultModel(provider?: AIProvider): string {
    const p = provider || aiConfig.routing.defaultProvider
    return aiConfig.providers[p]?.defaultModel || 'gpt-4o'
  }

  getMastra(): Mastra | null {
    return this.mastra
  }
}

export const mastraRegistry = new MastraRegistry()

export function createAgentTools<T extends AgentTool[]>(tools: T): T {
  return tools
}

export function defineAgent(config: AgentConfig): AgentConfig {
  mastraRegistry.registerAgent(config)
  return config
}

export default mastraRegistry
