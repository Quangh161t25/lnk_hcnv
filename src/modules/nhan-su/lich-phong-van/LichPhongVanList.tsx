import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Calendar, CircleDot, Plus, SquarePen, Trash2, User, Video, X } from 'lucide-react';
import { t, LOCALE } from '@/lib/i18n';
import { formatDate, formatDateTime } from '@/lib/format';
import { createListStore, filterItems } from '@/stores/createListStore';
import { useConfirm } from '@/stores/confirm';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import type { FilterGroup } from '@/components/data/MobileFilterSheet';
import { LPV_DANH_GIA, LPV_TRANG_THAI, useDeleteLichPhongVan, useLichPhongVan, useUngVien, type LichPhongVan } from '../tuyen-dung/data';
import { DANH_GIA_COLOR, DanhGiaForm, HINH_THUC_COLOR, LichPhongVanDetail, LichPhongVanForm, TRANG_THAI_COLOR, hinhThucLabel, ketQuaColor } from './components';

interface Filters {
  id_ung_vien: string[];
  ngay_tu: string;
  ngay_den: string;
  hinh_thuc: string[];
  trang_thai: string[];
}

export const useLichList = createListStore<Filters>({ id_ung_vien: [], ngay_tu: '', ngay_den: '', hinh_thuc: [], trang_thai: [] }, [
  { id: 'ten_ung_vien', label: t('lichPhongVan.store.ungVienCol'), visible: true, minWidth: 140, maxWidth: 240 },
  { id: 'so_vong', label: t('lichPhongVan.store.soVongCol'), visible: true, minWidth: 72 },
  { id: 'ngay', label: t('lichPhongVan.store.ngayCol'), visible: true, minWidth: 118 },
  { id: 'gio', label: t('lichPhongVan.store.gioCol'), visible: true, minWidth: 64 },
  { id: 'hinh_thuc', label: t('lichPhongVan.store.hinhThucCol'), visible: true, minWidth: 100 },
  { id: 'dia_diem', label: t('lichPhongVan.store.diaDiemCol'), visible: true, minWidth: 160, maxWidth: 280 },
  { id: 'trang_thai', label: t('lichPhongVan.store.trangThaiCol'), visible: true, minWidth: 116 },
  { id: 'trang_thai_danh_gia', label: t('lichPhongVan.store.trangThaiDanhGiaCol'), visible: true, minWidth: 132 },
  { id: 'ket_qua', label: t('lichPhongVan.store.ketQuaCol'), visible: true, minWidth: 100, maxWidth: 180 },
  { id: 'tg_cap_nhat', label: t('lichPhongVan.store.updatedCol'), visible: true, minWidth: 128 },
]);

const BADGE = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap';
const HINH_THUC = [
  { value: 'online', labelKey: 'lichPhongVan.hinhThuc.online' },
  { value: 'offline', labelKey: 'lichPhongVan.hinhThuc.offline' },
];
const dateInput =
  'h-9 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 min-w-0 max-w-[140px]';

