import type {
  ChatMessage,
  ConversationSummary,
  ToolConfirmationRequest,
  VisualBlock as VisualBlockType,
} from '../src/types'
import type {
  ChartSpec,
  ImageSpec,
  KpiSpec,
  TableSpec,
} from '../src/visuals/types'

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
  /** When provided, renders the ConversationSwitcher in the panel
   *  header.  Omit to keep the legacy static-title surface. */
  conversations?: ConversationSummary[]
  currentConversationId?: string | null
  /** Open the switcher dropdown on initial render — used for the
   *  switcher-open screenshot scene. */
  switcherOpen?: boolean
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

// ----- Conversation list (used by every scene that opts in) --------------

const SAMPLE_CONVERSATIONS: ConversationSummary[] = [
  {
    id: 'conv_active',
    title: 'Past-due invoices for April',
    updatedAt: ts(0),
  },
  { id: 'conv_2', title: 'Monthly revenue trend', updatedAt: ts(-3600) },
  { id: 'conv_3', title: 'Refund flow for #4733', updatedAt: ts(-86400) },
  {
    id: 'conv_4',
    title: 'Why are signups dipping on weekends?',
    updatedAt: ts(-2 * 86400),
  },
  { id: 'conv_5', title: 'Q1 board prep', updatedAt: ts(-5 * 86400) },
]
const ACTIVE_CONVERSATION_ID = 'conv_active'

const pendingConfirmation: ToolConfirmationRequest = {
  toolUseId: 'tu_pending',
  toolName: 'refund_invoice',
  toolDescription:
    'Issue a full refund for an invoice. This is irreversible and notifies the customer.',
  toolInput: { invoice_id: 4733, reason: 'duplicate_charge' },
  timeoutSeconds: 60,
  expiresAtUnix: Math.floor(Date.now() / 1000) + 45,
}

// ----- Visuals demo scenes ------------------------------------------------

function visualBlock(
  toolUseId: string,
  spec: ChartSpec | TableSpec | KpiSpec | ImageSpec,
): VisualBlockType {
  return {
    type: 'visual',
    tool_use_id: toolUseId,
    schema_version: 1,
    spec,
  }
}

const visualBarChart = (): ChatMessage[] => [
  {
    id: 'vb-u1',
    role: 'user',
    createdAt: ts(0),
    blocks: [
      { type: 'text', text: 'Show me revenue by quarter for the last year.' },
    ],
  },
  {
    id: 'vb-a1',
    role: 'assistant',
    createdAt: ts(2),
    blocks: [
      { type: 'text', text: 'Quarterly revenue, FY26:' },
      visualBlock('tu_chart_bar', {
        kind: 'chart',
        chart_type: 'bar',
        title: 'Revenue by quarter (FY26, USD)',
        data: [
          { quarter: 'Q1', revenue: 412000, cost: 268000 },
          { quarter: 'Q2', revenue: 489000, cost: 281000 },
          { quarter: 'Q3', revenue: 521000, cost: 295000 },
          { quarter: 'Q4', revenue: 604000, cost: 312000 },
        ],
        x_key: 'quarter',
        y_keys: ['revenue', 'cost'],
        y_label: 'USD',
      }),
      {
        type: 'text',
        text: 'Revenue grew **47%** Q1 → Q4 while cost grew only **16%**, widening margin every quarter.',
      },
    ],
  },
]

const visualLineChart = (): ChatMessage[] => [
  {
    id: 'vl-u1',
    role: 'user',
    createdAt: ts(0),
    blocks: [{ type: 'text', text: 'How is monthly active users trending?' }],
  },
  {
    id: 'vl-a1',
    role: 'assistant',
    createdAt: ts(2),
    blocks: [
      visualBlock('tu_chart_line', {
        kind: 'chart',
        chart_type: 'line',
        title: 'Monthly active users (12 mo)',
        data: [
          { month: 'May', mau: 18420 },
          { month: 'Jun', mau: 19105 },
          { month: 'Jul', mau: 21330 },
          { month: 'Aug', mau: 23890 },
          { month: 'Sep', mau: 26012 },
          { month: 'Oct', mau: 28911 },
          { month: 'Nov', mau: 31408 },
          { month: 'Dec', mau: 33990 },
          { month: 'Jan', mau: 35211 },
          { month: 'Feb', mau: 38004 },
          { month: 'Mar', mau: 41250 },
          { month: 'Apr', mau: 44120 },
        ],
        x_key: 'month',
        y_keys: ['mau'],
        y_label: 'MAU',
      }),
      {
        type: 'text',
        text: 'Steady growth — **+139%** YoY, with no dips.',
      },
    ],
  },
]

const visualAreaChart = (): ChatMessage[] => [
  {
    id: 'va-a1',
    role: 'assistant',
    createdAt: ts(0),
    blocks: [
      visualBlock('tu_chart_area', {
        kind: 'chart',
        chart_type: 'area',
        title: 'Daily signups by source (last 30 days)',
        data: [
          { day: 'Apr 1',  organic: 142, referral: 38, paid: 51 },
          { day: 'Apr 5',  organic: 168, referral: 41, paid: 60 },
          { day: 'Apr 10', organic: 184, referral: 49, paid: 72 },
          { day: 'Apr 15', organic: 201, referral: 55, paid: 81 },
          { day: 'Apr 20', organic: 213, referral: 62, paid: 88 },
          { day: 'Apr 25', organic: 232, referral: 71, paid: 96 },
          { day: 'Apr 30', organic: 248, referral: 79, paid: 104 },
        ],
        x_key: 'day',
        y_keys: ['organic', 'referral', 'paid'],
        stacked: true,
      }),
      {
        type: 'text',
        text: 'Stacked view — total daily signups roughly doubled, organic still dominant.',
      },
    ],
  },
]

const visualPieChart = (): ChatMessage[] => [
  {
    id: 'vp-a1',
    role: 'assistant',
    createdAt: ts(0),
    blocks: [
      visualBlock('tu_chart_pie', {
        kind: 'chart',
        chart_type: 'donut',
        title: 'Open invoices by aging bucket',
        data: [
          { label: '0–30 days',  value: 42 },
          { label: '31–60 days', value: 18 },
          { label: '61–90 days', value:  7 },
          { label: '90+ days',   value:  3 },
        ],
      }),
      {
        type: 'text',
        text: '**70 open invoices.** Most are within 60 days; 3 are past 90 — review for write-off.',
      },
    ],
  },
]

const visualTable = (): ChatMessage[] => [
  {
    id: 'vt-u1',
    role: 'user',
    createdAt: ts(0),
    blocks: [{ type: 'text', text: 'List the past-due invoices.' }],
  },
  {
    id: 'vt-a1',
    role: 'assistant',
    createdAt: ts(2),
    blocks: [
      visualBlock('tu_table', {
        kind: 'table',
        title: 'Open invoices > 30 days past due',
        columns: [
          { key: 'id',       label: 'Invoice', type: 'string' },
          { key: 'customer', label: 'Customer', type: 'string' },
          { key: 'amount',   label: 'Amount',   type: 'currency', align: 'right' },
          { key: 'due',      label: 'Due',      type: 'date' },
          { key: 'days',     label: 'Days late',type: 'number',   align: 'right' },
        ],
        rows: [
          { id: '#4711', customer: 'Acme Corp',     amount: 1250.00, due: '2026-03-20', days: 47 },
          { id: '#4733', customer: 'Globex Inc',    amount: 2890.00, due: '2026-04-05', days: 31 },
          { id: '#4798', customer: 'Initech LLC',   amount: 2200.00, due: '2026-03-29', days: 38 },
          { id: '#4810', customer: 'Hooli',         amount:  890.00, due: '2026-04-02', days: 34 },
          { id: '#4855', customer: 'Pied Piper',    amount: 4100.00, due: '2026-03-15', days: 52 },
        ],
      }),
      {
        type: 'text',
        text: '**5 invoices**, **$11,330** outstanding. Pied Piper is the oldest at 52 days.',
      },
    ],
  },
]

const visualKpi = (): ChatMessage[] => [
  {
    id: 'vk-u1',
    role: 'user',
    createdAt: ts(0),
    blocks: [{ type: 'text', text: 'How are we doing on revenue this month?' }],
  },
  {
    id: 'vk-a1',
    role: 'assistant',
    createdAt: ts(2),
    blocks: [
      visualBlock('tu_kpi', {
        kind: 'kpi',
        label: 'MTD revenue',
        value: '$487,210',
        trend: { direction: 'up', delta: '+12.4%', period: 'vs last month' },
        status: 'good',
      }),
      {
        type: 'text',
        text: 'On pace to beat April by **~$60k** if the current run rate holds.',
      },
    ],
  },
]

// 640×400 RGB PNG of a board-deck quarterly revenue bar chart
// (four ascending blue bars + gridlines on white).  Displayed at
// 320×200 CSS pixels in the panel, so retina (2× DPR) screenshots
// map device pixels 1:1 against the source for crisp edges.
// Generated by a hand-rolled encoder (Node zlib + raw RGB chunks)
// — earlier versions used indexed-palette encoders that introduced
// vertical color banding on the bar edges, reading as a glitchy
// upload rather than a real preview.  A 1×1 transparent before
// that rendered as an empty box; same problem.
const TINY_PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAGQCAIAAACxkUZyAAAMeUlEQVR42u3XMZKDMBBFQe7F7XxDAiLHKgXKSSEltZEQjLqLE+xXzVtPOwBwu8mfAAAEGAAEGAAQYAAQYABAgAFAgAEAAQYAAQYABBgABBgABBgAEGAAEGAAQIABQIABAAEGAAEGAAQYAAQYAAQYABBgABBgAECAAUCAAQABBgABBgAEGAAEGAAE+PGW9Zty8fl8Pp+vyifAPwTYv04A+AUswAAgwAAgwAIMAAIMAAIswAAIsAADgAALMAACLMAAIMACDIAACzAACDAACLAAA4AAA4AACzAAAizAACDAAgyAAAswAAiwAAMgwAIMAAIMAAIswAAgwAAgwAIMgAALMAAIsAAD/GP+bLE/ARZgAAEWYAEGQIAFWIABBFiABRhAgAVYgAUYQIAFWIABBFiABViAAQRYgAUYQIAFWIAFGECABViAAQRYgAUYAAEWYAEGEGABFmAAARZgARZgAAEWYAEGEGABFmABBhBgARZgAAEWYAEWYAABFmABBhBgARZgAARYgAUYQIAFWIABBFiABViAAQRYgAUYQIAFWIAFGECABViAAQRYgAVYgAEEWIAFGECABViAARBgARZgAAEWYAEGEGABFmABBhBgARZgAAEWYAEWYAABFmABBhBgARZgAQYQYAEWYAABFmABFmAAARZgAQYQYAEWYAABFmABFmAAARZgAQYQYAEWYAEGEGABFmAAARZgARZgAAEWYAEGEGABFmABBhBgARZgAAEWYAEGEGABFmABBhBgARZgAAEWYAEWYAABFmABBhBgARZgAQYQYAEWYAABFmABFmAAARbgjgFOufh8Pp/v/IUPcLs/nQD7BQzgF7BfwAIMIMACLMACDCDAAizAAAIswAIMgAALsAADCLAACzCAAAuwAAswgAALsAADbn2kW28UARZgEGC33ihGEWDArRdgowiwAIMAu/VGEWABBtx6ATaKAAswuPVuvVEEWIABt94oRhFgAQa33q03igALMAiwW28Uowgw4Na79UYRYAEGAXbrjWIUAQbcegE2igALMAiwW28UARZgwK0XYKMIsACDW+/WG0WABRhw641iFAEWYHDr3XqjCLAAA269UYwiwIBb79YbRYAFGATYrTeKUQQYcOsF2CgCLMAgwG69UQRYgAG3XoCNIsACDG69W28UARZgwK03ilEEWIDBrXfrjSLAAgy49UYxigADbr1bbxQBFmAQYLfeKEYRYMCtF2CjCLAAgwC79UYRYAEG3HoBNooACzC49W69UQRYgAG3XoCNIsACDG69W28UARZgwK03ilEEGHDr3XqjCLAAgwC79UYxigADbr0AG0WABRgE2K03igALMODWC7BRBFiAQYDdeqMIsAADbr0AG0WABRjcerfeKAIswIBbbxSjCLDzB269W28UARZgEGC33ihGEWDArRdgowiwAIMAu/VGEWABBtx6ATaKAAswCLBbbxQBFmDArRdgowiwAINb79YbRYAFGHDrjWIUARZgcOvdeqMIsACDALv1RjGKAANuvQAbRYAFGATYrTeKAAsw4NYLsFEEWIBBgN16owiwAANuvQAbRYAFGNx6t94oAizAgFtvFKMIsACDW+/WG0WABRgE2K03ilEEGHDrBdgoAizAIMBuvVEEWIABt16AjSLAAgwC7NYbRYAFGHDrBdgoAizA4Na79UYRYAEG3HqjGEWABRjcerfeKALcM8ApF984X/izYhSjGKXvKALsFzD+rzeKUYziF7AA46w4K0YxilEEWIAF2FkxilGMIsACjLPi1hvFKEYRYATYWTGKUYwiwAKMs+LWG8UoRhFgBNhZMYpRjCLAAoyz4tYbxSgCLMA4K86KUYxiFAEWYJwVoxjFKAIswDgrzopRjGIUARZgAXZWjGIUowiwAOOsOCtGMYpRBBgBdlaMYhSjCLAA46y49UYxilEEGAF2VoxiFKMIsADjrLj1RjGKAAswzoqzYhSjGEWABRhnxShGMYoACzDOirNiFKMYRYAFGGfFKEYxigALMM6Ks2IUoxhFgBFgZ8UoRjGKAAswzopbbxSjGEWAEWBnxShGMYoACzDOiltvFKMIsADjrDgrRjGKUQRYgHFWjGIUowiwAOOsOCtGMYpRBFiAcVaMYhSjCLAA46w4K0YxilEEGAF2VoxiFKMIsADjrLj1RjGKUQQYAXZWjGIUowiwAOOsuPVGMYoACzDOirNiFKMYRYAFGGfFrTeKUQRYgHFWnBWjGMUoAizAOCtGMYpRBFiAcVacFaMYxSgCjAA7K0YxilEEWIBxVtx6oxjFKAKMADsrRjGKUQRYgHFW3HqjGEWABRhnxVkxilGMIsACjLPi1hvFKAIswDgrzopRjGIUARZgnBWjGMUoAizAOCvOilGMYhQBFmABdlaMYhSjCLAA46y49UYxilEEGAF2VoxiFKMIsADjrLj1RjGKAAswAuysGMUoRhFgAcZZceuNYhQBFmCcFWfFKEYxigALMM6KUYxiFAEWYJwVZ8UoRjGKAAuwADsrRjGKUQRYgHFW3HqjGMUoAowAOytGMYpRBFiAcVbceqMYRYAFGAF2VoxiFKMIsADjrLj1RjGKAAswzoqzYhSjGEWA+wbYC3ZWjGIUoxhFgAXYCzaKUYxiFAEWYC/YWTGKUYxiFAH2gp0VoxjFKEYRYAH2gp0VoxjFKEYRYC/YWTGKUYxiFAEWYC/YKEYxilEEWIC9YGfFKEYxilEEWIC9YKMYxShGEWAB9oKdFaMYxShGEWAB9oKNYhSjGEWABdgLdlaMYhSjGEWAvWBnxShGMYpRBFiAvWBnxShGMYpRBNgLdlaMYhSjGEWABdgLNopRjGIUARZgL9hZMYpRjGIUAb4Q4JRLoy/8C273pzOKUYxilJeOIsB+AfsX0ihGMYpR/AIWYC/YWTGKUYxiFAEWYGfFKEYxilEEWIC9YGfFKEYxilEE2At2VoxiFKMYRYAF2As2ilGMYhSjCLAX7KwYxShGMYoAC7AXbBSjGMUoAizAXrCzYhSjGMUoAizAXrBRjGIUowiwAHvBzopRjGIUowiwADsrRjGKUYwiwALsBTsrRjGKUYwiwF6ws2IUoxjFKAIswF6wUYxiFKMYRYC9YGfFKEYxilEEWIC9YKMYxShGEWAB9oKdFaMYxShGEWAB9oKNYhSjGEWABdgLdlaMYhSjGEWABdgLNopRjGIUARZgL9hZMYpRjGIUAfaCnRWjGMUoRhFgAfaCjWIUoxjFKALsBTsrRjGKUYwiwALsBRvFKEYxigALsBfsrBjFKEYxigALsBdsFKMYxSgCLMBesLNiFKMYxSgCLMBesFGMYhSjCLAAe8HOilGMYhSjCLAX7KwYxShGMYoAC7AXbBSjGMUoRhFgL9hZMYpRjGIUARZgL9goRjGKUQRYgL1gZ8UoRjGKUQRYgL1goxjFKEYRYAH2gp0VoxjFKEYRYAH2go1iFKMYRYAF2At2VoxiFKMYRYC9YGfFKEYxilEEWIC9YGfFKEYxilEE2At2VoxiFKMYRYAF2As2ilGMYhQBFmAv2FkxilGMYhQBFmAv2ChGMYpRBFiAvWBnxShGMYpRBFiAvWCjGMUoRhFgAfaCnRWjGMUoRhFgAXZWjGIUoxhFgAXYC3ZWjGIUoxhFgL1gZ8UoRjGKUQRYgL1goxjFKEYRYAH2gp0VoxjFKEYRYAH2go1iFKMYRYAF2At2VoxiFKMYRYAF2As2ilGMYhQBFmAv2FkxilGMYhQBFmBnxShGMYpRBFiAvWBnxShGMYpRBNgLdlaMYhSjGEWABdgLNopRjGIUARZgL9hZMYpRjGIUARZgL9goRjGKUQRYgL1gZ8UoRjGKUQRYgL1goxjFKEYRYAH2gp0VoxjFKEYRYAF2VoxiFKMYRYAF2At2VoxiFKMYRYC9YGfFKEYxilEEWIC9YKMYxShGEWAB9oKdFaMYxShGEWAB9oKNYhSjGEWABdgLdlaMYhSjGEWABdgLNopRjGIUARZgL9hZMYpRjGIUARZgZ8UoRjGKUQRYgL1gZ8UoRjGKUQTYC3ZWjGIUoxhFgAXYCzaKUYxiFKMIsBfsrBjFKEYxigDXCbDP5/P5fLU+AQaAUQgwAAgwAAgwACDAACDAAIAAA4AAAwACDAACDAAIMAAIMAAIMAAgwAAgwACAAAOAAAMAAgwAAgwACDAACDAACDAAIMAAIMAAgAADgAADAAIMAAIMAAgwAAgwAAgwACDAACDAAIAAA4AAAwACDAACDAAIMAAIMACM5wDJqzDQOMJ7cAAAAABJRU5ErkJggg=='

