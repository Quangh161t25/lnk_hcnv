import { useMemo, useState } from 'react';
import { Download, FilePenLine, Plus, Printer, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { useConfirm } from '@/stores/confirm';
import {
  LOAI_HOP_DONG_BADGE,
  LOAI_HOP_DONG_LABELS,
  TRANG_THAI_HOP_DONG_BADGE,
  TRANG_THAI_HOP_DONG_LABELS,
  useDeleteHopDong,
  useHopDongList,
  usePhieuThanhLyList,
  type HopDong,
} from './data';
import { useHopDongStore } from './store';
import { HopDongDetail } from './HopDongDetail';
import { HopDongForm } from './HopDongForm';
import { PhieuThanhLyModal } from './PhieuThanhLyModal';
import { HopDongPreviewModal } from './HopDongPreviewModal';

export function HopDongList() {
  const { data: items = [], isLoading } = useHopDongList();
  const { data: phieuList = [] } = usePhieuThanhLyList();
  const deleteMut = useDeleteHopDong();
  const confirm = useConfirm();

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    resetFilters,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
    sort,
    setSort,
    pagination,
    setPage,
    setPageSize,
  } = useHopDongStore();

  const [selectedDetail, setSelectedDetail] = useState<HopDong | null>(null);
  const [editingItem, setEditingItem] = useState<HopDong | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [prefillHopDong, setPrefillHopDong] = useState<HopDong | null>(null);
  const [liquidatingHopDong, setLiquidatingHopDong] = useState<HopDong | null>(null);
  const [previewingHopDong, setPreviewingHopDong] = useState<HopDong | null>(null);

  // Filter options
  const loaiOptions = useMemo(
    () =>
      Object.entries(LOAI_HOP_DONG_LABELS).map(([val, label]) => ({
        value: val,
        label,
        count: items.filter((i) => i.loai_hop_dong === val).length,
      })),
    [items]
  );

  const trangThaiOptions = useMemo(
    () =>
      Object.entries(TRANG_THAI_HOP_DONG_LABELS).map(([val, label]) => ({
        value: val,
        label,
        count: items.filter((i) => i.trang_thai === val).length,
      })),
    [items]
  );

  const ungVienOptions = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const item of items) {
      const prev = map.get(item.id_ung_vien);
      map.set(item.id_ung_vien, {
        label: item.ten_ung_vien || item.id_ung_vien,
        count: (prev?.count ?? 0) + 1,
      });
    }
    return Array.from(map.entries()).map(([value, info]) => ({
      value,
      label: info.label,
      count: info.count,
    }));
  }, [items]);

  // Filtered & sorted data
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchSearch =
          item.so_hop_dong.toLowerCase().includes(q) ||
          (item.ten_ung_vien && item.ten_ung_vien.toLowerCase().includes(q)) ||
          (item.bac_luong && item.bac_luong.toLowerCase().includes(q)) ||
          (item.muc_luong && item.muc_luong.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }
      if (filters.loai_hop_dong.length > 0 && !filters.loai_hop_dong.includes(item.loai_hop_dong)) {
        return false;
      }
      if (filters.trang_thai.length > 0 && !filters.trang_thai.includes(item.trang_thai)) {
        return false;
      }
      if (filters.id_ung_vien.length > 0 && !filters.id_ung_vien.includes(item.id_ung_vien)) {
        return false;
      }
      return true;
    });
  }, [items, searchTerm, filters]);

  const sortedData = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredData;
    const col = sort.column;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...filteredData].sort((a, b) => {
      const va = (a as any)[col] ?? '';
      const vb = (b as any)[col] ?? '';
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [filteredData, sort]);

  const handleDeleteOne = (id: string) => {
    confirm({
      title: t('hopDong.deleteTitle'),
      message: t('hopDong.deleteMessage'),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: () => {
        deleteMut.mutate([id], {
          onSuccess: () => {
            if (selectedDetail?.id === id) setSelectedDetail(null);
          },
        });
      },
    });
  };

  const handleDeleteMany = () => {
    const ids = Array.from(selectedIds);
    confirm({
      title: t('hopDong.bulkDeleteTitle'),
      message: t('hopDong.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: () => {
        deleteMut.mutate(ids, {
          onSuccess: () => {
            clearSelection();
            if (selectedDetail && ids.includes(selectedDetail.id)) setSelectedDetail(null);
          },
        });
      },
    });
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const exportRows = filteredData.map((d) => ({
      [t('hopDong.table.soHopDong')]: d.so_hop_dong,
      [t('hopDong.table.ungVien')]: d.ten_ung_vien,
      [t('hopDong.table.loaiHopDong')]: LOAI_HOP_DONG_LABELS[d.loai_hop_dong] || d.loai_hop_dong,
      [t('hopDong.table.trangThai')]: TRANG_THAI_HOP_DONG_LABELS[d.trang_thai] || d.trang_thai,
      [t('hopDong.table.ngayBatDau')]: d.ngay_bat_dau,
      [t('hopDong.table.ngayKetThuc')]: d.ngay_ket_thuc || 'Không xác định',
      [t('hopDong.table.ngayVaoLam')]: d.ngay_vao_lam || '—',
      [t('hopDong.bacLuong')]: d.bac_luong || '—',
      [t('hopDong.table.mucLuong')]: d.muc_luong || '—',
      [t('hopDong.coCheKhac')]: d.co_che_khac || '—',
      [t('hopDong.table.ngayTao')]: d.tg_tao,
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HopDong');
    XLSX.writeFile(wb, `Danh_sach_hop_dong_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const activeFilterCount =
    filters.loai_hop_dong.length + filters.trang_thai.length + filters.id_ung_vien.length;

  const renderCell = (col: string, r: HopDong) => {
    switch (col) {
      case 'ung_vien':
        return (
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-foreground text-sm hover:text-primary cursor-pointer truncate" onClick={() => setSelectedDetail(r)}>
              {r.ten_ung_vien}
            </span>
            <span className="text-xs text-muted-foreground truncate">{r.email_ung_vien || r.sdt_ung_vien || '—'}</span>
          </div>
        );
      case 'so_hop_dong':
        return <span className="font-mono text-xs font-semibold text-foreground">{r.so_hop_dong}</span>;
      case 'loai_hop_dong':
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${LOAI_HOP_DONG_BADGE[r.loai_hop_dong] || ''}`}>
            {LOAI_HOP_DONG_LABELS[r.loai_hop_dong] || r.loai_hop_dong}
          </span>
        );
      case 'trang_thai':
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${TRANG_THAI_HOP_DONG_BADGE[r.trang_thai] || ''}`}>
            {TRANG_THAI_HOP_DONG_LABELS[r.trang_thai] || r.trang_thai}
          </span>
        );
      case 'ngay_bat_dau':
        return <span className="text-xs text-muted-foreground">{formatDate(r.ngay_bat_dau)}</span>;
      case 'ngay_ket_thuc':
        return <span className="text-xs text-muted-foreground">{r.ngay_ket_thuc ? formatDate(r.ngay_ket_thuc) : '—'}</span>;
      case 'ngay_vao_lam':
        return <span className="text-xs text-muted-foreground">{r.ngay_vao_lam ? formatDate(r.ngay_vao_lam) : '—'}</span>;
      case 'muc_luong':
        return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{r.muc_luong || '—'}</span>;
      case 'tg_tao':
        return <span className="text-xs text-muted-foreground">{formatDate(r.tg_tao)}</span>;
      case 'tg_cap_nhat':
        return <span className="text-xs text-muted-foreground">{formatDate(r.tg_cap_nhat)}</span>;
      case 'actions':
        return (
          <div className="flex items-center gap-1">
            <Tooltip content={t('hopDong.detail.toolbar.print')}>
              <button
                type="button"
                onClick={() => setPreviewingHopDong(r)}
                className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Printer size={15} />
              </button>
            </Tooltip>
            <Tooltip content={t('common.edit')}>
              <button
                type="button"
                onClick={() => setEditingItem(r)}
                className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <FilePenLine size={15} />
              </button>
            </Tooltip>
            <Tooltip content={t('common.delete')}>
              <button
                type="button"
                onClick={() => handleDeleteOne(r.id)}
                className="p-1 rounded text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
              >
                <Trash2 size={15} />
              </button>
            </Tooltip>
          </div>
        );
      default:
        return <span>{(r as any)[col] ?? '—'}</span>;
    }
  };

  const renderMobileCard = (r: HopDong) => (
    <div
      key={r.id}
      onClick={() => setSelectedDetail(r)}
      className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-foreground">{r.so_hop_dong}</span>
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${TRANG_THAI_HOP_DONG_BADGE[r.trang_thai] || ''}`}>
          {TRANG_THAI_HOP_DONG_LABELS[r.trang_thai] || r.trang_thai}
        </span>
      </div>
      <p className="text-sm font-semibold text-foreground">{r.ten_ung_vien}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{LOAI_HOP_DONG_LABELS[r.loai_hop_dong] || r.loai_hop_dong}</span>
        <span className="font-semibold text-emerald-600">{r.muc_luong}</span>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <ListToolbar
        selectedCount={selectedIds.size}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSelection={clearSelection}
        searchPlaceholder={t('hopDong.searchPlaceholder')}
        activeFilterCount={activeFilterCount}
        onClearAllFilters={resetFilters}
        onDeleteMany={handleDeleteMany}
        columns={columns}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetColumns={resetColumns}
        filters={
          <>
            <MultiSelectFilter
              options={loaiOptions}
              value={filters.loai_hop_dong}
              onChange={(v) => setFilter('loai_hop_dong', v)}
              placeholder={t('hopDong.filterLoaiHopDong')}
              className="w-full sm:w-[150px]"
            />
            <MultiSelectFilter
              options={trangThaiOptions}
              value={filters.trang_thai}
              onChange={(v) => setFilter('trang_thai', v)}
              placeholder={t('common.status')}
              className="w-full sm:w-[140px]"
            />
            <MultiSelectFilter
              options={ungVienOptions}
              value={filters.id_ung_vien}
              onChange={(v) => setFilter('id_ung_vien', v)}
              placeholder={t('hopDong.filterUngVien')}
              className="w-full sm:w-[160px]"
            />
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Download size={14} />
              {t('hopDong.exportList')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="h-8 gap-1.5 text-xs font-medium bg-primary text-white hover:bg-primary/90 shadow-sm"
            >
              <Plus size={14} />
              {t('hopDong.add')}
            </Button>
          </div>
        }
      />

      <div className="flex-1 min-h-0">
        <DataTable<HopDong>
          data={sortedData}
          columns={columns}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
          onToggleAll={toggleAllSelection}
          sort={sort}
          onSort={setSort}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          renderCell={renderCell}
          renderMobileCard={renderMobileCard}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => setSelectedDetail(r)}
        />
      </div>

      {/* Drawers and Modals */}
      {selectedDetail && (
        <HopDongDetail
          data={selectedDetail}
          phieuThanhLy={phieuList.find((p) => p.id_hop_dong === selectedDetail.id)}
          onClose={() => setSelectedDetail(null)}
          onEdit={(hd) => {
            setSelectedDetail(null);
            setEditingItem(hd);
          }}
          onDelete={handleDeleteOne}
          onPrint={(hd) => setPreviewingHopDong(hd)}
          onOpenCreateChinhThuc={(hd) => {
            setSelectedDetail(null);
            setPrefillHopDong(hd);
          }}
          onOpenPhieuThanhLy={(hd) => {
            setSelectedDetail(null);
            setLiquidatingHopDong(hd);
          }}
        />
      )}

      {(isCreating || editingItem || prefillHopDong) && (
        <HopDongForm
          initialData={editingItem}
          prefillFromHopDong={prefillHopDong}
          onClose={() => {
            setIsCreating(false);
            setEditingItem(null);
            setPrefillHopDong(null);
          }}
        />
      )}

      {liquidatingHopDong && (
        <PhieuThanhLyModal
          hopDong={liquidatingHopDong}
          onClose={() => setLiquidatingHopDong(null)}
        />
      )}

      {previewingHopDong && (
        <HopDongPreviewModal
          data={previewingHopDong}
          onClose={() => setPreviewingHopDong(null)}
        />
      )}
    </div>
  );
}
