```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StreamData {
  id: string
  recipient: string
  amount: number
  streamed: number
  remaining: number
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'cancelled'
  token: string
}

interface AnalyticsData {
  totalStreams: number
  totalValue: number
  activeStreams: number
  completedStreams: number
  totalRecipients: number
  averageStreamSize: number
  monthlyGrowth: number
  weeklyVolume: number
}

interface ChartData {
  date: string
  volume: number
  streams: number
  recipients: number
}

interface TokenDistribution {
  token: string
  value: number
  percentage: number
  color: string
}

const mockStreamData: StreamData[] = [
  {
    id: '1',
    recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    amount: 50000,
    streamed: 32500,
    remaining: 17500,
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    status: 'active',
    token: 'SOL'
  },
  {
    id: '2',
    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    amount: 25000,
    streamed: 25000,
    remaining: 0,
    startDate: '2024-02-01',
    endDate: '2024-04-01',
    status: 'completed',
    token: 'USDC'
  },
  {
    id: '3',
    recipient: '4vMsoUT2BWatFweudnQM1xedRLfJgJ7hswhcpz4xgBTy',
    amount: 75000,
    streamed: 45000,
    remaining: 30000,
    startDate: '2024-03-01',
    endDate: '2024-09-01',
    status: 'active',
    token: 'SOL'
  }
]

const mockChartData: ChartData[] = [
  { date: '2024-01', volume: 125000, streams: 15, recipients: 12 },
  { date: '2024-02', volume: 180000, streams: 22, recipients: 18 },
  { date: '2024-03', volume: 245000, streams: 31, recipients: 25 },
  { date: '2024-04', volume: 320000, streams: 28, recipients: 22 },
  { date: '2024-05', volume: 410000, streams: 35, recipients: 28 },
  { date: '2024-06', volume: 485000, streams: 42, recipients: 34 }
]

const tokenColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function StreamAnalytics() {
  const [timeRange, setTimeRange] = useState('30d')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalStreams: 0,
    totalValue: 0,
    activeStreams: 0,
    completedStreams: 0,
    totalRecipients: 0,
    averageStreamSize: 0,
    monthlyGrowth: 0,
    weeklyVolume: 0
  })

  const [tokenDistribution, setTokenDistribution] = useState<TokenDistribution[]>([])

  useEffect(() => {
    // Calculate analytics from mock data
    const totalStreams = mockStreamData.length
    const totalValue = mockStreamData.reduce((sum, stream) => sum + stream.amount, 0)
    const activeStreams = mockStreamData.filter(s => s.status === 'active').length
    const completedStreams = mockStreamData.filter(s => s.status === 'completed').length
    const uniqueRecipients = new Set(mockStreamData.map(s => s.recipient)).size
    const averageStreamSize = totalValue / totalStreams
    const monthlyGrowth = 24.5
    const weeklyVolume = 125000

    setAnalyticsData({
      totalStreams,
      totalValue,
      activeStreams,
      completedStreams,
      totalRecipients: uniqueRecipients,
      averageStreamSize,
      monthlyGrowth,
      weeklyVolume
    })

    // Calculate token distribution
    const tokenTotals = mockStreamData.reduce((acc, stream) => {
      acc[stream.token] = (acc[stream.token] || 0) + stream.amount
      return acc
    }, {} as Record<string, number>)

    const distribution = Object.entries(tokenTotals).map(([token, value], index) => ({
      token,
      value,
      percentage: (value / totalValue) * 100,
      color: tokenColors[index % tokenColors.length]
    }))

    setTokenDistribution(distribution)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: { 
    title: string
    value: number
    change?: number
    icon: any
    format?: 'number' | 'currency' | 'percentage'
  }) => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">
          {format === 'currency' && formatCurrency(value)}
          {format === 'number' && formatNumber(value)}
          {format === 'percentage' && `${value.toFixed(1)}%`}
        </div>
        {change !== undefined && (
          <p className="text-xs text-slate-400 flex items-center mt-1">
            {change > 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={change > 0 ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="ml-1">from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 p-6 bg-slate-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Stream Analytics</h1>
          <p className="text-slate-400 mt-1">Monitor your streaming performance and insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="7d" className="text-white">7 days</SelectItem>
            <SelectItem value="30d" className="text-white">30 days</SelectItem>
            <SelectItem value="90d" className="text-white">90 days</SelectItem>
            <SelectItem value="1y" className="text-white">1 year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Value Streamed"
          value={analyticsData.totalValue}
          change={analyticsData.monthlyGrowth}
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          title="Active Streams"
          value={analyticsData.activeStreams}
          change={12.5}
          icon={Zap}
        />
        <StatCard
          title="Total Recipients"
          value={analyticsData.totalRecipients}
          change={8.2}
          icon={Users}
        />
        <StatCard
          title="Average Stream Size"
          value={analyticsData.averageStreamSize}
          change={-3.1}
          icon={TrendingUp}
          format="currency"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="volume" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Volume
          </TabsTrigger>
          <TabsTrigger value="tokens" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Token Distribution
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Streaming Volume Trend</CardTitle>
                <CardDescription className="text-slate-400">
                  Monthly streaming volume over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Stream Activity</CardTitle>
                <CardDescription className="text-slate-400">
                  Number of active streams and recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="streams" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Streams"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="recipients" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Recipients"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Streams */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Streams</CardTitle>
              <CardDescription className="text-slate-400">
                Latest streaming activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockStreamData.map((stream) => (
                  <div key={stream.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {stream.recipient.slice(0, 8)}...{stream.recipient.slice(-8)}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {formatCurrency(stream.amount)} {stream.token}
                        </p>
                      </div>