const visualMixed = (): ChatMessage[] => [
  {
    id: 'vm-u1',
    role: 'user',
    createdAt: ts(0),
    blocks: [{ type: 'text', text: 'Give me the Q1 wrap-up — KPIs, trend chart, and the past-due table.' }],
  },
  {
    id: 'vm-a1',
    role: 'assistant',
    createdAt: ts(2),
    blocks: [
      { type: 'text', text: '**Q1 FY26 — at a glance**' },
      visualBlock('tu_mix_kpi', {
        kind: 'kpi',
        label: 'Q1 revenue',
        value: '$1.42M',
        trend: { direction: 'up', delta: '+18%', period: 'vs Q4 FY25' },
        status: 'good',
      }),
      visualBlock('tu_mix_chart', {
        kind: 'chart',
        chart_type: 'bar',
        title: 'Revenue by month (Q1)',
        data: [
          { month: 'Jan', revenue: 412000 },
          { month: 'Feb', revenue: 489000 },
          { month: 'Mar', revenue: 521000 },
        ],
        x_key: 'month',
        y_keys: ['revenue'],
      }),
      visualBlock('tu_mix_table', {
        kind: 'table',
        title: 'Top 3 past-due',
        columns: [
          { key: 'id',       label: 'Invoice' },
          { key: 'customer', label: 'Customer' },
          { key: 'amount',   label: 'Amount', type: 'currency', align: 'right' },
        ],
        rows: [
          { id: '#4855', customer: 'Pied Piper', amount: 4100.00 },
          { id: '#4733', customer: 'Globex',     amount: 2890.00 },
          { id: '#4798', customer: 'Initech',    amount: 2200.00 },
        ],
      }),
      {
        type: 'text',
        text: 'Strong Q1 across the board. Past-due collections are the only watch item — Pied Piper alone is **3.6%** of outstanding.',
      },
    ],
  },
]

const visualImage = (): ChatMessage[] => [
  {
    id: 'vi-u1',
    role: 'user',
    createdAt: ts(0),
    blocks: [{ type: 'text', text: 'Here is the chart from the board deck — confirm the Q4 number?' }],
  },
  {
    id: 'vi-a1',
    role: 'assistant',
    createdAt: ts(2),
    blocks: [
      { type: 'text', text: 'Image received and validated.  Preview:' },
      visualBlock('tu_image', {
        kind: 'image',
        src: TINY_PNG_DATA_URI,
        alt: 'Uploaded chart from the board deck',
        width: 320,
        height: 200,
        caption: 'Source: 2026 Q1 board deck (data:image upload preview)',
      }),
      {
        type: 'text',
        text: 'Q4 figure on the deck reads **$604k** — matches the system of record.',
      },
    ],
  },
]

// ----- Workflow / recording / replay / graph demo scenes ------------------
//
// These mirror the four feature surfaces exposed by ai-assistant-client:
//   * Multi-step workflows (chained tool calls with emit_status updates).
//   * Recording (the run id shown in the workflow-running scene).
//   * Replay (workflow-replay reads from the recorded transcript with
//     no live side-effects — the tool_result blocks are marked
//     accordingly so the renderer can hint at read-only mode).
//   * Graph viz — workflow-graph + workflow-gantt embed the flowchart
//     and Gantt diagrams the client's CLI emits, baked into image
//     visuals so they render in the chat surface.
//
// The mermaid PNGs are generated at native panel size (LR flowchart at
// 1568×170 px source, Gantt at 1176×330 px source) and displayed at
// half that in the visual block so retina (DPR=2) screenshots map
// device pixels 1:1 against the source for crisp edges.

