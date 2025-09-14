'use client'

import React, { useState } from 'react'
import { FileUpload } from '@/components/file-upload'
import { FileList, UploadedFile } from '@/components/file-list'
import { ConfigEditor, PandocConfig, EisvogelConfig } from '@/components/config-editor'
import { ConversionHistory, ConversionItem } from '@/components/conversion-history'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Settings, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Upload,
  History,
  FileDown
} from 'lucide-react'

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversionHistory, setConversionHistory] = useState<ConversionItem[]>([])
  
  const [pandocConfig, setPandocConfig] = useState<PandocConfig>({
    outputFile: 'output.pdf',
    tableOfContents: true,
    tocDepth: 2,
    numberSections: true,
    listings: true,
    referenceLinks: true
  })
  
  const [eisvogelConfig, setEisvogelConfig] = useState<EisvogelConfig>({
    title: 'Markdown to PDF',
    author: '',
    date: new Date().toISOString().split('T')[0],
    subject: '',
    keywords: [],
    subtitle: '',
    lang: 'en',
    titlepage: true,
    fontsize: '11pt',
    mainfont: undefined
  })

  const handleFilesAdded = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file
    }))
    setFiles(prev => [...prev, ...uploadedFiles])
    setError(null)
  }

  const handleReorder = (reorderedFiles: UploadedFile[]) => {
    setFiles(reorderedFiles)
  }

  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleClearAll = () => {
    setFiles([])
    setError(null)
  }

  const handleConvert = async () => {
    if (files.length === 0) {
      setError('Please upload at least one markdown file')
      return
    }

    setIsConverting(true)
    setError(null)

    // Add processing item to history
    const historyItem: ConversionItem = {
      id: Date.now().toString(),
      filename: pandocConfig.outputFile || 'output.pdf',
      timestamp: new Date(),
      status: 'processing'
    }
    setConversionHistory(prev => [historyItem, ...prev])

    try {
      const formData = new FormData()
      
      // Add files in order
      files.forEach(f => {
        formData.append('files', f.file)
      })
      
      // Add configurations
      formData.append('pandocConfig', JSON.stringify(pandocConfig))
      formData.append('eisvogelConfig', JSON.stringify(eisvogelConfig))

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Conversion failed')
      }

      const result = await response.json()
      
      // Update history item with success
      setConversionHistory(prev => 
        prev.map(item => 
          item.id === historyItem.id 
            ? { 
                ...item, 
                status: 'completed', 
                pdfId: result.pdfId,
                size: result.size 
              }
            : item
        )
      )
      
      // Clear files after successful conversion
      setFiles([])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during conversion'
      setError(errorMessage)
      
      // Update history item with failure
      setConversionHistory(prev => 
        prev.map(item => 
          item.id === historyItem.id 
            ? { ...item, status: 'failed', error: errorMessage }
            : item
        )
      )
    } finally {
      setIsConverting(false)
    }
  }

  const handleDownload = async (pdfId: string, filename: string) => {
    try {
      const response = await fetch(`/api/download/${pdfId}?filename=${encodeURIComponent(filename)}`)
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Failed to download file')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PDF Converter</h1>
                <p className="text-sm text-gray-600">Powered by Pandoc & Eisvogel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Docker Connected
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Upload and Files */}
          <div className="xl:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Files
                </CardTitle>
                <CardDescription>
                  Drag and drop your markdown files or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFilesAdded={handleFilesAdded} />
              </CardContent>
            </Card>

            {/* Files List */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Files to Convert
                      </CardTitle>
                      <CardDescription>
                        {files.length} file{files.length !== 1 && 's'} ready for conversion
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAll}
                      >
                        Clear All
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleConvert}
                        disabled={isConverting}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        {isConverting ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          <>
                            <FileDown className="mr-2 h-3 w-3" />
                            Convert to PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FileList
                    files={files}
                    onReorder={handleReorder}
                    onRemove={handleRemove}
                  />
                </CardContent>
              </Card>
            )}

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuration
                </CardTitle>
                <CardDescription>
                  Customize your PDF output settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConfigEditor
                  pandocConfig={pandocConfig}
                  eisvogelConfig={eisvogelConfig}
                  onPandocChange={setPandocConfig}
                  onEisvogelChange={setEisvogelConfig}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - History */}
          <div className="xl:col-span-1">
            <div className="sticky top-24">
              <div className="mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Conversion History</h2>
              </div>
              <ConversionHistory 
                items={conversionHistory}
                onDownload={handleDownload}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}