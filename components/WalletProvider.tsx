```tsx
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { WalletAdapter, WalletError } from '@solana/wallet-adapter-base'
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  SlopeWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { toast } from 'sonner'

require('@solana/wallet-adapter-react-ui/styles.css')

interface WalletContextType {
  connected: boolean
  connecting: boolean
  publicKey: PublicKey | null
  wallet: WalletAdapter | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>
  sendTransaction: (transaction: Transaction) => Promise<string>
  balance: number | null
  refreshBalance: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
  network?: 'mainnet-beta' | 'testnet' | 'devnet'
  autoConnect?: boolean
}

const WalletProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { connection } = useConnection()
  const {
    publicKey,
    connected,
    connecting,
    wallet,
    connect: walletConnect,
    disconnect: walletDisconnect,
    signTransaction,
    signAllTransactions,
    sendTransaction: walletSendTransaction,
  } = useWallet()

  const [balance, setBalance] = useState<number | null>(null)

  const connect = async () => {
    try {
      await walletConnect()
      toast.success('Wallet connected successfully')
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast.error('Failed to connect wallet')
      throw error
    }
  }

  const disconnect = async () => {
    try {
      await walletDisconnect()
      setBalance(null)
      toast.success('Wallet disconnected')
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      toast.error('Failed to disconnect wallet')
      throw error
    }
  }

  const sendTransaction = async (transaction: Transaction): Promise<string> => {
    try {
      const signature = await walletSendTransaction(transaction, connection)
      toast.success('Transaction sent successfully')
      return signature
    } catch (error) {
      console.error('Failed to send transaction:', error)
      toast.error('Failed to send transaction')
      throw error
    }
  }

  const refreshBalance = async () => {
    if (!publicKey || !connection) {
      setBalance(null)
      return
    }

    try {
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / 1e9) // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      setBalance(null)
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance()
      
      // Set up balance refresh interval
      const interval = setInterval(refreshBalance, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    } else {
      setBalance(null)
    }
  }, [connected, publicKey, connection])

  const contextValue: WalletContextType = {
    connected,
    connecting,
    publicKey,
    wallet,
    connect,
    disconnect,
    signTransaction: signTransaction!,
    signAllTransactions: signAllTransactions!,
    sendTransaction,
    balance,
    refreshBalance,
  }

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  network = 'mainnet-beta',
  autoConnect = true,
}) => {
  const endpoint = React.useMemo(() => {
    if (network === 'mainnet-beta') {
      return process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl('mainnet-beta')
    }
    return clusterApiUrl(network)
  }, [network])

  const wallets = React.useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SlopeWalletAdapter(),
    ],
    []
  )

  const onError = React.useCallback((error: WalletError) => {
    console.error('Wallet error:', error)
    toast.error(`Wallet error: ${error.message}`)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider
        wallets={wallets}
        onError={onError}
        autoConnect={autoConnect}
      >
        <WalletModalProvider>
          <WalletProviderInner>
            {children}
          </WalletProviderInner>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider')
  }
  return context
}

export const useWalletBalance = () => {
  const { balance, refreshBalance } = useWalletContext()
  return { balance, refreshBalance }
}

export const useWalletConnection = () => {
  const { connected, connecting, connect, disconnect, publicKey } = useWalletContext()
  return { connected, connecting, connect, disconnect, publicKey }
}

export const useWalletTransactions = () => {
  const { signTransaction, signAllTransactions, sendTransaction } = useWalletContext()
  return { signTransaction, signAllTransactions, sendTransaction }
}
```