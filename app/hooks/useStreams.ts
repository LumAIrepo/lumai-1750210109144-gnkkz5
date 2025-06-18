```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'

export interface Stream {
  id: string
  name: string
  recipient: string
  sender: string
  mint: string
  depositedAmount: number
  withdrawnAmount: number
  startTime: number
  endTime: number
  cliffTime: number
  cancelledAt?: number
  withdrawFrequency: number
  amountPerPeriod: number
  status: 'active' | 'paused' | 'cancelled' | 'completed'
  tokenSymbol: string
  tokenDecimals: number
  createdAt: number
  lastWithdrawnAt?: number
  canWithdrawAmount: number
  streamedAmount: number
  remainingAmount: number
  isRecipient: boolean
  isSender: boolean
}

export interface UseStreamsReturn {
  streams: Stream[]
  incomingStreams: Stream[]
  outgoingStreams: Stream[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  withdrawFromStream: (streamId: string) => Promise<boolean>
  cancelStream: (streamId: string) => Promise<boolean>
  pauseStream: (streamId: string) => Promise<boolean>
  resumeStream: (streamId: string) => Promise<boolean>
}

const STREAMFLOW_PROGRAM_ID = new PublicKey('strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m')
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com'

export function useStreams(): UseStreamsReturn {
  const { publicKey, connected } = useWallet()
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connection = new Connection(RPC_ENDPOINT, 'confirmed')

  const fetchStreams = useCallback(async () => {
    if (!publicKey || !connected) {
      setStreams([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch stream accounts where user is either sender or recipient
      const streamAccounts = await connection.getProgramAccounts(STREAMFLOW_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 8, // Skip discriminator
              bytes: publicKey.toBase58(),
            },
          },
        ],
      })

      const parsedStreams: Stream[] = []

      for (const account of streamAccounts) {
        try {
          const streamData = parseStreamAccount(account.account.data, account.pubkey.toBase58())
          if (streamData) {
            // Calculate current withdrawable amount
            const now = Date.now() / 1000
            const streamedAmount = calculateStreamedAmount(streamData, now)
            const canWithdrawAmount = streamedAmount - streamData.withdrawnAmount
            const remainingAmount = streamData.depositedAmount - streamData.withdrawnAmount

            const stream: Stream = {
              ...streamData,
              canWithdrawAmount: Math.max(0, canWithdrawAmount),
              streamedAmount,
              remainingAmount: Math.max(0, remainingAmount),
              isRecipient: streamData.recipient === publicKey.toBase58(),
              isSender: streamData.sender === publicKey.toBase58(),
            }

            parsedStreams.push(stream)
          }
        } catch (err) {
          console.warn('Failed to parse stream account:', err)
        }
      }

      // Sort by creation time (newest first)
      parsedStreams.sort((a, b) => b.createdAt - a.createdAt)
      setStreams(parsedStreams)
    } catch (err) {
      console.error('Error fetching streams:', err)
      setError('Failed to fetch streams')
    } finally {
      setLoading(false)
    }
  }, [publicKey, connected, connection])

  const withdrawFromStream = useCallback(async (streamId: string): Promise<boolean> => {
    if (!publicKey || !connected) {
      setError('Wallet not connected')
      return false
    }

    try {
      setError(null)
      // Implementation would involve creating and sending a withdraw transaction
      // This is a simplified version - actual implementation would use StreamFlow SDK
      
      // For now, simulate the withdrawal
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Refetch streams after withdrawal
      await fetchStreams()
      return true
    } catch (err) {
      console.error('Error withdrawing from stream:', err)
      setError('Failed to withdraw from stream')
      return false
    }
  }, [publicKey, connected, fetchStreams])

  const cancelStream = useCallback(async (streamId: string): Promise<boolean> => {
    if (!publicKey || !connected) {
      setError('Wallet not connected')
      return false
    }

    try {
      setError(null)
      // Implementation would involve creating and sending a cancel transaction
      
      // For now, simulate the cancellation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Refetch streams after cancellation
      await fetchStreams()
      return true
    } catch (err) {
      console.error('Error cancelling stream:', err)
      setError('Failed to cancel stream')
      return false
    }
  }, [publicKey, connected, fetchStreams])

  const pauseStream = useCallback(async (streamId: string): Promise<boolean> => {
    if (!publicKey || !connected) {
      setError('Wallet not connected')
      return false
    }

    try {
      setError(null)
      // Implementation would involve creating and sending a pause transaction
      
      // For now, simulate the pause
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Refetch streams after pausing
      await fetchStreams()
      return true
    } catch (err) {
      console.error('Error pausing stream:', err)
      setError('Failed to pause stream')
      return false
    }
  }, [publicKey, connected, fetchStreams])

  const resumeStream = useCallback(async (streamId: string): Promise<boolean> => {
    if (!publicKey || !connected) {
      setError('Wallet not connected')
      return false
    }

    try {
      setError(null)
      // Implementation would involve creating and sending a resume transaction
      
      // For now, simulate the resume
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Refetch streams after resuming
      await fetchStreams()
      return true
    } catch (err) {
      console.error('Error resuming stream:', err)
      setError('Failed to resume stream')
      return false
    }
  }, [publicKey, connected, fetchStreams])

  useEffect(() => {
    fetchStreams()
  }, [fetchStreams])

  // Auto-refresh streams every 30 seconds
  useEffect(() => {
    if (!connected) return

    const interval = setInterval(() => {
      fetchStreams()
    }, 30000)

    return () => clearInterval(interval)
  }, [connected, fetchStreams])

  const incomingStreams = streams.filter(stream => stream.isRecipient)
  const outgoingStreams = streams.filter(stream => stream.isSender)

  return {
    streams,
    incomingStreams,
    outgoingStreams,
    loading,
    error,
    refetch: fetchStreams,
    withdrawFromStream,
    cancelStream,
    pauseStream,
    resumeStream,
  }
}

function parseStreamAccount(data: Buffer, accountId: string): Omit<Stream, 'canWithdrawAmount' | 'streamedAmount' | 'remainingAmount' | 'isRecipient' | 'isSender'> | null {
  try {
    // This is a simplified parser - actual implementation would use proper borsh deserialization
    // For demo purposes, we'll return mock data
    const mockStreams = [
      {
        id: accountId,
        name: 'Team Vesting',
        recipient: 'GjwXKWVaJxQmKKv1eWBfKQzXuYiT8FpUxfmKg5mRqUCo',
        sender: 'HjwXKWVaJxQmKKv1eWBfKQzXuYiT8FpUxfmKg5mRqUCo',
        mint: 'So11111111111111111111111111111111111111112',
        depositedAmount: 1000000000, // 1000 SOL
        withdrawnAmount: 250000000, // 250 SOL
        startTime: Date.now() / 1000 - 86400 * 30, // 30 days ago
        endTime: Date.now() / 1000 + 86400 * 335, // 335 days from now
        cliffTime: Date.now() / 1000 - 86400 * 15, // 15 days ago
        withdrawFrequency: 86400, // Daily
        amountPerPeriod: 2739726, // ~2.74 SOL per day
        status: 'active' as const,
        tokenSymbol: 'SOL',
        tokenDecimals: 9,
        createdAt: Date.now() / 1000 - 86400 * 30,
        lastWithdrawnAt: Date.now() / 1000 - 86400 * 2,
      },
      {
        id: accountId + '_2',
        name: 'Marketing Budget',
        recipient: 'IjwXKWVaJxQmKKv1eWBfKQzXuYiT8FpUxfmKg5mRqUCo',
        sender: 'GjwXKWVaJxQmKKv1eWBfKQzXuYiT8FpUxfmKg5mRqUCo',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        depositedAmount: 50000000000, // 50,000 USDC
        withdrawnAmount: 12500000000, // 12,500 USDC
        startTime: Date.now() / 1000 - 86400 * 60, // 60 days ago
        endTime: Date.now() / 1000 + 86400 * 305, // 305 days from now
        cliffTime: Date.now() / 1000 - 86400 * 30, // 30 days ago
        withdrawFrequency: 604800, // Weekly
        amountPerPeriod: 961538461, // ~961.54 USDC per week
        status: 'active' as const,
        tokenSymbol: 'USDC',
        tokenDecimals: 6,
        createdAt: Date.now() / 1000 - 86400 * 60,
        lastWithdrawnAt: Date.now() / 1000 - 86400 * 7,
      },
    ]

    return mockStreams[0] // Return first mock stream for demo
  } catch (err) {
    console.error('Error parsing stream account:', err)
    return null
  }
}

function calculateStreamedAmount(stream: Omit<Stream, 'canWithdrawAmount' | 'streamedAmount' | 'remainingAmount' | 'isRecipient' | 'isSender'>, currentTime: number): number {
  if (stream.status === 'cancelled' || stream.status === 'paused') {
    return stream.withdrawnAmount
  }

  if (currentTime < stream.cliffTime) {
    return 0
  }

  if (currentTime >= stream.endTime) {
    return stream.depositedAmount
  }

  const timeElapsed = currentTime - stream.startTime
  const totalDuration = stream.endTime - stream.startTime
  const streamedRatio = timeElapsed / totalDuration

  return Math.min(stream.depositedAmount * streamedRatio, stream.depositedAmount)
}
```