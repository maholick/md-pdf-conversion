'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, FileText, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export interface ConversionItem {
  id: string
  filename: string
  timestamp: Date
  status: 'processing' | 'completed' | 'failed'
  size?: number
  pdfId?: string
  error?: string
}

interface ConversionHistoryProps {
  items: ConversionItem[]
  onDownload: (pdfId: string, filename: string) => void
}

export function ConversionHistory({ items, onDownload }: ConversionHistoryProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  const getStatusIcon = (status: ConversionItem['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: ConversionItem['status']) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Processing</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-gray-500 text-center">
            No conversions yet.<br />
            <span className="text-sm">Your conversion history will appear here.</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Recent Conversions</CardTitle>
        <CardDescription>Click on completed files to download</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="px-6 pb-4 space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  item.status === 'completed' 
                    ? 'hover:bg-gray-50 cursor-pointer' 
                    : 'bg-gray-50/50'
                }`}
                onClick={() => {
                  if (item.status === 'completed' && item.pdfId) {
                    onDownload(item.pdfId, item.filename)
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{item.filename}</p>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.timestamp)}
                      </span>
                      {item.size && (
                        <span className="text-xs text-gray-500">
                          {formatFileSize(item.size)}
                        </span>
                      )}
                    </div>
                    {item.error && (
                      <p className="text-xs text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>
                </div>
                {item.status === 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (item.pdfId) {
                        onDownload(item.pdfId, item.filename)
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}