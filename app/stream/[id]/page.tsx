```tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, DollarSign, Users, Wallet, TrendingUp, Pause, Play, Settings, ExternalLink, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import StreamChart from '@/components/stream-chart'
import StreamActions from '@/components/stream-actions'
import TransactionHistory from '@/components/transaction-history'
import StreamMetrics from '@/components/stream-metrics'

interface StreamPageProps {
  params: Promise<{ id: string }>
}

// Mock data - replace with actual API calls
const getStreamData = async (id: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (id === 'invalid') {
    return null
  }

  return {
    id,
    name: 'Employee Salary Stream',
    description: 'Monthly salary payment stream for John Doe',
    status: 'active' as const,
    token: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      image: '/tokens/usdc.png'
    },
    sender: {
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      name: 'Acme Corp',
      avatar: '/avatars/acme.png'
    },
    recipient: {
      address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      name: 'John Doe',
      avatar: '/avatars/john.png'
    },
    totalAmount: '120000000000', // 120,000 USDC
    withdrawnAmount: '45000000000', // 45,000 USDC
    remainingAmount: '75000000000', // 75,000 USDC
    startTime: new Date('2024-01-01T00:00:00Z'),
    endTime: new Date('2024-12-31T23:59:59Z'),
    cliffTime: new Date('2024-03-01T00:00:00Z'),
    releaseFrequency: 86400, // 1 day in seconds
    lastWithdrawal: new Date('2024-01-15T10:30:00Z'),
    nextWithdrawal: new Date('2024-01-16T10:30:00Z'),
    createdAt: new Date('2023-12-15T14:20:00Z'),
    canWithdraw: true,
    canPause: true,
    canCancel: false,
    isPaused: false,
    isCancelled: false,
    withdrawalFee: '0.1', // 0.1%
    category: 'salary',
    tags: ['employee', 'monthly', 'vesting']
  }
}

const formatAmount = (amount: string, decimals: number = 6) => {
  const num = parseInt(amount) / Math.pow(10, decimals)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

const formatAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

const getStatusColor = (status: string) => {
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

const calculateProgress = (withdrawn: string, total: string) => {
  const withdrawnNum = parseInt(withdrawn)
  const totalNum = parseInt(total)
  return (withdrawnNum / totalNum) * 100
}

const calculateTimeProgress = (start: Date, end: Date, current: Date = new Date()) => {
  const totalDuration = end.getTime() - start.getTime()
  const elapsed = current.getTime() - start.getTime()
  return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100)
}

async function StreamDetailContent({ id }: { id: string }) {
  const stream = await getStreamData(id)

  if (!stream) {
    notFound()
  }

  const progress = calculateProgress(stream.withdrawnAmount, stream.totalAmount)
  const timeProgress = calculateTimeProgress(stream.startTime, stream.endTime)
  const isCliffPeriod = new Date() < stream.cliffTime

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="h-6 w-px bg-slate-700" />
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Stream</span>
            <span>/</span>
            <span className="text-white">{formatAddress(stream.id)}</span>
          </div>
        </div>

        {/* Stream Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-white">{stream.name}</h1>
                      <Badge className={getStatusColor(stream.status)}>
                        {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-slate-400">{stream.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {stream.createdAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Duration: {Math.ceil((stream.endTime.getTime() - stream.startTime.getTime()) / (1000 * 60 * 60 * 24))} days</span>
                      </div>
                    </div>
                  </div>
                  <StreamActions stream={stream} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Stream Progress</span>
                    <span className="text-sm text-slate-400">{progress.toFixed(1)}% completed</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-slate-700" />
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Total Amount</p>
                      <p className="font-semibold text-white">
                        {formatAmount(stream.totalAmount, stream.token.decimals)} {stream.token.symbol}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Withdrawn</p>
                      <p className="font-semibold text-green-400">
                        {formatAmount(stream.withdrawnAmount, stream.token.decimals)} {stream.token.symbol}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Remaining</p>
                      <p className="font-semibold text-blue-400">
                        {formatAmount(stream.remainingAmount, stream.token.decimals)} {stream.token.symbol}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Time Progress */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Time Progress</span>
                    <span className="text-sm text-slate-400">{timeProgress.toFixed(1)}% elapsed</span>
                  </div>
                  <Progress value={timeProgress} className="h-2 bg-slate-700" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Start Date</p>
                      <p className="font-semibold text-white">{stream.startTime.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">End Date</p>
                      <p className="font-semibold text-white">{stream.endTime.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Cliff Period Alert */}
                {isCliffPeriod && (
                  <Alert className="bg-yellow-500/10 border-yellow-500/20">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-400">
                      This stream is in cliff period until {stream.cliffTime.toLocaleDateString()}. 
                      No withdrawals are available during this time.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Token Info */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Token Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={stream.token.image} alt={stream.token.symbol} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {stream.token.symbol.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-white">{stream.token.name}</p>
                    <p className="text-sm text-slate-400">{stream.token.symbol}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contract</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white">{formatAddress(stream.token.address)}</span>
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Decimals</span>
                    <span className="text-white">{stream.token.decimals}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Participants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Sender</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={stream.sender.avatar} alt={stream.sender.name} />
                        <AvatarFallback className="bg-slate-700 text-white text-xs">
                          {stream.sender.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{stream.sender.name}</p>
                        <p className="text-xs text-slate-400">{formatAddress(stream.sender.address)}</p>
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-slate-700" />
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Recipient</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={stream.recipient.avatar} alt={stream.recipient.name} />
                        <AvatarFallback className="bg-slate-700 text-white text-xs">
                          {stream.recipient.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="