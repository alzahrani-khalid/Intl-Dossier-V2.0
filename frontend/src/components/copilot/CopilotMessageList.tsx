/**
 * CopilotMessageList — the RTL-aware vertical message stream (AGENT-06).
 *
 * Built on assistant-ui headless primitives (ThreadPrimitive.Viewport / Messages,
 * MessagePrimitive.Root / Parts). User + assistant rows are BOTH flat --surface with
 * --ink text (no accent-tinted bubbles); differentiation is by start/end alignment via
 * logical properties (copilot-theme.css), so Arabic mirrors automatically.
 *
 * XSS GATE (threat T-72-08-01): assistant markdown is rendered with react-markdown +
 * remark-gfm + rehype-sanitize. We NEVER dangerouslySetInnerHTML raw model output.
 *
 * Each assistant turn carries a copy-message icon control (ActionBarPrimitive.Copy)
 * with an aria-label from the copilot namespace. The streaming state shows the accent
 * caret + "Thinking…" (--t-meta). Citations render via the Source part (CitationCard).
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import {
  ThreadPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  type TextMessagePartComponent,
  type ReasoningMessagePartComponent,
} from '@assistant-ui/react'
import { CitationCard } from './CitationCard'
import { GenericToolResultCard } from './genui/GenericToolResultCard'

/**
 * The assistant-ui Text message-part: render the part text as sanitized markdown.
 * `MessagePartPrimitive.InProgress` is NOT used for text here — react-markdown handles
 * the streamed text directly (assistant-ui re-renders the part as deltas arrive).
 */
const MarkdownText: TextMessagePartComponent = ({ text }): ReactElement => {
  return (
    <div className="copilot-message__body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {text}
      </ReactMarkdown>
    </div>
  )
}

/**
 * Reasoning message-part — a collapsible <details> disclosure, COLLAPSED by default.
 * The model's chain-of-thought is rendered as plain text (never markdown/HTML — no
 * injection surface) inside a muted token-bound panel. After the latency fix suppresses
 * thinking upstream this rarely streams, but when reasoning IS shown it stays tucked
 * away until the analyst opens it. Native <details> is keyboard-operable as-is.
 */
const ReasoningPart: ReasoningMessagePartComponent = ({ text }): ReactElement | null => {
  const { t } = useTranslation('copilot')
  if (text.length === 0) return null
  return (
    <details className="copilot-reasoning">
      <summary className="copilot-reasoning__summary">{t('reasoning.label')}</summary>
      <div className="copilot-reasoning__body">{text}</div>
    </details>
  )
}

function AssistantMessage(): ReactElement {
  const { t } = useTranslation('copilot')

  return (
    <MessagePrimitive.Root className="copilot-message" data-role="assistant">
      <div className="copilot-message__role">{t('title')}</div>
      {/* Text → sanitized markdown; Source → citation chip; any tool with NO dedicated
          renderer (the FIXED-allowlist genUI + propose_* HITL cards still win, resolved
          as toolUIs[name] ?? Fallback) → the generic token-bound tool card. */}
      <MessagePrimitive.Parts
        components={{
          Text: MarkdownText,
          Reasoning: ReasoningPart,
          Source: CitationCard,
          tools: { Fallback: GenericToolResultCard },
        }}
      />
      <div className="copilot-message__actions">
        <ActionBarPrimitive.Root hideWhenRunning autohide="not-last">
          <ActionBarPrimitive.Copy asChild>
            <button
              type="button"
              className="tb-icon-btn inline-flex h-8 w-8 min-h-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--ink-mute)] hover:bg-[var(--line-soft)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label={t('aria.copyMessage')}
            >
              <MessagePrimitive.If copied>
                <Check size={14} />
              </MessagePrimitive.If>
              <MessagePrimitive.If copied={false}>
                <Copy size={14} />
              </MessagePrimitive.If>
            </button>
          </ActionBarPrimitive.Copy>
        </ActionBarPrimitive.Root>
      </div>
    </MessagePrimitive.Root>
  )
}

function UserMessage(): ReactElement {
  const { t } = useTranslation('copilot')
  return (
    <MessagePrimitive.Root className="copilot-message" data-role="user">
      <div className="copilot-message__role">{t('roleYou', { defaultValue: 'You' })}</div>
      <MessagePrimitive.Parts components={{ Text: MarkdownText }} />
    </MessagePrimitive.Root>
  )
}

/** Accent caret + "Thinking…" — the token-bound streaming indicator. */
function StreamingIndicator(): ReactElement {
  const { t } = useTranslation('copilot')
  return (
    <div className="copilot-message" data-role="assistant" aria-live="polite">
      <span className="copilot-streaming">
        <span className="copilot-streaming__caret" aria-hidden="true" />
        {t('streaming.thinking')}
      </span>
    </div>
  )
}

export function CopilotMessageList(): ReactElement {
  return (
    <ThreadPrimitive.Viewport className="copilot-viewport" autoScroll>
      <ThreadPrimitive.Messages
        components={{
          UserMessage,
          AssistantMessage,
        }}
      />
      <ThreadPrimitive.If running>
        <StreamingIndicator />
      </ThreadPrimitive.If>
    </ThreadPrimitive.Viewport>
  )
}
