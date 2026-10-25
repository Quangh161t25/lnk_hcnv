import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Briefcase, Funnel, Plus, SquarePen, Tag, Trash2, User } from 'lucide-react';
import { t, LOCALE } from '@/lib/i18n';
import { formatDateTime } from '@/lib/format';
import { extractYear } from '@/lib/utils';
import { filterItems } from '@/stores/createListStore';
import { useConfirm } from '@/stores/confirm';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import type { FilterGroup } from '@/components/data/MobileFilterSheet';
import { BADGE, sourceBadgeColor, statusBadgeColor } from '../tuyen-dung/badges';
import {
  deXuatLabel,
  useDeXuatTuyenDung,
  useDeleteLichPhongVan,
  useDeleteUngVien,
  useKenhTuyenDung,
  useTrangThaiUngVien,
  useUngVien,
  type LichPhongVan,
  type UngVien,
} from '../tuyen-dung/data';
import { DanhGiaForm, LichPhongVanDetail, LichPhongVanForm } from '../lich-phong-van/components';
import { useUngVienList, type UngVienFilters } from './store';
import { UngVienForm } from './UngVienForm';
import { UngVienDetail } from './UngVienDetail';

function Toolbar({ items, onAdd, onDeleteMany }: { items: UngVien[]; onAdd: () => void; onDeleteMany: (ids: string[]) => void }) {
  const { data: proposals = [] } = useDeXuatTuyenDung();
  const { data: statuses = [] } = useTrangThaiUngVien();
  const { data: sources = [] } = useKenhTuyenDung();
  const { searchTerm, setSearchTerm, filters, setFilter, columns, toggleColumn, reorderColumns, resetColumns, selectedIds, clearSelection } = useUngVienList();
  const activeCount = filters.id_trang_thai_ung_vien.length + filters.id_de_xuat_tuyen_dung.length + filters.id_kenh_tuyen_dung.length;
  const clearAll = () => {
    setFilter('id_trang_thai_ung_vien', []);
    setFilter('id_de_xuat_tuyen_dung', []);
    setFilter('id_kenh_tuyen_dung', []);
  };

  const statusOptions = useMemo(
    () => statuses.map((s) => ({ label: s.ten, value: s.id, count: items.filter((i) => i.id_trang_thai_ung_vien === s.id).length })),
    [statuses, items],
  );
  const proposalOptions = useMemo(
    () => proposals.map((p) => ({ label: deXuatLabel(p), value: p.id, count: items.filter((i) => i.id_de_xuat_tuyen_dung === p.id).length })),
    [proposals, items],
  );
  const sourceOptions = useMemo(
    () => sources.map((s) => ({ label: s.ten, value: s.id, count: items.filter((i) => i.id_kenh_tuyen_dung === s.id).length })),
    [sources, items],
  );

  const groups: FilterGroup[] = [
    { key: 'id_trang_thai_ung_vien', label: t('ungVien.filterTrangThai'), icon: Tag, options: statusOptions, value: filters.id_trang_thai_ung_vien, onChange: (v) => setFilter('id_trang_thai_ung_vien', v) },
    { key: 'id_de_xuat_tuyen_dung', label: t('ungVien.filterViTri'), icon: Briefcase, options: proposalOptions, value: filters.id_de_xuat_tuyen_dung, onChange: (v) => setFilter('id_de_xuat_tuyen_dung', v) },
    { key: 'id_kenh_tuyen_dung', label: t('ungVien.filterNguon'), icon: Funnel, options: sourceOptions, value: filters.id_kenh_tuyen_dung, onChange: (v) => setFilter('id_kenh_tuyen_dung', v) },
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
          <span className="hidden sm:inline">{t('ungVien.add')}</span>
        </Button>
      }
      filters={
        <>
          <MultiSelectFilter options={statusOptions} value={filters.id_trang_thai_ung_vien} onChange={(v) => setFilter('id_trang_thai_ung_vien', v)} placeholder={t('ungVien.filterTrangThai')} icon={Tag} className="w-full sm:w-[140px]" />
          <MultiSelectFilter options={proposalOptions} value={filters.id_de_xuat_tuyen_dung} onChange={(v) => setFilter('id_de_xuat_tuyen_dung', v)} placeholder={t('ungVien.filterViTri')} icon={Briefcase} className="w-full sm:w-[180px]" />
          <MultiSelectFilter options={sourceOptions} value={filters.id_kenh_tuyen_dung} onChange={(v) => setFilter('id_kenh_tuyen_dung', v)} placeholder={t('ungVien.filterNguon')} icon={Funnel} className="w-full sm:w-[140px]" />
        </>
      }
      filterGroups={groups}
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

function Table({ data, isLoading, onEdit, onDelete, onView }: { data: UngVien[]; isLoading: boolean; onEdit: (r: UngVien) => void; onDelete: (id: string) => void; onView: (r: UngVien) => void }) {
  const { columns, pagination, setPage, setPageSize, selectedIds, toggleSelection, toggleAllSelection, sort, setSort, resizeColumn } = useUngVienList();
  const none = t('ungVien.noValue');

  const renderCell = (col: string, r: UngVien) => {
    switch (col) {
      case 'ho_ten':
        return <span className="font-medium text-sm text-foreground">{r.ho_ten}</span>;
      case 'email':
        return <span className="text-sm text-foreground truncate max-w-[220px] block">{r.email}</span>;
      case 'so_dien_thoai':
        return <span className="text-sm text-muted-foreground tabular-nums">{r.so_dien_thoai || none}</span>;
      case 'nam_sinh':
        return <span className="text-sm text-muted-foreground tabular-nums">{extractYear(r.ngay_sinh) ?? none}</span>;
      case 'vi_tri_ung_tuyen':
        return (
          <span className="text-sm text-foreground">
            {r.ma_de_xuat ?? none}
            {r.ten_chuc_vu ? <span className="text-muted-foreground text-xs block">{r.ten_chuc_vu}</span> : null}
          </span>
        );
      case 'trang_thai':
        return <span className={`${BADGE} ${statusBadgeColor(r.id_trang_thai_ung_vien)}`}>{r.ten_trang_thai ?? none}</span>;
      case 'nguon':
        return r.id_kenh_tuyen_dung ? (
          <span className={`${BADGE} ${sourceBadgeColor(r.id_kenh_tuyen_dung)}`}>{r.ten_kenh_tuyen_dung ?? none}</span>
        ) : (
          <span className="text-sm text-muted-foreground">{none}</span>
        );
      case 'ngay_phong_van_gan_nhat':
        return r.ngay_phong_van_gan_nhat ? (
          <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(r.ngay_phong_van_gan_nhat)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">{none}</span>
        );
      case 'ket_qua_phan_hoi_gan_nhat':
        return <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">{r.ket_qua_phan_hoi_gan_nhat || none}</span>;
      case 'tg_tao':
        return <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(r.tg_tao)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={t('common.edit')} placement="left">
              <button
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
      default:
        return null;
    }
  };

  const renderCard = (r: UngVien, selected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(r)}
      onKeyDown={(e) => e.key === 'Enter' && onView(r)}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${selected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <User size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{r.ho_ten}</h4>
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleSelection(r.id)}
                className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                aria-label={t('common.select')}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground truncate">{r.email}</span>
            <span className={`${BADGE} ${statusBadgeColor(r.id_trang_thai_ung_vien)}`}>{r.ten_trang_thai ?? none}</span>
            {r.id_kenh_tuyen_dung && <span className={`${BADGE} ${sourceBadgeColor(r.id_kenh_tuyen_dung)}`}>{r.ten_kenh_tuyen_dung ?? none}</span>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
        <p className="text-muted-foreground mb-0.5">{t('ungVien.store.viTriCol')}</p>
        <p className="font-medium text-foreground">
          {r.ma_de_xuat ?? none} {r.ten_chuc_vu ? `· ${r.ten_chuc_vu}` : ''}
        </p>
      </div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs">
          {r.ngay_phong_van_gan_nhat ? formatDateTime(r.ngay_phong_van_gan_nhat) : none} · {formatDateTime(r.tg_tao)}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(r);
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
              onDelete(r.id);
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

function matches(r: UngVien, search: string, f: UngVienFilters) {
  const q = search.toLowerCase();
  const text = !search || r.ho_ten.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (!!r.so_dien_thoai && r.so_dien_thoai.toLowerCase().includes(q));
  const status = f.id_trang_thai_ung_vien.length === 0 || f.id_trang_thai_ung_vien.includes(r.id_trang_thai_ung_vien);
  const proposal = f.id_de_xuat_tuyen_dung.length === 0 || f.id_de_xuat_tuyen_dung.includes(r.id_de_xuat_tuyen_dung);
  const source = f.id_kenh_tuyen_dung.length === 0 || (r.id_kenh_tuyen_dung != null && f.id_kenh_tuyen_dung.includes(r.id_kenh_tuyen_dung));
  return text && status && proposal && source;
}

function sortValue(r: UngVien, col: string): string {
  if (col === 'vi_tri_ung_tuyen') return r.ma_de_xuat ?? '';
  if (col === 'nam_sinh') {
    const y = extractYear(r.ngay_sinh);
    return y != null ? String(y) : '';
  }
  if (col === 'nguon') return r.ten_kenh_tuyen_dung ?? '';
  if (col === 'trang_thai') return r.ten_trang_thai ?? '';
  const v = (r as unknown as Record<string, unknown>)[col];
  return v == null ? '' : String(v);
}

/** Tab "Danh sách" của Ứng viên: bảng + các ngăn kéo form/chi tiết/lịch phỏng vấn. */
export function UngVienList() {
  const confirm = useConfirm();
  const { searchTerm, filters, sort, resetState, clearSelection } = useUngVienList();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UngVien | null>(null);
  const [viewing, setViewing] = useState<UngVien | null>(null);
  const [reopenAfterEdit, setReopenAfterEdit] = useState<string | null>(null);
  const [viewingLich, setViewingLich] = useState<LichPhongVan | null>(null);
  const [lichFormOpen, setLichFormOpen] = useState(false);
  const [editingLich, setEditingLich] = useState<LichPhongVan | null>(null);
  const [lichForCandidate, setLichForCandidate] = useState<string | null | undefined>(null);
  const [danhGia, setDanhGia] = useState<LichPhongVan | null>(null);
  const { data: rows = [], isLoading } = useUngVien();
  const remove = useDeleteUngVien();
  const removeLich = useDeleteLichPhongVan();

  useEffect(() => () => resetState(), [resetState]);

  const filtered = useMemo(() => filterItems(rows, searchTerm, filters, matches), [rows, searchTerm, filters]);
  const sorted = useMemo(() => {
    if (!sort.column || !sort.direction) return filtered;
    const col = sort.column;
    return [...filtered].sort((a, b) => {
      const c = sortValue(a, col).localeCompare(sortValue(b, col), LOCALE);
      return sort.direction === 'desc' ? -c : c;
    });
  }, [filtered, sort]);

  const view = (r: UngVien) => {
    setEditing(null);
    setFormOpen(false);
    setViewing(r);
  };
  const edit = useCallback(
    (r: UngVien) => {
      setEditing(r);
      setFormOpen(true);
      if (viewing?.id === r.id) {
        setReopenAfterEdit(r.id);
        setViewing(null);
      } else {
        setViewing(null);
        setReopenAfterEdit(null);
      }
    },
    [viewing],
  );
  const askDelete = (id: string) =>
    confirm({
      title: t('ungVien.deleteTitle'),
      message: t('ungVien.deleteMessage'),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: () => remove.mutate([id], { onSuccess: () => viewing?.id === id && setViewing(null) }),
    });
  const askDeleteMany = (ids: string[]) =>
    confirm({
      title: t('ungVien.bulkDeleteTitle'),
      message: t('ungVien.bulkDeleteMessage', { count: ids.length }),
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
    const id = editing?.id;
    setFormOpen(false);
    setEditing(null);
    setReopenAfterEdit(null);
    if (reopen && id) setViewing(rows.find((r) => r.id === id) ?? null);
  };

  // Giữ dữ liệu chi tiết luôn mới nhất sau khi cập nhật (vd. xóa tài liệu).
  const viewingFresh = viewing ? (rows.find((r) => r.id === viewing.id) ?? viewing) : null;

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
        <Table data={sorted} isLoading={isLoading} onEdit={edit} onDelete={askDelete} onView={view} />
      </div>
      <AnimatePresence>{formOpen && <UngVienForm initialData={editing} onClose={closeForm} />}</AnimatePresence>
      <AnimatePresence>
        {viewingFresh && !formOpen && (
          <UngVienDetail
            data={viewingFresh}
            onClose={() => setViewing(null)}
            onEdit={edit}
            onDelete={(id) => {
              setViewing(null);
              askDelete(id);
            }}
            onAddLichPhongVan={() => {
              setLichForCandidate(viewingFresh.id);
              setEditingLich(null);
              setLichFormOpen(true);
            }}
            onViewLichPhongVan={setViewingLich}
            onEditLichPhongVan={(l) => {
              setEditingLich(l);
              setLichForCandidate(undefined);
              setLichFormOpen(true);
            }}
            onDeleteLichPhongVan={(l) =>
              confirm({
                title: t('lichPhongVan.deleteTitle'),
                message: t('lichPhongVan.deleteMessage'),
                variant: 'danger',
                confirmText: t('common.delete'),
                onConfirm: () => removeLich.mutate([l.id], { onSuccess: () => viewingLich?.id === l.id && setViewingLich(null) }),
              })
            }
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {viewingLich && (
          <LichPhongVanDetail
            data={viewingLich}
            onClose={() => setViewingLich(null)}
            onEdit={(l) => {
              setViewingLich(null);
              setEditingLich(l);
              setLichForCandidate(undefined);
              setLichFormOpen(true);
            }}
            onDelete={(id) => removeLich.mutate([id], { onSuccess: () => setViewingLich(null) })}
            onOpenDanhGia={setDanhGia}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {lichFormOpen && (
          <LichPhongVanForm
            initialData={editingLich}
            initialIdUngVien={lichForCandidate ?? undefined}
            onClose={() => {
              setLichFormOpen(false);
              setEditingLich(null);
              setLichForCandidate(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {danhGia && (
          <DanhGiaForm
            initialData={danhGia}
            onClose={() => setDanhGia(null)}
            onSuccess={(row) => {
              if (viewingLich?.id === row.id) setViewingLich(row);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
