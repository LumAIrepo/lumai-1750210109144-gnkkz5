```tsx
'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  User, 
  ArrowRight,
  Pause,
  Play,
  Settings
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface StreamCardProps {
  id: string
  title: string
  recipient: {
    address: string
    name?: string
    avatar?: string
  }
  sender: {
    address: string
    name?: string
    avatar?: string
  }
  token: {
    symbol: string
    decimals: number
    mint: string
  }
  totalAmount: number
  streamedAmount: number
  remainingAmount: number
  startTime: Date
  endTime: Date
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  streamRate: number
  isRecipient?: boolean
  onPause?: () => void
  onResume?: () => void
  onCancel?: () => void
  onWithdraw?: () => void
  onViewDetails?: () => void
}

export default function StreamCard({
  id,
  title,
  recipient,
  sender,
  token,
  totalAmount,
  streamedAmount,
  remainingAmount,
  startTime,
  endTime,
  status,
  streamRate,
  isRecipient = false,
  onPause,
  onResume,
  onCancel,
  onWithdraw,
  onViewDetails
}: StreamCardProps) {
  const progressPercentage = (streamedAmount / totalAmount) * 100
  const isActive = status === 'active'
  const isPaused = status === 'paused'
  const isCompleted = status === 'completed'
  const isCancelled = status === 'cancelled'

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'completed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const timeRemaining = isActive ? formatDistanceToNow(endTime, { addSuffix: true }) : null

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-100 text-lg">{title}</h3>
            <Badge className={`text-xs ${getStatusColor()}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="text-slate-400 hover:text-slate-100"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-slate-400">From:</span>
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={sender.avatar} />
                <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                  {sender.name?.[0] || sender.address[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-slate-300">
                {sender.name || formatAddress(sender.address)}
              </span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500" />
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">To:</span>
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={recipient.avatar} />
                <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                  {recipient.name?.[0] || recipient.address[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-slate-300">
                {recipient.name || formatAddress(recipient.address)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-slate-300">{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-slate-700"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-slate-400 text-xs">
              <DollarSign className="h-3 w-3" />
              <span>Streamed</span>
            </div>
            <p className="text-slate-100 font-medium">
              {formatAmount(streamedAmount)} {token.symbol}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-slate-400 text-xs">
              <DollarSign className="h-3 w-3" />
              <span>Remaining</span>
            </div>
            <p className="text-slate-100 font-medium">
              {formatAmount(remainingAmount)} {token.symbol}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-slate-400">
              <Calendar className="h-3 w-3" />
              <span>Start Date</span>
            </div>
            <p className="text-slate-300">{format(startTime, 'MMM dd, yyyy')}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-slate-400">
              <Calendar className="h-3 w-3" />
              <span>End Date</span>
            </div>
            <p className="text-slate-300">{format(endTime, 'MMM dd, yyyy')}</p>
          </div>
        </div>

        {timeRemaining && (
          <div className="flex items-center space-x-1 text-xs">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-slate-400">Ends {timeRemaining}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <div className="text-xs text-slate-400">
            Rate: {formatAmount(streamRate)} {token.symbol}/sec
          </div>
          
          <div className="flex space-x-2">
            {isRecipient && streamedAmount > 0 && (
              <Button
                size="sm"
                onClick={onWithdraw}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Withdraw
              </Button>
            )}
            
            {!isRecipient && (
              <>
                {isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onPause}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                )}
                
                {isPaused && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onResume}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Resume
                  </Button>
                )}
                
                {(isActive || isPaused) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onCancel}
                    className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                  >
                    Cancel
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```