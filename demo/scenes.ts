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
}

export const sceneIds = Object.keys(scenes)
