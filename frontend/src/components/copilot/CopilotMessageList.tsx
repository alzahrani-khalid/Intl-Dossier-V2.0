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
} from '@assistant-ui/react'
import { CitationCard } from './CitationCard'

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

function AssistantMessage(): ReactElement {
  const { t } = useTranslation('copilot')

  return (
    <MessagePrimitive.Root className="copilot-message" data-role="assistant">
      <div className="copilot-message__role">{t('title')}</div>
      <MessagePrimitive.Parts components={{ Text: MarkdownText, Source: CitationCard }} />
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
