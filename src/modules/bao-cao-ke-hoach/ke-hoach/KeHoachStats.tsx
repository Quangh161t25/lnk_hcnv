import { useMemo, useState } from 'react';
import { Building2, CalendarRange, CircleCheck, CircleDot, Clock, FilePen, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportToExcel } from '@/lib/export';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { EmptyState } from '@/components/ui/Feedback';
import { PageHeaderBar } from '@/components/data/PageHeaderBar';
import { BarChartBox, ChartCard, CountTable, PieChartBox, StatCard, StatsActionsMenu, StatsLoading, countBy, toChart, useChartReady } from '@/components/data/StatsKit';
import { LOAI_KY_LABEL, TRANG_THAI, periodLabel, statusColor, statusLabel, type LoaiKy, type Plan } from './data';

/** Tab "Thống kê" của Kế hoạch. */
export function KeHoachStats({ plans, isLoading }: { plans: Plan[]; isLoading: boolean }) {
  const [kyF, setKyF] = useState<string[]>([]);
  const [yearF, setYearF] = useState<string[]>([]);
  const ready = useChartReady();
  const years = useMemo(() => Array.from(new Set(plans.map((p) => String(p.nam)))).sort().reverse(), [plans]);
  const filtered = useMemo(() => plans.filter((p) => (kyF.length === 0 || kyF.includes(p.loai_ky)) && (yearF.length === 0 || yearF.includes(String(p.nam)))), [plans, kyF, yearF]);
  const byStatus = TRANG_THAI.map((s) => ({ id: s, ten: statusLabel(s), count: filtered.filter((p) => p.trang_thai === s).length }));
  const byDept = countBy(filtered, (p) => p.phong_ban_id, (_id, p) => p.ten_phong_ban ?? _id);
  const deptApproved = byDept.map((d) => {
    const ok = filtered.filter((p) => p.phong_ban_id === d.id && p.trang_thai === 'Đã duyệt').length;
    return { ...d, ten: `${d.ten} (${Math.round((ok / d.count) * 100)}% đã duyệt)` };
  });
  const active = kyF.length + yearF.length;
  const clear = () => {
    setKyF([]);
    setYearF([]);
  };

  const exportReport = () => {
    if (!filtered.length) return toast.info('Không có dữ liệu');
    exportToExcel(
      filtered.map((p) => ({
        'Mã kế hoạch': p.id,
        'Tiêu đề': p.tieu_de,
        Loại: p.loai === 'phong_ban' ? 'Phòng ban' : 'Cá nhân',
        Kỳ: periodLabel(p),
        'Phòng ban': p.ten_phong_ban ?? '',
        'Người lập': p.ten_nguoi_lap,
        'Số đầu việc': p.items.length,
        'Trạng thái': statusLabel(p.trang_thai),
      })),
      'thong_ke_ke_hoach',
    );
    toast.success('Đã xuất báo cáo');
  };

  if (isLoading) return <StatsLoading text="Đang tải thống kê..." />;
  const icons = { Nháp: FilePen, 'Đã gửi': Clock, 'Đã duyệt': CircleCheck, 'Trả lại': Undo2 } as const;

  return (
    <div className="flex flex-col h-full">
      <PageHeaderBar
        className="static z-auto"
        filters={
          <>
            <MultiSelectFilter options={(Object.keys(LOAI_KY_LABEL) as LoaiKy[]).map((k) => ({ label: LOAI_KY_LABEL[k], value: k, count: plans.filter((p) => p.loai_ky === k).length }))} value={kyF} onChange={setKyF} placeholder="Kỳ" icon={CalendarRange} className="w-full sm:w-[130px]" size="md" />
            <MultiSelectFilter options={years.map((y) => ({ label: y, value: y, count: plans.filter((p) => String(p.nam) === y).length }))} value={yearF} onChange={setYearF} placeholder="Năm" icon={CalendarRange} className="w-full sm:w-[110px]" size="md" />
          </>
        }
        activeFilterCount={active}
        onClearFilters={clear}
        actions={<StatsActionsMenu label="Thao tác" exportLabel="Xuất báo cáo" printLabel="In báo cáo" onExport={exportReport} onPrint={() => window.print()} />}
      />
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {filtered.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu" description="Lập kế hoạch ở tab Danh sách để xem thống kê." />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <StatCard label="Tổng kế hoạch" value={filtered.length} icon={CalendarRange} primary className="col-span-2 sm:col-span-1" />
                {TRANG_THAI.map((s) => (
                  <StatCard key={s} label={statusLabel(s)} value={filtered.filter((p) => p.trang_thai === s).length} icon={icons[s]} colorClass={statusColor(s)} />
                ))}
              </div>
              {ready && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <ChartCard title="Theo trạng thái" icon={<CircleDot size={14} className="text-primary" />}>
                    <PieChartBox data={byStatus.map((s) => ({ name: s.ten, value: s.count }))} />
                  </ChartCard>
                  <ChartCard title="Theo phòng ban" icon={<Building2 size={14} className="text-primary" />}>
                    <BarChartBox data={toChart(byDept)} seriesName="Số kế hoạch" />
                  </ChartCard>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CountTable title="Theo trạng thái" icon={<CircleDot size={14} className="text-primary" />} rows={byStatus} nameLabel="Trạng thái" countLabel="Số lượng" emptyText="Không có dữ liệu" />
                <CountTable title="Theo phòng ban" icon={<Building2 size={14} className="text-primary" />} rows={deptApproved} nameLabel="Phòng ban" countLabel="Số kế hoạch" emptyText="Không có dữ liệu" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
