```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Plus, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Wallet, 
  TrendingUp,
  MoreHorizontal,
  Play,
  Pause,
  Square
} from 'lucide-react'

interface Stream {
  id: string
  name: string
  recipient: string
  recipientAvatar?: string
  sender: string
  senderAvatar?: string
  amount: number
  token: string
  tokenSymbol: string
  startDate: Date
  endDate: Date
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  streamedAmount: number
  remainingAmount: number
  flowRate: number
  type: 'outgoing' | 'incoming'
}

interface DashboardStats {
  totalStreaming: number
  totalReceiving: number
  activeStreams: number
  completedStreams: number
}

export default function StreamDashboard() {
  const [streams, setStreams] = useState<Stream[]>([])
  const [filteredStreams, setFilteredStreams] = useState<Stream[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [stats, setStats] = useState<DashboardStats>({
    totalStreaming: 0,
    totalReceiving: 0,
    activeStreams: 0,
    completedStreams: 0
  })

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockStreams: Stream[] = [
      {
        id: '1',
        name: 'Marketing Team Salary',
        recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        recipientAvatar: '/avatars/marketing.jpg',
        sender: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        senderAvatar: '/avatars/company.jpg',
        amount: 50000,
        token: 'USDC',
        tokenSymbol: 'USDC',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'active',
        streamedAmount: 25000,
        remainingAmount: 25000,
        flowRate: 137,
        type: 'outgoing'
      },
      {
        id: '2',
        name: 'Development Grant',
        recipient: '4vMsoUT2BWatFweudnQM1xedRLfJgJ7hswhcpz4xgBTy',
        sender: '8P8JdqldE7EFN7NxN2VA2BbhVoN5Ajxe27T8EHFoW2X2',
        senderAvatar: '/avatars/dao.jpg',
        amount: 100000,
        token: 'SOL',
        tokenSymbol: 'SOL',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-01'),
        status: 'active',
        streamedAmount: 60000,
        remainingAmount: 40000,
        flowRate: 555,
        type: 'incoming'
      },
      {
        id: '3',
        name: 'Advisor Compensation',
        recipient: '2WmzNHdNxbC6t4cy4phKXvQB42R61UR6fvNFDgePiKVk',
        recipientAvatar: '/avatars/advisor.jpg',
        sender: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        senderAvatar: '/avatars/company.jpg',
        amount: 25000,
        token: 'USDC',
        tokenSymbol: 'USDC',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-07-15'),
        status: 'completed',
        streamedAmount: 25000,
        remainingAmount: 0,
        flowRate: 0,
        type: 'outgoing'
      },
      {
        id: '4',
        name: 'Community Rewards',
        recipient: '6ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5',
        sender: '5Rs2eQtYK4CEaTHv6Bs75E2d1fNLFFZYBPiAfuLVgQYA',
        senderAvatar: '/avatars/community.jpg',
        amount: 75000,
        token: 'BONK',
        tokenSymbol: 'BONK',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-09-01'),
        status: 'paused',
        streamedAmount: 30000,
        remainingAmount: 45000,
        flowRate: 0,
        type: 'incoming'
      }
    ]

    setStreams(mockStreams)
    setFilteredStreams(mockStreams)

    // Calculate stats
    const newStats = mockStreams.reduce((acc, stream) => {
      if (stream.type === 'outgoing') {
        acc.totalStreaming += stream.amount
      } else {
        acc.totalReceiving += stream.amount
      }
      
      if (stream.status === 'active') {
        acc.activeStreams++
      } else if (stream.status === 'completed') {
        acc.completedStreams++
      }
      
      return acc
    }, {
      totalStreaming: 0,
      totalReceiving: 0,
      activeStreams: 0,
      completedStreams: 0
    })

    setStats(newStats)
  }, [])

  // Filter streams based on search and tab
  useEffect(() => {
    let filtered = streams

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(stream =>
        stream.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.token.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'outgoing') {
        filtered = filtered.filter(stream => stream.type === 'outgoing')
      } else if (activeTab === 'incoming') {
        filtered = filtered.filter(stream => stream.type === 'incoming')
      } else if (activeTab === 'active') {
        filtered = filtered.filter(stream => stream.status === 'active')
      } else if (activeTab === 'completed') {
        filtered = filtered.filter(stream => stream.status === 'completed')
      }
    }

    setFilteredStreams(filtered)
  }, [streams, searchQuery, activeTab])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const formatAmount = (amount: number, symbol: string) => {
    return `${amount.toLocaleString()} ${symbol}`
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

  const getProgressPercentage = (streamed: number, total: number) => {
    return (streamed / total) * 100
  }

  const handleStreamAction = (streamId: string, action: 'pause' | 'resume' | 'cancel') => {
    setStreams(prev => prev.map(stream => {
      if (stream.id === streamId) {
        switch (action) {
          case 'pause':
            return { ...stream, status: 'paused' as const }
          case 'resume':
            return { ...stream, status: 'active' as const }
          case 'cancel':
            return { ...stream, status: 'cancelled' as const }
          default:
            return stream
        }
      }
      return stream
    }))
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Stream Dashboard</h1>
            <p className="text-slate-400">Manage your token streams and vesting schedules</p>
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Stream
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Streaming</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${stats.totalStreaming.toLocaleString()}</div>
              <p className="text-xs text-slate-400">Outgoing payments</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Receiving</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${stats.totalReceiving.toLocaleString()}</div>
              <p className="text-xs text-slate-400">Incoming payments</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Streams</CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeStreams}</div>
              <p className="text-xs text-slate-400">Currently running</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.completedStreams}</div>
              <p className="text-xs text-slate-400">Finished streams</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search streams, addresses, or tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Streams Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-slate-700">
                <TabsTrigger value="all" className="data-[state=active]:bg-slate-600">All</TabsTrigger>
                <TabsTrigger value="outgoing" className="data-[state=active]:bg-slate-600">Outgoing</TabsTrigger>
                <TabsTrigger value="incoming" className="data-[state=active]:bg-slate-600">Incoming</TabsTrigger>
                <TabsTrigger value="active" className="data-[state=active]:bg-slate-600">Active</TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-slate-600">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStreams.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet