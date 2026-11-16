'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from '@/utils/i18n';
import { useTranslations } from './LanguageProvider';
import type { FileData } from './PDFMerger';
import ZoomableThumbnail from './ZoomableThumbnail';
import { iconButton, iconButtonAccent } from './styles';

interface FileItemProps {
  file: FileData;
  onToggleIncluded: (id: string) => void;
}

export default function FileItem({ file, onToggleIncluded }: FileItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: file.id });
  const t = useTranslations();
  const excluded = !file.included;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const name =
    file.pageNumber !== undefined && file.totalPages !== undefined
      ? format(t.fileList.page, { page: file.pageNumber, total: file.totalPages })
      : file.name;
  const hasPreview = file.type.startsWith('image/') || (file.type === 'application/pdf' && file.thumbnailUrl);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border p-2 ${
        excluded
          ? 'border-dashed border-neutral-300 dark:border-neutral-700'
          : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={format(t.fileList.reorder, { name })}
        className={`cursor-move touch-none ${iconButton}`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-neutral-100 sm:h-14 sm:w-14 dark:bg-neutral-800">
        {hasPreview ? (
          // The filter sits on the thumbnail itself: on this wrapper it would also dim the zoomed preview.
          <ZoomableThumbnail
            src={file.thumbnailUrl || file.url}
            alt={name}
            className={`h-full w-full ${excluded ? 'opacity-40 grayscale' : ''}`}
          />
        ) : (
          <svg
            className={`h-8 w-8 text-neutral-400 ${excluded ? 'opacity-40' : ''}`}
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${excluded ? 'text-neutral-400 line-through dark:text-neutral-500' : ''}`}>
          {name}
        </p>
        <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
          {excluded && (
            <span className="font-medium text-neutral-700 dark:text-neutral-200">{t.fileList.excluded} · </span>
          )}
          <span className={excluded ? 'text-neutral-400 dark:text-neutral-500' : undefined}>
            {file.type.replace('image/', '').replace('application/', '').toUpperCase()}
            {file.originalFileName && ` · ${format(t.fileList.fromFile, { name: file.originalFileName })}`}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => onToggleIncluded(file.id)}
        aria-pressed={excluded}
        aria-label={format(excluded ? t.fileList.include : t.fileList.exclude, { name })}
        className={excluded ? iconButtonAccent : iconButton}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d={excluded ? 'M12 8v8M8 12h8' : 'M8 12h8'} />
        </svg>
      </button>
    </li>
  );
}
