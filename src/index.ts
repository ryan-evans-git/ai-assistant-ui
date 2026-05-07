export { ChatBar } from './components/ChatBar'
export { ChatPanel } from './components/ChatPanel'
export { ConfirmToolCall } from './components/ConfirmToolCall'
export { MessageList } from './components/MessageList'
export { ToolCallBlock } from './components/ToolCallBlock'

export { VisualBlock } from './visuals/VisualBlock'
export { ChartVisual } from './visuals/ChartVisual'
export { TableVisual } from './visuals/TableVisual'
export { KpiVisual } from './visuals/KpiVisual'
export { ImageVisual } from './visuals/ImageVisual'
export { safeParseEnvelope } from './visuals/schemas'
export { SCHEMA_VERSION as VISUAL_SCHEMA_VERSION } from './visuals/types'

export type {
  ChatBarProps,
  ChatMessage,
  ChatPanelProps,
  ConfirmationDecision,
  ContentBlock,
  Role,
  SlashCommandHandler,
  SlashCommandResult,
  TextBlock,
  ToolConfirmationRequest,
  ToolResultBlock,
  ToolUseBlock,
  VisualBlock as VisualBlockType,
} from './types'

export type {
  ChartSpec,
  ChartType,
  ImageSpec,
  KpiSpec,
  KpiTrend,
  TableColumn,
  TableColumnType,
  TableSpec,
  VisualEnvelope,
  VisualSpec,
} from './visuals/types'
