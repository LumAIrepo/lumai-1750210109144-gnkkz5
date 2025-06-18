```tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Coins, Clock, TrendingUp, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Stream {
  id: string
  name: string
  token: {
    symbol: string
    decimals: number
    mint: string
  }
  totalAmount: number
  withdrawnAmount: number
  availableAmount: number
  recipient: string
  sender: string
  startTime: number
  endTime: number
  cliffTime?: number
  status: 'active' | 'paused' | 'completed' | 'cancelled'
}

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  stream: Stream | null
  onWithdraw: (streamId: string, amount: number) => Promise<void>
  isLoading?: boolean
}

export default function WithdrawModal({
  isOpen,
  onClose,
  stream,
  onWithdraw,
  isLoading = false
}: WithdrawModalProps) {
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [error, setError] = useState('')

  if (!stream) return null

  const handleAmountChange = (value: string) => {
    setError('')
    
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value)
      
      const numValue = parseFloat(value)
      if (numValue > stream.availableAmount) {
        setError(`Amount exceeds available balance of ${stream.availableAmount.toLocaleString()} ${stream.token.symbol}`)
      }
    }
  }

  const handleMaxClick = () => {
    setWithdrawAmount(stream.availableAmount.toString())
    setError('')
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    if (amount > stream.availableAmount) {
      setError(`Amount exceeds available balance`)
      return
    }

    try {
      await onWithdraw(stream.id, amount)
      setWithdrawAmount('')
      setError('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw')
    }
  }

  const handleClose = () => {
    setWithdrawAmount('')
    setError('')
    onClose()
  }

  const progressPercentage = ((stream.totalAmount - (stream.totalAmount - stream.withdrawnAmount - stream.availableAmount)) / stream.totalAmount) * 100

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold">Withdraw Tokens</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stream Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Stream</span>
              <span className="font-medium">{stream.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Token</span>
              <Badge variant="secondary" className="bg-slate-800 text-slate-200">
                {stream.token.symbol}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Status</span>
              <Badge 
                variant={stream.status === 'active' ? 'default' : 'secondary'}
                className={
                  stream.status === 'active' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-slate-700'
                }
              >
                {stream.status}
              </Badge>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Balance Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Coins className="h-4 w-4 text-blue-500" />
              Balance Overview
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-slate-400">Available</span>
                <div className="font-semibold text-green-400">
                  {stream.availableAmount.toLocaleString()} {stream.token.symbol}
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-slate-400">Withdrawn</span>
                <div className="font-semibold">
                  {stream.withdrawnAmount.toLocaleString()} {stream.token.symbol}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Withdraw Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount" className="text-sm font-medium">
                Withdraw Amount
              </Label>
              <div className="relative">
                <Input
                  id="withdraw-amount"
                  type="text"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 pr-16"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleMaxClick}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                  disabled={isLoading}
                >
                  MAX
                </Button>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Available: {stream.availableAmount.toLocaleString()} {stream.token.symbol}</span>
              </div>
            </div>

            {error && (
              <Alert className="bg-red-900/20 border-red-800">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Transaction Info */}
            {withdrawAmount && !error && parseFloat(withdrawAmount) > 0 && (
              <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <TrendingUp className="h-4 w-4" />
                  Transaction Summary
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">You will receive</span>
                    <span className="font-medium">
                      {parseFloat(withdrawAmount).toLocaleString()} {stream.token.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Remaining available</span>
                    <span className="font-medium">
                      {(stream.availableAmount - parseFloat(withdrawAmount)).toLocaleString()} {stream.token.symbol}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={
                !withdrawAmount || 
                parseFloat(withdrawAmount) <= 0 || 
                parseFloat(withdrawAmount) > stream.availableAmount ||
                isLoading ||
                !!error
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                'Withdraw'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```