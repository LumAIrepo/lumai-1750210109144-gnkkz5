```typescript
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'

export interface StreamData {
  id: string
  sender: PublicKey
  recipient: PublicKey
  mint: PublicKey
  depositedAmount: BN
  withdrawnAmount: BN
  startTime: BN
  endTime: BN
  cliffTime: BN
  cancelableBySender: boolean
  cancelableByRecipient: boolean
  automaticWithdrawal: boolean
  transferableBySender: boolean
  transferableByRecipient: boolean
  canTopup: boolean
  streamName: string
  withdrawFrequency: BN
  amountPerPeriod: BN
  created: number
  lastWithdrawnAt: BN
  closedAt?: BN
}

export interface VestingSchedule {
  totalAmount: number
  releasedAmount: number
  startDate: Date
  endDate: Date
  cliffDate?: Date
  withdrawnAmount: number
  remainingAmount: number
  nextUnlockDate: Date
  nextUnlockAmount: number
}

export interface StreamMetrics {
  totalStreamed: number
  totalWithdrawn: number
  streamingRate: number
  timeRemaining: number
  percentageComplete: number
  isActive: boolean
  isPaused: boolean
  isCompleted: boolean
  isCancelled: boolean
}

export class StreamCalculator {
  /**
   * Calculate the total amount that should be available for withdrawal at a given time
   */
  static calculateVestedAmount(
    totalAmount: number,
    startTime: number,
    endTime: number,
    currentTime: number,
    cliffTime?: number
  ): number {
    if (currentTime < startTime) return 0
    
    // Check if cliff period has passed
    if (cliffTime && currentTime < cliffTime) return 0
    
    if (currentTime >= endTime) return totalAmount
    
    const totalDuration = endTime - startTime
    const elapsedTime = currentTime - startTime
    const vestedPercentage = elapsedTime / totalDuration
    
    return Math.floor(totalAmount * vestedPercentage)
  }

  /**
   * Calculate withdrawable amount (vested - already withdrawn)
   */
  static calculateWithdrawableAmount(
    totalAmount: number,
    withdrawnAmount: number,
    startTime: number,
    endTime: number,
    currentTime: number,
    cliffTime?: number
  ): number {
    const vestedAmount = this.calculateVestedAmount(
      totalAmount,
      startTime,
      endTime,
      currentTime,
      cliffTime
    )
    
    return Math.max(0, vestedAmount - withdrawnAmount)
  }

  /**
   * Calculate streaming rate per second
   */
  static calculateStreamingRate(
    totalAmount: number,
    startTime: number,
    endTime: number
  ): number {
    const duration = endTime - startTime
    return duration > 0 ? totalAmount / duration : 0
  }

  /**
   * Calculate next unlock time and amount for periodic vesting
   */
  static calculateNextUnlock(
    totalAmount: number,
    startTime: number,
    endTime: number,
    withdrawFrequency: number,
    currentTime: number,
    withdrawnAmount: number
  ): { nextUnlockTime: number; nextUnlockAmount: number } {
    if (currentTime >= endTime) {
      return { nextUnlockTime: endTime, nextUnlockAmount: 0 }
    }

    const totalDuration = endTime - startTime
    const periodsTotal = Math.floor(totalDuration / withdrawFrequency)
    const amountPerPeriod = totalAmount / periodsTotal

    let nextUnlockTime = startTime
    let periodsElapsed = 0

    while (nextUnlockTime <= currentTime && nextUnlockTime < endTime) {
      nextUnlockTime += withdrawFrequency
      periodsElapsed++
    }

    const expectedWithdrawn = periodsElapsed * amountPerPeriod
    const nextUnlockAmount = Math.max(0, expectedWithdrawn - withdrawnAmount)

    return {
      nextUnlockTime: Math.min(nextUnlockTime, endTime),
      nextUnlockAmount: Math.floor(nextUnlockAmount)
    }
  }

  /**
   * Generate complete vesting schedule
   */
  static generateVestingSchedule(
    totalAmount: number,
    startTime: number,
    endTime: number,
    withdrawnAmount: number,
    currentTime: number,
    cliffTime?: number
  ): VestingSchedule {
    const vestedAmount = this.calculateVestedAmount(
      totalAmount,
      startTime,
      endTime,
      currentTime,
      cliffTime
    )

    const remainingAmount = totalAmount - withdrawnAmount
    const streamingRate = this.calculateStreamingRate(totalAmount, startTime, endTime)
    
    // Calculate next unlock (assuming daily unlocks for simplicity)
    const dailyUnlock = streamingRate * 86400 // 24 hours in seconds
    const nextUnlockTime = currentTime + 86400
    const nextUnlockAmount = Math.min(dailyUnlock, remainingAmount)

    return {
      totalAmount,
      releasedAmount: vestedAmount,
      startDate: new Date(startTime * 1000),
      endDate: new Date(endTime * 1000),
      cliffDate: cliffTime ? new Date(cliffTime * 1000) : undefined,
      withdrawnAmount,
      remainingAmount,
      nextUnlockDate: new Date(nextUnlockTime * 1000),
      nextUnlockAmount: Math.floor(nextUnlockAmount)
    }
  }

  /**
   * Calculate comprehensive stream metrics
   */
  static calculateStreamMetrics(
    streamData: Partial<StreamData>,
    currentTime: number
  ): StreamMetrics {
    const {
      depositedAmount,
      withdrawnAmount = new BN(0),
      startTime,
      endTime,
      cliffTime,
      closedAt
    } = streamData

    if (!depositedAmount || !startTime || !endTime) {
      throw new Error('Invalid stream data: missing required fields')
    }

    const totalAmount = depositedAmount.toNumber()
    const withdrawn = withdrawnAmount.toNumber()
    const start = startTime.toNumber()
    const end = endTime.toNumber()
    const cliff = cliffTime?.toNumber()
    const closed = closedAt?.toNumber()

    const vestedAmount = this.calculateVestedAmount(
      totalAmount,
      start,
      end,
      currentTime,
      cliff
    )

    const streamingRate = this.calculateStreamingRate(totalAmount, start, end)
    const timeRemaining = Math.max(0, end - currentTime)
    const totalDuration = end - start
    const elapsedTime = Math.max(0, currentTime - start)
    const percentageComplete = totalDuration > 0 ? (elapsedTime / totalDuration) * 100 : 0

    const isActive = currentTime >= start && currentTime < end && !closed
    const isPaused = false // Implement pause logic if needed
    const isCompleted = currentTime >= end || withdrawn >= totalAmount
    const isCancelled = !!closed && closed < end

    return {
      totalStreamed: vestedAmount,
      totalWithdrawn: withdrawn,
      streamingRate,
      timeRemaining,
      percentageComplete: Math.min(100, percentageComplete),
      isActive,
      isPaused,
      isCompleted,
      isCancelled
    }
  }

  /**
   * Calculate cliff unlock amount
   */
  static calculateCliffAmount(
    totalAmount: number,
    startTime: number,
    cliffTime: number,
    endTime: number
  ): number {
    if (cliffTime <= startTime) return 0
    
    const totalDuration = endTime - startTime
    const cliffDuration = cliffTime - startTime
    const cliffPercentage = cliffDuration / totalDuration
    
    return Math.floor(totalAmount * cliffPercentage)
  }

  /**
   * Format time duration to human readable string
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.floor(seconds)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d`
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo`
    return `${Math.floor(seconds / 31536000)}y`
  }

  /**
   * Calculate APY for a stream
   */
  static calculateAPY(
    totalAmount: number,
    duration: number,
    currentValue?: number
  ): number {
    if (duration <= 0) return 0
    
    const durationInYears = duration / (365 * 24 * 3600)
    const finalValue = currentValue || totalAmount
    
    if (durationInYears === 0) return 0
    
    // Simple APY calculation - can be enhanced for compound interest
    return ((finalValue / totalAmount) - 1) / durationInYears * 100
  }

  /**
   * Validate stream parameters
   */
  static validateStreamParams(params: {
    totalAmount: number
    startTime: number
    endTime: number
    cliffTime?: number
    withdrawFrequency?: number
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const { totalAmount, startTime, endTime, cliffTime, withdrawFrequency } = params

    if (totalAmount <= 0) {
      errors.push('Total amount must be greater than 0')
    }

    if (startTime >= endTime) {
      errors.push('End time must be after start time')
    }

    if (cliffTime && (cliffTime < startTime || cliffTime > endTime)) {
      errors.push('Cliff time must be between start and end time')
    }

    if (withdrawFrequency && withdrawFrequency <= 0) {
      errors.push('Withdraw frequency must be greater than 0')
    }

    const duration = endTime - startTime
    if (duration < 60) {
      errors.push('Stream duration must be at least 1 minute')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Utility functions for stream formatting and display
 */
export class StreamFormatter {
  /**
   * Format token amount with proper decimals
   */
  static formatTokenAmount(
    amount: number,
    decimals: number = 9,
    symbol: string = 'SOL'
  ): string {
    const formatted = (amount / Math.pow(10, decimals)).toFixed(6)
    return `${parseFloat(formatted)} ${symbol}`
  }

  /**
   * Format percentage with proper precision
   */
  static formatPercentage(percentage: number): string {
    return `${percentage.toFixed(2)}%`
  }

  /**
   * Format date for display
   */
  static formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Format streaming rate
   */
  static formatStreamingRate(
    rate: number,
    decimals: number = 9,
    symbol: string = 'SOL'
  ): string {
    const ratePerSecond = rate / Math.pow(10, decimals)
    const ratePerHour = ratePerSecond * 3600
    const ratePerDay = ratePerSecond * 86400

    if (ratePerDay >= 1) {
      return `${ratePerDay.toFixed(4)} ${symbol}/day`
    } else if (ratePerHour >= 1) {
      return `${ratePerHour.toFixed(4)} ${symbol}/hour`
    } else {
      return `${ratePerSecond.toFixed(8)} ${symbol}/sec`
    }
  }
}

/**
 * Constants for stream calculations
 */
export const STREAM_CONSTANTS = {
  MIN_STREAM_DURATION: 60, // 1 minute
  MAX_STREAM_DURATION: 365 * 24 * 3600, // 1 year
  DEFAULT_WITHDRAW_FREQUENCY: 86400, // 1 day
  PRECISION_DECIMALS: 9,
  LAMPORTS_PER_SOL: 1000000000
} as const

export type StreamStatus = 'pending' | 'active' | 'paused' | 'completed' | 'cancelled'

/**
 * Determine stream status based on current conditions
 */
export function getStreamStatus(
  startTime: number,
  endTime: number,
  currentTime: number,
  closedAt?: number,
  isPaused?: boolean
): StreamStatus {
  if (closedAt && closedAt < endTime) return 'cancelled'
  if (currentTime >= endTime) return 'completed'
  if (isPaused) return 'paused'
  if (currentTime >= startTime) return 'active'
  return 'pending'
}
```