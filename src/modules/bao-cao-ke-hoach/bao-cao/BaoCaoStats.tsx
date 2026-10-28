import { useMemo, useState } from 'react';
import { Building2, CalendarRange, CircleCheck, CircleDot, Clock, FileChartColumn, Gauge, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { exportToExcel } from '@/lib/export';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { EmptyState } from '@/components/ui/Feedback';
import { PageHeaderBar } from '@/components/data/PageHeaderBar';
import { BarChartBox, ChartCard, CountTable, PieChartBox, StatCard, StatsActionsMenu, StatsLoading, useChartReady } from '@/components/data/StatsKit';
import { TRANG_THAI, periodLabel, periodSortKey, statusColor, statusLabel } from '../ke-hoach/data';
import type { Report } from './data';

const avg = (list: Report[]) => (list.length ? Math.round(list.reduce((s, r) => s + (r.phan_tram ?? 0), 0) / list.length) : 0);

/** Tab "Thống kê" của Báo cáo: số lượng theo trạng thái, % hoàn thành trung bình theo phòng ban và theo kỳ. */
export function BaoCaoStats({ reports, isLoading }: { reports: Report[]; isLoading: boolean }) {
  const [kyF, setKyF] = useState<string[]>([]);
  const [yearF, setYearF] = useState<string[]>([]);
  const ready = useChartReady();
  const years = useMemo(() => Array.from(new Set(reports.map((r) => String(r.nam)))).sort().reverse(), [reports]);
  const filtered = useMemo(() => reports.filter((r) => (kyF.length === 0 || kyF.includes(r.loai_ky)) && (yearF.length === 0 || yearF.includes(String(r.nam)))), [reports, kyF, yearF]);
  // % hoàn thành chỉ tính trên báo cáo đã gửi hoặc đã duyệt (bản nháp chưa chốt số liệu).
  const counted = filtered.filter((r) => r.trang_thai === 'Đã gửi' || r.trang_thai === 'Đã duyệt');

  const byStatus = TRANG_THAI.map((s) => ({ id: s, ten: statusLabel(s), count: filtered.filter((r) => r.trang_thai === s).length }));
  const byDept = useMemo(() => {
    const ids = Array.from(new Set(counted.map((r) => r.phong_ban_id)));
    return ids
      .map((id) => {
        const list = counted.filter((r) => r.phong_ban_id === id);
        return { id, ten: list[0]?.ten_phong_ban ?? id, count: list.length, avg: avg(list) };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [counted]);
  const trend = useMemo(() => {
    const map = new Map<string, Report[]>();
    for (const r of counted) {
      const k = periodSortKey(r);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, list]) => ({ name: periodLabel(list[0]), value: avg(list) }));
  }, [counted]);

  const active = kyF.length + yearF.length;
  const exportReport = () => {
    if (!filtered.length) return toast.info('Không có dữ liệu');
    exportToExcel(
      filtered.map((r) => ({
        'Mã báo cáo': r.id,
        'Tiêu đề': r.tieu_de,
        Loại: r.loai === 'phong_ban' ? 'Phòng ban' : 'Cá nhân',
        Kỳ: periodLabel(r),
        'Phòng ban': r.ten_phong_ban ?? '',
        'Người lập': r.ten_nguoi_lap,
        '% hoàn thành': r.phan_tram ?? 0,
        'Trạng thái': statusLabel(r.trang_thai),
      })),
      'thong_ke_bao_cao',
    );
    toast.success('Đã xuất báo cáo');
  };

  if (isLoading) return <StatsLoading text="Đang tải thống kê..." />;

  return (
    <div className="flex flex-col h-full">
      <PageHeaderBar
        className="static z-auto"
        filters={
          <>
            <MultiSelectFilter
              options={[
                { label: 'Tuần', value: 'tuan', count: reports.filter((r) => r.loai_ky === 'tuan').length },
                { label: 'Tháng', value: 'thang', count: reports.filter((r) => r.loai_ky === 'thang').length },
              ]}
              value={kyF}
              onChange={setKyF}
              placeholder="Kỳ"
              icon={CalendarRange}
              className="w-full sm:w-[120px]"
              size="md"
            />
            <MultiSelectFilter options={years.map((y) => ({ label: y, value: y, count: reports.filter((r) => String(r.nam) === y).length }))} value={yearF} onChange={setYearF} placeholder="Năm" icon={CalendarRange} className="w-full sm:w-[110px]" size="md" />
          </>
        }
        activeFilterCount={active}
        onClearFilters={() => {
          setKyF([]);
          setYearF([]);
        }}
        actions={<StatsActionsMenu label="Thao tác" exportLabel="Xuất báo cáo" printLabel="In báo cáo" onExport={exportReport} onPrint={() => window.print()} />}
      />
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {filtered.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu" description="Lập báo cáo ở tab Danh sách để xem thống kê." />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <StatCard label="Tổng báo cáo" value={filtered.length} icon={FileChartColumn} primary className="col-span-2 sm:col-span-1" />
                <StatCard label="Chờ duyệt" value={filtered.filter((r) => r.trang_thai === 'Đã gửi').length} icon={Clock} colorClass={statusColor('Đã gửi')} />
                <StatCard label="Đã duyệt" value={filtered.filter((r) => r.trang_thai === 'Đã duyệt').length} icon={CircleCheck} colorClass={statusColor('Đã duyệt')} />
                <StatCard label="Nháp / Trả lại" value={filtered.filter((r) => r.trang_thai === 'Nháp' || r.trang_thai === 'Trả lại').length} icon={CircleDot} />
                <StatCard label="% hoàn thành TB" value={`${avg(counted)}%`} icon={Gauge} colorClass="bg-cyan-500/10 text-cyan-700 border-cyan-500/20" />
              </div>
              {ready && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  <ChartCard title="Theo trạng thái" icon={<CircleDot size={14} className="text-primary" />}>
                    <PieChartBox data={byStatus.map((s) => ({ name: s.ten, value: s.count }))} />
                  </ChartCard>
                  <ChartCard title="% hoàn thành TB theo phòng ban" icon={<Building2 size={14} className="text-primary" />}>
                    {byDept.length ? <BarChartBox data={byDept.map((d) => ({ name: d.ten, value: d.avg }))} seriesName="% hoàn thành" /> : <p className="text-xs text-muted-foreground py-10 text-center">Chưa có báo cáo đã gửi</p>}
                  </ChartCard>
                  <ChartCard title="Xu hướng % hoàn thành theo kỳ" icon={<TrendingUp size={14} className="text-primary" />}>
                    {trend.length ? <BarChartBox data={trend} seriesName="% hoàn thành" /> : <p className="text-xs text-muted-foreground py-10 text-center">Chưa có báo cáo đã gửi</p>}
                  </ChartCard>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CountTable title="Theo trạng thái" icon={<CircleDot size={14} className="text-primary" />} rows={byStatus} nameLabel="Trạng thái" countLabel="Số lượng" emptyText="Không có dữ liệu" />
                <CountTable
                  title="Theo phòng ban (đã gửi / đã duyệt)"
                  icon={<Building2 size={14} className="text-primary" />}
                  rows={byDept.map((d) => ({ id: d.id, ten: `${d.ten} · TB ${d.avg}%`, count: d.count }))}
                  nameLabel="Phòng ban · % hoàn thành TB"
                  countLabel="Số báo cáo"
                  emptyText="Chưa có báo cáo đã gửi"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