function Toolbar({ items, onAdd, onDeleteMany }: { items: LichPhongVan[]; onAdd: () => void; onDeleteMany: (ids: string[]) => void }) {
  const { data: candidates = [] } = useUngVien();
  const { searchTerm, setSearchTerm, filters: f, setFilter, columns, toggleColumn, reorderColumns, resetColumns, selectedIds, clearSelection } = useLichList();
  const activeCount = f.id_ung_vien.length + f.hinh_thuc.length + f.trang_thai.length + (f.ngay_tu ? 1 : 0) + (f.ngay_den ? 1 : 0);
  const candidateOptions = useMemo(() => candidates.map((c) => ({ label: c.ho_ten, value: c.id, count: items.filter((i) => i.id_ung_vien === c.id).length })), [candidates, items]);
  const formatOptions = useMemo(() => HINH_THUC.map((h) => ({ label: t(h.labelKey), value: h.value, count: items.filter((i) => i.hinh_thuc === h.value).length })), [items]);
  const statusOptions = useMemo(() => LPV_TRANG_THAI.map((s) => ({ label: s, value: s, count: items.filter((i) => i.trang_thai === s).length })), [items]);
  const hasDate = !!(f.ngay_tu || f.ngay_den);
  const dateChip =
    f.ngay_tu && f.ngay_den
      ? t('lichPhongVan.filterDateRange', { from: formatDate(f.ngay_tu), to: formatDate(f.ngay_den) })
      : f.ngay_tu
        ? t('lichPhongVan.filterFromDate', { date: formatDate(f.ngay_tu) })
        : f.ngay_den
          ? t('lichPhongVan.filterToDate', { date: formatDate(f.ngay_den) })
          : '';

  const groups: FilterGroup[] = [
    { key: 'id_ung_vien', label: t('lichPhongVan.filterUngVien'), icon: User, options: candidateOptions, value: f.id_ung_vien, onChange: (v) => setFilter('id_ung_vien', v) },
    { key: 'hinh_thuc', label: t('lichPhongVan.filterHinhThuc'), icon: Video, options: formatOptions, value: f.hinh_thuc, onChange: (v) => setFilter('hinh_thuc', v) },
    { key: 'trang_thai', label: t('lichPhongVan.filterTrangThai'), icon: CircleDot, options: statusOptions, value: f.trang_thai, onChange: (v) => setFilter('trang_thai', v) },
  ];

  return (
    <ListToolbar
      selectedCount={selectedIds.size}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={
        <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('lichPhongVan.add')}</span>
        </Button>
      }
      filters={
        <>
          <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
            <div className="flex items-center gap-1.5">
              <input type="date" value={f.ngay_tu} onChange={(e) => setFilter('ngay_tu', e.target.value)} className={dateInput} aria-label={t('lichPhongVan.filterNgay')} />
              <span className="text-muted-foreground text-xs">–</span>
              <input type="date" value={f.ngay_den} onChange={(e) => setFilter('ngay_den', e.target.value)} className={dateInput} aria-label={t('lichPhongVan.filterNgay')} />
            </div>
            {hasDate && (
              <span className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium shrink-0">
                <Calendar size={12} className="shrink-0" />
                <span className="truncate max-w-[180px]">{dateChip}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilter('ngay_tu', '');
                    setFilter('ngay_den', '');
                  }}
                  className="p-0.5 rounded hover:bg-primary/20 transition-colors"
                  aria-label={t('common.clearFilter')}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </span>
            )}
          </div>
          <MultiSelectFilter options={candidateOptions} value={f.id_ung_vien} onChange={(v) => setFilter('id_ung_vien', v)} placeholder={t('lichPhongVan.filterUngVien')} icon={User} className="w-full sm:w-[160px]" />
          <MultiSelectFilter options={formatOptions} value={f.hinh_thuc} onChange={(v) => setFilter('hinh_thuc', v)} placeholder={t('lichPhongVan.filterHinhThuc')} icon={Video} className="w-full sm:w-[120px]" />
          <MultiSelectFilter options={statusOptions} value={f.trang_thai} onChange={(v) => setFilter('trang_thai', v)} placeholder={t('lichPhongVan.filterTrangThai')} icon={CircleDot} className="w-full sm:w-[130px]" />
        </>
      }
      filterGroups={groups}
      onAdd={onAdd}
      activeFilterCount={activeCount}
      onClearAllFilters={() => {
        setFilter('id_ung_vien', []);
        setFilter('ngay_tu', '');
        setFilter('ngay_den', '');
        setFilter('hinh_thuc', []);
        setFilter('trang_thai', []);
      }}
      onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
}

const statusBadge = (s: string) => <span className={`${BADGE} ${TRANG_THAI_COLOR[s as keyof typeof TRANG_THAI_COLOR] ?? 'bg-muted text-muted-foreground border-border'}`}>{s}</span>;

