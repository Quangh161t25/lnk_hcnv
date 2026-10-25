import { useMemo, useState } from 'react';
import { Download, FilePenLine, Plus, Trash2 } from 'lucide-react';
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
  QUYET_DINH_BADGE,
  QUYET_DINH_LABELS,
  TRANG_THAI_DANH_GIA_BADGE,
  TRANG_THAI_DANH_GIA_LABELS,
  useDeleteDanhGia,
  useDanhGiaThuViecList,
  type DanhGiaThuViec,
} from './data';
import { useDanhGiaStore } from './store';
import { DanhGiaDetail } from './DanhGiaDetail';
import { DanhGiaForm } from './DanhGiaForm';

export function DanhGiaList() {
  const { data: items = [], isLoading } = useDanhGiaThuViecList();
  const deleteMut = useDeleteDanhGia();
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
  } = useDanhGiaStore();

  const [selectedDetail, setSelectedDetail] = useState<DanhGiaThuViec | null>(null);
  const [editingItem, setEditingItem] = useState<DanhGiaThuViec | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Filters
  const trangThaiOptions = useMemo(
    () =>
      Object.entries(TRANG_THAI_DANH_GIA_LABELS).map(([value, label]) => ({
        value,
        label,
        count: items.filter((i) => i.trang_thai === value).length,
      })),
    [items]
  );

  const phongBanOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      if (item.ten_phong_ban) {
        map.set(item.ten_phong_ban, (map.get(item.ten_phong_ban) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([value, count]) => ({
      value,
      label: value,
      count,
    }));
  }, [items]);

  const dotThangOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      if (item.dot_thang) {
        map.set(item.dot_thang, (map.get(item.dot_thang) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([value, count]) => ({
      value,
      label: `Tháng ${value}`,
      count,
    }));
  }, [items]);

  // Filtering & Sorting
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchSearch =
          item.ho_ten.toLowerCase().includes(q) ||
          item.vi_tri.toLowerCase().includes(q) ||
          item.ten_phong_ban.toLowerCase().includes(q) ||
          item.ten_quan_ly.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }
      if (filters.trang_thai.length > 0 && !filters.trang_thai.includes(item.trang_thai)) {
        return false;
      }
      if (filters.phong_ban.length > 0 && !filters.phong_ban.includes(item.ten_phong_ban)) {
        return false;
      }
      if (filters.dot_thang.length > 0 && !filters.dot_thang.includes(item.dot_thang)) {
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
      title: t('danhGiaThuViec.deleteTitle'),
      message: t('danhGiaThuViec.deleteMessage'),
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
      title: t('danhGiaThuViec.bulkDeleteTitle'),
      message: t('danhGiaThuViec.bulkDeleteMessage', { count: ids.length }),
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
      [t('danhGiaThuViec.table.hoTen')]: d.ho_ten,
      [t('danhGiaThuViec.table.viTri')]: d.vi_tri,
      [t('danhGiaThuViec.table.phongBan')]: d.ten_phong_ban,
      [t('danhGiaThuViec.table.quanLyTrucTiep')]: d.ten_quan_ly,
      [t('danhGiaThuViec.table.ngayBatDau')]: d.ngay_bat_dau_thu_viec,
      [t('danhGiaThuViec.table.ngayKetThuc')]: d.ngay_ket_thuc_thu_viec,
      'Điểm TB': d.diem_trung_binh ?? '—',
      'Xếp loại': d.xep_loai ?? '—',
      'Quyết định': d.quyet_dinh ? QUYET_DINH_LABELS[d.quyet_dinh] : '—',
      [t('danhGiaThuViec.table.trangThai')]: TRANG_THAI_DANH_GIA_LABELS[d.trang_thai],
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhGiaThuViec');
    XLSX.writeFile(wb, `Danh_gia_thu_viec_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const activeFilterCount =
    filters.trang_thai.length + filters.phong_ban.length + filters.dot_thang.length;

  const renderCell = (col: string, r: DanhGiaThuViec) => {
    switch (col) {
      case 'ho_ten':
        return (
          <span
            className="font-medium text-foreground text-sm hover:text-primary cursor-pointer truncate"
            onClick={() => setSelectedDetail(r)}
          >
            {r.ho_ten}
          </span>
        );
      case 'vi_tri':
        return <span className="text-xs text-foreground">{r.vi_tri}</span>;
      case 'ten_phong_ban':
        return <span className="text-xs text-muted-foreground">{r.ten_phong_ban}</span>;
      case 'ten_quan_ly':
        return <span className="text-xs text-foreground">{r.ten_quan_ly}</span>;
      case 'ngay_bat_dau_thu_viec':
        return <span className="text-xs text-muted-foreground">{formatDate(r.ngay_bat_dau_thu_viec)}</span>;
      case 'ngay_ket_thuc_thu_viec':
        return <span className="text-xs text-muted-foreground">{formatDate(r.ngay_ket_thuc_thu_viec)}</span>;
      case 'trang_thai':
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${TRANG_THAI_DANH_GIA_BADGE[r.trang_thai] || ''}`}>
            {TRANG_THAI_DANH_GIA_LABELS[r.trang_thai] || r.trang_thai}
          </span>
        );
      case 'diem_trung_binh':
        return r.diem_trung_binh != null ? (
          <span className="font-mono text-xs font-bold text-primary">{r.diem_trung_binh}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      case 'quyet_dinh':
        return r.quyet_dinh ? (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${QUYET_DINH_BADGE[r.quyet_dinh] || ''}`}>
            {QUYET_DINH_LABELS[r.quyet_dinh] || r.quyet_dinh}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      case 'dot_thang':
        return <span className="text-xs text-muted-foreground">{r.dot_thang}</span>;
      case 'actions':
        return (
          <div className="flex items-center gap-1">
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

  const renderMobileCard = (r: DanhGiaThuViec) => (
    <div
      key={r.id}
      onClick={() => setSelectedDetail(r)}
      className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-2 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{r.ho_ten}</span>
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${TRANG_THAI_DANH_GIA_BADGE[r.trang_thai] || ''}`}>
          {TRANG_THAI_DANH_GIA_LABELS[r.trang_thai] || r.trang_thai}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{r.vi_tri} • {r.ten_phong_ban}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
        <span>Quản lý: {r.ten_quan_ly}</span>
        <span className="font-bold font-mono text-primary">{r.diem_trung_binh ? `${r.diem_trung_binh}/5` : '—'}</span>
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
        searchPlaceholder={t('danhGiaThuViec.searchPlaceholder')}
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
              options={trangThaiOptions}
              value={filters.trang_thai}
              onChange={(v) => setFilter('trang_thai', v)}
              placeholder={t('danhGiaThuViec.filterTrangThai')}
              className="w-full sm:w-[150px]"
            />
            <MultiSelectFilter
              options={phongBanOptions}
              value={filters.phong_ban}
              onChange={(v) => setFilter('phong_ban', v)}
              placeholder={t('danhGiaThuViec.filterPhongBan')}
              className="w-full sm:w-[160px]"
            />
            <MultiSelectFilter
              options={dotThangOptions}
              value={filters.dot_thang}
              onChange={(v) => setFilter('dot_thang', v)}
              placeholder={t('danhGiaThuViec.filterDotThang')}
              className="w-full sm:w-[150px]"
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
              {t('danhGiaThuViec.add')}
            </Button>
          </div>
        }
      />

      <div className="flex-1 min-h-0">
        <DataTable<DanhGiaThuViec>
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

      {selectedDetail && (
        <DanhGiaDetail
          data={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onEdit={(d) => {
            setSelectedDetail(null);
            setEditingItem(d);
          }}
          onDelete={handleDeleteOne}
        />
      )}

      {(isCreating || editingItem) && (
        <DanhGiaForm
          initialData={editingItem}
          onClose={() => {
            setIsCreating(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
