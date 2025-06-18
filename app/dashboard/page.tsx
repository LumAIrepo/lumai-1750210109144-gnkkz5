```tsx
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Wallet, 
  TrendingUp, 
  Users, 
  Calendar,
  Plus,
  Eye,
  Settings,
  ChevronRight
} from 'lucide-react'

interface StreamData {
  id: string
  recipient: string
  amount: number
  token: string
  startDate: string
  endDate: string
  claimed: number
  status: 'active' | 'completed' | 'cancelled'
  type: 'vesting' | 'streaming'
}

interface TreasuryData {
  totalValue: number
  tokens: Array<{
    symbol: string
    amount: number
    value: number
    change24h: number
  }>
}

const mockStreams: StreamData[] = [
  {
    id: '1',
    recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    amount: 10000,
    token: 'USDC',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    claimed: 3500,
    status: 'active',
    type: 'vesting'
  },
  {
    id: '2',
    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    amount: 50000,
    token: 'SOL',
    startDate: '2024-02-15',
    endDate: '2025-02-15',
    claimed: 12500,
    status: 'active',
    type: 'streaming'
  },
  {
    id: '3',
    recipient: '4vMsoUT2BWatFweudnQM1xedRLfJgJ7hswhcpz4xgBTy',
    amount: 25000,
    token: 'USDT',
    startDate: '2023-06-01',
    endDate: '2024-06-01',
    claimed: 25000,
    status: 'completed',
    type: 'vesting'
  }
]

const mockTreasury: TreasuryData = {
  totalValue: 2847392.50,
  tokens: [
    { symbol: 'SOL', amount: 15420.5, value: 1847392.50, change24h: 5.2 },
    { symbol: 'USDC', amount: 850000, value: 850000, change24h: 0.1 },
    { symbol: 'USDT', amount: 150000, value: 150000, change24h: -0.05 }
  ]
}

function DashboardStats() {
  const totalStreaming = mockStreams.reduce((acc, stream) => acc + stream.amount, 0)
  const totalClaimed = mockStreams.reduce((acc, stream) => acc + stream.claimed, 0)
  const activeStreams = mockStreams.filter(stream => stream.status === 'active').length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Total Streaming</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${totalStreaming.toLocaleString()}</div>
          <p className="text-xs text-slate-400">+12.5% from last month</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Total Claimed</CardTitle>
          <Wallet className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${totalClaimed.toLocaleString()}</div>
          <p className="text-xs text-slate-400">+8.2% from last month</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Active Streams</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{activeStreams}</div>
          <p className="text-xs text-slate-400">2 ending this month</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Treasury Value</CardTitle>
          <Users className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${mockTreasury.totalValue.toLocaleString()}</div>
          <p className="text-xs text-slate-400">+3.1% from last week</p>
        </CardContent>
      </Card>
    </div>
  )
}

function StreamsList() {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Recent Streams</CardTitle>
            <CardDescription className="text-slate-400">
              Your latest streaming and vesting contracts
            </CardDescription>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Stream
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockStreams.map((stream) => (
            <div key={stream.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border border-slate-600">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-slate-600 text-slate-200">
                    {stream.token.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-white">
                      {stream.recipient.slice(0, 8)}...{stream.recipient.slice(-8)}
                    </p>
                    <Badge 
                      variant={stream.status === 'active' ? 'default' : stream.status === 'completed' ? 'secondary' : 'destructive'}
                      className={
                        stream.status === 'active' 
                          ? 'bg-green-600 text-white' 
                          : stream.status === 'completed'
                          ? 'bg-slate-600 text-slate-200'
                          : 'bg-red-600 text-white'
                      }
                    >
                      {stream.status}
                    </Badge>
                    <Badge variant="outline" className="border-slate-500 text-slate-300">
                      {stream.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(stream.startDate).toLocaleDateString()} - {new Date(stream.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {stream.amount.toLocaleString()} {stream.token}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress 
                    value={(stream.claimed / stream.amount) * 100} 
                    className="w-20 h-2"
                  />
                  <span className="text-xs text-slate-400">
                    {Math.round((stream.claimed / stream.amount) * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Settings className="h-4 w-4" />
                </Button>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TreasuryOverview() {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Treasury Overview</CardTitle>
        <CardDescription className="text-slate-400">
          Your organization's token holdings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-2xl font-bold text-white">
            ${mockTreasury.totalValue.toLocaleString()}
          </div>
          <div className="space-y-3">
            {mockTreasury.tokens.map((token) => (
              <div key={token.symbol} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-600 text-slate-200 text-xs">
                      {token.symbol.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">{token.symbol}</p>
                    <p className="text-xs text-slate-400">{token.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    ${token.value.toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-1">
                    {token.change24h > 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownLeft className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${token.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(token.change24h)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivity() {
  const activities = [
    {
      id: '1',
      type: 'claim',
      description: 'Claimed 1,250 USDC from vesting contract',
      timestamp: '2 hours ago',
      amount: '1,250 USDC'
    },
    {
      id: '2',
      type: 'create',
      description: 'Created new streaming contract',
      timestamp: '1 day ago',
      amount: '50,000 SOL'
    },
    {
      id: '3',
      type: 'complete',
      description: 'Vesting contract completed',
      timestamp: '3 days ago',
      amount: '25,000 USDT'
    }
  ]

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
        <CardDescription className="text-slate-400">
          Latest transactions and events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.type === 'claim' ? 'bg-green-500' :
                activity.type === 'create' ? 'bg-blue-500' :
                'bg-purple-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{activity.description}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-400">{activity.timestamp}</p>
                  <p className="text-xs font-medium text-slate-300">{activity.amount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
        <CardDescription className="text-slate-400">
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white h-auto p-4 flex-col space-y-2">
            <Plus className="h-5 w-5" />
            <span className="text-sm">Create Stream</span>
          </Button>
          <Button variant="outline" className="border-slate-600 text-slate-200