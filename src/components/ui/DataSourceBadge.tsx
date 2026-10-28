import { HardDrive, Loader2, Sheet } from 'lucide-react';
import type { DataSource } from '@/lib/sheetTable';

/** Nhãn nhỏ cho biết dữ liệu đang đọc/ghi ở Google Sheet hay chỉ trên trình duyệt. */
export function DataSourceBadge({ source, tab, isLoading, isSaving }: { source?: DataSource; tab: string; isLoading?: boolean; isSaving?: boolean }) {
  if (isLoading || !source)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-muted text-muted-foreground border-border">
        <Loader2 size={11} className="animate-spin" /> Đang tải từ Google Sheet...
      </span>
    );
  const sheet = source === 'sheet';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
        sheet ? 'bg-sky-500/10 text-sky-600 border-sky-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      }`}
      title={sheet ? `Dữ liệu đọc/ghi trực tiếp tab "${tab}" trên Google Sheet` : 'Không kết nối được Google Sheet, thay đổi chỉ lưu trên trình duyệt này'}
    >
      {isSaving ? <Loader2 size={11} className="animate-spin" /> : sheet ? <Sheet size={11} /> : <HardDrive size={11} />}
      {sheet ? (isSaving ? 'Đang lưu lên Sheet...' : `Google Sheet · ${tab}`) : 'Bản lưu cục bộ'}
    </span>
  );
}
