import { useMemo, useState } from 'react';
import { Briefcase, ChartColumn, FileText, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { formatDateTime } from '@/lib/format';
import { exportToExcel } from '@/lib/export';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { EmptyState } from '@/components/ui/Feedback';
import { PageHeaderBar } from '@/components/data/PageHeaderBar';
import type { FilterGroup } from '@/components/data/MobileFilterSheet';
import { BarChartBox, ChartCard, CountTable, PieChartBox, StatCard, StatsActionsMenu, StatsError, StatsLoading, countBy, toChart, useChartReady } from '@/components/data/StatsKit';
import { usePositions } from '@/modules/shared/orgData';
import { DX_TRANG_THAI, useDeXuatWithCounts, type DeXuatWithCounts } from '../tuyen-dung/data';
import { DX_STATUS_OPTIONS, dxStatusColor } from './components';

function toExportRow(e: DeXuatWithCounts) {
  return {
    ma_de_xuat: e.ma_de_xuat ?? '',
    tieu_de: e.tieu_de ?? '',
    chuc_vu: e.ten_chuc_vu ?? '',
    trang_thai: e.trang_thai,
    so_luong: e.so_luong ?? 0,
    so_luong_onboard: e.so_luong_onboard,
    so_luong_da_nghi: e.so_luong_da_nghi,
    so_luong_con_lai: e.so_luong_con_lai,
    han_nop: e.han_nop ? formatDateTime(e.han_nop) : '',
    tg_tao: formatDateTime(e.tg_tao),
  };
}

function Charts({ byStatus, byChucVu }: { byStatus: { name: string; value: number }[]; byChucVu: { name: string; value: number }[] }) {
  const ready = useChartReady();
  if (!ready) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {byStatus.some((d) => d.value > 0) && (
        <ChartCard title={t('deXuatTuyenDung.stats.byStatus')} icon={<ChartColumn size={14} className="text-primary" />}>
          <PieChartBox data={byStatus} />
        </ChartCard>
      )}
      {byChucVu.length > 0 && (
        <ChartCard title={t('deXuatTuyenDung.stats.byChucVu')} icon={<Briefcase size={14} className="text-primary" />}>
          <BarChartBox data={byChucVu} seriesName={t('deXuatTuyenDung.stats.count')} />
        </ChartCard>
      )}
    </div>
  );
}

