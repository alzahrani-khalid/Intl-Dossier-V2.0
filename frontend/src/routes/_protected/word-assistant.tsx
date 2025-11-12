import { createFileRoute } from '@tanstack/react-router'
import { WordAssistantPage } from '@/pages/word-assistant/WordAssistantPage'

export const Route = createFileRoute('/_protected/word-assistant')({
 component: WordAssistantPage
})