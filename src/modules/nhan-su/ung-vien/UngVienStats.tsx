import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Briefcase, ChevronDown, FileDown, Printer, Share2, Tag, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { formatDateTime } from '@/lib/format';
import { exportToExcel } from '@/lib/export';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { PageHeaderBar } from '@/components/data/PageHeaderBar';
import { ChartTooltip } from '@/components/data/ChartTooltip';
import type { FilterGroup } from '@/components/data/MobileFilterSheet';
import { deXuatLabel, useDeXuatTuyenDung, useKenhTuyenDung, useTrangThaiUngVien, useUngVien, type UngVien } from '../tuyen-dung/data';

const CHART_HEIGHT = 220;
const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface CountRow {
  id: string;
  ten: string;
  count: number;
}

function useStats(rows: UngVien[]) {
  return useMemo(() => {
    const byStatus = new Map<string, CountRow>();
    const byPosition = new Map<string, CountRow>();
    const bySource = new Map<string, CountRow>();
    rows.forEach((r) => {
      const s = byStatus.get(r.id_trang_thai_ung_vien) ?? { id: r.id_trang_thai_ung_vien, ten: r.ten_trang_thai ?? r.id_trang_thai_ung_vien, count: 0 };
      s.count += 1;
      byStatus.set(r.id_trang_thai_ung_vien, s);
      const posName = r.ma_de_xuat ? deXuatLabel(r) : r.id_de_xuat_tuyen_dung;
      const p = byPosition.get(r.id_de_xuat_tuyen_dung) ?? { id: r.id_de_xuat_tuyen_dung, ten: posName, count: 0 };
      p.count += 1;
      byPosition.set(r.id_de_xuat_tuyen_dung, p);
      if (r.id_kenh_tuyen_dung) {
        const k = bySource.get(r.id_kenh_tuyen_dung) ?? { id: r.id_kenh_tuyen_dung, ten: r.ten_kenh_tuyen_dung ?? r.id_kenh_tuyen_dung, count: 0 };
        k.count += 1;
        bySource.set(r.id_kenh_tuyen_dung, k);
      }
    });
    const statusList = Array.from(byStatus.values());
    const positionList = Array.from(byPosition.values()).sort((a, b) => b.count - a.count);
    const sourceList = Array.from(bySource.values()).sort((a, b) => b.count - a.count);
    const toChart = (l: CountRow[]) => l.map((x) => ({ name: x.ten, value: x.count }));
    return {
      total: rows.length,
      statusList,
      positionList,
      sourceList,
      chartStatus: toChart(statusList),
      chartPosition: toChart(positionList),
      chartSource: toChart(sourceList),
    };
  }, [rows]);
}

function toExportRow(r: UngVien) {
  return {
    ho_ten: r.ho_ten ?? '',
    email: r.email ?? '',
    so_dien_thoai: r.so_dien_thoai ?? '',
    vi_tri: r.ma_de_xuat ? deXuatLabel(r) : '',
    trang_thai: r.ten_trang_thai ?? '',
    nguon: r.ten_kenh_tuyen_dung ?? '',
    ngay_phong_van_gan_nhat: r.ngay_phong_van_gan_nhat ? formatDateTime(r.ngay_phong_van_gan_nhat) : '',
    ket_qua_phan_hoi_gan_nhat: r.ket_qua_phan_hoi_gan_nhat ?? '',
    tg_tao: formatDateTime(r.tg_tao),
  };
}

