import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Briefcase, ExternalLink, Funnel, Plus, SquarePen, Trash2 } from 'lucide-react';
import { t, LOCALE } from '@/lib/i18n';
import { formatDateTime } from '@/lib/format';
import { createListStore, filterItems } from '@/stores/createListStore';
import { useConfirm } from '@/stores/confirm';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import type { FilterGroup } from '@/components/data/MobileFilterSheet';
import { usePositions } from '@/modules/shared/orgData';
import { useChangeDeXuatStatusMany, useDeleteDeXuat, useDeleteUngVien, useDeXuatWithCounts, type DeXuatWithCounts, type UngVien } from '../tuyen-dung/data';
import { UngVienDetail } from '../ung-vien/UngVienDetail';
import { UngVienForm } from '../ung-vien/UngVienForm';
import { DX_STATUS_OPTIONS, DeXuatDetail, DeXuatForm, DxStatusBadge } from './components';

interface Filters {
  status: string[];
  id_chuc_vu: string[];
}

export const useDeXuatList = createListStore<Filters>({ status: [], id_chuc_vu: [] }, [
  { id: 'ma_de_xuat', label: t('deXuatTuyenDung.store.maDeXuatCol'), visible: true, minWidth: 120 },
  { id: 'ten_chuc_vu', label: t('deXuatTuyenDung.store.chucVuCol'), visible: true, minWidth: 160 },
  { id: 'tieu_de', label: t('deXuatTuyenDung.store.tieuDeCol'), visible: true, minWidth: 180, maxWidth: 280 },
  { id: 'mo_ta', label: t('deXuatTuyenDung.store.moTaCol'), visible: true, minWidth: 180, maxWidth: 280 },
  { id: 'so_luong', label: t('deXuatTuyenDung.store.soLuongCol'), visible: true, minWidth: 90 },
  { id: 'so_luong_onboard', label: t('deXuatTuyenDung.store.soLuongOnboardCol'), visible: true, minWidth: 100 },
  { id: 'so_luong_da_nghi', label: t('deXuatTuyenDung.store.soLuongDaNghiCol'), visible: true, minWidth: 100 },
  { id: 'so_luong_con_lai', label: t('deXuatTuyenDung.store.soLuongConLaiCol'), visible: true, minWidth: 100 },
  { id: 'link_tuyen', label: t('deXuatTuyenDung.store.linkCol'), visible: true, minWidth: 90, maxWidth: 100 },
  { id: 'trang_thai', label: t('deXuatTuyenDung.store.statusCol'), visible: true, minWidth: 110 },
  { id: 'tg_tao', label: t('deXuatTuyenDung.store.createdCol'), visible: true, minWidth: 120 },
]);

