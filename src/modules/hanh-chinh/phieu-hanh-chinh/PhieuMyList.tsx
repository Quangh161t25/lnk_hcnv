import { useMemo, useState } from 'react';
import { Ban, Download, Plus, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useConfirm } from '@/stores/confirm';
import {
  LOAI_PHIEU_BADGE,
  LOAI_PHIEU_LABELS,
  TRANG_THAI_PHIEU_BADGE,
  TRANG_THAI_PHIEU_LABELS,
  useAllPhieu,
  useCancelPhieu,
} from './data';
import { PhieuCreateModal } from './PhieuCreateModal';

export function PhieuMyList() {
  const { data: all = [] } = useAllPhieu();
  const cancelMut = useCancelPhieu();
  const confirm = useConfirm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoai, setSelectedLoai] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // My records (filter u-1 demo)
  const myList = useMemo(() => all.filter((p) => p.user_id === 'u-1'), [all]);

  const loaiOptions = [
    { value: '', label: 'Tất cả loại phiếu' },
    ...Object.entries(LOAI_PHIEU_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    ...Object.entries(TRANG_THAI_PHIEU_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const filtered = useMemo(() => {
    return myList.filter((p) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          p.ma_phieu.toLowerCase().includes(q) ||
          p.ly_do.toLowerCase().includes(q) ||
          p.nguoi_duyet.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedLoai && p.loai_phieu !== selectedLoai) return false;
      if (selectedStatus && p.trang_thai !== selectedStatus) return false;
      return true;
    });
  }, [myList, searchTerm, selectedLoai, selectedStatus]);

  const handleCancel = (id: string) => {
    confirm({
      title: 'Hủy phiếu hành chính',
      message: 'Bạn có chắc chắn muốn hủy phiếu này không?',
      variant: 'danger',
      confirmText: 'Hủy phiếu',
      onConfirm: () => cancelMut.mutate(id),
    });
  };

  const handleExport = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map((p) => ({
      'Mã phiếu': p.ma_phieu,
      'Loại phiếu': LOAI_PHIEU_LABELS[p.loai_phieu] || p.loai_phieu,
      'Từ ngày': p.tu_ngay,
      'Đến ngày': p.den_ngay,
      'Số lượng': `${p.so_luong} ${p.don_vi}`,
      'Lý do': p.ly_do,
      'Người duyệt': p.nguoi_duyet,
      'Trạng thái': TRANG_THAI_PHIEU_LABELS[p.trang_thai] || p.trang_thai,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PhieuCuaToi');
    XLSX.writeFile(wb, `Phieu_hanh_chinh_cua_toi_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
        <div className="flex items-center gap-3 flex-1 flex-wrap min-w-[280px]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã phiếu, lý do..."
              className="pl-8 text-xs h-8"
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={loaiOptions}
              value={selectedLoai}
              onChange={setSelectedLoai}
              className="text-xs h-8"
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              className="text-xs h-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Download size={14} />
            Xuất Excel
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="h-8 gap-1.5 text-xs font-medium bg-primary text-white hover:bg-primary/90 shadow-sm"
          >
            <Plus size={14} />
            Tạo phiếu mới
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
              <th className="py-3 px-4">Mã phiếu</th>
              <th className="py-3 px-4">Loại phiếu</th>
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4 text-center">Số lượng</th>
              <th className="py-3 px-4">Lý do</th>
              <th className="py-3 px-4">Người duyệt</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-mono font-medium text-foreground">{row.ma_phieu}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${LOAI_PHIEU_BADGE[row.loai_phieu] || ''}`}>
                    {LOAI_PHIEU_LABELS[row.loai_phieu] || row.loai_phieu}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {row.tu_ngay} <span className="text-foreground">→</span> {row.den_ngay}
                </td>
                <td className="py-3 px-4 text-center font-mono font-medium text-foreground">
                  {row.so_luong} {row.don_vi}
                </td>
                <td className="py-3 px-4 max-w-xs truncate text-foreground" title={row.ly_do}>
                  {row.ly_do}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{row.nguoi_duyet}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${TRANG_THAI_PHIEU_BADGE[row.trang_thai] || ''}`}>
                    {TRANG_THAI_PHIEU_LABELS[row.trang_thai] || row.trang_thai}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {row.trang_thai === 'cho_duyet' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancel(row.id)}
                      className="h-7 px-2 text-[11px] text-rose-500 hover:bg-rose-500/10"
                    >
                      <Ban size={13} className="mr-1" />
                      Hủy
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCreating && <PhieuCreateModal onClose={() => setIsCreating(false)} />}
    </div>
  );
}
