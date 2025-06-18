```typescript
export interface StreamMetadata {
  name: string
  description?: string
  category?: string
  tags?: string[]
}

export interface StreamParticipant {
  address: string
  name?: string
  role: 'sender' | 'recipient'
}

export interface StreamAmount {
  total: string
  withdrawn: string
  remaining: string
  rate: string
  token: {
    mint: string
    symbol: string
    decimals: number
    logoURI?: string
  }
}

export interface StreamSchedule {
  startTime: number
  endTime: number
  cliffTime?: number
  frequency: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month'
  releaseFrequency: number
}

export interface StreamStatus {
  isActive: boolean
  isPaused: boolean
  isCancelled: boolean
  isCompleted: boolean
  canWithdraw: boolean
  canCancel: boolean
  canPause: boolean
}

export interface StreamActivity {
  id: string
  type: 'created' | 'withdrawn' | 'paused' | 'resumed' | 'cancelled' | 'completed'
  amount?: string
  timestamp: number
  signature?: string
  actor: string
}

export interface Stream {
  id: string
  publicKey: string
  metadata: StreamMetadata
  sender: StreamParticipant
  recipient: StreamParticipant
  amount: StreamAmount
  schedule: StreamSchedule
  status: StreamStatus
  activities: StreamActivity[]
  createdAt: number
  updatedAt: number
  version: number
}

export interface CreateStreamParams {
  recipient: string
  amount: string
  tokenMint: string
  startTime: number
  endTime: number
  cliffTime?: number
  frequency: StreamSchedule['frequency']
  releaseFrequency: number
  metadata?: Partial<StreamMetadata>
  automaticWithdrawal?: boolean
  canCancel?: boolean
  canPause?: boolean
}

export interface WithdrawParams {
  streamId: string
  amount?: string
}

export interface StreamFilters {
  status?: 'active' | 'paused' | 'cancelled' | 'completed'
  role?: 'sender' | 'recipient'
  tokenMint?: string
  startDate?: number
  endDate?: number
  search?: string
}

export interface StreamSortOptions {
  field: 'createdAt' | 'startTime' | 'endTime' | 'amount' | 'name'
  direction: 'asc' | 'desc'
}

export interface StreamListResponse {
  streams: Stream[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface StreamStats {
  totalStreams: number
  activeStreams: number
  totalValue: string
  totalWithdrawn: string
  averageStreamDuration: number
  topTokens: Array<{
    mint: string
    symbol: string
    count: number
    totalValue: string
  }>
}

export interface StreamError {
  code: string
  message: string
  details?: Record<string, any>
}

export interface StreamTransaction {
  signature: string
  type: 'create' | 'withdraw' | 'cancel' | 'pause' | 'resume'
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: number
  amount?: string
  fee?: string
}

export interface VestingTemplate {
  id: string
  name: string
  description: string
  schedule: Omit<StreamSchedule, 'startTime' | 'endTime'>
  isPublic: boolean
  createdBy: string
  usageCount: number
}

export interface BatchStreamParams {
  recipients: Array<{
    address: string
    amount: string
    metadata?: Partial<StreamMetadata>
  }>
  tokenMint: string
  schedule: StreamSchedule
  template?: string
}

export interface StreamNotification {
  id: string
  streamId: string
  type: 'withdrawal_available' | 'stream_started' | 'stream_ending' | 'stream_cancelled'
  message: string
  isRead: boolean
  createdAt: number
}

export type StreamEventType = 
  | 'stream:created'
  | 'stream:withdrawn'
  | 'stream:paused'
  | 'stream:resumed'
  | 'stream:cancelled'
  | 'stream:completed'
  | 'stream:updated'

export interface StreamEvent {
  type: StreamEventType
  streamId: string
  data: Partial<Stream>
  timestamp: number
}

export interface StreamAnalytics {
  streamId: string
  withdrawalPattern: Array<{
    timestamp: number
    amount: string
    cumulativeAmount: string
  }>
  utilizationRate: number
  averageWithdrawalSize: string
  withdrawalFrequency: number
}
```