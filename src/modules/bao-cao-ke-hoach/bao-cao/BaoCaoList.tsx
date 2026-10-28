import { useEffect, useMemo } from 'react';
import { Building2, CalendarRange, CircleDot, FileChartColumn, Layers, Plus, SquarePen, Trash2 } from 'lucide-react';
import { LOCALE } from '@/lib/i18n';
import { formatDateTime } from '@/lib/format';
import { createListStore, filterItems } from '@/stores/createListStore';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import type { FilterGroup } from '@/components/data/MobileFilterSheet';
import type { DataSource } from '@/lib/sheetTable';
import { LOAI_LABEL, TRANG_THAI, periodLabel, periodSortKey, statusLabel } from '../ke-hoach/data';
import { PlanStatusBadge } from '../ke-hoach/KeHoachDetail';
import { CompletionBar } from './BaoCaoDetail';
import type { Report } from './data';

interface Filters {
  loai: string[];
  loai_ky: string[];
  phong_ban: string[];
  trang_thai: string[];
}

const useBaoCaoList = createListStore<Filters>({ loai: [], loai_ky: [], phong_ban: [], trang_thai: [] }, [
  { id: 'tieu_de', label: 'Tiêu đề', visible: true, minWidth: 220, maxWidth: 360 },
  { id: 'loai', label: 'Loại', visible: true, minWidth: 100 },
  { id: 'ky', label: 'Kỳ', visible: true, minWidth: 130 },
  { id: 'phong_ban', label: 'Phòng ban', visible: true, minWidth: 160 },
  { id: 'nguoi_lap', label: 'Người lập', visible: true, minWidth: 150 },
  { id: 'phan_tram', label: 'Hoàn thành', visible: true, minWidth: 140 },
  { id: 'trang_thai', label: 'Trạng thái', visible: true, minWidth: 110 },
  { id: 'tg_cap_nhat', label: 'Cập nhật', visible: true, minWidth: 130 },
]);

function matches(r: Report, search: string, f: Filters) {
  const q = search.toLowerCase();
  const text = !q || [r.tieu_de, r.id, r.ten_nguoi_lap, r.nguoi_lap, r.ten_phong_ban, r.tom_tat].some((v) => v?.toLowerCase().includes(q));
  return (
    text &&
    (f.loai.length === 0 || f.loai.includes(r.loai)) &&
    (f.loai_ky.length === 0 || f.loai_ky.includes(r.loai_ky)) &&
    (f.phong_ban.length === 0 || f.phong_ban.includes(r.phong_ban_id)) &&
    (f.trang_thai.length === 0 || f.trang_thai.includes(r.trang_thai))
  );
}

const sortValue = (r: Report, col: string): string | number =>
  col === 'ky' ? periodSortKey(r) : col === 'phong_ban' ? (r.ten_phong_ban ?? '') : col === 'nguoi_lap' ? r.ten_nguoi_lap : col === 'phan_tram' ? (r.phan_tram ?? 0) : String((r as unknown as Record<string, unknown>)[col] ?? '');

