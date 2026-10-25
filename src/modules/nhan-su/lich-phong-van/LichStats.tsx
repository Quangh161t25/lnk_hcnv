import { useMemo, useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  CalendarOff,
  CircleCheck,
  CircleDot,
  CircleX,
  ClipboardCheck,
  ClipboardList,
  Clock,
  MapPin,
  ThumbsDown,
  ThumbsUp,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { exportToExcel } from '@/lib/export';
import { EmptyState } from '@/components/ui/Feedback';
import { PageHeaderBar } from '@/components/data/PageHeaderBar';
import { BarChartBox, ChartCard, CountTable, PieChartBox, StatsActionsMenu, StatsError, StatsLoading, useChartReady } from '@/components/data/StatsKit';
import { LPV_DANH_GIA, LPV_TRANG_THAI, useLichPhongVan } from '../tuyen-dung/data';

const dateInput =
  'w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40';

function DateBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-[140px]">
      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={dateInput} placeholder={placeholder} />
    </div>
  );
}

/** Tab "Thống kê" của Lịch phỏng vấn. */
export function LichStats() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data: rows = [], isLoading, isError } = useLichPhongVan();
  const filtered = useMemo(() => rows.filter((r) => !((from && r.ngay < from) || (to && r.ngay > to))), [rows, from, to]);
  const stats = useMemo(() => {
    const byStatus = LPV_TRANG_THAI.map((s) => ({ id: s, ten: s, count: filtered.filter((r) => r.trang_thai === s).length }));
    const byFormat = [
      { id: 'online', ten: t('lichPhongVan.hinhThuc.online'), count: filtered.filter((r) => r.hinh_thuc === 'online').length },
      { id: 'offline', ten: t('lichPhongVan.hinhThuc.offline'), count: filtered.filter((r) => r.hinh_thuc !== 'online').length },
    ];
    const byEval = LPV_DANH_GIA.map((s) => ({ id: s, ten: s, count: filtered.filter((r) => (r.trang_thai_danh_gia ?? LPV_DANH_GIA[0]) === s).length }));
    return { byStatus, byFormat, byEval };
  }, [filtered]);

  const filteredByDate = !!from || !!to;
  const activeCount = filteredByDate ? 1 : 0;
  const clear = () => {
    setFrom('');
    setTo('');
  };

  const exportReport = () => {
    if (filtered.length === 0) {
      toast.info(t('lichPhongVan.stats.noData'));
      return;
    }
    exportToExcel(
      filtered.map((v) => ({
        [t('lichPhongVan.store.ungVienCol')]: v.ten_ung_vien ?? '',
        [t('lichPhongVan.store.soVongCol')]: v.so_vong,
        [t('lichPhongVan.store.ngayCol')]: v.ngay,
        [t('lichPhongVan.store.gioCol')]: v.gio,
        [t('lichPhongVan.store.hinhThucCol')]: v.hinh_thuc,
        [t('lichPhongVan.store.trangThaiCol')]: v.trang_thai,
        [t('lichPhongVan.store.ketQuaCol')]: v.ket_qua ?? '',
      })),
      'bao_cao_lich_phong_van',
    );
    toast.success(t('lichPhongVan.stats.exportReport'));
  };

  if (isError) return <StatsError text={t('lichPhongVan.stats.errorLoad')} />;
  if (isLoading) return <StatsLoading text={t('lichPhongVan.stats.loading')} />;

  const [cho, daDienRa, hoan, huy] = stats.byStatus.map((s) => s.count);
  const [chuaDanhGia, dat, khongDat] = stats.byEval.map((s) => s.count);
  const cards: { title: string; value: number; icon: LucideIcon; cls: string }[] = [
    { title: t('lichPhongVan.stats.total'), value: filtered.length, icon: CalendarCheck, cls: 'bg-primary/10 text-primary border-primary/20' },
    { title: t('lichPhongVan.trangThai.cho'), value: cho, icon: Clock, cls: 'bg-muted text-muted-foreground border-border' },
    { title: t('lichPhongVan.trangThai.daDienRa'), value: daDienRa, icon: CircleCheck, cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
    { title: t('lichPhongVan.trangThai.hoan'), value: hoan, icon: CalendarOff, cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
    { title: t('lichPhongVan.trangThai.huy'), value: huy, icon: CircleX, cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' },
    { title: t('lichPhongVan.hinhThuc.online'), value: stats.byFormat[0].count, icon: Video, cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' },
    { title: t('lichPhongVan.hinhThuc.offline'), value: stats.byFormat[1].count, icon: MapPin, cls: 'bg-muted text-muted-foreground border-border' },
    { title: t('lichPhongVan.trangThaiDanhGia.chuaDanhGia'), value: chuaDanhGia, icon: ClipboardList, cls: 'bg-muted text-muted-foreground border-border' },
    { title: t('lichPhongVan.trangThaiDanhGia.dat'), value: dat, icon: ThumbsUp, cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
    { title: t('lichPhongVan.trangThaiDanhGia.khongDat'), value: khongDat, icon: ThumbsDown, cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeaderBar
        className="static z-auto"
        filters={
          <>
            <DateBox value={from} onChange={setFrom} placeholder={t('lichPhongVan.filterFromDate', { date: '' })} />
            <DateBox value={to} onChange={setTo} placeholder={t('lichPhongVan.filterToDate', { date: '' })} />
          </>
        }
        activeFilterCount={activeCount}
        onClearFilters={clear}
        actions={
          <StatsActionsMenu
            label={t('lichPhongVan.stats.actions')}
            exportLabel={t('lichPhongVan.stats.exportReport')}
            printLabel={t('lichPhongVan.stats.printReport')}
            onExport={exportReport}
            onPrint={() => window.print()}
          />
        }
      />
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {filtered.length === 0 ? (
            <EmptyState
              title={t('lichPhongVan.stats.noData')}
              description={t('lichPhongVan.stats.noDataHint')}
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
              <h3 className="text-sm font-semibold text-primary">{t('lichPhongVan.stats.title')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {cards.map((c) => (
                  <div key={c.title} className={`rounded-lg border p-2.5 sm:p-3 transition-all hover:shadow-sm flex items-center gap-2.5 ${c.cls}`}>
                    <div className="w-8 h-8 rounded-lg bg-white/50 dark:bg-black/10 flex items-center justify-center shrink-0">
                      <c.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs opacity-90 truncate">{c.title}</p>
                      <p className="text-lg font-bold tabular-nums mt-0.5">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('lichPhongVan.stats.totalCount', { count: filtered.length })}
                {filteredByDate ? ` (${t('lichPhongVan.stats.filteredHint')})` : ''}
              </p>
              <Charts stats={stats} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: t('lichPhongVan.stats.byTrangThai'), Icon: CircleDot, rows: stats.byStatus },
                  { title: t('lichPhongVan.stats.byHinhThuc'), Icon: Video, rows: stats.byFormat },
                  { title: t('lichPhongVan.stats.byTrangThaiDanhGia'), Icon: ClipboardCheck, rows: stats.byEval },
                ].map(({ title, Icon, rows: r }) => (
                  <CountTable
                    key={title}
                    title={title}
                    icon={<Icon size={14} className="text-primary" />}
                    rows={r}
                    nameLabel={t('lichPhongVan.stats.nameCol')}
                    countLabel={t('lichPhongVan.stats.countCol')}
                    emptyText={t('lichPhongVan.stats.noData')}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type Rows = { id: string; ten: string; count: number }[];

function Charts({ stats }: { stats: { byStatus: Rows; byFormat: Rows; byEval: Rows } }) {
  const ready = useChartReady();
  if (!ready) return null;
  const chart = (r: Rows) => r.map((x) => ({ name: x.ten, value: x.count }));
  const any = (r: Rows) => r.some((x) => x.count > 0);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {any(stats.byStatus) && (
        <ChartCard title={t('lichPhongVan.stats.byTrangThai')} icon={<CircleDot size={14} className="text-primary" />}>
          <PieChartBox data={chart(stats.byStatus)} />
        </ChartCard>
      )}
      {any(stats.byFormat) && (
        <ChartCard title={t('lichPhongVan.stats.byHinhThuc')} icon={<Video size={14} className="text-primary" />}>
          <PieChartBox data={chart(stats.byFormat)} />
        </ChartCard>
      )}
      {any(stats.byEval) && (
        <ChartCard title={t('lichPhongVan.stats.byTrangThaiDanhGia')} icon={<ClipboardCheck size={14} className="text-primary" />}>
          <BarChartBox data={chart(stats.byEval)} seriesName={t('lichPhongVan.stats.countCol')} />
        </ChartCard>
      )}
    </div>
  );
}