const WORKFLOW_GRAPH_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABiAAAACqCAIAAACrhhBeAAAQAElEQVR4nOzdB1wTZx8H8AdIwt6IAoITBLc4EAfiBsUJjrpxb61aa62ttlZb997iHrj3AsW990ZBUJShsvcI8P6Ts3kpI4CskPy+Hz7xcrlcnuSenPf88txzvMzMTAYAAAAAAAAAAPC9lBkAAAAAAAAAAEARIGACAAAAAAAAAIAiQcAEAAAAAAAAAABFgoAJAAAAAAAAAACKBAETAAAAAAAAAAAUCQImAAAAAAAAAAAoEh4DAAAAKD/S4qPS4iIZQIlR4gvUjcyZTIqPFqYLMxnII20DvrJM/vqfnJiRkpjOAAqAx1fW1FVhoKgQMAEAAEB58v7cBv9jS3nqmgygBGSmp/M19dque8Vk0tltoTHhaUrKSgzkS3Ji+pA5VXUMZLF19tgn6un1aAoOGIBUGRmZxuaqPceZMVBUCJgAAACgnKni6GIzYDwDKAGxQf6P1i1gsiozk7V0NalYVZ2BfDm6LIDJMKumeg3aGjIAqT69SQh4Es1AgSGHBgAAAAAAAACAIkHABAAAAAAAAAAARYKACQAAAAAAAAAAigQBEwAAAAAAAAAAFAkCJgAAAAAAAAAAKBJcRQ4AAAAAAAAAILvI5Fgv35sxyXFKSsqZmRlMVikxZTW+oKOVvYl2BVZ2EDABAAAAAAAAAIhsunvosv+920FPk1KTGctUF6irKClThMMymexSYunp6TPOLKVC8pRV7Czqta7eZFrrIax0IWACAAAAAAAAAIX2ITpk+qklt94/yVTKrG5k3qZWU7vq9Z3qtWHlio/v7Tvvnr4Ne7/y+q5Flz0amVovcZlRr5IlKxUImAAAAAAAAABAQSULU388tej4Cx8ddS33Nn2Gt+zNyq121vb0x00ff3xx581j7TeNaGfZfJnLdDOdiqyEIWACAAAAAAAAAEXk8+7eoH2zBHz+0n4/N6/RkMmRno060J9vaMBPBxc1Xtn3n67ThjXuwUoSriIHAAAAAAAAAApn+fWdlC7ZVrG59NNOOUuXJKxNqp+asqlrw3azz62cfGIhK0nowQQAAAAAAAAAimWw5y/n39yc6TSyd5NOTN7N7jqmQx37H/cufP0l0HvUFlYy0IMJAAAAAAAAABTIgH0/X/K7M6/7BEVIlzjNqtZfM3ju2/APDhuGspKBgAkAAAAAAAAAFMVc7/UX/W+v+OEXp/rl7CJxRWRrYbN95N/+4UE/7JvJSgBOkQMAAIDcCYXC6OhoVmSqqqra2toMAAAAoKy9DQ/aePvAGMd+TarVZ4qnioHZ331+mnlwkbff7Y6W9qxYoQcTAAAAlKzMzEwGAAAAIAN6bJ9Ut7LVsJauTFG1srTt2sBx+KHfkoWprFghYAIAAAAAAAAA+bfkyrbo5JjNQ+czxfaryzi+Cm/isb9YsULABAAAkKeXt2Mjw4r5tx0AAAAAKBNrbu13VrBxl/Iypk2/U6+vsWKFgAkAACB3z2/GXD745ejaT8iYAAAAAMo7j3tHk9NSf3UZx4Axt6bOqjze1FOLWPFBwAQAAJCLZzdibpwI7zC0srmN9tG1wVGf0xiAzEiOS3h02uvK9v2+1+8y2ZatqBlCYZh/YGZGBgMZFh7+JSIinJVDISGfTpw4cPDgzrdvX7Nicvnyhe3b16Wm4peGciNnBX758umBAztOnjz49etnBgpsw23PNtZNWMn4GBZy6PyJ3ScO+L57y4qJ183LGzy3paQVbv8TGRtNz7r95H6+Sw5o3v3ECx9WfHAVOQAAgOwoXbp5MrztALMK5mr0R3OOrPnoOqmyfkUBAyhrSbFxG0dMjQoOo+nGLp2sW9sxWZWzqDf3H/fesL3HL1Mad+vEQCalpKQMHNhFT0/f09NLSUmJlR++vi+mTBnGTc+c+aeVlQ0rDnfuXL1yxatv36ECAf4LkDkU/AUEvLW2riuZk7MCU660bt1i7tGmTVuyMpWzwFBqkoWpH6JD/3CdykrAC7/XI+dM4abnTpxpXcOKFYfrD25737oyuHtfVX4h9j/RMTE7j3lm9Mi0b9hU+pKj2vT1uH743sfnzczrseKAgAkAAOA/sqZL3JwmThWYKGP6hIwJZMG9o2cosuk8cYR93+5KyjLdGz1nUavUr12tUT0z65oMZJWqqmrnzt01NbXKV7pEtm1bS7fLlm2tW7chLl6pIEaP7qOtrbtmzS7JnGwVODExkdIlExOzxYs3GRkZK5f1PjNngaHUbL57SJWnam1SnZWADfu30+2mP5Y3sK5bvvY/FXX0t90/VlwBE06RAwAA+L+Xd2KzpUscypiq1tOhjCnqM86SyC4mJkYoFOacHxcXx4pm48aNtHJWdjKEwsToXApAx47xkVFpScmsMGhtKfGJOecLU1KSYgvxWYX4+tNts15dlHm8rAFTulCYFJPneoSpqVIezYbeWq5FpTWk57atmfgzSYiKznZUnbOoFg1qu6/7p5Jl9uN7ernUpKT/zElISEtOkdylR1MTE5nCGDNmzNmzZ1kZmTbt9zFjpmWdExcXm20Z+tYnJMSzwkhPT4+OjvqOpldqamps7H++ifTSycn/+QLSap8+fUDREv3R3YKnY4mJCdlWxcnIyMj2oopgy5YtCQkJrEzRx57r/ylJSUmJOXYCVKNyLpm1AgcHB9Fthw4uxsaVip4uUcFiYqILtXy2r0muBebk9cZJWlpafHxc1tXmVTmpeHmthHuUVsUUlffb2xaGJqyQ4hMTEv+7i4iKjRam/+dDpv3Pw5dPGtrUbSDum1bw/U9MfGy2VXFo/0MP5fWsnAXIWtq0vCtAruqYWd0Les6KCXowAQAAfEPp0vWjX3OmS5xGHYyYgvVjokaXk5NT69atf/31V24OtQ9HjhxJx+geHh509HPy5ElPT8/oaNHRdoMGDcaOHVutWjWa3r9/v5eXV2hoqImJSYsWLSZMmMC+y44dOy5fvuzs7Ny7d28dHR1WWm4fOH5u1RarFk3f3hKNXyDQUG810NVhcB9KSSgJ8lq77bnP9dREURrStKezfb8eRlXMadpny+4r2z2neG42tDBj4sPNuS1dbBzsf/hnDuU1p5dveHn5Jj3LpFYN+z7dG3bpQMtEfAw5vXT9u/uPuVdxHPaDff8eKrw8D88oc1nQsS83Pb+9K7dymo77Gn5yybo3N+7RtKa+bqtBfVr060GBTlx4xJLuQ5r17pqRnv7gxHl6dMzW5Wa1a+W1firzo9Ne13Yd5E5qozfSbsTAeh1FV9t5dMbbe/32hChRk6Z64wbdZk40NDel6f2z/lLmqZjXtfHZuofeHb2LXr9OrdO2Va5FPfrX8idnL9GcUZuXmde1fnX1lucvC7pOG/vi0vUPT1/Sc2ed2ftP14GtB/cJfvXW9/odWtKink3bkQOv7TgQ+Fh0+FvTzrbPHzPVdbSZvPv8+fPixYsPHTrUv3//zp07s9ISEvLJ3b0nTdjZtf7zzxU0sW+fh5fXydDQYBMTsxYt2o4ePZX2DGvX/nPjhg+19y0trXv06N+xo8uuXRv37t3q4XG0cmULJq5LTk5NW7RwnDt3KRPnQdu2rT19+jD3Kk5OPYYPn6SrqyelJBER4QMGOLm4uNFu59y5YzRn9eqdtWrVefTo7tq1i7jUwMzMgsrTvLkDzfzlF9F+5sWLJ507N6FwoXfvAVKK9Pbtq0mThtDEgQM7fH1fcO935sw/tbREVYva5/TckycP0hu0sqodGVkuh6P6Plu3bqW9d7du3VxdXTU1NVlpOXZsv6fntunT561atSA8/AvN6ddv2PDhE7lHaRutXPlXYKAosKaNPmHCzMaNm4uX6UjbiLYmbXS6u379Pj6fP2pUH/ZvBd69e9OePVvoLk3QH1WhK1cuHD26j5as8e8ZTF5ep5Yt+2PWrAVt20r7olHV2rRpOb0WTevp6Xfu3GPYsPF79mzOq47l+jXJWWCuGFQGD4/VXPbUoEGTKVN+NTMT/bfyxx8zeDyeqam5p6eod4yRkfHEiT/fvn31woWTdJe+kr//vrR6dUsmziOoxu7f7yFZybhxM6pVE/UVpWLTW/7113+2bVtDX2Q7u1Z//rmSyTtHR8emTZsOGzasTp06kpkBkZ/sajYoyNOv3Lsxa9mfM4ZPuHj76pPXLzTU1M9tOcjn8Q9fOLn96D7Kd2iZxnUaThs2roZFtXvPH03+axbNoSWb9+s0ZciYH7q6bj64c9uRvQdXbrMwqczEdcO+f+c2TVssmjHP8+zRncc8fxv/09+bV36N/EqPDunZf/wPw7mXpuRo08GdR86fTExOsqlhFR71/0SStnKuBeAe9Q30+3vTyjeBflTaupaFOEHYtkrtm28fsmKCHkwAAAAilC7dOP7VMY90iUMZk0L1Y1JTU7O1tb1+/XpkZCQ35/Xr1xQbtWrViqb37t27ceNGdXX1AQMG2NnZPX36dNq0aREREYGBgTt37qSj/OHDhxsYGHz58oV9r9TU1Hfv3lGDh6Krbdu2xcbGslKRnpZOt2H+gZ0njewwdoialqbPlj2Xt+2nmTyBwPfmXb6qwM7NpVqjevePn9v78/wM8a+F6Wmi24zM9KyrEooH5nx87tLjMxer2dajrIQymjTxaMHxkVEb3CdTulS3XStKr2idXuu3XRG/Sl5U+Py2wwdQhETTNGHTxp6JexttGjWd0qVWA3v3+GWKYWXTC2u23th3RPQEcVeRe0fPPPO+6ujev0X/nlLSJXJp484Tf6/m8QX0xjuOc+fx+SniXloUTh1fsFLLQL/7z5PodQMePqWSJ8fGc2/wpc+N67sPthzQ27ZrR8qYDvz6d2J0bK5FpcyOPjRRudJFg3xT7EW3Z5ZvjI+Kpk+m04ThPFVVWsOlTbsSo2M6jR9epUGdoOevd06Zky4Udhg3lLI5/7uPKKdjCoBi3Pj4+OfPny9atGjw4MEXLlxgpYISlkGDRjFRjwlRLaUm/c6dG/h8wYgRkwwMjL5+FSWPFy+e9vY+Xb9+48GDx0RFRaampoiXF3WLyMz8z/Dt3EqoUfT771MpXapTp8GQIWOpsX3+/Ik//pienp4utSyi2kvPokRg4MCRrq4DuXSJgiRKfHr06Ne1qyvFTHPnTnv48I6xsQnlEUzc5KbyUyokvUjcS1PrXV/f0N19goVFtbt3rx89updbhrIMCp7MzauOHTudVsXlHQqCwjXah2/evJl+S6CInyohKxVCYRolI7/9NqVVq3a0KdXVNWgT0OZm4ko4ZcqwsLCQUaOmUrSUkBA3e/bEly+f0kNDh45n4riH5tOfoWEFbW3drBW4du0Gbds60YStrR3Np83dqlV7Jq7Dkpe+ePEM3TZpYi+lePfu3Zw+feTHj+8HDRo9fvxPVBW/fAmjL6mUOpbr1yRngenu2bPHKOGislGuRIV8+vTBhAkDuf5KtKpr1y5SCamWtm/fharivHnTqcJTtmVv34bSooMHd3Ivunfvlg0bltLnRl8WCtdoJT/+OJwb6Zwbn8lgGgAAEABJREFUn37BglmVK1ehz9bNbQhTAHFxcT4+PjNnzpw/fz4dSHybmZJgXbFaQZ4uFP8ntXTbusjo6JF9hkwcNEpVoLrtyJ7lO9ZTfDPCbWCrxs0fvnwy6rep4dGRlYyMB/fsR8ubGZuMdBtkU10UGnLdiDL+e0WLVHGFoW8ZJUTT/vm1rV1LipZohbuOe1JKxS2zcNOK3ccPVDEznzp0LK2KS6A4eRWAHnoXFDhs1gRKlwa4uI7uNzSsMHut+uY2qemF6/QkBXowAQAAfEuX2g2sbGCqKn1JST8mtymV9SrIfz8mJyenR48eXbt2rWdPUacGmmDiHwaDg4MpYLKwsNiwYYOKigrNPHHiBE17e3tTLEV3O3Xq5Obm1rdv31zPPSkUWsPbt28/fPhAK+9MP/vyUkrn9zG3uTOqitOQpj27LOvtfnWHZ8sfeqtpa47dtkrbUF9Z3M+Isg9KiCI+hVSoaiFlVRSL0G2bIf0q17V2HNafC1YubdxFYUq/Bb/UaSsK7BxHDPinywB6FUqCKJ3JdT0Ub1EQQ69IKRVNcDMfnvaK/RJO4VGnCSPobv2ObZa7unuv39HctZvkiRN2rtU3q8SkiggKvrb7kEBDfazHCr66aCNSYqWkrCxMTT2/ZivdHbb6L019fZpQ19M5u3zj/RPnWw924547essKfdOKNKFdwZDeQqjfuxpNG+Usat12raNDv3B9kSSoYJP2rFfO0m/L0MJs2OoFFDY17tbpb+f+lFINXfkXFamRU7slPYa+uHitSQ8nJu8k55HFii1ZsuTAgQP0hWKsDitJOjq61B7mOn0QaqbSbefO3d3cBvftO5T7Oj94cJtuBwwYYW1dl27zy4nY5cvnX7x4QpEQtczpLjWAKdm5devK69fPudPZpNuwYT/FRkzcVKN2OBOdxnWoQgVRfXN27jVx4iBKIhYv3jhw4CiaqFbNksrPCsbZuefUqaI+gC4ubq6ubandTvkXJReUC1SrVnP5cg+++JsYEfH19u2rTDFQxVNSUqIN7efnFxQU5OXlRf8LVNXuxBiflbyZM/+kGIWJO+BQivTixWMKhiji5B5q0cKRJmxs6tNGpzxl4cK1Xbr02rx5BcWL3bv3lawkawVu3Lg5/Q9FNbB5cweqgTSHao6ZmcW5c8fd3ScKBALauFTJHRw6aGvn2UmW4oBVqxbQxOLFm7iR42lVGfldCjPXr0nOAlP6Q3No4u+/1+vrGzDRd1Bv/folZ88epW8ct8yyZVsrVRL1GKWE6+3bV3/9tZrrmjR8eG96a1SH6V3QW6acdONGz3//Rz5AK/HyOvnDv/1inJx6/Pjjb0yRUE3+/PkzHZw8efKkWbNmlNSnCFNNDYwLvgYKjPYt28xTEf339DE0eOvhPVUrW+xdsklFWfQhHzp/Ytn2dad9zg/rPWCk6yBKhWpWqUZpVAFXPnfiTOfWor7MtnXqT10w+8nr583q2T578/LsVW9az6Y/Vwh4oi/d16jI6w9u5VuA1bs305yF035rZ9eaJhpa1x32y8QClqR6BVEfK2GGkKdcDOkQAiYAAFB0BU+XON8yptXBrpPN5D5jsrOzU1dXP3v2LAVMdJBNEU81sUuXRCc6aWho7Nr1baRSrpcTNUh++OEHJj7Pgo6bXVxccp7aFhYWFipGR34JCQmpOaSkpHDH4llHMaCZ1OChmCnAKKq/S1NW8pTFB3BEXUe7Yee2946djQoJNalVU8tA7/E5n4D7j2M+f6VoiRaI/RohPWCq7djC9/qdvT//2XniiHodHLj8yO+eKHUKee0X+ubbj6uUpFDkFBUSxp1zV0CfXvoy8blj3F2+mqqNg/2DE+ejQj+ra4vOcLGoZ5NvukQ+vhBd1p3yKS5dItyoSVQeKpWZjSWXLhGbVnYUMIW+8ZM8V69SBW6iQlVRyeMjoliBNezcTvm/ZwXqVTSmdIkm1HW16TPRMtDniqRdwYjeyOeA96yEJSUmjhlT0JCihNC3I+vdaDH6Hb5X0yX1mBErLdyJSFu2rKIvYLdufSh+orutWrWjwGXu3B9HjZrapk0nPj+f6OHZM9HJF1FREdu3r+PmcKPSUGs534CpTp0GXLpEvnwJCw//oqenLznVjsOdtfQdKlX6tmYtLW0jI2Oup9LDh6JcoEMHF8n7UlUt0H8NRZSZmTF79uy0zDIe9SnbXpfC/cDAwOaWCd2yJDglp2JFU27C3LwqE0d7dPtEfKl1ipy4hywtrWljvXr1jH0XeoNdu7pSpnP//s2WLdty0SGXauWFq3hUD7NelzDf4ZwK+DUJCwvmzsTk0iVib9+GsiE/v9eSZYyNv+3A6WOh2s71eyKNGjULDg6iT8nXV5Taa2ho7tq1kXuI++iCggIlK3F0LKUzbUNCQkaP/oMVE+V/8Xi8bBMqYnlNcFEptxI6cvj48ePjx48zbTJV+eoFf3Vnh/ZcukRe+Iu2iKa65uZ/e42Fiw97AkOC2HcxrfBts1Y1Ff2/+TUygm7viDP9Lq07cukSUfv34pVSCpCYnHz32UMNNfWWtt+uKivgF2KvRblSJssMjQ0318v/UCH/tTEAAAAFVth0iaM4GRO1rJydnY8ePfrmzZvExMSkpCRuOBiKh5i4C7qvr69k4QYNGtSoUcPc3HzZsmVr166l7OnQoUMzZsyoWLEiRVSUK9FxJ90aGhqaiJmZmVF6paenR0fe9EKCLHjixGHs2LFZC0PzLSwsmtW15M6dKU2aBqJsJS4yulJGxu5pcwMePqXgo3abFhmika1j0oX59OBo6Nw+Iz3de8OOo/OX3z54os+8n/QqGcd+EZ28EPz6/zGNfqWK9Keuo8UKI+azaD1m1v+/IrKqhugAOi4ikguYKtaoWpD1RIWKWtfVbOtnmx8nTouqNPh/xxmBumj9FKvlXAlfTfR1yMzvt/2sjKpULvjCPL4glSWxEiZQFYwaOYqVqTlz5oSH/2foH319/dq1axsYGLBSRA3a5cs91qz5mxquhw7tmj3772bNWnbo0JUi4G3b1ixZMvf48f0///wXFwfkhYIkJm7xZh0dmfICrlOGdFWr/v+Cg9QU5yZev36edT0GBsWQuFHjPFY8rAlXWkmcUWqUlJT79++vplWI705JePDgQda7tNetUqVK48aNWekSCET/I1M1o58cKH+xsKimqfn/HaO2tg4lPsnJyVyH2cJq29aJAqYLF05QwOTjc05dXcPWtrmU5b98Ef1/J32ZnAr4NaHglW6zJq1qaqIdLJcQSSf4N3oICfnExCPxZ/tq1Kjx/3OizcwsWKmgfdTonqNZMckQSxfLdyLr3ZzroYyJ2ahkpBdijHML0///2BMcJj7siY978fb/hz2N6zSsVdWSFQ1X27kyvw/+SLe2dXMZKEpKAUI+ix5qXLeRKv87j0iVmJKqoHiOZhEwAQCA4vq+dImjOBlTx44dKWC6dOkS16uodWtR72sKiZhogNV+nTp1yrpwWloaHfRTg2TBggXXrl3buHHj/PnzFy9ebGtry4VKlBCxwqP4iZ5Ira8ePXr4HVqYFuXLSlfcV1FTX9tA7+Fpb0qXmvZ0dpkxXklZ+f6Jc59efCsMd05ThjD39qGtS6d67R2ubPe8vufQ0QUrR29eJtBQ56sKhq1ZyIpG21AUfqUmJ6vrfhv6+sNz0e+c2kaGhVqPlqFoxOXg12+5Ub3/P19fND/rBd2Cfd/SrW7FCkxOqajwmjQp7XwhGw0NDck0RbS1atUaMmRIw4YNDyz7yEpXnToN1q/fd/ny+cWLf//ttylHjlzW0tLu3Ll7mzad9u3beuDAjqVL561atYOr/7levsrY2OTly6fTp8/jxi3+blyQ1LRpyxkz5hVkeSlFkoILMt6/97e0tGalq379+joGstI64/a6AwYM6Nat2+3TEYW8ZmaxoQyFAiBuVCNOQkJ8YKA/zZSkS1kfLQgDA0MHhw7Xrl2kakl/PXr0E0htWuvpiVLdV6+e5nxIeh3L+TXJWWBdXdEOPCXl/ztYru8SdxJoAXF9mvr3d+/UqRsra7Rdynz/yUSn1m6QTGtpaVWqVImOWCa/Xpf0vRfRMxKH+0N69ndx7FSQ5f+tG+msMLTF+5+AoPfW1SwLXoDQr6Iery/evsrab6vgPseKjnCMNYrn1wsM8g0AAAqqKOkShzKmKnW1KWOK/irPY35Xq1bNysrq5MmTZ86cod+xuWjJ0lJ06HP69GmhWGJiYkRERGhoaHy86NrhhI7nunfv3rVrVyZqsGn27NnTzs6usOkS/aDH5/OpALNmzdq/fz+lS6wsJERFP7soGnzK0Nw0WBwnNe7uxJ0+lhAp6vKQLhQdsBqJzw77+PIN96wPT15I1pCamJghFPLV1TqOH6ZvVokyqeS4hOqNGyRExfheuyNZLO272nCm4r5Lb27e4+4mxcbR+im90jcpRPtEtB6rGnT79MLljH8bS/RbMOVKtB5a26urt4Sp3+p54EPRySkmtWoyKElU/ymTpYR34cKFy5cvp3SJlToqA7XnlZWV27fv0rWrKxM1s5/R952+9dSMHD58oomJma/vC1rGQnwlI+6KbEx0WtwjyUpq1RJ1fztz5v/ntdEuQjLIVMGZmppTrODtffrLl7Csq8preSlFkqK6eIDe69cvfUcJ5QBtcUpbatSoMXv2bNrrUrrEylrdug1DQ4O5S8gx8dXcWJYuP3p6+vRQYQf769SpO93++ecMJu7QJH1hE5PKVPHoVbjebRz6FjCpdSzXr0nOAleqZEYrv3nTJ/XfHSx3SqBlYa4Cxi186tQhSdTFdf5iio2+wtra2nXq1KHK7Onp2atXL02B+seoEPZduMTniNdJ4b/jYadnpKfkHW5WFXcZe+n/7VTHx6+eswKwrCKqUT53r+fc/0gpgLGhkYaaelRstG+AHyu8oMgQvkqxRdvowQQAAIqo6OkSR0H6MTk7O799K+q00qFDB24ONT+o3evt7U2/b7dr146OhK5cueLg4DBhwoRnz57NnTvX1dVVQ4MOmkUX/DI1zf9EmFxRtDRs2LCyauF4rd/WsEuHlITE2wdPpCYmdRg3VKChUad9q4enva7u8Kzf2THktd/1PaI287MLV2xa21u3bEbTlzbtjAuPSEtKunfsnGRVtw4cf3rhStOeXWhtUcFhJrVqqGqqdxo/zPf6nX2z5tdq1axqo/rv7j3yv/to2pFteoUMhpr0cLqyY//ppeuTExJ0KxjdOSS6fLWj+w98NdXkuLiCr8esdq36ndo887q6ZcwMeuN0bP7ojLelXeMOY4e2Gdrfe8P2PdPn2XbrFBEUTO+aIqemPZwZlBhql9L3rk+fPmWSK0k8f/547twfXV0HaWhoUhuYib77VseO7bt06SzlTYmJCdTyt7S0phaynXhk2R071kVEfE1KSjxz5ohkJV269Kam75Eje589e9imTacPHwIoJPr1138cHDoUqjA8Hm/SpFmLF+gCr+wAABAASURBVP8+eLALvXqFChWvXvWihvSGDft5vFwaNVKKJEWHDl337t1y9+51d/eeHTq4pKWlXrnixRRG9erV3d3dXVxcmMwYOHDU/fu35syZPGjQ6IyM9C1bVtFMmuYebdfOee/erYsWzWnUqJmamnoBu/DQwhT0REdHUfRjbV1X+sKqqqpjxkxbufKvGTNG0XdBW1v30aM7YWEha9bsklLHcv2a5FrgAQNGeHisoTfo5NQzOPjDwYM7aUln516swGjlTk49zp8/MXCgM33d0tLSvL1POTh0nDBhJlNUurq61tbW/fr1c3R0lMw00TG++fbRALvvOaiwrm7Vra3Tqcvnu40d0LNDlzSh8MwVr/b2bWYMn5Dr8i1tRYcEGz13fI2KTEpJOuZ1uiCv4uzQ0ePw3hsP77hNHubcpmOaMNX71pV8C6CirDKq75BVuza5z57YrrmDbe16Z656swK78vqejlrhzs2XAgETAAAonOJKlziKkDE1atSIm7Czs6PfXVNSUuin0cGDB+vo6Bw5cuT48eNMNL6DGdetiX4At7Gx2bNnDxOdXFNn/PjxdJzHvgutnJWdsHfvTy5aQxMUpnSeOKJFf9F19Ko3aUgTtzyPv752W8fYqP/C2Zc99r30uUEPaejpdhg75OLGXZe37tXU1+00YfjpJeuUlEQdndR1dATqaudXiy5sZN26edvhPygpKxtVMR+zdfnJJeve3LhHf/QqNg72mRn5d5pQ+u/gsmramuO2rTq2YMXFDTuzlbawev4yRde4AuVH3MhQogG2jUR95kWXk1NSohgr4KHoJBGLeja95kxT1RI1lrg3yCR98sUTkhIq5RgH91vvfSXpbzDPh5VVFKX3/b59+5gMyMykr3O9PXtE1yeqU6fBhAk/GxpW0NHRpfiYu/SVvX0bav8rKyvr6uq5u0/Yvn3d7t2bqOk+cuTkNWv+4QZCpvb5kiWb1q9fcuOGj5+fL7cqyUDFhcINxkwvzbXk6YUcHTsLhcJcAyYpReLqYbZzSXjiUXUpSlu6dAvFWG/fvuKeSBkEBQTfceJJeVRWe11uTyL5kLkJ7oJoVAPnz1+1atUCinjorpGR8W+/LZakQpSnBAb637p1hf7q1m2YM2DKY1vzmjd3oESmY8duBdmyzs49+Xz+li0rKQni5ri4uNF/hVLqWK5fk1wL7OY2mMpAqRN30Ub6dkyfPo87VTNrdc15N+tbGz9+pp6egafn9n37PJh4xCVJH6hsz1IQly9fzjmzWeU6ex4XKOjJFUU5Bnp6O495bj8q2j9bmFS2rp7nAEz6Onrj+rtv8Ny+9dAump44aNTirauVxVtBOVttF99ym0lTXWPjvGXz1i16/e4t90QzY5PgL6HcF0RKAfo696QDM3o5nzvX6K+hTV3xOgu00a+9vV+rQjVWTJQUs/MnAAAorOJNlyQeXwz/8CJOzjImarZFR4tOAQsLCxs2bFibNm1GjRpFx+VqamoCgYA7GEpPT4+KitLS0so22CrlUPQjqra2aFQgWjjnteS+GzcGk82A8azE3NhzxGv9tpEblhhXsxAK07QM9LMtkJaULExN48Y8yszIiAuPpLCJeyg9LS0xOkbLyDDn0XxSbByP2ijq2UelTY5LEKalSl4lJT4xLiIi14KpaWlqGeY5SgKVKjkhgRaQ0pCIDA7NyGO4EH0zExVxK517R3w1VXUd7awL0EFjfESkmqZmzrcgT2KD/B+tW9B23Wsmkw4s+1jP0ahi1UJcCKnoxF/n1GzXcY+Li+XzBdm++PStj42NNjAwyrUSUvuHHqVmMJcHJSTER0aG5/qKGhpahobShu6OioqklUi5tHwBiyQFFY8SBAODwo1l9t2OLgvoN8NCdsZgyoobg6lB21L6KPISGyu6xB53KcNsYmKi6b+kgtQHiRUr5lPAtG3bMW5osIiI8MTE+FyXpMojGWKcXoj+Z9TXN8h6FTkpdSzXr0muBaYdbGRkBL3Q941czhH/jxyhpaVTlJUUxac3CQFPonuNN2My6WHwqy4e40/+uNFIQ499r/SM9IjoSB0tbTVB/h9yqjAtJjbGSN+wsPuf+MT4lNQ0Qz39QhWAfuH7GhWhp62jKijEIW6bfwb93mHsaDs3VhzQgwkAABRICaVLTH77McXGxt6+ffvUqVNMfH6cvr4+95OyBN01MsqlHagmxso5tTwu6EYJiyRkUVJWlqRLRIXP166Qe8M4W17z/1cRXetNU3L35dWbxxeszHXJhl3a954zjeUha6nysmX09ISo3K+DPuXAFkNz0cmM2d6RBB0fF3bgcJAPuX6dc23MU4IqpWsSZc1GRsaSuzdvXl62LPfLmXfs6CJ9JG/JNd3zJb1IUlBTP+uVy6DM5RotcXR1C5EX+Pn53r17ndKl+vUbSwae3759rbd37n1bpk+fK+kYlesLSaljeWVeOddDO1jpoWpBiP9HNmaQh8ZmtQUqvNOPLw1r6cq+l4qyirFBQXcpAh6/wndd5lJLQ0tLgxW2AJRaVizk7u72u0dpwtTiSpcYAiYAAFAcJZcuceQsYzp79ixFSzY2NitWiHr4T506tWnTpgxKXoNOjjatc78eNo/PZ0UzxXNLZmbu17lT09JkAKWobVsne/s2uT7E58vtkHZQ5pYtmxcY6G9lVXvOnEWSmRMnzhozJvf4Xk2tVDsMQolqV7PZicc+RQmY5MyOm8dtjGuw4oOACQAAFEJJp0scOciYPn36xA2rZGxsPGjQoOrVqy9evNjKykoOuiMVXI2mDbrNnGBQuRIrCyp8vnqRg6S8iHtLAcgEvhgDKF2jRk01NTU3MfnPaVzy0esW8vVX58lNVvc9/+yqU/02TOE9D37z7KPvkSErWfFBwAQAAPKvdNIlTjnNmDIzM2/evOnp6fns2TMnJ6f169fb2NhwYzBVrFi4i5rJAZNaNemPAQCA3GncuDkDRWWuV8mxRrPlXtsRMJH5J9bbVKjWuqotKz4ImAAAQM75PogrtXSJQxkTT6B8dA1lTJV1jWT99/mkpKQTJ04cOHBASUmpX79+S5YsUVfH6QAAAAAghza4/t5gWe81l3ZPaj+YKbDjjy+GRn+5OGYrK1YImAAAQJ5RunTtaKmmS5x6DgZ8gfKR1Z/cpprL5lWBSGho6L59+06dOlW3bt0ZM2a0aNFC0S5jDAAAAArFQE1nYssfVl7f09Kyia2FDVNIodFfV3vt7GhlX7tYB2BiCJgAAECO/ZsumelXKtV0iWPdXHSNGMqYXCdXlrWMydfXd/v27bdv3+7SpcuuXbssLCxyXYzH4xkYFPRSTVIgtwIAAAAZ8bPjCK83t3868M/BcasMtQpxCUK5MWbnHC1VzZ39FrLipswAAADkUdmmSxzKmKya6lHGFBspZLKBQqWxY8dOnDjR0tLy7Nmzs2bNyitd4igXBwRMAAAAIDsujdmqJVAftWMOUzwjts+OS068Mm47KwEImAAAQA7JQrrEkZGMKT09/fz58wMGDFi4cGHbtm0pWho5cqSWlhYDAAAAUDw3xu+JT47vsWocUyRDtsx89zno0uhtFTT0WQlAwAQAAPJGdtIlTtlmTEKh8NixY717996xY8fgwYOPHz/er18/gaDcXN4OAAAAoNjpqWndnrgvKTWp7SJFGe2b0rT34Z8ujNxgaWTOSgbGYAIAALkia+kSp0zGY0pNTaU4adeuXUZGRjNmzGjdujUDAAAAADFjTYN3s8733Dm51cIf6pvXWj94HpNTs48su/H2YXUDM5+xHsYaxTC8Zl4QMAEAgPyQzXSJU5oZU0pKyuHDh3fv3l25cuU5c+Y0b96cAQAAAEAOx4euPvT8wvRTS9svHuJUz+En55FMjmy66nnqsU90YtzPbYdPbVXifbUQMAEAgJyQ5XSJUwoZU3JyMkVLu3btqlmz5sKFC21tbRkAAAAA5K1Pvc70N9d7/f7Hp6+8vlPf3MapgUMbq6as3Hrw/uWZpz7PPr6JSYzrUbfdym4/s1KBgAkAAOSB7KdLnJLLmCTRkpWV1bJly+rVq8cAAAAAoGD+6Die/m5+ePLXxY2zDy/TVtWoYmTGU+FlZmaw8kOJKb/78iEuJcHSsOq8juN71m7HShECJgAAKPfKS7rEKfaMCdESAAAAQLFoWaXhuREbacLb7/a1wIcvw/zTWfqHyND41MTMzEwmqzQEalX0TfnKvGoGZuPt+nW3cWRlAQFT6fn6KeXV3VgGCqORo76OoSx+xYLfJfk/iWcgv+q20DU0UaBrhJWvdIlTXBlTamoqRUs7duxAtAQAAABQjDpa2tMfg8JAwFR6osPTPrxOrFZfh4ECeHs/2spWWzYDpoiQ1OB3yebWWgzk0bsnsRa1NBQnYCqP6RKniBlTWlrasWPHtm3bZmZmhmgJAAAAAMocAqZSpW3Ar91Sn4ECCHoVx2SYrrEAVVFefX6fyBRG+U2XON+XMQmFwpMnT1K0ZGBgMG/ePFwhDgAAAABkAQImAAAol8p7usQpbMZ0/PhxDw8PVVXVqVOndujQgQEAAAAAyAYETAAAUP74PYmXg3SJQxmTsooSZUx9plbW0svz/+Vz585t2rSJJsaMGePi4sIAAAAAAGQJAiYAAChnKF26cuiLfKRLHKumunR7ZM0n10nZM6bMzEwfHx+KlpKSkkaOHEnRkoqKCgMAAAAAkDEImAAAoDzh0qX2gyvrVpCrgcxzzZiuX7++cePGyMjIESNG9OzZk8fD/9rfRL597uu5gQGUgJS4GCbb/B/GBPslMJAvQqHsXv6cfA5MfCTbJQRZEB+VxkCx4VAVAADKDXlNlzhZM6YXvg8oWgoJCXF3d3d1dRUIFOWygAVhWMeBZaKdAyWFp8P0anVisqpuS92EGCEDudO4vb6ahjKTSea1NFT4SgwgP7r6qrqGfAYKrNgCpjM34648TnwdmBz0OS0jg2UU4ciP9l5KSqySIa+Whap9PQ2XVjp6WjK6twUAgFIj3+kSh8uYti94de7p4n4De/Tr109NTY3BfxnUbkV/DEAh1WmuwwBKV2VLdfpjAAD5KVLA9D40beGOL9efJiYkZvD5SoZ6PPNKgl7tNdUFRc2DhOnM933S84DUiw/iZ2/4rMpXqlVVdfbQCi3qaTAAAFA8ipAucShjysy00NZe5trDXE0NHY0BAAAAoHz4ziPXsEjhsD8/vQpM0dFS6eag181Rz6RCsR8E63P/xMdneN2NPXYput+cj8a6vA2zTJvVRoIOAKBA/J8qSrrEqdVMT0lJKdcxvwEAAAAAZNP3HLauPRS5fH+4prryP1PMmtXTZCVMS0u5d3s9+guNEM5e9cl1VpBTc60ts80YAAAoAEVLlzhSrisHAAAAACCDCncuW3h0RtsJASsPhA/uZnBsZY1SSJeyMjHkbf+z6p8Tze69Tqo7wP/B62QGAAByjUuX2g1SrHSJQxmTVVN9ypjiozGgLwAAAADIukLmcDNUAAAQAElEQVQETC/eJdsN90/PVDq8pMZgF0NWRlo30jyyvEbDWuquv3zYeTqaAQCAnFLkdImDjAkAAAAAyouCBkzvglO7z/xQz1Jt2x9VtWTgmm7zxpu69zD8fctnz4sxDAAA5A7SJQ4yJgAAAAAoFwo0rEN4dIbzj++b1tZcMFmGRj4a5GIoECjPWhdWQY/XvkmpnqwHAAAlCulSVhiPCQAAAABkX4H6InWcHGBpoSZT6RKnbyf9Yd0NRy0I/hCC33UBAOQE0qWc0I8JAAAAAGRc/gHTkD8+paWzVT+bM5k0yMWwjqV6t58CGQAAlH9Il/IiyZgSY9MZAAAAAICMySdgev4u+drjhN/HmDAZtuKnyvGJmX/v/MoAAKA8Q7okHZcxHV6NjAkAAAAAZE4+AdPwvz7VqqZma6PBZNuArgabjkfFxGcwAAAonwJfJCBdyhdlTLXskDEBAAAAgMyRFjB53UsIi0yfN96UybxhPQzVVZV+3RjGAACgHKJ0yecA0qUCqWmrg4wJAAAAAGSNtIBp8e6vNczUKpSTC9Z0bql77nY8A8YyMjJu3ry8d+/WCxdOpqSksGKya9dGWiErvA8fApKTk1nJKNGVQ7H78iVs+/Z1T58+YMXk+fPHtMLPn0NZyTtyZO/hw3uyzkH1Ky7f0qXBJZIuBQT4USV59+6tZE5CQvynT0H5PlEoFNJzaY/K8qtpOetGrmhVr18/v3btYmCgPysaZEwAAAAAIGukBUxvg1JG9zFk3ys2LvlDUAQrgkKtYWL/CmnCzGNXY5nC+/vv2X/++RPlQfv3e/D5fOkLBwd/jIgIZwVAidWVKxdYIVFravTovqtWLWAloERXDiUhIuKrp+d22nCsmPj6PqcVfv36mZW8U6cOnj59SHIX1a+4SNIlHUM+KwGfPn2gShIU9P9rQSxYMGvEiN4hIZ+kP/Ho0b3jxv3ABevSa1q2upGXdesWT53qTq8+dmz/UaP6hIWFsCJAxgQAAAAAMiXPgGnNoUg1gVKzuprsu4SERfcavNbryiv2vb5jDVZVVHedjWKKjX5mp5/HHRw6HDt2ddu2Y8rK0jJEH5/zw4f3evfuDSsxlSqZ2draNW3agpWAEl05gHSofsWipNOlXLVo4UgbTk9PX/pitWs3qF+/sZVVbVZMnJx6Tpo0y8Pj6ODBYyjwOnIk/05P0nEZE64rBwAAAACyIM/04cKduOrmqqzAkpPTUlOFkrtpqbkf7GZmssioBFo4r/WkpqbHxiVLWYMU9g20XgWmMsUWECA6DcTFxU1DQzNrupSenh4dHZVJGyCLpKTEvNZDS9Ly3Lkh2aSkpCQkFPRsRH19g7//XteunXO2+YmJCYU6tyjX8uS18ri42NTUXGpCTEy0UChkUIqkVCSqRXmdwillS9F8epSVcNmkPCRR2OoHOZVEukSVijaB9GVoD/nXX6tpJymZk5aWFhsbQxMhIZ/8/Hy5mXXrNlyyZFONGlZZn0s1MN/1c3LudS0tremlK1e26NatD92NjCxQ71HpKGOyaoaMCQAAAADKXp7jK30IS+vcSpcVwLvAr9v2Xr/zIICmbRtUcR/QSkONP2LKDrrrefQu/amr80/vnxIXn7xpx9UrN32TkkTpkkvnBq7dG1uYGdB0RGRC3+Ebujs1zMjIPO31lOb8Os1lwfLT2daQb0k6t9DdcbIYjteLrnfv3l27dqVbfX19VoqmTx/54sUTmpg5cyzdXrggGumGmvHbtq09ffowt4yTU4/hwyfp6uqdO3d89eqFNOe330SfrYNDh19//YeJR8nZsGHprVtXuOXbtnUaO3Y691P/58+h8+fPvHHDh6br1Gkwa9YCY+NKUspz/vyJFSvm08SoUVPd3Aa9fftq0qQhc+cuPXBgh6/vC5pvZ9d65sw/qUE4YIATNb3Wrv32ez6139zc2llb1121age11XfsWH/27FEuDqPyjx79o6amVraVM1HKmbxnz2Zv71PUqGPixuHYsTNotRQTnDx5cP9+D25+gwZNxo2bUa1aTaYAevXq1bNnzz59+mholPa1IHOtSNw0bf2JEwdxzfiOHV0mTfpFVVUUZ0vfUlS3N21aTrWIpqlCdu7cY9iw8VlfkQKCqVPdqdFO1aZKlep5FYyrh/XrNw4KCuBeiEIiKht9KZgo4869vmVbSQGr37Jl86KiIvbsOSs5WXXp0nn0DTp+/BqTd1T3unXrRrtBPT29XBco9nQpOPjj2rX/PHp0l6bV1TUGDhzZq9cAHi/7f3P9+nXkttG5c/cohadqQxXVx+cczaHKRjsfoTBt585TtCpvb9F/QytXbrexqcc9d+PGpVy9NTIyHj58Yvv2XXItSV57XckCVE+YaC/akBUHypjoljIm10mVNXRUGAAAAABAWcgzYIpLSG9gpc4KYMma834Bn916NKF46NzFZ5Qu6etr9u9tR8FQg7rmDi2sVJSUaDEBn3f7wTtVVX7ntnUDg8JPX3j65HmQxxp3nopyJhP9wHvy/BMKkgb1tU9OSWvcsErONeSrkhFPiSk99E1ubK3GytT79++3bdvm5eXVuXNnamWVWsxE7WT6tfzly6fUnjEyqsjELfbff59KLXPKgxo3tr99+wo1jD9+fL9kyeZatepQqHTt2kVn517Vq1tWrCi6XGBExNfRo/tS05p+Zqe2VkCA35Mn9wWCb33ZgoODKKegZtXDh3eePn1w7Ni+MWOmSSlP1ao1KD6gRho12Jj493y6/eOPGfb2bdzdJ1y6dPbu3etHj+4dMmRsq1btqNX97t1brrMAlYqJexnQ7fLlf16+fL5FC0d61rNnD6n8X79+Xrhwbc6V//zzWEou7OxaNW3aklIGygi4tuXevVv27NliYmLWtaurv/8betEffxzu4XHU0NCIybugoKBNmzadOXOme/furq6u6uoF+lIXnfSKdPv2VdqaLVu2o81Hf7Rx6Y9J3VL37t2kJJRSg0GDRuvo6D58eJsCrKx99IRC4d9/z6YqSjmplHSJ/VsPqS4NGDBCR0fvxo1LFC6EhHykHEFJSSmv+pZtJQWsfhSrUdBw//5N7g0mJSXRU+rXt2UK4MOHDx4eHhcuXHCmXUyvXrq6//nFotjTpcjIiAkTBlKVo92aiUnlCxdObN26OjExYejQcdmW7N17IOWY4eFfuLu0xalC0oarW7fRiRMHaP7PP89XU1Nr1qwVRepUB7gKw0lMTKTAMSYmilLyxYt/pzjS2blntvVL2euqqIjSH3poy5ZVVla1uV1csUDGBAAAAABlLs+AKSOT2VQrUFuU0iW6HTGotYCvMnJQa1VV0To7OdameMjGyrRnl0bcYjR/w5LBBgaalCjR3Z/mHnr09MOnkKiq5v8fR3zzimGmlb41QnKuoSDUBErPA8o+YKKUJyUl5d27dxQzeXt7t2/f3s3NTcqnXVyoWU6tLAqYXFz6WFpa0xxqKlNjpkePfuPH/0R36Sd9yndu3bry+vXzunUbNmzYjKIcavo2a9aSW8P27euohUaxUe/eA7g51FiSNOMtLKotXbqVml59+w4dNKgrNcupraWUd/xnbV2XiX6rP511JrXHpk6dw8T5katrW8qqKGDq1q0PBUyXLp3hAqZz545SlNC6dQc/P196C5RQ/PbbYipGp07dEhLiufJzfQokK6fCUPOeQoG5c5dyRRo8eAw9JTj4I2UWVPKNGz251h21IdevX+LldfKHH4YzeUdVkdrAAQEBGzduPH78eI8ePcRVscRJr0iSOtCmTSd39563bl2hSihlS/XpM4QbS3vx4k1WVjY0QVU62/lrmzevePToLtUlyhcKUEBGS9LXgVvVnDmTqR5SBKalpSO9vklkq9t5VT9tbR0KmLy8TnEB04MHt5goCO7CFAO3G9y6dev58+c7duxIESfXm6kkzozbuXM9Vbk5cxa1bt2e7lIQ2bdvh337PAYMGJltyX79hj1//ogLmGJjYyhdokzzjz9W0Iaj0Ofnn8fRpqSwnirSly+igCnrc6dN+532nDTRoUPXUaP6bNq0nDJE2iVmXUb6XpdCxqVL59Ir/vXXaoGgOC+Zh4wJAAAAAMpW7pHHpy+i0U/0tJVZATi1r3f+0vOpv+wfNcShUX0LKUvq6Wl4+bx49Czo69e4T2GiMxQiIuIlAVNdazNJuvTdeDzlr5FpBVyYGj9paWmpWXB36ZYVjaQhnZyc7OfnFxQUdPnyZYfG/YzVmrDSxbWOoqIiqMHPzeGGT6Kf07lmUjb379+k21at2knmZO0kYmRkzDWlqCVmZ9f6zJkjYWEh1FJihVGp0rfltbS0aYVcM69BgyZmZhZnzx5zd58YFBRIuRK1yui1/PxeM/GZdJJiUOp069aVgIC32Rr83JXvHRw6SgIv7im+vqILlmloaO7atZGbHxHxlYm69gSykkTJjq+vb3BEGQ/5JPk0qCq+f/9+06ZNZ8+ebd9kuIlhfVaSpFckSR0wNa1M9efx43tM6pb68iWM6gktyaVLOVd44oQnRaW0wIABI1jBcBkWt55OnbpTwPThQwDXx6og9S2bvKof1XBaG0UYERHhhoZG1655M/EI06yE+fv7RyQXdT9WXKjuUXk+fvzo4+PTrl27tnb9rxz80m5QMY/q/eDBbSY+/9Hf/9sISnp6+hQ5hYUFS3lWSopoJDhTU3Nuw3E18/37dyw/lIRSCMX1fate3TLrQ9L3uk+e3AsNDZ4y5desZ8wVF8qYMjMykTEBAAAAQJnIPWDKZIUwZUwHHW21g8fvz/j9YAfH2pNGtdfSzGV08IyMzNnzjzx+FkQxUys7y/TMjOjoRGGWUw+qVimG85VSUjLuP3gy+tr/LxfNBUaSLIm7TUxMlL4efX19AwMDHR0dpYKdnZdfqVICAwO1lB45tSjtgImaNEzcUM86LjKlOZUqmeZcmMoZHR1FrXTpIytxuKRJ+ijI+aI0ITZWVDD6nHv3HrBmzT8UTDx//oiJOrn0Yv8OglurVp0sT9FguQ2OS808Jh74Jsd80ZXI4+JiX79+LplJn0CNGrVYSaIKf+LEiaTMIl2GvNhRU5/izie8JybtSzBgEgqFhalI6txoR1K21JcvoTRta9s8r5Vw51RSu/3OnWv29m1YIXFDjNHXRFVVVKsLUt+yyav6MXF3rbt3r1++fJ4mqJxUvJJIFrKib+WFCxfiMvJPSUoTtxs8ffq0YYqThi5fXbs4e3RSleOi6jdvXkpmGhub0J+Wlo6UJ1aoUJEqKsWLFGpXq1bTy+sk+28FkILbi0ZHR2abL32vyw0Q3rJlW1YyDExUE+OEH3wTbJrpMAAAAACAUpT7Ib65cSEO/QUClTHD2vR2sV250fvilVcVK+gOH/jtfKus6cO5i88pXXLp3IACKWVlpdMXnr5+E5rvygubX/B4rE7tql1tR0vmqKioKCsr0y2Px+MmJOhutpnFNUJN48aNJdN8Pt/CwqJjx47N+I5IqQAAEABJREFU6vR497i0+xRQ++rly6fTp88zMzPPaxnJh6yqqqqurkGtdEoH8r2Ad7Fr29aJAqZTpw5RvuDo2Ikafkx8oS4mbppKFuMakAYGFbI93dBQNOfduzfZQg1ufv/+7p06dWOliOrXzz//bFKtjM/WtLW1lYSkVBVNTU179eplY+oUFlSCF5yir9V3VCQpW4rrUfLq1dO8nmtn13rKlNkjRriuXPlX/fqNc47JLR2XH1EBuKG4C1Lfci18zupHmjZtSZ/G2bNHDQxEGXpew0IXI9qnTZgwoVpdTVamqO5JpiW7wX79+qmrah5bH3J576e2g8z4ggL1k80XV+VoD7Z48cbCPnfSpF9mz544ceIgWgNlnRYW1dzcBhfkiVFREUwcUWWbL32v27hx81Gjpha2ihZQRHDy5b3BzZwNkS4BAAAAQOmTdnAfGFKgK23HxYtOMahgpD11bEeaePBYdOaRhoZoaIk3/mGSxV6/FcVJXTvVp3SJJqJiRH0WhMI886OcayiIVGGmbe1KTbJo1KhRgwYN6tata21tbWVlVaNGjapVq5qbm1NLu1KlSkZGRgYGBrq6ulpaWsU+/jElVlWqVBk9evTWrVtHjhxZauMrZ8X9FH/mzGHJnOTkZMlls7mrdFOrWPIoN/zw7dtXJXPy7e1VXKjF1b1730eP7lIbr3v3ftzM6tVFQzLdunWZu0sl5869ynbhcCZ6p6Ixca5e9ZbM4d6ppaXopCrKrSSXvU9PT1ecq8hz6RJXFakNvW/fvkGDBkmuaFZyvqMiSdlSJiaVqfEfGOjP9Q3JucK+fYdSxDNp0iyKtHbv3sQKg17lzJkjNFGzprX0+qalpU2pGXe6UzZ5VT8mzj6oYgcHB23atIzeBeVNTJFk2w1qa2vzBMq9xpvy+EqX9wSnpRapC2RWDRs2pa2ftcrRJuAmuI5pnz69z/WJtIGMjIwpl2zTpuOUKb9u2LC/IF3MqBpcueJFG5S7PELWuiF9r6umpq6joxsWVvx9GyXpUiPHku0iBwAAAACQqzx7KqkKlF68Taxmmv8QpHP/OcHnqbSyq/nstWioi3p1KjNx3lTX2uzpi4/rt10x1Ne0tqrk2KrWuYvP9x68087R5q1fmOdR0agrl66+bmmX+9Xic66hQR3zfAuTns7sy/p3eybuE0RJVufOnfv27Zvt2kmlrEuX3tRiP3Jk77NnD9u06fThQ4C39+lff/2HGwi5adMWdHvy5AFlZWVq1Xfp0svdfeLduzdWrvzr06cP9Ev++/f+584d37nzZEmf1MPp2tX15MmDlpbWdeo04ObY2NSjH/yvXbuorf13vXq2d+9e9/PzpWJzQyxn5eLiduzYvsuXz6enC21tm8fGRh89unfmzPn0dCenHufPnxg40Jk+jbS0NG/vUw4OHSdMmMkUANe8d3Fx6d+/v6qqKisteVUkKU+h7Z7XlqKSjxkzjdY2Y8YoV9dB2tq6jx7doSb6mjW7sq6hXTvnCxdOHju239Gxc84akg3VFoFAVSAQ+Pice/nyqa2tHXeCm5T6RoWhu/PmTZ88+Rdz86pZ1yal+jHxgNAHDuyg+MPZuVe2AaHlG6X5ue4GuYxJ1I9pT3Bx9WMaMWISpUu0dezsWlNaRDXk4cM7u3adqljRhNuf0G6Qwp0+fYZke+KWLSvp1sqq9pcvoTduXEpIiGvVqn1eQ8utWrWgW7c+VDlPnTpIUfjUqXO4gbqz1g3pe12qCfRnZmaxbdtRVnwiQ1OQLgEAAABA2cozYKpowHvzISXfc4roR1mLyoa37/s/ePJeXZ3v1L7eQLdv46SMGuqw3uPykZOisW+H9m8xsI+9a/cmdPfGXT8jQ625P3ff7Xn76q03jOX5ItnWkG/A9OBlIk9FyUiveM65KIrHjx+zMsL1WJEMUUwt8yVLNq1fv+TGDR9q/9Acamtxp/Mw8a/u1EDasWPdjh3r6W69eo0aNmy6atUOaskfPrybW4Zaa/SzPBcw/XdEqkKMTsU9MeutBI/3/940VavWoJYhpQxZF6CG2YYNS8+cOcJ1M+nY0WXcuBk5V07t9tWrd65du4jSAW5EnmrVanIPjR8/U0/PwNNz+759HnSXmnZcZxlFcO/ePVYW6MPPtSLlWgckpGwpZ+eefD6fsgAPjzXcHMp0UlJSlJSUWZaqNXny7BEjetPrbtiwX/oAavTcTZuWc9OdO3cfO3Y6Ny2lvrVv3zUgwO/OnWsfP76XBEz5Vj8mHhCaG8+eIjCmMB49eiTlUS5jOrk5tLgyJtoitAnWrPmbYkH6U1fXaNHCkTv/l3Z0P/742+7dm7y8TnEBU9YR4nv2/IE2HG3uypUtqFZs3br60qWzGzd6ih/8T3Wljaivb7hu3WImHrdr+vS5ktM5s9UNKXtdrubk7INZFEiXAAAAAEAWKEn67WczYUnI3ZdJnkuqs4KJiErQ09FQUcneoguPjNfSUFVT+xYiJCenpaal62hz40Nn0rMqGOYzFEW2NUgxb2OI//vkOx41mEzyexL/4lasQz9TVhZSU1NjY6Op9c7jZU8VhUJhTEyUrq5+1ocSExPoL9flsz03NPRTrg+pqPBMTSuzQoqJidbU1Mq1kNHRkfmWh6SlpUVFRejo6GXrKpKenk7ztbR0SqcLyfktQe36GZf5GEy5enY95uO75ObdKrKSV8CKlJX0LUU1hCqDvr5B1owgG+nVkmr71Knu7u4TevUaEBcXk9eXIq/6JhTLqxblWv1o+ZEjXemh3btPSyl2caGsoXE7vTIfg6kg0oWZJzaGpCRltBtsxuMXzydDOSblRAYGhtnmi3d00YaG2a8mQSFU1o2yYsX88+dPUECZ7dpwcXGxtCRF7ZKJnC+drW7ktdeNjY3R1i6eK0iwf9Olpp0NkC4BAAAAQNnKs8k3pKvemVvxrMAM9XNvzBgZ/Cc/opxIEhUpKyvlmy7lXIMUbwOTOzYtkZFT5YBAIKCf33N9iBo/kl/XJTQ0NLkRmqT7/Dl05Ei3XB+iX/gPHPBmhZTXuXjcOCmsAPh8fq4XL1NRUSngGqAYFbAiZSV9SxXkbE3p1XLevG8dl1RF8vxSSPm+SAnLslU/CsuePLl/6dLZ0NDgIUPGlkK6VL6o8JR6jDWljOnKvhDHAabFkjFRQp3rENriHV0u1yrdunW1v79v794DK1SoGBjoxw2kRYF7tsUoEso2ketLZK0bee11dXSK7bxppEsAAAAAIDvybCbZ1dZQ5SvN3xT62xgTVh48fp0YFiGc0MeQQSkyMTE7fNgn14fQloayIr1aBgUFstKSkBA/e/ZEJj7Fr1+/YQxyKImMqeAyMjKioyOfPn1Af9wcqjy//LIw1yhK1iBdAgAAAACZIu2kFZdW2l53C9GJqWwd8IqqaiIwNSroaThQLKi5LuX3fIAyIb1aVqxoOnnyL1ZWdVjJU1fX+OOP5bVrNyjGTivypwwzJqoqM2f+OWLEpIAAv9jYaBub+t9xYm+ZQLoEAAAAALJG2nH8ssmVYhPSL9+PYzLvS6Tw/ouE2UPLwW/OAFC2DAwMu3Z1tbS0ZiWPz+c3b+6AdClfXMbEFyhRxiRMy2Cly9CwQtOmLdq374J0CQAAAADgu+XzQ3H/DnrLd39hMu+PDSHVTAVO9toMAADKobLNmMoRpEsAAAAAIJvyCZgWTayozDKnL/3EZJjn+Sjf98m755kzAAAot5Ax5QvpEgAAAADIrPyHulj3k+lj38Q375OZrNp2PNzdRd/cGKMvAQCUb8iYpEC6BAAAAACyLP+AydFWc0p/o0n/fLzyQOYGYwoLF3af/K5+DbV5I3H5eQAAeYCMKVdIlwAAAABAxhXoYj3TfzDs1kr7r81h/h9TmcyIj88Yv+CDnpby8cUWDAAA5AUypmyQLgEAAACA7Cvo1aBX/WjSvqnmpL8/vAqQiXPlvkQKxyz4oK6qdGtLdQYAAPIFGZME0iUAAAAAKBcKGjARj9lmPR10piz6uGbfV1amztyIHf57oJG2yl2PGgwAAOQRMiaGdAkAAAAAyo9CBExkyaRKe+dW9r4T4zbtXZkMyfTmffKw396v3/95Yl+jMyuqMAAAkF8KnjEhXQIAAACAcqRwARNp0UDj1X5Luzoaf20KHf3nh+d+pXTGXGx8xswVwRMXBmmqKl1eX32iqwEDAAB5p7AZU/SXVKRLAAAAAFCO8Nh32TTLNDAkbeLSkKmLgnR1eHWqCRrU0nTrpM+Km9et2IevEv2Ckt+HpJpX5G/6pXKnZpoMAAAUBpcxndgYQhmT4wBTHr/QP42UO5QuXdr9CekSAAAAAJQj3xkwkWqm/DPLRSeprT4UeftZwlGfqC1Hw9OEmcpKShrqypmZmawIUtMyRatSZnravGom/A5NNN27mZsbf39pAQCg/JJkTNcOhLbpb6LCk+eMidIlrx0fVIwCbZo7MAAAAACAcqIYIpvJfQzoj5sOCRdefpiQkpKRUYSASUlJSUVZqbGNWr0aagwAAODfjOnU5pCrnvKcMXF9l8zqJh2/7HnQZfGwYcP69u0rEAgYAAAAAIBsK+Y+QaZGvIGddRkAAEBxo4yp2xjTU5vkNmP6dmZcJ4NGjtW7D9528+bNjRs37tmzx93dvXfv3nw+nwEAAAAAyCr5H8kCAADkhoqKKGOipIUypnShXI35nSVd+jbuUsuWLXfv3j1r1qxjx4716tWLboVCIQMAAAAAkEkImAAAoDyRy4wpZ7ok4ejouH///ilTpuzdu9fV1fX06dPp6ekMAAAAAEDGIGACAIByRs4yJinpEkdJSaljx44HDx4cM2bM1q1b3dzcTp48id5MAAAAACBTEDABAED5IzcZU77pkoSysnKXLl2OHDkycuTIXbt29ezZ8/Dhw6mpqQwAAAAAQAYgYAIAgHJJDjKmgqdLEioqKl27dj148ODUqVMpbOrevfvevXuTk5MZAAAAAECZUsrMzGRQKvyexF/YGaakxEAR0BfLdXJlk2pqTPY8ux5z7ehXVEV5RXWv6wiTanU1mWJIT888tSkkLY2Vu+vKfUe6lNO1a9c8PDyCg4MHDhzYt29fTU1F2e4AAAAAIGsQMJWejHQmTJOrax6BdHyBspJMtnYz0jOFafjiyzOeQFlZkfqnlseMqVjSJYk7d+5s3brV39+/f//+lDRpa2szKP++nDuXGBzMZAxPQ8O4fXtBxYoMAAAA4L8QMAEAQLlXvjKm4k2XJB49euTh4fH8+fM+ffoMGjRIX1+fQfkR7+fnt2hR/PPnKV+/ZlBVln1KSgI9PfWqVc2HDjV1dWUAAACg8BAwAQCAPCgvGVMJpUsSr1692rJly71793r16jVs2DAjIyMGsu39+vUBa9cKY2NVK1Y0aNrUyN6+Urt2TObFvHr19caNqHv3Ynx9KWyq2KWL9bx5AmNjBgAAAIoKARMAAMgJ2c+YYsPTvHd+LLl0ScLf33/r1q1Xr15t2xWgIwMAABAASURBVLZt3759GzZsyED2vJwxI+TIEdUKFSr36GHm4iIwMGDlU5iPz6cjR6KePtWysrLdulWtShUGAAAAigcBEwAAyA9ZzpgoXbq461OTjvolnS5JfPpErf4jJ0+eNDIy6tOnj7OzM0YBlxHRjx8/GjxYGBdXY8SI6u7uTC7E+vo+mjZNGBtbbdKkmjNmMAAAAFAwCJgAAECu/D9j+sFURUVWLpdY+umSRGpqqre396FDh969e9e1a9e+fftWr16dQdl589dfQVu2VGjdutbEiWpmZky+BO7YEbB9u3rVqnZHj/L0Sru2AwAAQBlCwAQAAPKGy5jSM5Ra9zWRhYypDNOlrPz9/T09Pc+fP29tbd2nT5927drx+XwGpevF9OkhBw9WHzq0xpgxTE7FBwTcHT6cr6vb0scHGRMAAIDiQMAEAABySHYyJhlJlyTi4+NPnz59+PDhmJiYnj17urq6VqpUiUGpEPVd2ry59uzZpl27MrmWGh5+a/BgFXV1h/v3GQAAACgGBEwAACCfZCFjkrV0KasHDx5QzHT16tXmzZv36dPH3t5eSUlWziiUSx937Hj922/WP/5o3qcPUwCpkZE33Nw0qla19/ZmAAAAoAAQMAEAgNyijOmsR2hqKiuTjEmW0yWJyMjIo2J0PNBerGHDhjmTpoyMjPj4eFZI6urqOAuPE/P48d0ePUydnevMmcMURszr1/dGjDBxc6u3YgUDAAAAeYeACQAA5FlGeuaZssiYykW6JEH50aNHjy5evHj58mVKl9q2bUtJk62trbLytyvxCYXC6OhoVkja2tqqqqoMGLvWrBl9mC0PHWIK5v2ePX7r17fw9taytmYAAAAg1xAwAQCAnCv9jKl8pUtZ0VHB48ePKWny8fGh1ImSpg4dOlDSRPMRMH03/6VLA9eudThxQmBgwBTPnSFDUuPj22AwJgAAAHmHgAkAAORfaWZM5TddyooOD548eUJJ06VLl4RCYffu3d3c3AQCQaFWgoCJ41OnjnmPHjXHjWMKKTU6+lqPHg03bqzQqRMDAAAA+YWACQAAFELpZEzykS5lRccJT58+vXv3rqOjI03z+XyKmeiWx+Pl+1wETMRv0aL3Gzd2uHaNKbCHkyYlfvrk8OABAwAAAPmFgAkAABRFSWdM8pcuSXBjMNFt2r8KEjYhYCJXGjTQsbFptGQJKwHhHz7oVKgg0NBgZeT6zp1q2tpNe/eWvlisr+/d4cMxEhMAAIB8U2YAAACKQVlFqesIE4GAXT8Ymp5ezL+vyHG6JEFBkrq6uo6OjqGhob6+PoVHFDnFxsaGh4fHxMQkJSXRXQZZJH38mBoZWWPECFYCPvv7rxsw4MTChawIKCj89OJFxvduuBt79jw+fTrfxXSsrXlaWv7LljEAAACQXwiYAABAgZRQxqQI6VI2Kioqampq2traBgYGOcOmhISElJQUmmaK7dPevRSs6JRMtx0dY+MazZrVsLNjRXB26VKPMWPSkpNZCavQokXso0cMAAAA5Ff+AygAAADIEy5jOuMRShlTsZwrp4DpUmJiorKyMgVM3F0VMbpLGVN8fDw3kZycvG7dugcPHtSqVcvGxsbCwsLc3Lxy5cpmZmZMYUTdvKlVvTorpJT4eCUVFYG6umROYnS0mpaW8n9PRVTX0Rm0YkXOpyfHxanw+fx/t05WmZmZtCoNXV0l5W8/MSbHx7M8CFNS0lJS6FVyfUh0jmRuL5GXip07h3p7MwAAAJBfGIMJAAAUUXGNxxQXmea9Q/7TJQqM7t27N3ny5N9///3gwYO+vr40087O7qefftLS0qLpiIiI1atX3717l6b19PT69OnTq1cvXV3dhISE169f+/n5vX///pNYeHi4uRgXNhFTU1O61dTUZOVZjx49fvjhh/79+2edeblePVMnJ6vJk/N9+uurVw/Onu08bdrLS5eCnj4VaGj8dPo05UT3jhy5vnNnQlQULVOtcWOnqVONxYnVmaVLHxw7RhOm1tajPDy4lQTcu3d2+fKIjx9p2tDcvOPEibVateIeivn8+fzKlb7/jjVer2PHzlOmeK1Z8+zCBUkZusyY0bRXL5qI/PSJ1h9w/z5NU0kchg1r3rcvFYaJo65TixZx67Fq2fLtzZsmtWqN3raNFYC3vX2LixcxDBMAAIC8Qg8mAABQRMXSj4nSpUsK03cpPT2dbv/88097e/thw4b5+PhQnHT06NEhQ4YkJydPmTKFkiM3NzeKjby9vbds2UKZ1MiRIw0MDFqKSdZDC1PM9PHjR+6WVhIipqqqKgmbDMUM/kXTTObRe1m5cuXhw4cpZnJ1deVmCmNjdevVK8jTuVGQzi1fTsGQ44gRmvr6PFXVKx4eV7dt0zc1bdKzZ+jbt5TmeIwZM2n/fi0jo+pNm9Iy9Kjk7DZKl3b/+CPlQc3c3GhtD44f9/z550ErVtRo1iwuPHz9oEGpiYlNevUyrlHji79/4MOHfFXVuh07fvb3//zuXYdx4/jq6pVr16b1xEdEbHJ3p4XrtGunb2b2+PTpi+vXpyYktB09ml5r66hRUSEh9JBFw4Zvb9xghaGsqhr14AECJgAAAHmFgAkAABRU1ozJoZ+JsnLhMiYuXbJtr0BnxhEnJ6epU6fShIuLC8VJjx49ooDp/PnzlC716tWLEiV6yNHRkRKo7du3023Oq8ipqanVFMs2n9bAJU1hYWGhoaEvXryIjo6mmZGRkbGxsXp6etzI4pr/0tHRUVdXl9zV1tbm7mpoaNCtepbzy0pHZmYmZWqBgYHLli3bv39///796fPJzMjQLMwpgZQljd+zhzsVLvLTJ8qPKlStOnbXLmUVFZpz7/DhcytWPD5zpvXQoTZt2tAf14lJ9OoZGdxo3xP27tUxNqYJ2+7dNw8ffnPPHgqYfDZtosCo8+TJzfv1kyyvpKxsaW//7Px5CpgowFIV90QjPps308J9/vqrdtu2dLeNu/sSF5drO3c6DBt299AhSpcowHL+8Ud6qEmPHoucnVmBUcCU9P49AwAAADmFgAkAABSXJGO6cTi0lVshMibFTJdIpUqVuAktLS0jIyNuGO83b97QbZMmTbiHKEKyt7c/d+5cfHx8wU98MxKrX79+ro9+/fo1IiIiLi6OwqaEf1ECFRwczE0nJibSy9EtN52amioJm+iW8ib+f/F4PG5CIBBwdyVzct7li88Ok05ZPKqRkpISvXRAQMDy5csPHTo0PDNTYGDACqy+k5NkoKVPL17Qraqm5pWtW7k5ceJPO/zDh5xPjAkLi/36VVNfXxI5cYJfv6Zbv9u36ZYCKcl8yRhMOb0Tn+cY8vp12Nu33BxNPT2KnKJCQ99cvy4qZOfO394yr3CHkbxST/0AAACgNCFgAgAAhfYdGZPCpkvZUHBDcQ9NfPnyhW4tLS2zPkS3SUlJrJhUECvUU6hskrwpRSwtLU0oFKblQDOpqEKxrDOz3hZqzEoKmyhmCgoKorwpQ3xqYQEZVakimY4MDqbbpNjYTy9fSmZWa9y4kpVVzidGhYRwE9kW1jIwEKakJERF6Zua6v4bDkpBC1NQRRMh4mG2OHomJvSnrq39JTCQiUd9Yt+FPor04qsSAAAAIGsQMAEAgKIrVMaEdCknA3EnneTkZJ1/rzj2UhxzqJdpjxUdMVZaGjduLJnmxpNycnJi8+alRESoVazICk/byIhuWw0e3LBr13wX1hIPU1WzefOec+bkfFSgoUEJFMVMmvr6uT49IyODm+CpqtLCfFXVIatX51xMTVOT68pk8F2XAsxITRUUMiUEAACAckSZAQAAKDwuY+KpMMqYMjLy7KuCdClXVuI+Nffu3ePuxsXF+fr6Urqk9e+wPoqA6+IkEAhq1qw5ZsyYrVu3Dh8+XJnPj/f3Z9/FtFYtur1/9Cg3/jcT9wASpqTkurBB5coUDD09dy7m82fJTMn431UaNqRb7gQ3DuVE3ISaeBt9CQiQPFStcWOKorIuLFmPqY1NtvUUSnpioma1agwAAADkFHowAQAAiOTbjwnpUl66dOmyb9++tWvXJiQkGBkZnThxgmYOHDiQx1Ogwww+n1+1alVnZ2c3NzdJsiYwNIwTD1D1HUysrRu5uDw+fXp5z56Nu3dPFwqfnD1bp10752nTci6swud3nT792Pz5K3v3btKzp46x8ctLlyiQGrtzpzKP12HcOL9bt04tWhTx8aNR1apf3r17dOrUlEOHNPT0RCOFHz9+YfXqBs7OSbGxjiNG0MIUIXnOmmXVsmVVW9t3d+++u3dvyuHDeiYmrYcO9b12zWvNmtdXrtg4Oob6+kqCqnwJY2MzhUKD5s0ZAAAAyCkETAAAAN9IyZi4dKlxB/2GbRQ0XVJSUpLcSnARkqamJqVLy5cv3759OxOfGTdq1KhevXoxRXJXPDZ2Nto2NjHiYba/T5dp07QMDK7v2nVt5066a2hubiLu1pSr+k5OdOu1di0FRjShqa9ft3379PR0CpiMq1cfuWXLqX/+ubVvH7cwhUfJCQkUMFGE1LxfvzsHDoSKg7AWAwYYVakycuvWM0uWvL15k/4EGhrWDg6Z4nPoTK2tf1i8+OTff398/pz+zOvVYzmqRF6+XL+urK4u+K6zBQEAAKBcUCrUoJUAAAByLyM989yOsNTUTEnGhHRJKBRGR0fnu1hycnJiYqK+vj4XOmhra6uqqjIFFnrw4Mtffml/5Qorgoz09PjISHUdHf5/P8yvgYHrBw2q2qjR0LVrs85PiIykUEk9t/GnUhISUhITNfX0VP57XbzUxMTUpCTKpLJeXS45Lk6YmsqN7pRNfEQETyBQ09ZmBfbkp59SYmKanzvHAAAAQE5hDCYAAID/UFZRcnavJBAoceMxIV0qODU1NQMDgwJ2aVEEJn37ZmZkRNy/z4pAWUVFp0KFrOlS7Jcv7x8/9hLnSs379cu2vKaBgXoeo5uramrSqrKlS0w8CjgFSVnTJUL5Ua7pEhOPKV6odIlEPn1aScE6tQEAACganCIHAACQnbKy6Fy5czvCrh8MjfqcgnQJvptuo0a+S5e2PHCAFZ8Lq1e/unyZJup17GjVqhWTeR/27ctISqo6ejQDAAAA+YVT5AAAAPJ0YWdYpWpqDRwUPV0q4Cly2eAUORL95Mm9bt3stm3TsbZmxeT9o0epSUlGVaoYVK7MyoOrXbpQ0NZo1y4GAAAA8gsBEwAAAOQDAVNRXG/VSqNSJdsVK5hC+nLlyrO5c9vcvo0RvgEAAOQbxmACAAAAKEF1ly2LuHs3zNubKaTnc+catW6NdAkAAEDuIWACAAAAKEH6dnaVXFzeKGQPplcLFyoJBI127mQAAAAg73CKHAAAAOQvNTWVFRKPx1NWxk9Z31xv1UpVT6/phg1MYQSfOeO7dGmzY8d06tVjAAAAIO8QMAEAAACUuNjnz+927Wpgb2+7dClTAJ+OH3+zYkWVUaMsf/mFAQAAgALA74oAAADn+W9oAAAB1klEQVQAJU6nXr2mR49GPXx4f+xYJu8+Hj78Zvly86FDkS4BAAAoDvRgAgAGAAClI/H9+1udOqlXqNDC05PJqbdr11LAVH3y5OpTpjAAAABQGAiYAAAAAErVbSenhLdvGyxYYNSqFZMjyR8/Pp49O+nz50ZbthjI11sDAACAfCFgAgAAACht7zdu9F+8WLd+fesff9SqXp2Vfy8WLvxy8aJ23brNjh1jAAAAoHgQMAEAAACUjXs9e0Y/fKhuYmLu5lblhx9YORQfEPB66dLox4/5Bgb11641dHBgAAAAoJAQMAEAAACUmZTQ0Dfz54dfuZIeH8/T1dWysNCuWVPN3JzJsvT0iHv34gMD06Kj6Z5mzZo1Z82q0K4dAwAAAAWGgAkAAABAJrz544+4Fy+EyclJHz9mpqYy2aMkvlU1MeEbGFAcVmPKFJ169RgAAAAAAiYAAAAAAAAAACgiZQYAAAAAAAAAAFAECJgAAAAAAAAAAKBIEDABAAAAAAAAAECRIGACAAAAAAAAAIAiQcAEAAAAAAAAAABFgoAJAAAAAAAAAACKBAETAAAAAAAAAAAUCQImAAAAAAAAAAAoEgRMAAAAAAAAAABQJAiYAAAAAAAAAACgSP4HAAD//7hZNfEAAAAGSURBVAMAglq+WI/v5EgAAAAASUVORK5CYII='