/** Tab "Danh sách" của Báo cáo. */
export function BaoCaoList({ reports, isLoading, source, onAdd, onView, onEdit, onDelete }: { reports: Report[]; isLoading: boolean; source?: DataSource; onAdd: () => void; onView: (r: Report) => void; onEdit: (r: Report) => void; onDelete: (r: Report) => void }) {
  const list = useBaoCaoList();
  const { searchTerm, filters, sort, setFilter, resetState, selectedIds, clearSelection } = list;
  useEffect(() => () => resetState(), [resetState]);

  const opts = (values: string[], label: (v: string) => string, key: (r: Report) => string) => values.map((v) => ({ label: label(v), value: v, count: reports.filter((r) => key(r) === v).length }));
  const deptIds = useMemo(() => Array.from(new Set(reports.map((r) => r.phong_ban_id))), [reports]);
  const loaiOptions = opts(['ca_nhan', 'phong_ban'], (v) => LOAI_LABEL[v as Report['loai']], (r) => r.loai);
  const kyOptions = opts(['tuan', 'thang'], (v) => (v === 'tuan' ? 'Tuần' : 'Tháng'), (r) => r.loai_ky);
  const deptOptions = opts(deptIds, (id) => reports.find((r) => r.phong_ban_id === id)?.ten_phong_ban ?? id, (r) => r.phong_ban_id);
  const statusOptions = opts([...TRANG_THAI], statusLabel, (r) => r.trang_thai);
  const groups: FilterGroup[] = [
    { key: 'loai', label: 'Loại', icon: Layers, options: loaiOptions, value: filters.loai, onChange: (v) => setFilter('loai', v) },
    { key: 'loai_ky', label: 'Kỳ', icon: CalendarRange, options: kyOptions, value: filters.loai_ky, onChange: (v) => setFilter('loai_ky', v) },
    { key: 'phong_ban', label: 'Phòng ban', icon: Building2, options: deptOptions, value: filters.phong_ban, onChange: (v) => setFilter('phong_ban', v) },
    { key: 'trang_thai', label: 'Trạng thái', icon: CircleDot, options: statusOptions, value: filters.trang_thai, onChange: (v) => setFilter('trang_thai', v) },
  ];

  const filtered = useMemo(() => filterItems(reports, searchTerm, filters, matches), [reports, searchTerm, filters]);
  const sorted = useMemo(() => {
    const base = [...filtered].sort((a, b) => periodSortKey(b).localeCompare(periodSortKey(a)));
    if (!sort.column || !sort.direction) return base;
    const col = sort.column;
    return base.sort((a, b) => {
      const x = sortValue(a, col);
      const y = sortValue(b, col);
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), LOCALE);
      return sort.direction === 'desc' ? -c : c;
    });
  }, [filtered, sort]);

  const iconBtn = (label: string, cls: string, onClick: () => void, Icon: typeof SquarePen) => (
    <Tooltip content={label} placement="left">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`p-2 rounded-lg transition-all ${cls}`}
        aria-label={label}
      >
        <Icon size={16} />
      </button>
    </Tooltip>
  );

  const renderCell = (col: string, r: Report) => {
    switch (col) {
      case 'tieu_de':
        return (
          <span className="block min-w-0">
            <span className="font-medium text-sm text-foreground line-clamp-2">{r.tieu_de}</span>
            <span className="text-xs text-muted-foreground font-mono">{r.id}</span>
          </span>
        );
      case 'loai':
        return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${r.loai === 'phong_ban' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20' : 'bg-sky-500/10 text-sky-600 border-sky-500/20'}`}>{LOAI_LABEL[r.loai]}</span>;
      case 'ky':
        return <span className="text-sm text-foreground whitespace-nowrap">{periodLabel(r)}</span>;
      case 'phong_ban':
        return <span className="text-sm text-foreground">{r.ten_phong_ban ?? '—'}</span>;
      case 'nguoi_lap':
        return <span className="text-sm text-foreground">{r.ten_nguoi_lap || r.nguoi_lap}</span>;
      case 'phan_tram':
        return <CompletionBar value={r.phan_tram ?? 0} />;
      case 'trang_thai':
        return <PlanStatusBadge status={r.trang_thai} />;
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(r.tg_cap_nhat)}</span>;
      case 'actions':
        return r.quyen.sua ? (
          <div className="flex items-center justify-center gap-1">
            {iconBtn('Sửa', 'text-primary hover:bg-primary/10', () => onEdit(r), SquarePen)}
            {iconBtn('Xóa', 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30', () => onDelete(r), Trash2)}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  const renderCard = (r: Report, selected: boolean) => (
    <div role="button" tabIndex={0} onClick={() => onView(r)} onKeyDown={(e) => e.key === 'Enter' && onView(r)} className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${selected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="h-11 w-11 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-700 shrink-0">
          <FileChartColumn size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{r.tieu_de}</h4>
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <input type="checkbox" checked={selected} onChange={() => list.toggleSelection(r.id)} className="w-4 h-4 rounded border-border accent-primary cursor-pointer" aria-label="Chọn" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{periodLabel(r)}</span>
            <PlanStatusBadge status={r.trang_thai} />
          </div>
        </div>
      </div>
      <CompletionBar value={r.phan_tram ?? 0} className="mb-2" />
      <div className="pt-2.5 border-t border-border text-xs text-muted-foreground">
        {LOAI_LABEL[r.loai]} · {r.ten_phong_ban} · {r.ten_nguoi_lap || r.nguoi_lap}
      </div>
    </div>
  );

  const active = filters.loai.length + filters.loai_ky.length + filters.phong_ban.length + filters.trang_thai.length;
  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <ListToolbar
        selectedCount={selectedIds.size}
        searchTerm={searchTerm}
        onSearchChange={list.setSearchTerm}
        onClearSelection={clearSelection}
        searchPlaceholder="Tìm theo tiêu đề, mã, người lập..."
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex">
              <DataSourceBadge source={source} tab="22. BaoCao_DanhSach" isLoading={isLoading} />
            </span>
            <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
              <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Lập báo cáo</span>
            </Button>
          </div>
        }
        filters={
          <>
            <MultiSelectFilter options={loaiOptions} value={filters.loai} onChange={(v) => setFilter('loai', v)} placeholder="Loại" icon={Layers} className="w-full sm:w-[120px]" />
            <MultiSelectFilter options={kyOptions} value={filters.loai_ky} onChange={(v) => setFilter('loai_ky', v)} placeholder="Kỳ" icon={CalendarRange} className="w-full sm:w-[110px]" />
            <MultiSelectFilter options={deptOptions} value={filters.phong_ban} onChange={(v) => setFilter('phong_ban', v)} placeholder="Phòng ban" icon={Building2} className="w-full sm:w-[160px]" />
            <MultiSelectFilter options={statusOptions} value={filters.trang_thai} onChange={(v) => setFilter('trang_thai', v)} placeholder="Trạng thái" icon={CircleDot} className="w-full sm:w-[130px]" />
          </>
        }
        filterGroups={groups}
        onAdd={onAdd}
        activeFilterCount={active}
        onClearAllFilters={() => (['loai', 'loai_ky', 'phong_ban', 'trang_thai'] as const).forEach((k) => setFilter(k, []))}
        columns={list.columns}
        onToggleColumn={list.toggleColumn}
        onReorderColumns={list.reorderColumns}
        onResetColumns={list.resetColumns}
        showBack
      />
      <div className="flex-1 min-h-0">
        <DataTable
          data={sorted}
          columns={list.columns}
          isLoading={isLoading}
          loadingText="Đang tải báo cáo..."
          selectedIds={selectedIds}
          onToggleSelection={list.toggleSelection}
          onToggleAll={list.toggleAllSelection}
          page={list.pagination.page}
          pageSize={list.pagination.pageSize}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          sort={sort}
          onSort={list.setSort}
          onResizeColumn={list.resizeColumn}
          renderCell={renderCell}
          renderMobileCard={renderCard}
          keyExtractor={(r) => r.id}
          onRowClick={onView}
          emptyTitle="Chưa có báo cáo nào"
          emptyDescription='Bấm "Lập báo cáo" để tạo báo cáo tuần hoặc tháng.'
        />
      </div>
    </div>
  );
}