/** Tab "Thống kê" của Đề xuất tuyển dụng. */
export function DeXuatStats() {
  const [statusF, setStatusF] = useState<string[]>([]);
  const [positionF, setPositionF] = useState<string[]>([]);
  const { data: rows, isLoading, isError } = useDeXuatWithCounts();
  const { data: positions = [] } = usePositions();

  const filtered = useMemo(
    () => rows.filter((r) => (statusF.length === 0 || statusF.includes(r.trang_thai)) && (positionF.length === 0 || (!!r.id_chuc_vu && positionF.includes(r.id_chuc_vu)))),
    [rows, statusF, positionF],
  );
  const stats = useMemo(() => {
    const byStatus = Object.fromEntries(DX_TRANG_THAI.map((s) => [s, 0])) as Record<string, number>;
    filtered.forEach((r) => (byStatus[r.trang_thai] = (byStatus[r.trang_thai] ?? 0) + 1));
    const byChucVu = countBy(filtered, (r) => r.id_chuc_vu, (id, r) => r.ten_chuc_vu ?? positions.find((p) => p.id === id)?.ten_chuc_vu ?? id);
    return {
      byStatus,
      byStatusList: DX_TRANG_THAI.map((s) => ({ id: s, ten: s, count: byStatus[s] ?? 0 })),
      byChucVu,
    };
  }, [filtered, positions]);

  const statusOptions = useMemo(() => DX_TRANG_THAI.map((s) => ({ label: s, value: s, count: rows.filter((r) => r.trang_thai === s).length })), [rows]);
  const positionOptions = useMemo(() => positions.map((p) => ({ label: p.ten_chuc_vu, value: p.id, count: rows.filter((r) => r.id_chuc_vu === p.id).length })), [positions, rows]);
  const activeCount = statusF.length + positionF.length;
  const clear = () => {
    setStatusF([]);
    setPositionF([]);
  };
  const groups: FilterGroup[] = [
    { key: 'status', label: t('deXuatTuyenDung.stats.statusLabel'), icon: Tag, options: statusOptions, value: statusF, onChange: setStatusF },
    { key: 'id_chuc_vu', label: t('deXuatTuyenDung.stats.chucVu'), icon: Briefcase, options: positionOptions, value: positionF, onChange: setPositionF },
  ];

  const exportReport = () => {
    if (filtered.length === 0) {
      toast.info(t('deXuatTuyenDung.stats.noData'));
      return;
    }
    exportToExcel(filtered.map(toExportRow), 'thong_ke_de_xuat_tuyen_dung');
    toast.success(t('deXuatTuyenDung.stats.exportReport'));
  };

  if (isError) return <StatsError />;
  if (isLoading) return <StatsLoading text={t('deXuatTuyenDung.stats.loading')} />;

  return (
    <div className="flex flex-col h-full">
      <PageHeaderBar
        className="static z-auto"
        filters={
          <>
            <MultiSelectFilter options={statusOptions} value={statusF} onChange={setStatusF} placeholder={t('deXuatTuyenDung.stats.statusLabel')} icon={Tag} className="w-full sm:w-[140px]" size="md" />
            <MultiSelectFilter options={positionOptions} value={positionF} onChange={setPositionF} placeholder={t('deXuatTuyenDung.filterChucVu')} icon={Briefcase} className="w-full sm:w-[160px]" size="md" />
          </>
        }
        filterGroups={groups}
        activeFilterCount={activeCount}
        onClearFilters={clear}
        actions={
          <StatsActionsMenu
            label={t('deXuatTuyenDung.stats.actions')}
            exportLabel={t('deXuatTuyenDung.stats.exportReport')}
            printLabel={t('deXuatTuyenDung.stats.printReport')}
            onExport={exportReport}
            onPrint={() => window.print()}
          />
        }
      />
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {filtered.length === 0 ? (
            <EmptyState
              title={t('deXuatTuyenDung.stats.noData')}
              description={t('deXuatTuyenDung.stats.noDataHint')}
              action={
                activeCount > 0 ? (
                  <button type="button" onClick={clear} className="text-sm font-medium text-primary hover:underline">
                    {t('common.clearFilters', { count: activeCount })}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <StatCard label={t('deXuatTuyenDung.stats.total')} value={filtered.length} icon={FileText} primary className="col-span-2 sm:col-span-1" />
                {DX_STATUS_OPTIONS.map((o) => (
                  <StatCard key={o.value} label={t(o.key)} value={stats.byStatus[o.value] ?? 0} icon={Briefcase} colorClass={dxStatusColor(o.value)} />
                ))}
              </div>
              <Charts byStatus={stats.byStatusList.map((s) => ({ name: s.ten, value: s.count }))} byChucVu={toChart(stats.byChucVu)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CountTable
                  title={t('deXuatTuyenDung.stats.byStatus')}
                  icon={<Tag size={14} className="text-primary" />}
                  rows={stats.byStatusList}
                  nameLabel={t('deXuatTuyenDung.stats.statusLabel')}
                  countLabel={t('deXuatTuyenDung.stats.countCol')}
                  emptyText={t('deXuatTuyenDung.stats.noData')}
                />
                <CountTable
                  title={t('deXuatTuyenDung.stats.byChucVu')}
                  icon={<Briefcase size={14} className="text-primary" />}
                  rows={stats.byChucVu}
                  nameLabel={t('deXuatTuyenDung.stats.chucVu')}
                  countLabel={t('deXuatTuyenDung.stats.countCol')}
                  emptyText={t('deXuatTuyenDung.stats.noData')}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