const WORKFLOW_GANTT_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABJgAAAFKCAIAAADe+HJkAAAQAElEQVR4nOzdB1gU1xoG4IOCAoqiiFhQUbH33jVqVGLsvZdYYo2xxKgxxt5SjNHYoomxl6iJvRtjw94rig0EhShClCLlfrPHTPYuy7rAArvL9z4+49nZaWdmdph//pkztnFxcYKIiIiIiIgsRwZBREREREREFoWBHBERERERkYVhIEdERERERGRhGMgRERERERFZGAZyREREREREFoaBHBERERERkYVhIEdERERERGRhGMgRERERERFZGAZyREREREREFoaBHBERERERkYVhIEdERERERGRhGMgRERERERFZGAZyREREREREFoaBHBERERERkYVhIEdERERERGRhbAUREVHixcXFoWtjYyOIUhL3NCIivRjIERFZkujo6JUrV/711183btzInTt3iRIlJk+enD17dpG6Vq9ePX/+fBRWrFhRoUIFQcm2f//+P/744+rVqyiXLl166NCh5cqVE2nHmva08+fPe3t7P3z4MDY2tlChQlixDRo0SHJkiMDy6NGjt27d8vX1xUdMsGzZsvXq1cuQQf9dTmayJonI+jCQIyKyGBERETi/v3z5svz47Nkze3v7NDkjDA8PF2Q68+bNW7t2rfrx3LlzefLkEWnHavY0VOSLL75A3KXTHzHht99+6+zsLBLpn3/+QRj2559/6vRH7D116lQPD4/4C2Ama5KIrA8DOSIii7F582Z5Rujp6dm3b19c6Xd1dRVk4a5duyajOEdHx+HDh+fIkQPRS9puWavZ077++ms1isPqff36tSyjdrM1RCIhHadGZfnz5/f395dlZNtGjRq1atWqrFmzag/P3ywRpRwGckRElgFnkD/99JMsL126lBf1rcaaNWtkYdasWXXq1BFpzWr2NGTP/vjjD1lGzPbee+/FxMTs27cPqTP0OXjwYHBwcK5cuRIzSeHk5DRx4sQ9e/aMGzcOCb2wsLCTJ08i6YevHj16tH379m7duqkD8zdLRCmKrVYSEVmG58+fy3xCgwYNeEZoTe7cuSM0+aLq1asLM2A1e9rt27dloXDhwu+//76trW3mzJlbtWqF5Jjsf//+fZF4WC0IC+VtmYjrmjVrhhBRfoXkqvaQ/M0SUYpiRo6IjIJL1w8ePEChZMmSERERV65cwUcXF5ciRYoULVoU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K9bj44EDewwsTKFChdev367TU04B/X///QA+7t79B7off/wJutu2bRKa9jZ//nlxyZKl69VriGAMkd7HHw/HHLHwGzbswACI69D95ZeNNWvWkdPEKMOH90N4tmfPsTVrtv7009rr1/0mTZqlU/eKFeupdRdEREREROaBgRzp4ef3+Nq1K4iLLlw4s27dyvXrf5XvE0eqSu/we/cqwVLPnv3UB9vc3PKo39asWVeOLttQOXr0oEgkdQqVK1cXmns10W3Roq2Tk9OqVctRRqYOsdaQISNtbGyQu0Ofli3byXEbN26md6aPHz9EHT09iyNwlX2yZcvm6OioU/fg4CeG605ERERElPrY2Anp4eurPFTm7/947txpak8PjyJubnn1Du/jozw1V79+I2GQk1M2oXm5nEgqBFpCcy8ouvb29ojc5syZirgLEReCuvbtu6L/w4f30a1SpYYcBbElsnDe3ieQfMMw6qQePPBFt3nz1jqz0Kl7QEDAL78sNVB3IiIiIqLUx0CO9MiRI6dQmgYZNHXq3ISG0X6PnItLLnTv3r1TtWoNkYp69OiHQG7RonkbNqz+9NPPs2TJoi6MungoXL9+BYWsWbNqjyvrePPmNZ1p6tTdy8tr7969goiIiIjInPDWStLD07MEuuvX/xoaGqr2jI6OlgV5q+GNG1fVrypUqIKu9ou/ZespKa1AgYItWrRFOk4oodfbtijLlasklHspD8mPiOKQi0NSzsbGRnvcIkWKCc0De9qNr0RFRRmuOxERERGROWAgR3o4Ojp+/fXCoKBnVaoUmzbti+++m1WzZpnRo4fIbx0csnp6Ft+xY+u8ebMXL55///69jz8e7uqa+/vv5zRvXn/58kWDBvXy9HQNDAwQKW/gwGFC87xcoUKFZZ/+/ZXlHDSo56+//rRly4aPPuqCj2PHTtIZEQm6adO+FkoUWnjChFELF35btWqJKVPG69Td399Xu+5EREREROaAt1bSfzJk+C+w79dvMD5Onvz5t9/OxMf8+d2LFi2mfjt37oKxY4cj7EE5b958bdp03L//5KhRg48cOXDy5DEPjyLduvV59eqf+JM1fjEyZMio0wd0smpQr15DRJWDBn2i9smVy/X48ctDh/YdMWIgPiLCXLlyU6NGTeW3trb/vWd86NBR9vYOU6eOX7RoHj42afJBsWIl3ll3IiIiIqI0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sMBvABe8J06c6OzsbGB0k8PvFr+fvHnzYuFFwtXEYC4uLlu2bBGaOwEGDhwoLw4ltPw6o+fLl2/48OE4Ki1YsMDBwaFXr14ye57Q6CZkzDaVF9vUZ3ATu011RjdcKbk8KZq5Stttqs3k1Yy/9ozcprlz50aN5OuAcb0TfyRkfyO3qd7B7t27Jy9hXtGQQ2IdmqQld5Equ64xh6OUrqa2tN11E1p7JmQ+h6OEfhEmZz6HI5OLfzg6e/YsurVq1dIZMhUORynNfHZdeR+pPChh7WGyImWk7a5ra2sbGBiI5KrQtPLfv39/kz+Cbj7bFFEfspSywUyshM8//5wZuSSw0c71k2G4WoC9U/tvPPZseT1MZ8jIyEhcY9BppyT+6DgQ/PPPP/F3XL2jp5r4y4mrJljU+Ffi9S5//NGFpqVKjK7TM6HqpyYcg3TWc6K2afzRzaFS8aXaNjUHOhsFhzj8qUAf2SyYNiO3adr+HhOSzF3X+MNR2kq1XTehtZeaUudwZOAXkTp4OOLhKMm7LjY0hkyrhg1T83CEyCqtWhGTUu3sCKPjR4Go2Ax/vxaBgRwREREREZGFYfhLRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGFYSBHRERERERkYRjIERERERERWRgGckRERERERBaGgRwREREREZGF+R8AAAD//4a7C0UAAAAGSURBVAMAofrju9IGKSMAAAAASUVORK5CYII='

