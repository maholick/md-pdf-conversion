'use client'

import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { SortableFileItem } from './sortable-file-item'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface UploadedFile {
  id: string
  file: File
  preview?: string
}

interface FileListProps {
  files: UploadedFile[]
  onReorder: (files: UploadedFile[]) => void
  onRemove: (id: string) => void
}

export function FileList({ files, onReorder, onRemove }: FileListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id)
      const newIndex = files.findIndex((f) => f.id === over.id)
      onReorder(arrayMove(files, oldIndex, newIndex))
    }
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No files uploaded yet
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={files.map(f => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {files.map((file, index) => (
              <SortableFileItem
                key={file.id}
                file={file}
                index={index}
                onRemove={() => onRemove(file.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </ScrollArea>
  )
}