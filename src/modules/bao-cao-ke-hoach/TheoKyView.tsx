import { useMemo, useState, type ReactNode } from 'react';
import { CalendarRange, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { LOAI_KY_LABEL, LOAI_LABEL, periodLabel, periodSortKey, type LoaiKy } from './ke-hoach/data';
import { PlanStatusBadge } from './ke-hoach/KeHoachDetail';
import type { WorkflowDoc } from './workflowData';

/** Tab "Theo kỳ" (Kế hoạch, Báo cáo): gom theo từng kỳ (mới nhất trước), mỗi kỳ liệt kê theo phòng ban. */
export function TheoKyView<T extends WorkflowDoc<unknown>>({
  docs: plans,
  isLoading,
  onView,
  periods = ['tuan', 'thang', 'quy'],
  noun = 'kế hoạch',
  extra,
}: {
  docs: T[];
  isLoading: boolean;
  onView: (d: T) => void;
  periods?: LoaiKy[];
  noun?: string;
  /** Nội dung thêm ở mỗi dòng (vd. % hoàn thành của báo cáo). */
  extra?: (d: T) => ReactNode;
}) {
  // Kế hoạch (tuần/tháng/quý) mặc định xem theo tháng; báo cáo (tuần/tháng) mặc định theo tuần.
  const [loaiKy, setLoaiKy] = useState<LoaiKy>(periods.includes('quy') ? 'thang' : periods[0]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; items: T[] }>();
    for (const p of plans.filter((x) => x.loai_ky === loaiKy)) {
      const key = periodSortKey(p);
      if (!map.has(key)) map.set(key, { key, label: periodLabel(p, true, p), items: [] });
      map.get(key)!.items.push(p);
    }
    return [...map.values()]
      .sort((a, b) => b.key.localeCompare(a.key))
      .map((g) => ({ ...g, items: g.items.sort((a, b) => (a.loai === b.loai ? (a.ten_phong_ban ?? '').localeCompare(b.ten_phong_ban ?? '') : a.loai === 'phong_ban' ? -1 : 1)) }));
  }, [plans, loaiKy]);

  const toggle = (k: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 p-3 sm:px-4 border-b border-border flex items-center gap-2">
        {periods.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setLoaiKy(k)}
            className={cn('h-8 px-3 rounded-lg border text-xs font-medium transition-colors', loaiKy === k ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted/50')}
          >
            Theo {LOAI_KY_LABEL[k].toLowerCase()}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3">
        {isLoading ? (
          <Spinner text={`Đang tải ${noun}...`} />
        ) : groups.length === 0 ? (
          <EmptyState title={`Chưa có ${noun} theo ${LOAI_KY_LABEL[loaiKy].toLowerCase()}`} description={`Các ${noun} sẽ được gom theo từng kỳ tại đây.`} icon={<CalendarRange className="w-10 h-10 text-muted-foreground" />} />
        ) : (
          groups.map((g) => {
            const open = !collapsed.has(g.key);
            const approved = g.items.filter((p) => p.trang_thai === 'Đã duyệt').length;
            return (
              <div key={g.key} className="rounded-xl border border-border bg-card overflow-hidden">
                <button type="button" onClick={() => toggle(g.key)} className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 text-left">
                  <span className="flex items-center gap-2 font-semibold text-sm text-foreground">
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <CalendarRange size={15} className="text-primary" />
                    {g.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {g.items.length} {noun} · {approved} đã duyệt
                  </span>
                </button>
                {open && (
                  <div className="divide-y divide-border">
                    {g.items.map((p) => (
                      <button key={p.id} type="button" onClick={() => onView(p)} className="w-full flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-left hover:bg-muted/40">
                        <span className="flex-1 min-w-[220px]">
                          <span className="block text-sm font-medium text-foreground">{p.tieu_de}</span>
                          <span className="block text-xs text-muted-foreground">
                            {LOAI_LABEL[p.loai]} · {p.ten_phong_ban} · {p.ten_nguoi_lap || p.nguoi_lap}
                          </span>
                        </span>
                        {extra ? extra(p) : <span className="text-xs text-muted-foreground tabular-nums">{p.items.length} việc</span>}
                        <PlanStatusBadge status={p.trang_thai} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
