/**
 * Public types for ai-assistant-ui.
 *
 * The library is *transport-agnostic*: it doesn't know about
 * SSE, the Anthropic SDK, or any specific MCP runtime. The host
 * is responsible for translating their backend into this message
 * shape and pumping it into <ChatPanel>.
 *
 * This shape is intentionally close to the Anthropic Messages
 * API content blocks so a thin adapter (10-20 LOC) is enough to
 * bridge most chat backends.
 */

export type Role = 'user' | 'assistant'

export interface TextBlock {
  type: 'text'
  /** The text content. May be empty mid-stream. */
  text: string
  /**
   * Mark a streaming-in-progress assistant block. Renderer
   * shows a blinking cursor or pulsing skeleton.
   */
  streaming?: boolean
}

export interface ToolUseBlock {
  type: 'tool_use'
  /** Stable id used to correlate with a later tool_result. */
  id: string
  name: string
  /** JSON arguments passed to the tool. */
  input: unknown
  /** Streaming flag for in-flight tool_use blocks. */
  streaming?: boolean
}

export interface ToolResultBlock {
  type: 'tool_result'
  tool_use_id: string
  /**
   * Tool output rendered as text. The library doesn't try to
   * pretty-print JSON; pass a pre-formatted string if you want
   * indentation.
   */
  content: string
  isError?: boolean
}

// Re-export the visual block shape from its dedicated module so the
// public `ContentBlock` union stays a single import surface.
export type { VisualBlock } from './visuals/types'
import type { VisualBlock } from './visuals/types'

export type ContentBlock =
  | TextBlock
  | ToolUseBlock
  | ToolResultBlock
  | VisualBlock

export interface ChatMessage {
  /** Stable id (uuid, db id, anything unique within the list). */
  id: string
  role: Role
  blocks: ContentBlock[]
  /** ISO 8601 timestamp. Optional — used for tooltips. */
  createdAt?: string
}

/**
 * A pending mutation-tool confirmation request. When non-null the
 * panel renders a confirmation modal that surfaces the proposed
 * arguments and asks the user to approve or decline before the
 * tool runs upstream.
 */
export interface ToolConfirmationRequest {
  toolUseId: string
  toolName: string
  toolDescription?: string
  toolInput: unknown
  /** Unix seconds the request will expire at, if any. */
  expiresAtUnix?: number
  timeoutSeconds?: number
}

export type ConfirmationDecision = 'confirm' | 'decline'

/**
 * Slash-command parser callback. The host owns command semantics —
 * we just hand them the raw text and let them decide how to
 * dispatch. Return ``null`` to fall through to ``onSendMessage``.
 */
export type SlashCommandHandler = (
  raw: string,
) => Promise<SlashCommandResult | null> | SlashCommandResult | null

export interface SlashCommandResult {
  /** When true, the input is cleared but no message is sent. */
  consumed: boolean
  /** Optional toast / banner the host wants the panel to show. */
  message?: string
  variant?: 'info' | 'success' | 'error'
}

/**
 * One row in the conversation switcher dropdown.
 *
 * The library is conversation-agnostic — the host owns persistence
 * and decides what counts as a "conversation."  The library just
 * renders what's passed in and dispatches the new / select / delete
 * callbacks.
 */
export interface ConversationSummary {
  /** Stable id used by the select / delete callbacks. */
  id: string
  /** Display title (auto-generated, user-edited, or "Untitled"). */
  title: string
  /** ISO 8601 — used to sort and to render relative timestamps. */
  updatedAt?: string
}

export interface ChatPanelProps {
  /** Whether the drawer is open. */
  open: boolean
  /** Called when the user requests minimize (chevron / Esc). */
  onClose: () => void
  /** Conversation messages, oldest-first. */
  messages: ChatMessage[]
  /** True while a stream is in flight. Disables input. */
  isStreaming?: boolean
  /** Skeleton state while loading the initial history. */
  isLoading?: boolean
  /** Send a new user message. */
  onSendMessage: (content: string) => void | Promise<void>
  /** Cancel the in-flight stream. */
  onCancelStream?: () => void
  /** Pending tool-call confirmation, or null. */
  pendingConfirmation?: ToolConfirmationRequest | null
  /** Confirm/decline handler. ``note`` is optional reviewer feedback. */
  onResolveConfirmation?: (
    request: ToolConfirmationRequest,
    decision: ConfirmationDecision,
    note: string | null,
  ) => void | Promise<void>
  /** Optional slash-command interception. */
  onSlashCommand?: SlashCommandHandler
  /** Optional title. Defaults to "Assistant".  Hidden when
   *  ``conversations`` is provided — the switcher chip takes its place. */
  title?: string
  /** Optional textarea placeholder. */
  placeholder?: string
  /** Optional empty-state element shown when messages is empty. */
  emptyState?: React.ReactNode
  /** Optional className applied to the drawer root. */
  className?: string

  // -- Conversation switcher (all optional) ---------------------------
  /**
   * Pass a list to render the conversation switcher in the panel
   * header (where the static title would otherwise sit).  Omit
   * (or pass ``undefined``) to keep the legacy single-conversation
   * surface — back-compat default.
   */
  conversations?: ConversationSummary[]
  /** ``null`` means "new, unsaved conversation". */
  currentConversationId?: string | null
  /** Fired when the user picks "+ New conversation". */
  onNewConversation?: () => void
  /** Fired when the user picks an existing conversation in the menu. */
  onSelectConversation?: (id: string) => void
  /** When provided, a small trash icon appears on each conversation row. */
  onDeleteConversation?: (id: string) => void
}

export interface ChatBarProps {
  /** Click handler for the trigger pill. */
  onClick: () => void
  /** Whether the panel is currently open. Tweaks border radius. */
  open?: boolean
  /** Optional placeholder shown in the closed pill. */
  placeholder?: string
  /** Optional className passed to the pill. */
  className?: string
}