function Toolbar({ items, onAdd, onDeleteMany, onStatusChangeMany }: { items: DeXuatWithCounts[]; onAdd: () => void; onDeleteMany: (ids: string[]) => void; onStatusChangeMany: (ids: string[], status: string) => void }) {
  const { data: positions = [] } = usePositions();
  const { searchTerm, setSearchTerm, filters, setFilter, columns, toggleColumn, reorderColumns, resetColumns, selectedIds, clearSelection } = useDeXuatList();
  const statusOptions = useMemo(() => DX_STATUS_OPTIONS.map((o) => ({ label: t(o.key), value: o.value, count: items.filter((i) => i.trang_thai === o.value).length })), [items]);
  const positionOptions = useMemo(
    () => positions.filter((p) => p.trang_thai === 'Đang hoạt động').map((p) => ({ label: p.ten_chuc_vu, value: p.id, count: items.filter((i) => i.id_chuc_vu === p.id).length })),
    [positions, items],
  );
  const groups: FilterGroup[] = [
    { key: 'status', label: t('deXuatTuyenDung.filterStatus'), icon: Funnel, options: statusOptions, value: filters.status, onChange: (v) => setFilter('status', v) },
    { key: 'id_chuc_vu', label: t('deXuatTuyenDung.filterChucVu'), icon: Briefcase, options: positionOptions, value: filters.id_chuc_vu, onChange: (v) => setFilter('id_chuc_vu', v) },
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
          <span className="hidden sm:inline">{t('deXuatTuyenDung.add')}</span>
        </Button>
      }
      filters={
        <>
          <MultiSelectFilter options={statusOptions} value={filters.status} onChange={(v) => setFilter('status', v)} placeholder={t('deXuatTuyenDung.filterStatus')} icon={Funnel} className="w-full sm:w-[140px]" />
          <MultiSelectFilter options={positionOptions} value={filters.id_chuc_vu} onChange={(v) => setFilter('id_chuc_vu', v)} placeholder={t('deXuatTuyenDung.filterChucVu')} icon={Briefcase} className="w-full sm:w-[180px]" />
        </>
      }
      filterGroups={groups}
      onAdd={onAdd}
      activeFilterCount={filters.status.length + filters.id_chuc_vu.length}
      onClearAllFilters={() => {
        setFilter('status', []);
        setFilter('id_chuc_vu', []);
      }}
      onDeleteMany={() => onDeleteMany(Array.from(selectedIds))}
      bulkActions={
        selectedIds.size > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {DX_STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => onStatusChangeMany(Array.from(selectedIds), o.value)}
                className="px-2 py-1 text-xs rounded-lg border border-border bg-muted/30 hover:bg-muted/60 text-foreground"
              >
                {t(o.key)}
              </button>
            ))}
          </div>
        )
      }
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
    />
  );
}

