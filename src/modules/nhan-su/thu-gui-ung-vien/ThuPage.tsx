import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Download, FileText, Mail, Plus, Printer, SquarePen, Trash2, User } from 'lucide-react';
import { t, LOCALE } from '@/lib/i18n';
import { formatDateTime } from '@/lib/format';
import { exportToExcel } from '@/lib/export';
import { createListStore, filterItems } from '@/stores/createListStore';
import { useConfirm } from '@/stores/confirm';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import type { FilterGroup } from '@/components/data/MobileFilterSheet';
import { useUngVien } from '../tuyen-dung/data';
import { LOAI_THU, loaiThuLabel, useDeleteThu, useThuGuiUngVien, type ThuGuiUngVien } from '../tuyen-dung/settings';
import { LoaiThuBadge, ThuDetail, ThuForm, letterPreviewUrl } from './components';

interface Filters {
  id_ung_vien: string[];
  loai_thu: string[];
}

const useThuList = createListStore<Filters>({ id_ung_vien: [], loai_thu: [] }, [
  { id: 'ten_ung_vien', label: t('thuGuiUngVien.table.ungVien'), visible: true, minWidth: 140, maxWidth: 240 },
  { id: 'loai_thu', label: t('thuGuiUngVien.table.loaiPhieu'), visible: true, minWidth: 140 },
  { id: 'tg_tao', label: t('thuGuiUngVien.table.ngayTao'), visible: true, minWidth: 128 },
]);

