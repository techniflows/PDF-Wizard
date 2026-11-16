'use client';

import type { Dispatch, SetStateAction } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import FileItem from './FileItem';
import type { FileData } from './PDFMerger';

function setPageScrollLocked(locked: boolean) {
  document.body.style.overflow = locked ? 'hidden' : '';
  document.body.style.touchAction = locked ? 'none' : '';
}

interface FileListProps {
  files: FileData[];
  setFiles: Dispatch<SetStateAction<FileData[]>>;
}

export default function FileList({ files, setFiles }: FileListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setPageScrollLocked(false);

    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleIncluded = (id: string) => {
    setFiles((items) => items.map((item) => (item.id === id ? { ...item, included: !item.included } : item)));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => setPageScrollLocked(true)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setPageScrollLocked(false)}
    >
      <SortableContext items={files.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <ul className="mb-6 space-y-2">
          {files.map((file) => (
            <FileItem key={file.id} file={file} onToggleIncluded={toggleIncluded} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
