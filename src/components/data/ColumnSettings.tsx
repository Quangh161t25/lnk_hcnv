import { useRef, useState, type DragEvent } from 'react';
import { Check, GripVertical, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import type { ColumnDef } from '@/stores/createListStore';
import { Tooltip } from '@/components/ui/Tooltip';

/** Bảng bật/tắt và kéo thả sắp xếp cột. */
export function ColumnSettings({
  columns,
  onToggleColumn,
  onReorderColumns,
  onResetColumns,
}: {
  columns: ColumnDef[];
  onToggleColumn: (id: string) => void;
  onReorderColumns: (from: number, to: number) => void;
  onResetColumns: () => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragEl = useRef<HTMLElement | null>(null);
  const sorted = [...columns].sort((a, b) => a.order - b.order);
  const visibleCount = sorted.filter((c) => c.visible).length;

  const onDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index);
    dragEl.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (dragEl.current) dragEl.current.style.opacity = '0.4';
    }, 0);
  };
  const onDragEnter = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  };
  const onDragEnd = () => {
    if (dragEl.current) dragEl.current.style.opacity = '1';
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) onReorderColumns(dragIndex, overIndex);
    setDragIndex(null);
    setOverIndex(null);
    dragEl.current = null;
  };

  return (
    <div className="w-64 overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-medium text-muted-foreground">{t('common.columnDisplay')}</h4>
          <span className="text-xs tabular-nums text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded-full font-medium">
            {visibleCount}/{sorted.length}
          </span>
        </div>
        <Tooltip content={t('common.reset')} placement="bottom">
          <button onClick={onResetColumns} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <RotateCcw size={12} />
          </button>
        </Tooltip>
      </div>
      <div className="p-1.5 max-h-[320px] overflow-y-auto custom-scrollbar">
        {sorted.map((col, index) => (
          <div
            key={col.id}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnter={() => onDragEnter(index)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={onDragEnd}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing select-none transition-all group',
              overIndex === index && 'bg-primary/10 border border-primary/20 border-dashed',
              dragIndex === index ? 'opacity-40' : 'hover:bg-muted/50',
            )}
          >
            <GripVertical size={12} className="text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors" />
            <div
              onClick={(e) => {
                e.stopPropagation();
                onToggleColumn(col.id);
              }}
              className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer',
                col.visible ? 'bg-primary border-primary text-white' : 'border-border bg-background group-hover:border-primary/50',
              )}
            >
              {col.visible && <Check size={10} className="stroke-[3px]" />}
            </div>
            <span className={cn('text-xs flex-1 truncate', col.visible ? 'text-foreground font-medium' : 'text-muted-foreground')}>{col.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
