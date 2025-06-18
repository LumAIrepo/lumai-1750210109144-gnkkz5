```typescript
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { StreamFlow } from './types/streamflow'
import streamflowIdl from './idl/streamflow.json'

export interface StreamData {
  sender: PublicKey
  recipient: PublicKey
  mint: PublicKey
  escrowTokens: PublicKey
  streamedAmount: number
  withdrawnAmount: number
  startTime: number
  endTime: number
  cliff: number
  cliffAmount: number
  cancelableBySender: boolean
  cancelableByRecipient: boolean
  automaticWithdrawal: boolean
  transferableBySender: boolean
  transferableByRecipient: boolean
  canTopup: boolean
  name: string
  withdrawFrequency: number
  pausable: boolean
  canUpdateRate: boolean
  lastWithdrawnAt: number
  closedAt: number
}

export interface CreateStreamParams {
  recipient: PublicKey
  tokenMint: PublicKey
  start: number
  depositedAmount: number
  period: number
  cliff: number
  cliffAmount: number
  amountPerPeriod: number
  name: string
  canTopup?: boolean
  cancelableBySender?: boolean
  cancelableByRecipient?: boolean
  transferableBySender?: boolean
  transferableByRecipient?: boolean
  automaticWithdrawal?: boolean
  withdrawFrequency?: number
  pausable?: boolean
  canUpdateRate?: boolean
}

export interface TopupStreamParams {
  streamId: PublicKey
  amount: number
}

export interface WithdrawParams {
  streamId: PublicKey
  amount: number
}

export interface CancelStreamParams {
  streamId: PublicKey
}

export interface TransferStreamParams {
  streamId: PublicKey
  newRecipient: PublicKey
}

export interface PauseStreamParams {
  streamId: PublicKey
}

export interface UpdateStreamParams {
  streamId: PublicKey
  enableAutomaticWithdrawal?: boolean
  withdrawFrequency?: number
  amountPerPeriod?: number
}

export class AnchorClient {
  private connection: Connection
  private provider: AnchorProvider
  private program: Program<StreamFlow>
  private wallet: Wallet

  constructor(connection: Connection, wallet: Wallet) {
    this.connection = connection
    this.wallet = wallet
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    })
    this.program = new Program(streamflowIdl as StreamFlow, this.provider)
  }

  async createStream(params: CreateStreamParams): Promise<{ streamId: PublicKey; signature: string }> {
    const streamKeypair = Keypair.generate()
    const streamId = streamKeypair.publicKey

    const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), streamId.toBuffer()],
      this.program.programId
    )

    const signature = await this.program.methods
      .createStream(
        params.start,
        params.depositedAmount,
        params.period,
        params.amountPerPeriod,
        params.cliff,
        params.cliffAmount,
        params.cancelableBySender ?? true,
        params.cancelableByRecipient ?? false,
        params.automaticWithdrawal ?? false,
        params.transferableBySender ?? true,
        params.transferableByRecipient ?? false,
        params.canTopup ?? true,
        params.name,
        params.withdrawFrequency ?? 1,
        params.pausable ?? false,
        params.canUpdateRate ?? false
      )
      .accounts({
        sender: this.wallet.publicKey,
        recipient: params.recipient,
        metadata: streamId,
        escrowTokens: escrowTokenAccount,
        recipientTokens: await this.getAssociatedTokenAddress(params.tokenMint, params.recipient),
        senderTokens: await this.getAssociatedTokenAddress(params.tokenMint, this.wallet.publicKey),
        mint: params.tokenMint,
        rent: PublicKey.findProgramAddressSync([Buffer.from('rent')], this.program.programId)[0],
        timelock: PublicKey.findProgramAddressSync([Buffer.from('timelock')], this.program.programId)[0],
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
        systemProgram: PublicKey.default,
      })
      .signers([streamKeypair])
      .rpc()

    return { streamId, signature }
  }

  async withdrawFromStream(params: WithdrawParams): Promise<string> {
    const streamData = await this.getStream(params.streamId)
    
    const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), params.streamId.toBuffer()],
      this.program.programId
    )

    return await this.program.methods
      .withdrawStream(params.amount)
      .accounts({
        authority: this.wallet.publicKey,
        recipient: streamData.recipient,
        metadata: params.streamId,
        escrowTokens: escrowTokenAccount,
        recipientTokens: await this.getAssociatedTokenAddress(streamData.mint, streamData.recipient),
        mint: streamData.mint,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc()
  }

  async cancelStream(params: CancelStreamParams): Promise<string> {
    const streamData = await this.getStream(params.streamId)
    
    const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), params.streamId.toBuffer()],
      this.program.programId
    )

    return await this.program.methods
      .cancelStream()
      .accounts({
        authority: this.wallet.publicKey,
        sender: streamData.sender,
        recipient: streamData.recipient,
        metadata: params.streamId,
        escrowTokens: escrowTokenAccount,
        senderTokens: await this.getAssociatedTokenAddress(streamData.mint, streamData.sender),
        recipientTokens: await this.getAssociatedTokenAddress(streamData.mint, streamData.recipient),
        mint: streamData.mint,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc()
  }

  async topupStream(params: TopupStreamParams): Promise<string> {
    const streamData = await this.getStream(params.streamId)
    
    const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), params.streamId.toBuffer()],
      this.program.programId
    )

    return await this.program.methods
      .topupStream(params.amount)
      .accounts({
        sender: this.wallet.publicKey,
        metadata: params.streamId,
        escrowTokens: escrowTokenAccount,
        senderTokens: await this.getAssociatedTokenAddress(streamData.mint, this.wallet.publicKey),
        mint: streamData.mint,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc()
  }

  async transferStream(params: TransferStreamParams): Promise<string> {
    const streamData = await this.getStream(params.streamId)

    return await this.program.methods
      .transferStream()
      .accounts({
        authority: this.wallet.publicKey,
        newRecipient: params.newRecipient,
        metadata: params.streamId,
        mint: streamData.mint,
      })
      .rpc()
  }

  async pauseStream(params: PauseStreamParams): Promise<string> {
    return await this.program.methods
      .pauseStream()
      .accounts({
        authority: this.wallet.publicKey,
        metadata: params.streamId,
      })
      .rpc()
  }

  async resumeStream(streamId: PublicKey): Promise<string> {
    return await this.program.methods
      .resumeStream()
      .accounts({
        authority: this.wallet.publicKey,
        metadata: streamId,
      })
      .rpc()
  }

  async updateStream(params: UpdateStreamParams): Promise<string> {
    return await this.program.methods
      .updateStream(
        params.enableAutomaticWithdrawal ?? null,
        params.withdrawFrequency ?? null,
        params.amountPerPeriod ?? null
      )
      .accounts({
        authority: this.wallet.publicKey,
        metadata: params.streamId,
      })
      .rpc()
  }

  async getStream(streamId: PublicKey): Promise<StreamData> {
    const streamAccount = await this.program.account.stream.fetch(streamId)
    
    return {
      sender: streamAccount.sender,
      recipient: streamAccount.recipient,
      mint: streamAccount.mint,
      escrowTokens: streamAccount.escrowTokens,
      streamedAmount: streamAccount.streamedAmount.toNumber(),
      withdrawnAmount: streamAccount.withdrawnAmount.toNumber(),
      startTime: streamAccount.startTime.toNumber(),
      endTime: streamAccount.endTime.toNumber(),
      cliff: streamAccount.cliff.toNumber(),
      cliffAmount: streamAccount.cliffAmount.toNumber(),
      cancelableBySender: streamAccount.cancelableBySender,
      cancelableByRecipient: streamAccount.cancelableByRecipient,
      automaticWithdrawal: streamAccount.automaticWithdrawal,
      transferableBySender: streamAccount.transferableBySender,
      transferableByRecipient: streamAccount.transferableByRecipient,
      canTopup: streamAccount.canTopup,
      name: streamAccount.name,
      withdrawFrequency: streamAccount.withdrawFrequency.toNumber(),
      pausable: streamAccount.pausable,
      canUpdateRate: streamAccount.canUpdateRate,
      lastWithdrawnAt: streamAccount.lastWithdrawnAt.toNumber(),
      closedAt: streamAccount.closedAt.toNumber(),
    }
  }

  async getAllStreams(wallet?: PublicKey): Promise<{ publicKey: PublicKey; account: StreamData }[]> {
    const filters = wallet
      ? [
          {
            memcmp: {
              offset: 8,
              bytes: wallet.toBase58(),
            },
          },
        ]
      : []

    const streams = await this.program.account.stream.all(filters)
    
    return streams.map(stream => ({
      publicKey: stream.publicKey,
      account: {
        sender: stream.account.sender,
        recipient: stream.account.recipient,
        mint: stream.account.mint,
        escrowTokens: stream.account.escrowTokens,
        streamedAmount: stream.account.streamedAmount.toNumber(),
        withdrawnAmount: stream.account.withdrawnAmount.toNumber(),
        startTime: stream.account.startTime.toNumber(),
        endTime: stream.account.endTime.toNumber(),
        cliff: stream.account.cliff.toNumber(),
        cliffAmount: stream.account.cliffAmount.toNumber(),
        cancelableBySender: stream.account.cancelableBySender,
        cancelableByRecipient: stream.account.cancelableByRecipient,
        automaticWithdrawal: stream.account.automaticWithdrawal,
        transferableBySender: stream.account.transferableBySender,
        transferableByRecipient: stream.account.transferableByRecipient,
        canTopup: stream.account.canTopup,
        name: stream.account.name,
        withdrawFrequency: stream.account.withdrawFrequency.toNumber(),
        pausable: stream.account.pausable,
        canUpdateRate: stream.account.canUpdateRate,
        lastWithdrawnAt: stream.account.lastWithdrawnAt.toNumber(),
        closedAt: stream.account.closedAt.toNumber(),
      },
    }))
  }

  async getStreamableAmount(streamId: PublicKey): Promise<number> {
    const stream = await this.getStream(streamId)
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (currentTime < stream.startTime) {
      return 0
    }

    if (currentTime < stream.cliff) {
      return 0
    }

    const totalDuration = stream.endTime - stream.startTime
    const elapsedTime = Math.min(currentTime - stream.startTime, totalDuration)
    const totalStreamable = (elapsedTime / totalDuration) * stream.streamedAmount
    
    return Math.max(0, totalStreamable - stream.withdrawnAmount)
  }

  private async getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
    const [address] = PublicKey.findProgramAddressSync(
      [owner.toBuffer(), new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(), mint.toBuffer()],
      new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
    )
    return address
  }

  get programId(): PublicKey {
    return this.program.programId
  }

  get connection(): Connection {
    return this.connection
  }

  get walletPublicKey(): PublicKey {
    return this.wallet.publicKey
  }
}

export default AnchorClient
```