function Table({ data, isLoading, onEdit, onDelete, onView }: { data: LichPhongVan[]; isLoading: boolean; onEdit: (r: LichPhongVan) => void; onDelete: (id: string) => void; onView: (r: LichPhongVan) => void }) {
  const { columns, pagination, setPage, setPageSize, selectedIds, toggleSelection, toggleAllSelection, sort, setSort, resizeColumn } = useLichList();

  const renderCell = (col: string, v: LichPhongVan) => {
    switch (col) {
      case 'ten_ung_vien':
        return (
          <span className="font-medium text-sm text-foreground block min-w-0 truncate" title={v.ten_ung_vien ?? undefined}>
            {v.ten_ung_vien ?? '—'}
          </span>
        );
      case 'so_vong':
        return <span className="text-sm tabular-nums text-foreground whitespace-nowrap">{v.so_vong}</span>;
      case 'ngay':
        return <span className="text-sm text-foreground tabular-nums whitespace-nowrap">{v.ngay}</span>;
      case 'gio':
        return <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">{v.gio}</span>;
      case 'hinh_thuc':
        return <span className={`${BADGE} ${HINH_THUC_COLOR[v.hinh_thuc] ?? HINH_THUC_COLOR.offline}`}>{hinhThucLabel(v.hinh_thuc)}</span>;
      case 'dia_diem':
        return (
          <span className="text-sm text-foreground line-clamp-2 min-w-0 block break-words" title={v.dia_diem || undefined}>
            {v.dia_diem || '—'}
          </span>
        );
      case 'trang_thai':
        return statusBadge(v.trang_thai);
      case 'trang_thai_danh_gia': {
        const d = v.trang_thai_danh_gia ?? LPV_DANH_GIA[0];
        return <span className={`${BADGE} ${DANH_GIA_COLOR[d] ?? 'bg-muted text-muted-foreground border-border'}`}>{d}</span>;
      }
      case 'ket_qua':
        return (
          <span className={`${BADGE} max-w-full min-w-0 truncate ${ketQuaColor(v.ket_qua)}`} title={v.ket_qua ?? undefined}>
            {v.ket_qua || '—'}
          </span>
        );
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{formatDateTime(v.tg_cap_nhat)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={t('common.edit')} placement="left">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(v);
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                aria-label={t('common.edit')}
              >
                <SquarePen size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t('common.delete')} placement="left">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(v.id);
                }}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                aria-label={t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCard = (y: LichPhongVan, selected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(y)}
      onKeyDown={(e) => e.key === 'Enter' && onView(y)}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${selected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Calendar size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">
              {y.ten_ung_vien ?? '—'} · {t('lichPhongVan.store.soVongCol')} {y.so_vong}
            </h4>
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <input type="checkbox" checked={selected} onChange={() => toggleSelection(y.id)} className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer" aria-label={t('common.select')} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {y.ngay} {y.gio}
            </span>
            {statusBadge(y.trang_thai)}
          </div>
        </div>
      </div>
      <div className="text-body-sm text-muted-foreground mb-3 flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${HINH_THUC_COLOR[y.hinh_thuc] ?? HINH_THUC_COLOR.offline}`}>{hinhThucLabel(y.hinh_thuc)}</span>
        <span>{y.dia_diem || '—'}</span>
      </div>
      <div className="flex justify-end gap-1.5 pt-2.5 border-t border-border">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(y);
          }}
          className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all"
          aria-label={t('common.edit')}
        >
          <SquarePen size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(y.id);
          }}
          className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 rounded-lg transition-all"
          aria-label={t('common.delete')}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

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
      keyExtractor={(r) => r.id}
      onRowClick={onView}
    />
  );
}

