import type { ChatMessage, ToolConfirmationRequest } from '../src/types'

/**
 * Each `Scene` describes one screenshot the Playwright suite renders.
 * Scenes are URL-addressable: `/?scene=<id>`. New scenes need only
 * an entry here; the screenshot test discovers them automatically.
 */
export interface Scene {
  id: string
  /** Title above the demo frame in the rendered page. */
  title: string
  /** Whether the panel should be open. */
  open: boolean
  isStreaming?: boolean
  isLoading?: boolean
  /** When true, render a small unread badge on the closed bar. */
  unreadBadge?: boolean
  messages: ChatMessage[]
  pendingConfirmation?: ToolConfirmationRequest | null
}

const ts = (offsetSeconds: number): string =>
  new Date(Date.UTC(2026, 4, 6, 17, 30, 0) + offsetSeconds * 1000).toISOString()

const conversation: ChatMessage[] = [
  {
    id: 'm1',
    role: 'user',
    createdAt: ts(0),
    blocks: [{ type: 'text', text: 'How many open invoices are over 30 days past due?' }],
  },
  {
    id: 'm2',
    role: 'assistant',
    createdAt: ts(2),
    blocks: [
      { type: 'text', text: "I'll check the billing system." },
      {
        type: 'tool_use',
        id: 'tu_1',
        name: 'list_invoices',
        input: { status: 'open', past_due_days_min: 30 },
      },
      {
        type: 'tool_result',
        tool_use_id: 'tu_1',
        content:
          '[\n  {"id": 4711, "amount": 1250.00, "days_past_due": 47},\n  {"id": 4733, "amount":  890.00, "days_past_due": 31},\n  {"id": 4798, "amount": 2200.00, "days_past_due": 38}\n]',
      },
      {
        type: 'text',
        text:
          'There are **3 open invoices** more than 30 days past due, totaling **$4,340.00**. The oldest is invoice #4711 at 47 days past due ($1,250).',
      },
    ],
  },
]

const inFlightStreaming: ChatMessage[] = [
  ...conversation,
  {
    id: 'm3',
    role: 'user',
    createdAt: ts(60),
    blocks: [{ type: 'text', text: 'Send a friendly reminder for the oldest one.' }],
  },
  {
    id: 'm4',
    role: 'assistant',
    createdAt: ts(62),
    blocks: [
      { type: 'text', text: 'Drafting a reminder', streaming: true },
    ],
  },
]

const toolInFlight: ChatMessage[] = [
  ...conversation,
  {
    id: 'm5',
    role: 'user',
    createdAt: ts(120),
    blocks: [{ type: 'text', text: 'Send the reminder for #4711 now.' }],
  },
  {
    id: 'm6',
    role: 'assistant',
    createdAt: ts(122),
    blocks: [
      { type: 'text', text: 'Sending the reminder.' },
      {
        type: 'tool_use',
        id: 'tu_send',
        name: 'send_invoice_reminder',
        input: { invoice_id: 4711, tone: 'friendly' },
        streaming: true,
      },
    ],
  },
]

const toolResultDone: ChatMessage[] = [
  ...toolInFlight.slice(0, -1),
  {
    id: 'm6b',
    role: 'assistant',
    createdAt: ts(124),
    blocks: [
      { type: 'text', text: 'Sending the reminder.' },
      {
        type: 'tool_use',
        id: 'tu_send',
        name: 'send_invoice_reminder',
        input: { invoice_id: 4711, tone: 'friendly' },
      },
      {
        type: 'tool_result',
        tool_use_id: 'tu_send',
        content: '{"sent": true, "channel": "email", "message_id": "msg_8a3f"}',
      },
      {
        type: 'text',
        text: 'Done — reminder sent to the customer on file. Want me to schedule a follow-up if there’s no response in 5 business days?',
      },
    ],
  },
]

const pendingConfirmation: ToolConfirmationRequest = {
  toolUseId: 'tu_pending',
  toolName: 'refund_invoice',
  toolDescription:
    'Issue a full refund for an invoice. This is irreversible and notifies the customer.',
  toolInput: { invoice_id: 4733, reason: 'duplicate_charge' },
  timeoutSeconds: 60,
  expiresAtUnix: Math.floor(Date.now() / 1000) + 45,
}

export const scenes: Record<string, Scene> = {
  collapsed: {
    id: 'collapsed',
    title: '1. Collapsed — chat bar at rest',
    open: false,
    messages: [],
  },
  notifying: {
    id: 'notifying',
    title: '2. New-response notification — closed with unread badge',
    open: false,
    unreadBadge: true,
    messages: conversation,
  },
  loading: {
    id: 'loading',
    title: '3. Opening — loading prior conversation',
    open: true,
    isLoading: true,
    messages: [],
  },
  empty: {
    id: 'empty',
    title: '4. Open & empty — first-run state',
    open: true,
    messages: [],
  },
  conversation: {
    id: 'conversation',
    title: '5. Open with a completed conversation',
    open: true,
    messages: conversation,
  },
  streaming: {
    id: 'streaming',
    title: '6. Streaming — assistant text streaming in',
    open: true,
    isStreaming: true,
    messages: inFlightStreaming,
  },
  'tool-in-flight': {
    id: 'tool-in-flight',
    title: '7. Tool call in flight — args streaming',
    open: true,
    isStreaming: true,
    messages: toolInFlight,
  },
  'tool-result': {
    id: 'tool-result',
    title: '8. Tool result rendered + follow-up',
    open: true,
    messages: toolResultDone,
  },
  confirmation: {
    id: 'confirmation',
    title: '9. Mutation confirmation modal',
    open: true,
    messages: conversation,
    pendingConfirmation,
  },
}

export const sceneIds = Object.keys(scenes)
