export interface IntelligenceDeliveryPayload {
  recipientId: string
  recipientEmail: string
  recipientLanguage: 'en' | 'ar'
  type: 'digest' | 'alert'
  subject: string
  bodyHtml: string
  bodyText: string
  deepLink: string
  genericLabel: string
}

export interface ChannelAdapter {
  readonly name: 'in_app' | 'smtp' | 'webhook'
  send(payload: IntelligenceDeliveryPayload): Promise<void>
}
