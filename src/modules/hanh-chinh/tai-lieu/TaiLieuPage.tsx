import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Building2, FileText, List, Pin, PinOff, Plus, SquarePen, Tag, Trash2 } from 'lucide-react';
import { t, LOCALE } from '@/lib/i18n';
import { formatDate, formatDateTime } from '@/lib/format';
import { filterItems } from '@/stores/createListStore';
import { useConfirm } from '@/stores/confirm';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Tooltip } from '@/components/ui/Tooltip';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import type { FilterGroup } from '@/components/data/MobileFilterSheet';
import { PHONG_BAN_MAP } from '@/modules/shared/orgData';
import { useTabParam } from '@/modules/shared/useTabParam';
import {
  DEFAULT_STATUS_COLOR,
  HUONG_BADGE,
  HUONG_OPTIONS,
  huongLabel,
  useDeleteTaiLieu,
  useLoaiTaiLieu,
  useTaiLieu,
  useTaiLieuPins,
  useTogglePin,
  useTrangThaiTaiLieu,
  type Huong,
  type TaiLieu,
} from './data';
import { useFacetCounts, useTaiLieuList, type TaiLieuFilters } from './store';
import { TaiLieuForm } from './TaiLieuForm';
import { StatusBadge, TaiLieuDetail } from './TaiLieuDetail';

const TABS = ['tat_ca', 'da_ghim'] as const;
type Tab = (typeof TABS)[number];