const RUN_ID = 'wf_refund_8a3f'

const workflowRunning = (): ChatMessage[] => [
  {
    id: 'wr-u1',
    role: 'user',
    createdAt: ts(0),
    blocks: [
      {
        type: 'text',
        text: 'Please process the refund for invoice #4733 — duplicate charge.',
      },
    ],
  },
  {
    id: 'wr-a1',
    role: 'assistant',
    createdAt: ts(2),
    blocks: [
      {
        type: 'text',
        text:
          `Starting **${'process_refund'}** workflow. Recording run \`${RUN_ID}\` for replay.`,
      },
      {
        type: 'tool_use',
        id: 'tu_step1',
        name: 'fetch_invoice',
        input: { invoice_id: 4733 },
      },
      {
        type: 'tool_result',
        tool_use_id: 'tu_step1',
        content:
          '{"invoice_id": 4733, "amount": 890.00, "customer_id": 1287, "status": "open"}',
      },
      {
        type: 'tool_use',
        id: 'tu_step2',
        name: 'check_refund_policy',
        input: { invoice_id: 4733 },
      },
      {
        type: 'tool_result',
        tool_use_id: 'tu_step2',
        content: '{"eligible": true, "rule": "duplicate_charge_within_30d"}',
      },
      {
        type: 'tool_use',
        id: 'tu_step3',
        name: 'issue_refund',
        input: { invoice_id: 4733, amount: 890.00 },
        streaming: true,
      },
    ],
  },
]