function Toolbar({ items, onAdd, onDeleteMany, onExport }: { items: ThuGuiUngVien[]; onAdd: () => void; onDeleteMany: (ids: string[]) => void; onExport: () => void }) {
  const { data: candidates = [] } = useUngVien();
  const { searchTerm, setSearchTerm, filters, setFilter, columns, toggleColumn, reorderColumns, resetColumns, selectedIds, clearSelection } = useThuList();
  const candidateOptions = useMemo(() => candidates.map((c) => ({ label: c.ho_ten, value: c.id, count: items.filter((i) => i.id_ung_vien === c.id).length })), [candidates, items]);
  const typeOptions = useMemo(() => LOAI_THU.map((v) => ({ label: loaiThuLabel(v), value: v, count: items.filter((i) => i.loai_thu === v).length })), [items]);
  const groups: FilterGroup[] = [
    { key: 'id_ung_vien', label: t('thuGuiUngVien.filterUngVien'), icon: User, options: candidateOptions, value: filters.id_ung_vien, onChange: (v) => setFilter('id_ung_vien', v) },
    { key: 'loai_thu', label: t('thuGuiUngVien.filterLoaiPhieu'), icon: FileText, options: typeOptions, value: filters.loai_thu, onChange: (v) => setFilter('loai_thu', v) },
  ];
  return (
    <ListToolbar
      selectedCount={selectedIds.size}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={
        <div className="flex items-center gap-2">
          <Tooltip content={t('thuGuiUngVien.exportList')} placement="bottom">
            <Button type="button" variant="outline" size="sm" onClick={onExport} className="h-9 px-3 sm:px-4 border-border">
              <Download className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('thuGuiUngVien.exportList')}</span>
            </Button>
          </Tooltip>
          <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 h-9 px-3 sm:px-4">
            <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('thuGuiUngVien.add')}</span>
          </Button>
        </div>
      }
      filters={
        <>
          <MultiSelectFilter options={candidateOptions} value={filters.id_ung_vien} onChange={(v) => setFilter('id_ung_vien', v)} placeholder={t('thuGuiUngVien.filterUngVien')} icon={User} className="w-full sm:w-[160px]" />
          <MultiSelectFilter options={typeOptions} value={filters.loai_thu} onChange={(v) => setFilter('loai_thu', v)} placeholder={t('thuGuiUngVien.filterLoaiPhieu')} icon={FileText} className="w-full sm:w-[140px]" />
        </>
      }
      filterGroups={groups}
      onAdd={onAdd}
      activeFilterCount={filters.id_ung_vien.length + filters.loai_thu.length}
      onClearAllFilters={() => {
        setFilter('id_ung_vien', []);
        setFilter('loai_thu', []);
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

function Table({
  data,
  isLoading,
  onView,
  onEdit,
  onPrint,
  onDelete,
}: {
  data: ThuGuiUngVien[];
  isLoading: boolean;
  onView: (r: ThuGuiUngVien) => void;
  onEdit: (r: ThuGuiUngVien) => void;
  onPrint: (r: ThuGuiUngVien) => void;
  onDelete: (id: string) => void;
}) {
  const { columns, pagination, setPage, setPageSize, selectedIds, toggleSelection, toggleAllSelection, sort, setSort, resizeColumn } = useThuList();
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  const renderCell = (col: string, v: ThuGuiUngVien) => {
    switch (col) {
      case 'ten_ung_vien':
        return (
          <span className="font-medium text-sm text-foreground block min-w-0 truncate" title={v.ten_ung_vien ?? undefined}>
            {v.ten_ung_vien ?? '—'}
          </span>
        );
      case 'loai_thu':
        return <LoaiThuBadge value={v.loai_thu} />;
      case 'tg_tao':
        return <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{formatDateTime(v.tg_tao)}</span>;
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={t('thuGuiUngVien.edit')} placement="left">
              <button type="button" onClick={stop(() => onEdit(v))} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" aria-label={t('thuGuiUngVien.edit')}>
                <SquarePen size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t('thuGuiUngVien.print')} placement="left">
              <button type="button" onClick={stop(() => onPrint(v))} className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-all" aria-label={t('thuGuiUngVien.print')}>
                <Printer size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t('common.delete')} placement="left">
              <button type="button" onClick={stop(() => onDelete(v.id))} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all" aria-label={t('common.delete')}>
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCard = (y: ThuGuiUngVien, selected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(y)}
      onKeyDown={(e) => e.key === 'Enter' && onView(y)}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${selected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Mail size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{y.ten_ung_vien ?? '—'}</h4>
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <input type="checkbox" checked={selected} onChange={() => toggleSelection(y.id)} className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer" aria-label={t('common.select')} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <LoaiThuBadge value={y.loai_thu} />
            <span className="text-xs text-muted-foreground">{formatDateTime(y.tg_tao)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-1.5 pt-2.5 border-t border-border">
        <button type="button" onClick={stop(() => onEdit(y))} className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all" aria-label={t('thuGuiUngVien.edit')}>
          <SquarePen size={14} />
        </button>
        <button type="button" onClick={stop(() => onPrint(y))} className="p-2 text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-all" aria-label={t('thuGuiUngVien.print')}>
          <Printer size={14} />
        </button>
        <button type="button" onClick={stop(() => onDelete(y.id))} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 rounded-lg transition-all" aria-label={t('common.delete')}>
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
      emptyTitle={t('thuGuiUngVien.emptyTitle')}
      emptyDescription={t('thuGuiUngVien.emptyDescription')}
    />
  );
}

function matches(r: ThuGuiUngVien, search: string, f: Filters) {
  const text = !search || !!r.ten_ung_vien?.toLowerCase().includes(search.toLowerCase());
  return text && (f.id_ung_vien.length === 0 || f.id_ung_vien.includes(r.id_ung_vien)) && (f.loai_thu.length === 0 || f.loai_thu.includes(r.loai_thu));
}

/** Nhân sự › Thư gửi ứng viên: danh sách thư từ chối / mời nhận việc. */
export default function ThuPage() {
  const confirm = useConfirm();
  const { searchTerm, filters, sort, resetState, clearSelection } = useThuList();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ThuGuiUngVien | null>(null);
  const [viewing, setViewing] = useState<ThuGuiUngVien | null>(null);
  const [reopenAfterEdit, setReopenAfterEdit] = useState<string | null>(null);
  const { data: rows = [], isLoading } = useThuGuiUngVien();
  const remove = useDeleteThu();

  useEffect(() => () => resetState(), [resetState]);

  const filtered = useMemo(() => filterItems(rows, searchTerm, filters, matches), [rows, searchTerm, filters]);
  const sorted = useMemo(() => {
    if (!sort.column || !sort.direction) return filtered;
    const key = (r: ThuGuiUngVien) => (sort.column === 'ten_ung_vien' ? (r.ten_ung_vien ?? '') : sort.column === 'loai_thu' ? r.loai_thu : sort.column === 'tg_tao' ? r.tg_tao : '');
    return [...filtered].sort((a, b) => {
      const c = key(a).localeCompare(key(b), LOCALE);
      return sort.direction === 'desc' ? -c : c;
    });
  }, [filtered, sort]);

  const exportList = () => {
    if (sorted.length === 0) return;
    exportToExcel(
      sorted.map((r) => ({
        [t('thuGuiUngVien.table.ungVien')]: r.ten_ung_vien ?? '—',
        [t('thuGuiUngVien.table.loaiPhieu')]: loaiThuLabel(r.loai_thu),
        [t('thuGuiUngVien.table.ngayTao')]: formatDateTime(r.tg_tao),
      })),
      'thu_gui_ung_vien',
    );
  };
  const edit = (r: ThuGuiUngVien) => {
    setEditing(r);
    setFormOpen(true);
    setReopenAfterEdit(viewing?.id === r.id ? r.id : null);
    setViewing(null);
  };
  const print = (r: ThuGuiUngVien) => window.open(letterPreviewUrl(r), '_blank', 'noopener,noreferrer')?.focus();
  const askDelete = (id: string) =>
    confirm({
      title: t('thuGuiUngVien.deleteTitle'),
      message: t('thuGuiUngVien.deleteMessage'),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: () => remove.mutate([id], { onSuccess: () => viewing?.id === id && setViewing(null) }),
    });
  const askDeleteMany = (ids: string[]) =>
    confirm({
      title: t('thuGuiUngVien.bulkDeleteTitle'),
      message: t('thuGuiUngVien.bulkDeleteMessage', { count: ids.length }),
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
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Toolbar
            items={rows}
            onAdd={() => {
              setViewing(null);
              setEditing(null);
              setFormOpen(true);
            }}
            onDeleteMany={askDeleteMany}
            onExport={exportList}
          />
          <div className="flex-1 min-h-0">
            <Table data={sorted} isLoading={isLoading} onView={setViewing} onEdit={edit} onPrint={print} onDelete={askDelete} />
          </div>
          <AnimatePresence>{viewing && <ThuDetail data={viewing} onClose={() => setViewing(null)} onEdit={edit} onDelete={askDelete} />}</AnimatePresence>
          <AnimatePresence>{formOpen && <ThuForm initialData={editing ?? undefined} onClose={closeForm} />}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}
