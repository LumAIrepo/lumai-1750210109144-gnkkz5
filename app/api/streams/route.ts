```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'

interface StreamData {
  id: string
  sender: string
  recipient: string
  mint: string
  depositedAmount: string
  withdrawnAmount: string
  startTime: number
  endTime: number
  cliffTime: number
  cancelledAt?: number
  withdrawFrequency: number
  amountPerPeriod: string
  created: number
  lastWithdrawnAt: number
  streamflowRate: string
  senderTokens: string
  recipientTokens: string
  streamName: string
  canTopup: boolean
  canUpdate: boolean
  canPause: boolean
  pausedAt?: number
  closedAt?: number
  currentPauseStart?: number
  transferableBySender: boolean
  transferableByRecipient: boolean
  automaticWithdrawal: boolean
  withdrawalFrequency: number
  partner?: string
  status: 'active' | 'paused' | 'cancelled' | 'completed'
  progress: number
  availableAmount: string
  streamedAmount: string
  remainingAmount: string
}

interface CreateStreamRequest {
  recipient: string
  mint: string
  start: number
  depositedAmount: string
  period: number
  cliff: number
  cliffAmount: string
  amountPerPeriod: string
  name: string
  canTopup?: boolean
  canUpdate?: boolean
  canPause?: boolean
  transferableBySender?: boolean
  transferableByRecipient?: boolean
  automaticWithdrawal?: boolean
  withdrawalFrequency?: number
  partner?: string
}

interface UpdateStreamRequest {
  streamId: string
  name?: string
  canTopup?: boolean
  canUpdate?: boolean
  canPause?: boolean
  transferableBySender?: boolean
  transferableByRecipient?: boolean
  automaticWithdrawal?: boolean
  withdrawalFrequency?: number
}

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
)

// Mock data for development - replace with actual Solana program calls
const mockStreams: StreamData[] = [
  {
    id: '1',
    sender: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    depositedAmount: '1000000000',
    withdrawnAmount: '250000000',
    startTime: Date.now() - 86400000,
    endTime: Date.now() + 86400000 * 30,
    cliffTime: Date.now() - 43200000,
    withdrawFrequency: 3600,
    amountPerPeriod: '11574074',
    created: Date.now() - 86400000,
    lastWithdrawnAt: Date.now() - 3600000,
    streamflowRate: '100',
    senderTokens: '0',
    recipientTokens: '250000000',
    streamName: 'Monthly Salary Payment',
    canTopup: true,
    canUpdate: true,
    canPause: true,
    transferableBySender: false,
    transferableByRecipient: false,
    automaticWithdrawal: false,
    withdrawalFrequency: 86400,
    status: 'active',
    progress: 25,
    availableAmount: '150000000',
    streamedAmount: '400000000',
    remainingAmount: '600000000'
  },
  {
    id: '2',
    sender: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    mint: 'So11111111111111111111111111111111111111112',
    depositedAmount: '5000000000',
    withdrawnAmount: '0',
    startTime: Date.now() + 86400000,
    endTime: Date.now() + 86400000 * 90,
    cliffTime: Date.now() + 86400000 * 7,
    withdrawFrequency: 86400,
    amountPerPeriod: '55555555',
    created: Date.now() - 3600000,
    lastWithdrawnAt: 0,
    streamflowRate: '100',
    senderTokens: '5000000000',
    recipientTokens: '0',
    streamName: 'Vesting Schedule - Team Member',
    canTopup: false,
    canUpdate: false,
    canPause: true,
    transferableBySender: true,
    transferableByRecipient: false,
    automaticWithdrawal: true,
    withdrawalFrequency: 86400,
    status: 'active',
    progress: 0,
    availableAmount: '0',
    streamedAmount: '0',
    remainingAmount: '5000000000'
  }
]

function calculateStreamProgress(stream: StreamData): StreamData {
  const now = Date.now()
  const totalDuration = stream.endTime - stream.startTime
  const elapsed = Math.max(0, now - stream.startTime)
  const progress = Math.min(100, (elapsed / totalDuration) * 100)
  
  const totalStreamable = Math.min(elapsed, totalDuration)
  const streamedAmount = Math.floor((parseInt(stream.depositedAmount) * totalStreamable) / totalDuration)
  const availableAmount = streamedAmount - parseInt(stream.withdrawnAmount)
  const remainingAmount = parseInt(stream.depositedAmount) - streamedAmount
  
  let status: StreamData['status'] = 'active'
  if (stream.cancelledAt) {
    status = 'cancelled'
  } else if (stream.pausedAt) {
    status = 'paused'
  } else if (now >= stream.endTime) {
    status = 'completed'
  }
  
  return {
    ...stream,
    progress: Math.round(progress),
    streamedAmount: streamedAmount.toString(),
    availableAmount: Math.max(0, availableAmount).toString(),
    remainingAmount: remainingAmount.toString(),
    status
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const type = searchParams.get('type') // 'incoming', 'outgoing', 'all'
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let filteredStreams = mockStreams.map(calculateStreamProgress)

    // Filter by address
    if (address) {
      if (type === 'incoming') {
        filteredStreams = filteredStreams.filter(stream => stream.recipient === address)
      } else if (type === 'outgoing') {
        filteredStreams = filteredStreams.filter(stream => stream.sender === address)
      } else {
        filteredStreams = filteredStreams.filter(
          stream => stream.sender === address || stream.recipient === address
        )
      }
    }

    // Filter by status
    if (status && status !== 'all') {
      filteredStreams = filteredStreams.filter(stream => stream.status === status)
    }

    // Apply pagination
    const total = filteredStreams.length
    const paginatedStreams = filteredStreams.slice(offset, offset + limit)

    return NextResponse.json({
      streams: paginatedStreams,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching streams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateStreamRequest = await request.json()

    // Validate required fields
    if (!body.recipient || !body.mint || !body.depositedAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient, mint, depositedAmount' },
        { status: 400 }
      )
    }

    // Validate Solana addresses
    try {
      new PublicKey(body.recipient)
      new PublicKey(body.mint)
    } catch {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      )
    }

    // Validate amounts
    if (parseInt(body.depositedAmount) <= 0) {
      return NextResponse.json(
        { error: 'Deposited amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate time parameters
    if (body.start && body.start < Date.now()) {
      return NextResponse.json(
        { error: 'Start time cannot be in the past' },
        { status: 400 }
      )
    }

    // Create new stream
    const newStream: StreamData = {
      id: Date.now().toString(),
      sender: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', // This would come from wallet connection
      recipient: body.recipient,
      mint: body.mint,
      depositedAmount: body.depositedAmount,
      withdrawnAmount: '0',
      startTime: body.start || Date.now(),
      endTime: (body.start || Date.now()) + (body.period * 1000),
      cliffTime: (body.start || Date.now()) + (body.cliff * 1000),
      withdrawFrequency: body.withdrawalFrequency || 3600,
      amountPerPeriod: body.amountPerPeriod,
      created: Date.now(),
      lastWithdrawnAt: 0,
      streamflowRate: '100',
      senderTokens: body.depositedAmount,
      recipientTokens: '0',
      streamName: body.name,
      canTopup: body.canTopup ?? true,
      canUpdate: body.canUpdate ?? true,
      canPause: body.canPause ?? true,
      transferableBySender: body.transferableBySender ?? false,
      transferableByRecipient: body.transferableByRecipient ?? false,
      automaticWithdrawal: body.automaticWithdrawal ?? false,
      withdrawalFrequency: body.withdrawalFrequency || 86400,
      partner: body.partner,
      status: 'active',
      progress: 0,
      availableAmount: '0',
      streamedAmount: '0',
      remainingAmount: body.depositedAmount
    }

    // In production, this would interact with Solana program
    mockStreams.push(newStream)

    return NextResponse.json({
      stream: calculateStreamProgress(newStream),
      message: 'Stream created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating stream:', error)
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateStreamRequest = await request.json()

    if (!body.streamId) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      )
    }

    const streamIndex = mockStreams.findIndex(stream => stream.id === body.streamId)
    
    if (streamIndex === -1) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    const existingStream = mockStreams[streamIndex]

    // Check if stream can be updated
    if (!existingStream.canUpdate) {
      return NextResponse.json(
        { error: 'Stream is not updatable' },
        { status: 403 }
      )
    }

    // Update stream properties
    const updatedStream: StreamData = {
      ...existingStream,
      streamName: body.name ?? existingStream.streamName,
      canTopup: body.canTopup ?? existingStream.canTopup,
      canUpdate: body.canUpdate ?? existingStream.canUpdate,
      canPause: body.canPause ?? existingStream.canPause,
      transferableBySender: body.transferableBySender ?? existingStream.transferableBySender,
      transferableByRecipient: body.transferableByRecipient ?? existingStream.transferableByRecipient,
      automaticWithdrawal: body.automaticWithdrawal ?? existingStream.automaticWithdrawal,
      withdrawalFrequency: body.withdrawalFrequency ?? existingStream.withdrawalFrequency
    }

    mockStreams[streamIndex] = updatedStream

    return NextResponse.json({
      stream: calculateStreamProgress(updatedStream),
      message: 'Stream updated successfully'
    })
  } catch (error) {
    console.error('Error updating stream:', error)
    return NextResponse.json(
      { error: 'Failed to update stream' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const streamId = searchParams.get('id')

    if (!streamId) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      )
    }

    const streamIndex = mockStreams.findIndex(stream => stream.id === streamId)
    
    if (streamIndex === -1) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    const stream = mockStreams[streamIndex]

    // Mark stream as cancelled
    mockStreams[streamIndex] = {
      ...stream,
      cancelledAt: Date.now(),
      status: 'cancelled'
    }

    return NextResponse.json({
      message: 'Stream cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling stream:', error)
    return NextResponse.json(
      { error: 'Failed to cancel stream' },
      { status: 500 }
    )
  }
}
```