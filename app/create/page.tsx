```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, InfoIcon, ArrowLeftIcon, WalletIcon, ClockIcon, CoinsIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface StreamFormData {
  recipient: string
  tokenAddress: string
  totalAmount: string
  streamName: string
  description: string
  startDate: Date | undefined
  endDate: Date | undefined
  cliffDate: Date | undefined
  releaseFrequency: string
  cancelable: boolean
  transferable: boolean
  automaticWithdrawal: boolean
}

export default function CreateStreamPage() {
  const [formData, setFormData] = useState<StreamFormData>({
    recipient: '',
    tokenAddress: '',
    totalAmount: '',
    streamName: '',
    description: '',
    startDate: undefined,
    endDate: undefined,
    cliffDate: undefined,
    releaseFrequency: 'second',
    cancelable: true,
    transferable: false,
    automaticWithdrawal: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const handleInputChange = (field: keyof StreamFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const calculateStreamRate = () => {
    if (!formData.totalAmount || !formData.startDate || !formData.endDate) return '0'
    
    const total = parseFloat(formData.totalAmount)
    const duration = formData.endDate.getTime() - formData.startDate.getTime()
    const seconds = duration / 1000
    
    return (total / seconds).toFixed(8)
  }

  const calculateDuration = () => {
    if (!formData.startDate || !formData.endDate) return '0 days'
    
    const duration = formData.endDate.getTime() - formData.startDate.getTime()
    const days = Math.floor(duration / (1000 * 60 * 60 * 24))
    const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days} days ${hours > 0 ? `${hours} hours` : ''}`
    }
    return `${hours} hours`
  }

  const handleCreateStream = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('Creating stream with data:', formData)
      // Redirect to success page or stream details
    } catch (error) {
      console.error('Error creating stream:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = () => {
    return (
      formData.recipient &&
      formData.tokenAddress &&
      formData.totalAmount &&
      formData.streamName &&
      formData.startDate &&
      formData.endDate &&
      formData.startDate < formData.endDate
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Stream</h1>
            <p className="text-slate-400 mt-1">Set up a new token stream with custom vesting schedule</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    currentStep >= step
                      ? "bg-blue-500 text-white"
                      : "bg-slate-700 text-slate-400"
                  )}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={cn(
                      "w-16 h-0.5 mx-2",
                      currentStep > step ? "bg-blue-500" : "bg-slate-700"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <WalletIcon className="h-5 w-5 text-blue-500" />
                    Basic Information
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure the recipient and token details for your stream
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="streamName" className="text-slate-200">Stream Name</Label>
                    <Input
                      id="streamName"
                      placeholder="e.g., Team Vesting Q1 2024"
                      value={formData.streamName}
                      onChange={(e) => handleInputChange('streamName', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-200">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add a description for this stream..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipient" className="text-slate-200">Recipient Wallet Address</Label>
                    <Input
                      id="recipient"
                      placeholder="Enter Solana wallet address"
                      value={formData.recipient}
                      onChange={(e) => handleInputChange('recipient', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tokenAddress" className="text-slate-200">Token Address</Label>
                      <Input
                        id="tokenAddress"
                        placeholder="Token mint address"
                        value={formData.tokenAddress}
                        onChange={(e) => handleInputChange('tokenAddress', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="totalAmount" className="text-slate-200">Total Amount</Label>
                      <Input
                        id="totalAmount"
                        type="number"
                        placeholder="0.00"
                        value={formData.totalAmount}
                        onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      disabled={!formData.streamName || !formData.recipient || !formData.tokenAddress || !formData.totalAmount}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Continue to Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Schedule Configuration */}
            {currentStep === 2 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-blue-500" />
                    Vesting Schedule
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Set up the timing and release schedule for your stream
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
                              !formData.startDate && "text-slate-400"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                          <Calendar
                            mode="single"
                            selected={formData.startDate}
                            onSelect={(date) => handleInputChange('startDate', date)}
                            initialFocus
                            className="text-white"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
                              !formData.endDate && "text-slate-400"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                          <Calendar
                            mode="single"
                            selected={formData.endDate}
                            onSelect={(date) => handleInputChange('endDate', date)}
                            initialFocus
                            className="text-white"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Cliff Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
                            !formData.cliffDate && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.cliffDate ? format(formData.cliffDate, "PPP") : "No cliff period"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                        <Calendar
                          mode="single"
                          selected={formData.cliffDate}
                          onSelect={(date) => handleInputChange('cliffDate', date)}
                          initialFocus
                          className="text-white"
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-slate-400">
                      Tokens will be locked until this date, then released according to the schedule
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Release Frequency</Label>
                    <Select value={formData.releaseFrequency} onValueChange={(value) => handleInputChange('releaseFrequency', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="second" className="text-white">Every Second (Linear)</SelectItem>
                        <SelectItem value="minute" className="text-white">Every Minute</SelectItem>
                        <SelectItem value="hour" className="text-white">Every Hour</SelectItem>
                        <SelectItem value="day" className="text-white">Daily</SelectItem>
                        <SelectItem value="week" className="text-white">Weekly</SelectItem>
                        <SelectItem value="month" className="text-white">Monthly