const workflowConfirm = (): ChatMessage[] => [
  {
    id: 'wc-u1',
    role: 'user',
    createdAt: ts(0),
    blocks: [
      {
        type: 'text',
        text: 'Please process the refund for invoice #4733 — duplicate charge.',
      },
    ],
  },
  {
    id: 'wc-a1',
    role: 'assistant',
    createdAt: ts(2),
    blocks: [
      {
        type: 'text',
        text:
          `Running **${'process_refund'}** (run \`${RUN_ID}\`). Policy checks passed — waiting on your approval before issuing the refund.`,
      },
      {
        type: 'tool_use',
        id: 'tu_step1c',
        name: 'fetch_invoice',
        input: { invoice_id: 4733 },
      },
      {
        type: 'tool_result',
        tool_use_id: 'tu_step1c',
        content:
          '{"invoice_id": 4733, "amount": 890.00, "customer_id": 1287, "status": "open"}',
      },
      {
        type: 'tool_use',
        id: 'tu_step2c',
        name: 'check_refund_policy',
        input: { invoice_id: 4733 },
      },
      {
        type: 'tool_result',
        tool_use_id: 'tu_step2c',
        content: '{"eligible": true, "rule": "duplicate_charge_within_30d"}',
      },
    ],
  },
]

const workflowConfirmRequest: ToolConfirmationRequest = {
  toolUseId: 'tu_pause_refund',
  toolName: 'issue_refund',
  toolDescription:
    'Issue a full refund for invoice #4733 (.00) to customer #1287. This step is paused inside the process_refund workflow; declining will mark the run as rejected and notify the customer.',
  toolInput: { invoice_id: 4733, amount: 890.00 },
  timeoutSeconds: 60,
  expiresAtUnix: Math.floor(Date.now() / 1000) + 42,
}

