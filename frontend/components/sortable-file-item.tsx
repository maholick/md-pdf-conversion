'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GripVertical, FileText, X } from 'lucide-react'
import type { UploadedFile } from './file-list'

interface SortableFileItemProps {
  file: UploadedFile
  index: number
  onRemove: () => void
}

export function SortableFileItem({ file, index, onRemove }: SortableFileItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: file.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
    else return Math.round(bytes / 1048576) + ' MB'
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-gray-100 rounded p-1"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <span className="font-mono text-sm">{index + 1}.</span>
          <FileText className="w-4 h-4" />
        </div>
        
        <div className="flex-1">
          <p className="font-medium text-sm">{file.file.name}</p>
          <p className="text-xs text-gray-500">{formatFileSize(file.file.size)}</p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="hover:bg-red-50 hover:text-red-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}