function ActionsMenu({ onExport, onPrint }: { onExport: () => void; onPrint: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'h-8 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all active:scale-[0.98]',
          open ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/50',
        )}
      >
        <span>{t('ungVien.stats.actions')}</span>
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] bg-card rounded-xl shadow-xl border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => {
              onExport();
              setOpen(false);
            }}
            className="w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors"
          >
            <FileDown size={16} className="text-muted-foreground" />
            {t('ungVien.stats.exportReport')}
          </button>
          <button
            type="button"
            onClick={() => {
              onPrint();
              setOpen(false);
            }}
            className="w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors border-t border-border"
          >
            <Printer size={16} className="text-muted-foreground" />
            {t('ungVien.stats.printReport')}
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryCards({ total, statusList }: { total: number; statusList: CountRow[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      <div className="bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm col-span-2 sm:col-span-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users size={15} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{t('ungVien.stats.total')}</p>
            <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{total}</p>
          </div>
        </div>
      </div>
      {statusList.slice(0, 4).map((s) => (
        <div key={s.id} className="bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-muted/80 text-muted-foreground border-border">
              <Tag size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate" title={s.ten}>
                {s.ten}
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{s.count}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border p-3.5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Charts({ status, position, source }: { status: { name: string; value: number }[]; position: { name: string; value: number }[]; source: { name: string; value: number }[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(id);
  }, []);
  if (!ready) return null;
  const tick = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' };
  const bar = (data: { name: string; value: number }[]) => (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} interval={0} />
        <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} name={t('ungVien.stats.count')}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
      {status.length > 0 && status.some((d) => d.value > 0) && (
        <ChartCard title={t('ungVien.stats.byStatus')} icon={<Tag size={14} className="text-primary" />}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie data={status} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2} dataKey="value" stroke="none">
                {status.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span className="text-muted-foreground text-caption">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
      {position.length > 0 && (
        <ChartCard title={t('ungVien.stats.byViTri')} icon={<Briefcase size={14} className="text-primary" />}>
          {bar(position)}
        </ChartCard>
      )}
      {source.length > 0 && (
        <ChartCard title={t('ungVien.stats.byNguon')} icon={<Share2 size={14} className="text-primary" />}>
          {bar(source)}
        </ChartCard>
      )}
    </div>
  );
}

function CountTables({ status, position, source }: { status: CountRow[]; position: CountRow[]; source: CountRow[] }) {
  const table = (title: string, icon: ReactNode, rows: CountRow[], colLabel: string) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">{colLabel}</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('ungVien.stats.countCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                  {t('ungVien.stats.noData')}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-foreground">{r.ten}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {table(t('ungVien.stats.byStatus'), <Tag size={14} className="text-primary" />, status, t('ungVien.stats.statusLabel'))}
      {table(t('ungVien.stats.byViTri'), <Briefcase size={14} className="text-primary" />, position, t('ungVien.stats.viTriLabel'))}
      {table(t('ungVien.stats.byNguon'), <Share2 size={14} className="text-primary" />, source, t('ungVien.stats.nguonLabel'))}
    </div>
  );
}

/** Tab "Thống kê" của Ứng viên. */
export function UngVienStats() {
  const [statusF, setStatusF] = useState<string[]>([]);
  const [positionF, setPositionF] = useState<string[]>([]);
  const [sourceF, setSourceF] = useState<string[]>([]);
  const { data: rows = [], isLoading, isError } = useUngVien();
  const { data: proposals = [] } = useDeXuatTuyenDung();
  const { data: statuses = [] } = useTrangThaiUngVien();
  const { data: sources = [] } = useKenhTuyenDung();

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const a = statusF.length === 0 || statusF.includes(r.id_trang_thai_ung_vien);
        const b = positionF.length === 0 || positionF.includes(r.id_de_xuat_tuyen_dung);
        const c = sourceF.length === 0 || (!!r.id_kenh_tuyen_dung && sourceF.includes(r.id_kenh_tuyen_dung));
        return a && b && c;
      }),
    [rows, statusF, positionF, sourceF],
  );
  const stats = useStats(filtered);

  const statusOptions = useMemo(() => statuses.map((s) => ({ label: s.ten, value: s.id, count: rows.filter((r) => r.id_trang_thai_ung_vien === s.id).length })), [statuses, rows]);
  const positionOptions = useMemo(
    () => proposals.map((p) => ({ label: deXuatLabel(p), value: p.id, count: rows.filter((r) => r.id_de_xuat_tuyen_dung === p.id).length })),
    [proposals, rows],
  );
  const sourceOptions = useMemo(() => sources.map((s) => ({ label: s.ten, value: s.id, count: rows.filter((r) => r.id_kenh_tuyen_dung === s.id).length })), [sources, rows]);

  const activeCount = statusF.length + positionF.length + sourceF.length;
  const clear = () => {
    setStatusF([]);
    setPositionF([]);
    setSourceF([]);
  };
  const groups: FilterGroup[] = [
    { key: 'trangThai', label: t('ungVien.stats.statusLabel'), icon: Tag, options: statusOptions, value: statusF, onChange: setStatusF },
    { key: 'viTri', label: t('ungVien.stats.viTriLabel'), icon: Briefcase, options: positionOptions, value: positionF, onChange: setPositionF },
    { key: 'nguon', label: t('ungVien.stats.nguonLabel'), icon: Share2, options: sourceOptions, value: sourceF, onChange: setSourceF },
  ];

  const exportReport = () => {
    if (filtered.length === 0) {
      toast.info(t('ungVien.stats.noData'));
      return;
    }
    exportToExcel(filtered.map(toExportRow), 'thong_ke_ung_vien');
    toast.success(t('ungVien.stats.exportReport'));
  };

  if (isError)
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-destructive">{t('ungVien.errorLoad')}</p>
      </div>
    );

  if (isLoading)
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <Spinner text={t('ungVien.stats.loading')} centered />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[1, 2, 3, 4, 5].map((k) => (
              <div key={k} className="bg-card rounded-lg border border-border p-2.5 animate-pulse">
                <div className="h-12 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      <PageHeaderBar
        className="static z-auto"
        filters={
          <>
            <MultiSelectFilter options={statusOptions} value={statusF} onChange={setStatusF} placeholder={t('ungVien.stats.statusLabel')} icon={Tag} className="w-full sm:w-[140px]" size="md" />
            <MultiSelectFilter options={positionOptions} value={positionF} onChange={setPositionF} placeholder={t('ungVien.stats.viTriLabel')} icon={Briefcase} className="w-full sm:w-[160px]" size="md" />
            <MultiSelectFilter options={sourceOptions} value={sourceF} onChange={setSourceF} placeholder={t('ungVien.stats.nguonLabel')} icon={Share2} className="w-full sm:w-[140px]" size="md" />
          </>
        }
        filterGroups={groups}
        activeFilterCount={activeCount}
        onClearFilters={clear}
        actions={<ActionsMenu onExport={exportReport} onPrint={() => window.print()} />}
      />
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 sm:p-4 pb-4 space-y-4">
          {filtered.length === 0 ? (
            <EmptyState
              title={t('ungVien.stats.noData')}
              description={t('ungVien.stats.noDataHint')}
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
              <SummaryCards total={stats.total} statusList={stats.statusList} />
              <Charts status={stats.chartStatus} position={stats.chartPosition} source={stats.chartSource} />
              <CountTables status={stats.statusList} position={stats.positionList} source={stats.sourceList} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