const workflowReplay = (): ChatMessage[] => [
  {
    id: 'wp-a1',
    role: 'assistant',
    createdAt: ts(0),
    blocks: [
      {
        type: 'text',
        text:
          `Replaying recorded run \`${RUN_ID}\` — no upstream calls fire, results come from the transcript store.`,
      },
      {
        type: 'tool_use',
        id: 'tu_rep1',
        name: 'fetch_invoice',
        input: { invoice_id: 4733 },
      },
      {
        type: 'tool_result',
        tool_use_id: 'tu_rep1',
        content:
          '{"invoice_id": 4733, "amount": 890.00, "customer_id": 1287, "status": "open"}',
      },
      {
        type: 'tool_use',
        id: 'tu_rep2',
        name: 'check_refund_policy',
        input: { invoice_id: 4733 },
      },
      {
        type: 'tool_result',
        tool_use_id: 'tu_rep2',
        content: '{"eligible": true, "rule": "duplicate_charge_within_30d"}',
      },
      {
        type: 'tool_use',
        id: 'tu_rep3',
        name: 'issue_refund',
        input: { invoice_id: 4733, amount: 890.00 },
      },
      {
        type: 'tool_result',
        tool_use_id: 'tu_rep3',
        content:
          '{"refunded": true, "txn_id": "txn_a7c12", "channel": "stripe"}',
      },
      {
        type: 'tool_use',
        id: 'tu_rep4',
        name: 'notify_customer',
        input: { customer_id: 1287, txn_id: 'txn_a7c12' },
      },
      {
        type: 'tool_result',
        tool_use_id: 'tu_rep4',
        content: '{"sent": true, "channel": "email"}',
      },
      {
        type: 'text',
        text:
          'Replay complete — 4 steps, terminal state **refunded** (txn `txn_a7c12`). Live re-run would produce the same shape; nothing has been re-billed.',
      },
    ],
  },
]