function Table({ data, isLoading, onEdit, onDelete, onView }: { data: DeXuatWithCounts[]; isLoading: boolean; onEdit: (r: DeXuatWithCounts) => void; onDelete: (id: string) => void; onView: (r: DeXuatWithCounts) => void }) {
  const { columns, pagination, setPage, setPageSize, selectedIds, toggleSelection, toggleAllSelection, sort, setSort, resizeColumn } = useDeXuatList();

  const renderCell = (col: string, v: DeXuatWithCounts) => {
    switch (col) {
      case 'ma_de_xuat':
        return <span className="font-mono text-sm font-medium text-foreground">{v.ma_de_xuat}</span>;
      case 'ten_chuc_vu':
        return (
          <span className="text-sm text-foreground">
            {v.ten_chuc_vu ?? '—'}
            {v.ten_phong_ban ? <span className="text-muted-foreground text-xs block">{v.ten_phong_ban}</span> : null}
          </span>
        );
      case 'tieu_de':
        return <span className="text-sm text-foreground line-clamp-2 max-w-[280px]">{v.tieu_de || '—'}</span>;
      case 'mo_ta':
        return <span className="text-sm text-muted-foreground line-clamp-2 max-w-[280px]">{v.mo_ta || '—'}</span>;
      case 'so_luong':
        return <span className="text-sm font-medium tabular-nums text-foreground">{v.so_luong}</span>;
      case 'so_luong_onboard':
        return <span className="text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">{v.so_luong_onboard}</span>;
      case 'so_luong_da_nghi':
        return <span className="text-sm font-medium tabular-nums text-amber-600 dark:text-amber-400">{v.so_luong_da_nghi}</span>;
      case 'so_luong_con_lai':
        return <span className="text-sm font-medium tabular-nums text-foreground">{v.so_luong_con_lai}</span>;
      case 'link_tuyen':
        return v.link_tuyen?.trim() ? (
          <a
            href={v.link_tuyen}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={12} />
            {t('deXuatTuyenDung.viewLink')}
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      case 'trang_thai':
        return <DxStatusBadge status={v.trang_thai} />;
      case 'tg_tao':
        return <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(v.tg_tao)}</span>;
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

  const renderCard = (y: DeXuatWithCounts, selected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(y)}
      onKeyDown={(e) => e.key === 'Enter' && onView(y)}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${selected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Briefcase size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{y.ma_de_xuat}</h4>
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <input type="checkbox" checked={selected} onChange={() => toggleSelection(y.id)} className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer" aria-label={t('common.select')} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{y.ten_chuc_vu ?? '—'}</span>
            <DxStatusBadge status={y.trang_thai} />
          </div>
        </div>
      </div>
      {(y.tieu_de || y.mo_ta) && (
        <div className="grid grid-cols-1 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
          {y.tieu_de && (
            <>
              <p className="text-muted-foreground mb-0.5">{t('deXuatTuyenDung.store.tieuDeCol')}</p>
              <p className="font-medium text-foreground line-clamp-2">{y.tieu_de}</p>
            </>
          )}
          {y.mo_ta && (
            <>
              <p className="text-muted-foreground mb-0.5">{t('deXuatTuyenDung.store.moTaCol')}</p>
              <p className="text-foreground line-clamp-2">{y.mo_ta}</p>
            </>
          )}
        </div>
      )}
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs">
          {t('deXuatTuyenDung.store.soLuongCol')}: {y.so_luong} · {t('deXuatTuyenDung.store.soLuongOnboardCol')}: {y.so_luong_onboard} · {t('deXuatTuyenDung.store.soLuongDaNghiCol')}:{' '}
          {y.so_luong_da_nghi} · {t('deXuatTuyenDung.store.soLuongConLaiCol')}: {y.so_luong_con_lai} · {formatDateTime(y.tg_tao)}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(y);
            }}
            className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
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
            className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"
            aria-label={t('common.delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
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

function matches(r: DeXuatWithCounts, search: string, f: Filters) {
  const q = search.toLowerCase();
  const text =
    !search || r.ma_de_xuat.toLowerCase().includes(q) || (!!r.tieu_de && r.tieu_de.toLowerCase().includes(q)) || r.mo_ta.toLowerCase().includes(q) || r.yeu_cau.toLowerCase().includes(q);
  return text && (f.status.length === 0 || f.status.includes(r.trang_thai)) && (f.id_chuc_vu.length === 0 || f.id_chuc_vu.includes(r.id_chuc_vu));
}

const NUMERIC = new Set(['so_luong', 'so_luong_onboard', 'so_luong_da_nghi', 'so_luong_con_lai']);

/** Tab "Danh sách" của Đề xuất tuyển dụng. */
export function DeXuatList() {
  const confirm = useConfirm();
  const { searchTerm, filters, sort, resetState, clearSelection } = useDeXuatList();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DeXuatWithCounts | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [reopenAfterEdit, setReopenAfterEdit] = useState<string | null>(null);
  const [viewingUv, setViewingUv] = useState<UngVien | null>(null);
  const [uvFormOpen, setUvFormOpen] = useState(false);
  const [editingUv, setEditingUv] = useState<UngVien | null>(null);
  const [uvForProposal, setUvForProposal] = useState<string | null>(null);
  const { data: rows, isLoading } = useDeXuatWithCounts();
  const remove = useDeleteDeXuat();
  const changeMany = useChangeDeXuatStatusMany();
  const removeUv = useDeleteUngVien();

  useEffect(() => () => resetState(), [resetState]);

  const filtered = useMemo(() => filterItems(rows, searchTerm, filters, matches), [rows, searchTerm, filters]);
  const sorted = useMemo(() => {
    if (!sort.column || !sort.direction) return filtered;
    const col = sort.column;
    return [...filtered].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[col];
      const bv = (b as unknown as Record<string, unknown>)[col];
      const c = NUMERIC.has(col) ? Number(av ?? 0) - Number(bv ?? 0) : String(av ?? '').localeCompare(String(bv ?? ''), LOCALE);
      return sort.direction === 'desc' ? -c : c;
    });
  }, [filtered, sort]);

  // Luôn lấy bản mới nhất (số lượng ứng viên thay đổi khi thêm/sửa ứng viên).
  const viewing = viewingId ? (rows.find((r) => r.id === viewingId) ?? null) : null;

  const edit = useCallback(
    (r: DeXuatWithCounts) => {
      setEditing(r);
      setFormOpen(true);
      setReopenAfterEdit(viewingId === r.id ? r.id : null);
      setViewingId(null);
    },
    [viewingId],
  );
  const askDelete = (id: string) =>
    confirm({
      title: t('deXuatTuyenDung.deleteTitle'),
      message: t('deXuatTuyenDung.deleteMessage'),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: () => remove.mutate([id], { onSuccess: () => viewingId === id && setViewingId(null) }),
    });
  const askDeleteMany = (ids: string[]) =>
    confirm({
      title: t('deXuatTuyenDung.bulkDeleteTitle'),
      message: t('deXuatTuyenDung.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: t('common.deleteAll'),
      onConfirm: () =>
        remove.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (viewingId && ids.includes(viewingId)) setViewingId(null);
          },
        }),
    });
  const askStatusMany = (ids: string[], status: string) =>
    confirm({
      title: t('deXuatTuyenDung.statusChangeTitle'),
      message: t('deXuatTuyenDung.statusChangeMessage', { count: ids.length, status }),
      variant: 'warning',
      confirmText: t('common.confirm'),
      onConfirm: () => changeMany.mutate({ ids, status }, { onSuccess: () => clearSelection() }),
    });
  const closeForm = () => {
    const reopen = reopenAfterEdit;
    setFormOpen(false);
    setEditing(null);
    setReopenAfterEdit(null);
    if (reopen) setViewingId(reopen);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Toolbar
        items={rows}
        onAdd={() => {
          setViewingId(null);
          setEditing(null);
          setFormOpen(true);
        }}
        onDeleteMany={askDeleteMany}
        onStatusChangeMany={askStatusMany}
      />
      <div className="flex-1 min-h-0">
        <Table data={sorted} isLoading={isLoading} onEdit={edit} onDelete={askDelete} onView={(r) => setViewingId(r.id)} />
      </div>
      <AnimatePresence>{formOpen && <DeXuatForm initialData={editing} onClose={closeForm} />}</AnimatePresence>
      <AnimatePresence>
        {viewing && !formOpen && (
          <DeXuatDetail
            data={viewing}
            onClose={() => setViewingId(null)}
            onEdit={edit}
            onDelete={(id) => {
              setViewingId(null);
              askDelete(id);
            }}
            onAddUngVien={() => {
              setUvForProposal(viewing.id);
              setEditingUv(null);
              setUvFormOpen(true);
            }}
            onViewUngVien={setViewingUv}
            onEditUngVien={(uv) => {
              setEditingUv(uv);
              setUvForProposal(null);
              setUvFormOpen(true);
            }}
            onDeleteUngVien={(uv) =>
              confirm({
                title: t('ungVien.deleteTitle'),
                message: t('ungVien.deleteMessage'),
                variant: 'danger',
                confirmText: t('common.delete'),
                onConfirm: () => removeUv.mutate([uv.id], { onSuccess: () => viewingUv?.id === uv.id && setViewingUv(null) }),
              })
            }
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {viewingUv && (
          <UngVienDetail
            data={viewingUv}
            onClose={() => setViewingUv(null)}
            onEdit={(uv) => {
              setViewingUv(null);
              setEditingUv(uv);
              setUvForProposal(null);
              setUvFormOpen(true);
            }}
            onDelete={() => setViewingUv(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {uvFormOpen && (
          <UngVienForm
            initialData={editingUv}
            initialIdDeXuat={uvForProposal ?? undefined}
            onClose={() => {
              setUvFormOpen(false);
              setEditingUv(null);
              setUvForProposal(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