function Toolbar({
  items,
  onAdd,
  onDeleteMany,
  pinnedOnly,
  onPinnedOnlyChange,
  pinnedCount,
  filterGroups,
  onClearAllFilters,
}: {
  items: TaiLieu[];
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
  pinnedOnly: boolean;
  onPinnedOnlyChange: (v: boolean) => void;
  pinnedCount: number;
  filterGroups: FilterGroup[];
  onClearAllFilters: () => void;
}) {
  const { searchTerm, setSearchTerm, filters, setFilter, columns, toggleColumn, reorderColumns, resetColumns, selectedIds, clearSelection } = useTaiLieuList();
  const { data: loai = [] } = useLoaiTaiLieu();
  const { data: trangThai = [] } = useTrangThaiTaiLieu();
  const counts = useFacetCounts(items, filters);
  const activeCount = (filters.huong ? 1 : 0) + (filters.id_phong_ban ? 1 : 0) + filters.id_loai.length + (filters.id_trang_thai ? 1 : 0);
  const clearAll = () => {
    setFilter('huong', '');
    setFilter('id_phong_ban', '');
    setFilter('id_loai', []);
    setFilter('id_trang_thai', '');
    onPinnedOnlyChange(false);
    onClearAllFilters();
  };
  const huongOptions = HUONG_OPTIONS.map((h) => ({ label: t(h.labelKey), value: h.value, count: counts.huong[h.value] ?? 0 }));
  const phongOptions = Object.entries(PHONG_BAN_MAP).map(([value, label]) => ({ label, value, count: counts.phongBan[value] ?? 0 }));
  const loaiOptions = loai.map((l) => ({ label: l.ten, value: l.id, count: counts.loai[l.id] ?? 0 }));
  const trangThaiOptions = trangThai.map((s) => ({ label: s.ten, value: s.id, count: counts.trangThai[s.id] ?? 0 }));

  return (
    <ListToolbar
      selectedCount={selectedIds.size}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={
        <div className="flex items-center gap-2">
          {pinnedCount > 0 && (
            <button
              type="button"
              onClick={() => onPinnedOnlyChange(!pinnedOnly)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${pinnedOnly ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              <Pin size={14} />
              {t('taiLieu.pinnedOnly')}
            </button>
          )}
          <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3">
            <Plus className="w-4 h-4 mr-1.5" />
            <span className="text-xs">{t('common.add')}</span>
          </Button>
        </div>
      }
      filters={
        <>
          <MultiSelectFilter
            options={huongOptions}
            value={filters.huong ? [filters.huong] : []}
            onChange={(v) => setFilter('huong', v[0] ?? '')}
            placeholder={t('taiLieu.store.huongCol')}
            icon={FileText}
            className="w-full sm:w-[140px]"
          />
          <MultiSelectFilter
            options={phongOptions}
            value={filters.id_phong_ban ? [filters.id_phong_ban] : []}
            onChange={(v) => setFilter('id_phong_ban', v[0] ?? '')}
            placeholder={t('taiLieu.store.phongQuanLyCol')}
            icon={Building2}
            className="w-full sm:w-[180px]"
          />
          <MultiSelectFilter options={loaiOptions} value={filters.id_loai} onChange={(v) => setFilter('id_loai', v)} placeholder={t('taiLieu.store.loaiCol')} icon={List} className="w-full sm:w-[160px]" />
          <MultiSelectFilter
            options={trangThaiOptions}
            value={filters.id_trang_thai ? [filters.id_trang_thai] : []}
            onChange={(v) => setFilter('id_trang_thai', v[0] ?? '')}
            placeholder={t('taiLieu.store.trangThaiCol')}
            icon={Tag}
            className="w-full sm:w-[140px]"
          />
        </>
      }
      filterGroups={filterGroups}
      onAdd={onAdd}
      activeFilterCount={activeCount}
      onClearAllFilters={clearAll}
      onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
}

function Table({
  data,
  isLoading,
  pinnedIds,
  onEdit,
  onDelete,
  onView,
  onTogglePin,
}: {
  data: TaiLieu[];
  isLoading: boolean;
  pinnedIds: Set<string>;
  onEdit: (r: TaiLieu) => void;
  onDelete: (id: string) => void;
  onView: (r: TaiLieu) => void;
  onTogglePin: (id: string) => void;
}) {
  const { columns, pagination, setPage, setPageSize, selectedIds, toggleSelection, toggleAllSelection, sort, setSort, resizeColumn } = useTaiLieuList();

  const renderCell = (col: string, r: TaiLieu) => {
    switch (col) {
      case 'ma_so_trich_yeu':
        return (
          <div className="flex flex-col gap-0.5 min-w-0">
            {r.ma_so && <span className="text-xs font-mono text-muted-foreground truncate">{r.ma_so}</span>}
            <span className="text-sm font-medium text-foreground line-clamp-1">{r.trich_yeu}</span>
          </div>
        );
      case 'huong':
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${HUONG_BADGE[r.huong]}`}>{huongLabel(r.huong)}</span>;
      case 'ten_loai':
        return <span className="text-sm text-foreground">{r.ten_loai || r.ma_loai || '—'}</span>;
      case 'ten_nhom_tai_lieu':
        return <span className="text-sm text-foreground">{r.ten_nhom_tai_lieu || '—'}</span>;
      case 'ten_trang_thai':
        return <StatusBadge name={r.ten_trang_thai} color={r.mau_trang_thai} />;
      case 'ten_phong_ban':
        return <span className="text-sm text-foreground">{r.ten_phong_ban || '—'}</span>;
      case 'phan_quyen': {
        const n = r.id_chuc_vu_xem?.length ?? 0;
        return n === 0 ? (
          <span className="text-xs text-muted-foreground">{t('taiLieu.phanQuyenEmpty')}</span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">{t('taiLieu.phanQuyenCount', { count: n })}</span>
        );
      }
      case 'so_den':
        return <span className="text-sm font-mono">{r.so_den || '—'}</span>;
      case 'so_di':
        return <span className="text-sm font-mono">{r.so_di || '—'}</span>;
      case 'ngay_den':
        return <span className="text-sm text-muted-foreground">{r.ngay_den ? formatDate(r.ngay_den) : '—'}</span>;
      case 'ngay_ky':
        return <span className="text-sm text-muted-foreground">{r.ngay_ky ? formatDate(r.ngay_ky) : '—'}</span>;
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(r.tg_cap_nhat)}</span>;
      case 'actions': {
        const pinned = pinnedIds.has(r.id);
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={t(pinned ? 'taiLieu.unpin' : 'taiLieu.pin')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(r.id);
                }}
                className={`p-2 rounded-lg transition-all ${pinned ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30' : 'text-muted-foreground hover:bg-muted'}`}
                aria-label={t(pinned ? 'taiLieu.unpin' : 'taiLieu.pin')}
              >
                {pinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
            </Tooltip>
            <Tooltip content={t('common.edit')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(r);
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                aria-label={t('common.edit')}
              >
                <SquarePen size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t('common.delete')} placement="left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(r.id);
                }}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                aria-label={t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderCard = (r: TaiLieu, selected: boolean) => {
    const pinned = pinnedIds.has(r.id);
    const color = r.mau_trang_thai || DEFAULT_STATUS_COLOR;
    const statusStyle = { backgroundColor: `${color}20`, color, borderColor: `${color}40` };
    const huongMobile = r.huong === 'noi_bo' ? 'bg-slate-100 text-slate-700 border-slate-200' : r.huong === 'den' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-violet-50 text-violet-700 border-violet-100';
    return (
      <div className="bg-card rounded-xl border border-border p-3.5 shadow-sm transition-all" onClick={() => onView(r)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <FileText size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex flex-col gap-0.5">
                {r.ma_so && <span className="text-xs font-mono text-muted-foreground truncate">{r.ma_so}</span>}
                <h4 className="font-semibold text-foreground text-sm line-clamp-2">{r.trich_yeu}</h4>
              </div>
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={selected} onChange={() => toggleSelection(r.id)} className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer" aria-label={t('common.select')} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${huongMobile}`}>{huongLabel(r.huong)}</span>
              {r.ten_trang_thai && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border" style={statusStyle}>
                  {r.ten_trang_thai}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{r.ten_loai || r.ma_loai || '—'}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2.5 border-t border-border gap-2">
          <span className="text-muted-foreground text-xs flex items-center gap-1.5 flex-wrap">
            {r.ten_trang_thai && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border" style={statusStyle}>
                {r.ten_trang_thai}
              </span>
            )}
            {r.tg_cap_nhat ? formatDateTime(r.tg_cap_nhat) : '—'}
          </span>
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onTogglePin(r.id)}
              className={`p-2 rounded-lg transition-all ${pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'text-muted-foreground bg-muted/50 hover:bg-muted'}`}
              aria-label={t(pinned ? 'taiLieu.unpin' : 'taiLieu.pin')}
            >
              {pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button type="button" onClick={() => onEdit(r)} className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg" aria-label={t('common.edit')}>
              <SquarePen size={14} />
            </button>
            <button type="button" onClick={() => onDelete(r.id)} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-lg" aria-label={t('common.delete')}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('common.loading')}
      selectedIds={selectedIds}
      onToggleSelection={toggleSelection}
      onToggleAll={toggleAllSelection}
      page={pagination.page}
      pageSize={pagination.pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      sort={sort}
      onSort={setSort}
      onResizeColumn={resizeColumn}
      renderCell={renderCell}
      renderMobileCard={renderCard}
      onRowClick={onView}
      keyExtractor={(r) => r.id}
    />
  );
}

/** Hành chính › Danh sách tài liệu: tab Danh sách + Ghim. */
export default function TaiLieuPage() {
  const confirm = useConfirm();
  const [tab, setTab] = useTabParam<Tab>(TABS, 'tat_ca', true);
  const { searchTerm, filters, sort, resetState, clearSelection, setFilter, resetFilters } = useTaiLieuList();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaiLieu | null>(null);
  const [viewing, setViewing] = useState<TaiLieu | null>(null);
  const [defaultHuong, setDefaultHuong] = useState<Huong>('noi_bo');
  const { data: rows = [], isLoading, isError, error, refetch } = useTaiLieu();
  const { data: pins = [] } = useTaiLieuPins();
  const { data: loai = [] } = useLoaiTaiLieu();
  const { data: trangThai = [] } = useTrangThaiTaiLieu();
  const togglePin = useTogglePin();
  const remove = useDeleteTaiLieu();
  const pinnedIds = useMemo(() => new Set(pins), [pins]);

  useEffect(() => () => resetState(), [resetState]);

  const matches = useCallback(
    (r: TaiLieu, search: string, f: TaiLieuFilters) => {
      if (tab === 'da_ghim' && !pinnedIds.has(r.id)) return false;
      if (f.huong && r.huong !== f.huong) return false;
      if (f.id_phong_ban && r.id_phong_ban !== f.id_phong_ban) return false;
      if (f.id_loai.length > 0 && !f.id_loai.includes(r.id_loai)) return false;
      if (f.id_trang_thai && r.id_trang_thai !== f.id_trang_thai) return false;
      const q = search.toLowerCase();
      return (
        !search ||
        (!!r.ma_so && r.ma_so.toLowerCase().includes(q)) ||
        (!!r.trich_yeu && r.trich_yeu.toLowerCase().includes(q)) ||
        (!!r.so_den && r.so_den.toLowerCase().includes(q)) ||
        (!!r.so_di && r.so_di.toLowerCase().includes(q))
      );
    },
    [tab, pinnedIds],
  );

  const filtered = useMemo(() => filterItems(rows, searchTerm, filters, matches), [rows, searchTerm, filters, matches]);
  const scope = useMemo(() => (tab === 'da_ghim' ? rows.filter((r) => pinnedIds.has(r.id)) : rows), [rows, tab, pinnedIds]);
  const counts = useFacetCounts(scope, filters);
  const sorted = useMemo(() => {
    if (!sort.column || !sort.direction) return filtered;
    const col = sort.column;
    const key = (r: TaiLieu) =>
      col === 'ma_so_trich_yeu' ? [r.ma_so ?? '', r.trich_yeu].filter(Boolean).join(' ') : String((r as unknown as Record<string, unknown>)[col] ?? '');
    return [...filtered].sort((a, b) => {
      const c = key(a).localeCompare(key(b), LOCALE);
      return sort.direction === 'desc' ? -c : c;
    });
  }, [filtered, sort]);

  const clearAllFilters = useCallback(() => {
    resetFilters();
    setTab('tat_ca');
  }, [resetFilters, setTab]);

  const filterGroups: FilterGroup[] = [
    {
      key: 'huong',
      label: t('taiLieu.store.huongCol'),
      icon: FileText,
      options: HUONG_OPTIONS.map((h) => ({ label: t(h.labelKey), value: h.value, count: counts.huong[h.value] ?? 0 })),
      value: filters.huong ? [filters.huong] : [],
      onChange: (v) => setFilter('huong', v[0] ?? ''),
    },
    {
      key: 'id_phong_ban',
      label: t('taiLieu.store.phongQuanLyCol'),
      icon: FileText,
      options: Object.entries(PHONG_BAN_MAP).map(([value, label]) => ({ label, value, count: counts.phongBan[value] ?? 0 })),
      value: filters.id_phong_ban ? [filters.id_phong_ban] : [],
      onChange: (v) => setFilter('id_phong_ban', v[0] ?? ''),
    },
    {
      key: 'id_loai',
      label: t('taiLieu.store.loaiCol'),
      icon: FileText,
      options: loai.map((l) => ({ label: l.ten, value: l.id, count: counts.loai[l.id] ?? 0 })),
      value: filters.id_loai,
      onChange: (v) => setFilter('id_loai', v),
    },
    {
      key: 'id_trang_thai',
      label: t('taiLieu.store.trangThaiCol'),
      icon: FileText,
      options: trangThai.map((s) => ({ label: s.ten, value: s.id, count: counts.trangThai[s.id] ?? 0 })),
      value: filters.id_trang_thai ? [filters.id_trang_thai] : [],
      onChange: (v) => setFilter('id_trang_thai', v[0] ?? ''),
    },
  ];

  const edit = (r: TaiLieu) => {
    setEditing(r);
    setDefaultHuong(r.huong);
    setFormOpen(true);
    if (viewing?.id === r.id) setViewing(null);
  };
  const askDelete = (id: string) =>
    confirm({
      title: t('taiLieu.deleteTitle'),
      message: t('taiLieu.deleteMessage'),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: () => remove.mutate([id], { onSuccess: () => viewing?.id === id && setViewing(null) }),
    });
  const askDeleteMany = (ids: string[]) =>
    confirm({
      title: t('taiLieu.bulkDeleteTitle'),
      message: t('taiLieu.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: t('common.deleteAll'),
      onConfirm: () =>
        remove.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewing && ids.includes(viewing.id)) setViewing(null);
          },
        }),
    });
  const askTogglePin = (id: string) => {
    const pinned = pinnedIds.has(id);
    confirm({
      title: t(pinned ? 'taiLieu.unpinConfirmTitle' : 'taiLieu.pinConfirmTitle'),
      message: t(pinned ? 'taiLieu.unpinConfirmMessage' : 'taiLieu.pinConfirmMessage'),
      variant: 'default',
      onConfirm: () => togglePin.mutate(id),
    });
  };

  const tabs = [
    { id: 'tat_ca' as const, label: t('taiLieu.tabs.danhSach'), icon: FileText },
    { id: 'da_ghim' as const, label: t('taiLieu.tabs.ghim'), icon: Pin },
  ];
  const viewingFresh = viewing ? (rows.find((r) => r.id === viewing.id) ?? viewing) : null;

  if (isError) {
    return (
      <div className="flex flex-col h-page relative">
        <div className="shrink-0 relative z-0">
          <Tabs<Tab> tabs={tabs} activeTab={tab} onChange={setTab} />
        </div>
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6">
          <div className="rounded-xl border border-border bg-card shadow-sm p-6 max-w-md w-full text-center">
            <p className="text-sm text-destructive font-medium mb-1">{t('common.error') || 'Có lỗi khi tải dữ liệu'}</p>
            <p className="text-xs text-muted-foreground mb-4">{error instanceof Error ? error.message : String(error ?? '')}</p>
            <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 font-medium text-sm">
              {t('common.retry') || 'Thử lại'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-page relative">
      <div className="shrink-0 relative z-0">
        <Tabs<Tab> tabs={tabs} activeTab={tab} onChange={setTab} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Toolbar
            items={scope}
            onAdd={() => {
              setEditing(null);
              setDefaultHuong((filters.huong as Huong) || 'noi_bo');
              setFormOpen(true);
            }}
            onDeleteMany={askDeleteMany}
            pinnedOnly={tab === 'da_ghim'}
            onPinnedOnlyChange={(v) => setTab(v ? 'da_ghim' : 'tat_ca')}
            pinnedCount={pins.length}
            filterGroups={filterGroups}
            onClearAllFilters={clearAllFilters}
          />
          <div className="flex-1 min-h-0 overflow-auto px-2 pb-2">
            <Table data={sorted} isLoading={isLoading} pinnedIds={pinnedIds} onEdit={edit} onDelete={askDelete} onView={setViewing} onTogglePin={askTogglePin} />
          </div>
        </div>
      </div>
      <AnimatePresence>
        {formOpen && (
          <TaiLieuForm
            initialData={editing}
            defaultHuong={defaultHuong}
            onClose={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {viewingFresh && (
          <TaiLieuDetail
            data={viewingFresh}
            onClose={() => setViewing(null)}
            onEdit={edit}
            onDelete={(id) => {
              setViewing(null);
              askDelete(id);
            }}
            isPinned={pinnedIds.has(viewingFresh.id)}
            onTogglePin={() => askTogglePin(viewingFresh.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
