```typescript
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

export interface StreamData {
  id: string
  sender: PublicKey
  recipient: PublicKey
  mint: PublicKey
  amount: number
  startTime: number
  endTime: number
  cliffTime?: number
  withdrawn: number
  canceled: boolean
  paused: boolean
  createdAt: number
}

export interface CreateStreamParams {
  recipient: PublicKey
  mint: PublicKey
  amount: number
  startTime: number
  endTime: number
  cliffTime?: number
  canUpdate: boolean
  canCancel: boolean
}

export interface VestingSchedule {
  id: string
  beneficiary: PublicKey
  mint: PublicKey
  totalAmount: number
  releasedAmount: number
  startTime: number
  cliffDuration: number
  vestingDuration: number
  slicePeriodSeconds: number
  revocable: boolean
  revoked: boolean
}

export interface TreasuryData {
  id: string
  authority: PublicKey
  name: string
  description: string
  members: PublicKey[]
  threshold: number
  totalStreams: number
  totalValue: number
  createdAt: number
}

export const useStreamProgram = () => {
  const { connection } = useConnection()
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  const [loading, setLoading] = useState(false)
  const [streams, setStreams] = useState<StreamData[]>([])
  const [vestingSchedules, setVestingSchedules] = useState<VestingSchedule[]>([])
  const [treasuries, setTreasuries] = useState<TreasuryData[]>([])

  // Mock program ID - replace with actual StreamFlow program ID
  const PROGRAM_ID = useMemo(() => new PublicKey('11111111111111111111111111111112'), [])

  const createStream = useCallback(async (params: CreateStreamParams) => {
    if (!publicKey || !signTransaction) {
      toast.error('Wallet not connected')
      return null
    }

    setLoading(true)
    try {
      const transaction = new Transaction()
      
      // Get associated token accounts
      const senderATA = await getAssociatedTokenAddress(params.mint, publicKey)
      const recipientATA = await getAssociatedTokenAddress(params.mint, params.recipient)

      // Check if recipient ATA exists, create if not
      const recipientATAInfo = await connection.getAccountInfo(recipientATA)
      if (!recipientATAInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            recipientATA,
            params.recipient,
            params.mint
          )
        )
      }

      // Create stream account
      const streamKeypair = new PublicKey(Math.random().toString())
      
      // Add stream creation instruction (mock)
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: streamKeypair,
          lamports: await connection.getMinimumBalanceForRentExemption(1000),
          space: 1000,
          programId: PROGRAM_ID,
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      await connection.confirmTransaction(signature)

      const newStream: StreamData = {
        id: streamKeypair.toString(),
        sender: publicKey,
        recipient: params.recipient,
        mint: params.mint,
        amount: params.amount,
        startTime: params.startTime,
        endTime: params.endTime,
        cliffTime: params.cliffTime,
        withdrawn: 0,
        canceled: false,
        paused: false,
        createdAt: Date.now(),
      }

      setStreams(prev => [...prev, newStream])
      toast.success('Stream created successfully')
      return newStream
    } catch (error) {
      console.error('Error creating stream:', error)
      toast.error('Failed to create stream')
      return null
    } finally {
      setLoading(false)
    }
  }, [publicKey, signTransaction, connection, PROGRAM_ID])

  const withdrawFromStream = useCallback(async (streamId: string, amount?: number) => {
    if (!publicKey || !signTransaction) {
      toast.error('Wallet not connected')
      return false
    }

    setLoading(true)
    try {
      const stream = streams.find(s => s.id === streamId)
      if (!stream) {
        toast.error('Stream not found')
        return false
      }

      const transaction = new Transaction()
      const streamPubkey = new PublicKey(streamId)

      // Add withdraw instruction (mock)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: streamPubkey,
          toPubkey: publicKey,
          lamports: amount || (stream.amount - stream.withdrawn),
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      await connection.confirmTransaction(signature)

      // Update stream state
      setStreams(prev => prev.map(s => 
        s.id === streamId 
          ? { ...s, withdrawn: s.withdrawn + (amount || (s.amount - s.withdrawn)) }
          : s
      ))

      toast.success('Withdrawal successful')
      return true
    } catch (error) {
      console.error('Error withdrawing from stream:', error)
      toast.error('Failed to withdraw from stream')
      return false
    } finally {
      setLoading(false)
    }
  }, [publicKey, signTransaction, connection, streams])

  const cancelStream = useCallback(async (streamId: string) => {
    if (!publicKey || !signTransaction) {
      toast.error('Wallet not connected')
      return false
    }

    setLoading(true)
    try {
      const transaction = new Transaction()
      const streamPubkey = new PublicKey(streamId)

      // Add cancel instruction (mock)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: streamPubkey,
          toPubkey: publicKey,
          lamports: 0,
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      await connection.confirmTransaction(signature)

      // Update stream state
      setStreams(prev => prev.map(s => 
        s.id === streamId ? { ...s, canceled: true } : s
      ))

      toast.success('Stream canceled successfully')
      return true
    } catch (error) {
      console.error('Error canceling stream:', error)
      toast.error('Failed to cancel stream')
      return false
    } finally {
      setLoading(false)
    }
  }, [publicKey, signTransaction, connection])

  const pauseStream = useCallback(async (streamId: string) => {
    if (!publicKey || !signTransaction) {
      toast.error('Wallet not connected')
      return false
    }

    setLoading(true)
    try {
      const transaction = new Transaction()
      
      // Add pause instruction (mock)
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      await connection.confirmTransaction(signature)

      // Update stream state
      setStreams(prev => prev.map(s => 
        s.id === streamId ? { ...s, paused: !s.paused } : s
      ))

      toast.success(`Stream ${streams.find(s => s.id === streamId)?.paused ? 'resumed' : 'paused'} successfully`)
      return true
    } catch (error) {
      console.error('Error pausing/resuming stream:', error)
      toast.error('Failed to pause/resume stream')
      return false
    } finally {
      setLoading(false)
    }
  }, [publicKey, signTransaction, connection, streams])

  const createVestingSchedule = useCallback(async (
    beneficiary: PublicKey,
    mint: PublicKey,
    totalAmount: number,
    startTime: number,
    cliffDuration: number,
    vestingDuration: number,
    slicePeriodSeconds: number,
    revocable: boolean
  ) => {
    if (!publicKey || !signTransaction) {
      toast.error('Wallet not connected')
      return null
    }

    setLoading(true)
    try {
      const transaction = new Transaction()
      const vestingId = Math.random().toString()

      // Add vesting creation instruction (mock)
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      await connection.confirmTransaction(signature)

      const newVesting: VestingSchedule = {
        id: vestingId,
        beneficiary,
        mint,
        totalAmount,
        releasedAmount: 0,
        startTime,
        cliffDuration,
        vestingDuration,
        slicePeriodSeconds,
        revocable,
        revoked: false,
      }

      setVestingSchedules(prev => [...prev, newVesting])
      toast.success('Vesting schedule created successfully')
      return newVesting
    } catch (error) {
      console.error('Error creating vesting schedule:', error)
      toast.error('Failed to create vesting schedule')
      return null
    } finally {
      setLoading(false)
    }
  }, [publicKey, signTransaction, connection])

  const releaseVestedTokens = useCallback(async (vestingId: string) => {
    if (!publicKey || !signTransaction) {
      toast.error('Wallet not connected')
      return false
    }

    setLoading(true)
    try {
      const transaction = new Transaction()

      // Add release instruction (mock)
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      await connection.confirmTransaction(signature)

      toast.success('Vested tokens released successfully')
      return true
    } catch (error) {
      console.error('Error releasing vested tokens:', error)
      toast.error('Failed to release vested tokens')
      return false
    } finally {
      setLoading(false)
    }
  }, [publicKey, signTransaction, connection])

  const createTreasury = useCallback(async (
    name: string,
    description: string,
    members: PublicKey[],
    threshold: number
  ) => {
    if (!publicKey || !signTransaction) {
      toast.error('Wallet not connected')
      return null
    }

    setLoading(true)
    try {
      const transaction = new Transaction()
      const treasuryId = Math.random().toString()

      // Add treasury creation instruction (mock)
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      await connection.confirmTransaction(signature)

      const newTreasury: TreasuryData = {
        id: treasuryId,
        authority: publicKey,
        name,
        description,
        members,
        threshold,
        totalStreams: 0,
        totalValue: 0,
        createdAt: Date.now(),
      }

      setTreasuries(prev => [...prev, newTreasury])
      toast.success('Treasury created successfully')
      return newTreasury
    } catch (error) {
      console.error('Error creating treasury:', error)
      toast.error('Failed to create treasury')
      return null
    } finally {
      setLoading(false)
    }
  }, [publicKey, signTransaction, connection])

  const fetchStreams = useCallback(async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      // Mock fetch - replace with actual program account fetching
      const mockStreams: StreamData[] = [
        {
          id: 'stream1',
          sender: publicKey,
          recipient: new PublicKey('11111111111111111111111111111112'),
          mint: new PublicKey('So11111111111111111111111111111111111111112'),
          amount: 1000,
          startTime: Date.now() - 86400000,
          endTime: Date.now() + 86400000,
          withdrawn: 100,
          canceled: false,
          paused: false,
          createdAt: Date.now() - 86400000,
        },
      ]
      setStreams(mockStreams)
    } catch (error) {
      console.error('Error fetching streams:', error)
    } finally {
      setLoading(false)
    }
  }, [publicKey])

  const getStreamableAmount = useCallback((stream: StreamData) => {
    const now = Date.now()
    if (now < stream.startTime) return 0
    if (stream.canceled || stream.paused) return 0
    
    const elapsed = Math.min(now - stream.startTime, stream.endTime - stream.startTime)
    const totalDuration = stream.endTime - stream.startTime
    const streamableAmount = (stream.amount * elapsed) / totalDuration
    
    return Math.max(0, streamableAmount - stream.withdrawn)
  }, [])

  const getVestedAmount = useCallback((vesting: VestingSchedule) => {
    const now = Date.now()
    if (now < vesting.startTime + vesting.cliffDuration) return 0
    if (vesting.revoked) return 0
    
    const elapsed = Math.min(now - vesting.startTime, vesting.vestingDuration)
    const vestedAmount = (vesting.totalAmount * elapsed) / vesting.vestingDuration
    
    return Math.max(0, vestedAmount - vesting.releasedAmount)
  }, [])

  return {
    // State
    loading,
    streams,
    vestingSchedules,
    treasuries,
    
    // Stream operations
    createStream,
    withdrawFrom