const workflowGraph = (): ChatMessage[] => [
  {
    id: 'wg-u1',
    role: 'user',
    createdAt: ts(0),
    blocks: [
      { type: 'text', text: `Draw the workflow graph for run \`${RUN_ID}\`.` },
    ],
  },
  {
    id: 'wg-a1',
    role: 'assistant',
    createdAt: ts(2),
    blocks: [
      {
        type: 'text',
        text:
          `Here's the recorded path through **process_refund**. The amber node is the HITL pause (\`pause_for_confirmation\`); colored terminals mark the two end states.`,
      },
      visualBlock('tu_graph', {
        kind: 'image',
        src: WORKFLOW_GRAPH_PNG,
        alt: 'Flowchart of process_refund run wf_refund_8a3f',
        width: 720,
        height: 78,
        caption: 'process_refund — graph viz of run wf_refund_8a3f',
      }),
    ],
  },
]

const workflowGantt = (): ChatMessage[] => [
  {
    id: 'wgt-u1',
    role: 'user',
    createdAt: ts(0),
    blocks: [
      {
        type: 'text',
        text: `Show me the step timing for \`${RUN_ID}\`.`,
      },
    ],
  },
  {
    id: 'wgt-a1',
    role: 'assistant',
    createdAt: ts(2),
    blocks: [
      {
        type: 'text',
        text:
          'Step-level timing from the recorded transcript. The HITL pause dominates the wall clock — every other step is sub-second.',
      },
      visualBlock('tu_gantt', {
        kind: 'image',
        src: WORKFLOW_GANTT_PNG,
        alt: 'Gantt diagram of process_refund step timings',
        width: 660,
        height: 185,
        caption: 'process_refund — pause_for_confirmation was 4.20 s of 6.05 s total',
      }),
      {
        type: 'text',
        text:
          'Most observability dashboards ascribe latency to the slowest non-paused step; this surfaces the human turn as the actual bottleneck.',
      },
    ],
  },
]

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
  'visual-bar': {
    id: 'visual-bar',
    title: '10. Visual — bar chart',
    open: true,
    messages: visualBarChart(),
  },
  'visual-line': {
    id: 'visual-line',
    title: '11. Visual — line chart',
    open: true,
    messages: visualLineChart(),
  },
  'visual-area': {
    id: 'visual-area',
    title: '12. Visual — stacked area chart',
    open: true,
    messages: visualAreaChart(),
  },
  'visual-pie': {
    id: 'visual-pie',
    title: '13. Visual — donut chart',
    open: true,
    messages: visualPieChart(),
  },
  'visual-table': {
    id: 'visual-table',
    title: '14. Visual — data table',
    open: true,
    messages: visualTable(),
  },
  'visual-kpi': {
    id: 'visual-kpi',
    title: '15. Visual — KPI single-stat',
    open: true,
    messages: visualKpi(),
  },
  'visual-image': {
    id: 'visual-image',
    title: '16. Visual — image (data: URI upload preview)',
    open: true,
    messages: visualImage(),
  },
  'visual-mixed': {
    id: 'visual-mixed',
    title: '17. Visual — KPI + chart + table in one response',
    open: true,
    messages: visualMixed(),
  },
  'switcher-list': {
    id: 'switcher-list',
    title: '18. Conversation switcher — header chip showing current title',
    open: true,
    messages: conversation,
    conversations: SAMPLE_CONVERSATIONS,
    currentConversationId: ACTIVE_CONVERSATION_ID,
  },
  'switcher-open': {
    id: 'switcher-open',
    title: '19. Conversation switcher — dropdown open, list of recents',
    open: true,
    messages: conversation,
    conversations: SAMPLE_CONVERSATIONS,
    currentConversationId: ACTIVE_CONVERSATION_ID,
    switcherOpen: true,
  },
  'switcher-empty': {
    id: 'switcher-empty',
    title: '20. Conversation switcher — first run (no prior conversations)',
    open: true,
    messages: [],
    conversations: [],
    currentConversationId: null,
    switcherOpen: true,
  },
  'workflow-running': {
    id: 'workflow-running',
    title: '21. Workflow — multi-step run in flight (with recording id)',
    open: true,
    isStreaming: true,
    messages: workflowRunning(),
  },
  'workflow-confirm': {
    id: 'workflow-confirm',
    title: '22. Workflow — paused for HITL confirmation mid-run',
    open: true,
    messages: workflowConfirm(),
    pendingConfirmation: workflowConfirmRequest,
  },
  'workflow-replay': {
    id: 'workflow-replay',
    title: '23. Workflow — replay of a recorded run (no live side effects)',
    open: true,
    messages: workflowReplay(),
  },
  'workflow-graph': {
    id: 'workflow-graph',
    title: '24. Workflow — graph viz (flowchart) of a recorded run',
    open: true,
    messages: workflowGraph(),
  },
  'workflow-gantt': {
    id: 'workflow-gantt',
    title: '25. Workflow — Gantt viz of step timings',
    open: true,
    messages: workflowGantt(),
  },
}

export const sceneIds = Object.keys(scenes)