function matches(r: LichPhongVan, search: string, f: Filters) {
  const q = search.toLowerCase();
  const text = !search || !!r.ten_ung_vien?.toLowerCase().includes(q) || !!r.dia_diem?.toLowerCase().includes(q) || !!r.ma_de_xuat?.toLowerCase().includes(q);
  return (
    text &&
    (f.id_ung_vien.length === 0 || f.id_ung_vien.includes(r.id_ung_vien)) &&
    (!f.ngay_tu || r.ngay >= f.ngay_tu) &&
    (!f.ngay_den || r.ngay <= f.ngay_den) &&
    (f.hinh_thuc.length === 0 || f.hinh_thuc.includes(r.hinh_thuc)) &&
    (f.trang_thai.length === 0 || f.trang_thai.includes(r.trang_thai))
  );
}

/** Tab "Danh sách" của Lịch phỏng vấn. */
export function LichPhongVanList() {
  const confirm = useConfirm();
  const { searchTerm, filters, sort, resetState, clearSelection } = useLichList();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LichPhongVan | null>(null);
  const [viewing, setViewing] = useState<LichPhongVan | null>(null);
  const [reopenAfterEdit, setReopenAfterEdit] = useState<string | null>(null);
  const [danhGia, setDanhGia] = useState<LichPhongVan | null>(null);
  const { data: rows = [], isLoading } = useLichPhongVan();
  const remove = useDeleteLichPhongVan();

  useEffect(() => () => resetState(), [resetState]);

  const filtered = useMemo(() => filterItems(rows, searchTerm, filters, matches), [rows, searchTerm, filters]);
  const sorted = useMemo(() => {
    if (!sort.column || !sort.direction) return filtered;
    const col = sort.column;
    return [...filtered].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[col] ?? '';
      const bv = (b as unknown as Record<string, unknown>)[col] ?? '';
      const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), LOCALE);
      return sort.direction === 'desc' ? -c : c;
    });
  }, [filtered, sort]);

  const edit = useCallback(
    (r: LichPhongVan) => {
      setEditing(r);
      setFormOpen(true);
      setReopenAfterEdit(viewing?.id === r.id ? r.id : null);
      setViewing(null);
    },
    [viewing],
  );
  const askDelete = (id: string) =>
    confirm({
      title: t('lichPhongVan.deleteTitle'),
      message: t('lichPhongVan.deleteMessage'),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: () => remove.mutate([id], { onSuccess: () => viewing?.id === id && setViewing(null) }),
    });
  const askDeleteMany = (ids: string[]) =>
    confirm({
      title: t('lichPhongVan.bulkDeleteTitle'),
      message: t('lichPhongVan.bulkDeleteMessage', { count: ids.length }),
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
  const closeForm = () => {
    const reopen = reopenAfterEdit;
    setFormOpen(false);
    setEditing(null);
    setReopenAfterEdit(null);
    if (reopen) setViewing(rows.find((r) => r.id === reopen) ?? null);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Toolbar
        items={rows}
        onAdd={() => {
          setViewing(null);
          setEditing(null);
          setFormOpen(true);
        }}
        onDeleteMany={askDeleteMany}
      />
      <div className="flex-1 min-h-0">
        <Table data={sorted} isLoading={isLoading} onEdit={edit} onDelete={askDelete} onView={setViewing} />
      </div>
      <AnimatePresence>{formOpen && <LichPhongVanForm initialData={editing} onClose={closeForm} />}</AnimatePresence>
      <AnimatePresence>
        {viewing && !formOpen && (
          <LichPhongVanDetail
            data={viewing}
            onClose={() => setViewing(null)}
            onEdit={edit}
            onDelete={(id) => {
              setViewing(null);
              askDelete(id);
            }}
            onOpenDanhGia={setDanhGia}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {danhGia && <DanhGiaForm initialData={danhGia} onClose={() => setDanhGia(null)} onSuccess={(row) => viewing?.id === row.id && setViewing(row)} />}
      </AnimatePresence>
    </div>
  );
}
