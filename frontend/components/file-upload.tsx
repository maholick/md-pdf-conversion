'use client'

import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card } from '@/components/ui/card'
import { Upload, FileText } from 'lucide-react'

interface FileUploadProps {
  onFilesAdded: (files: File[]) => void
}

export function FileUpload({ onFilesAdded }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const markdownFiles = acceptedFiles.filter(
      file => file.name.endsWith('.md') || file.name.endsWith('.markdown')
    )
    if (markdownFiles.length > 0) {
      onFilesAdded(markdownFiles)
    }
  }, [onFilesAdded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/markdown': ['.md', '.markdown']
    },
    multiple: true
  })

  return (
    <Card
      {...getRootProps()}
      className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {isDragActive ? (
          <>
            <FileText className="w-12 h-12 text-primary" />
            <p className="text-lg font-medium">Drop the markdown files here</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400" />
            <p className="text-lg font-medium">Drag & drop markdown files here</p>
            <p className="text-sm text-gray-500">or click to select files</p>
            <p className="text-xs text-gray-400 mt-2">Only .md and .markdown files are accepted</p>
          </>
        )}
      </div>
    </Card>
  )
}