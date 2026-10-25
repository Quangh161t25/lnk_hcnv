import { useMemo, useState } from 'react';
import { Check, Download, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { t } from '@/lib/i18n';
import {
  LOAI_PHIEU_BADGE,
  LOAI_PHIEU_LABELS,
  TRANG_THAI_PHIEU_BADGE,
  TRANG_THAI_PHIEU_LABELS,
  useAllPhieu,
  useApprovePhieu,
  useRejectPhieu,
  type PhieuHanhChinh,
} from './data';

export function PhieuManagedList() {
  const { data: all = [] } = useAllPhieu();
  const approveMut = useApprovePhieu();
  const rejectMut = useRejectPhieu();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoai, setSelectedLoai] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('cho_duyet');

  // Reject modal state
  const [rejectingItem, setRejectingItem] = useState<PhieuHanhChinh | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loaiOptions = [
    { value: '', label: 'Tất cả loại phiếu' },
    ...Object.entries(LOAI_PHIEU_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    ...Object.entries(TRANG_THAI_PHIEU_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const filtered = useMemo(() => {
    return all.filter((p) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          p.user_name.toLowerCase().includes(q) ||
          p.department_name.toLowerCase().includes(q) ||
          p.ma_phieu.toLowerCase().includes(q) ||
          p.ly_do.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedLoai && p.loai_phieu !== selectedLoai) return false;
      if (selectedStatus && p.trang_thai !== selectedStatus) return false;
      return true;
    });
  }, [all, searchTerm, selectedLoai, selectedStatus]);

  const handleApprove = (id: string) => {
    approveMut.mutate({ id });
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    rejectMut.mutate(
      { id: rejectingItem.id, note: rejectReason },
      {
        onSuccess: () => {
          setRejectingItem(null);
          setRejectReason('');
        },
      }
    );
  };

  const handleExport = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map((p) => ({
      'Mã phiếu': p.ma_phieu,
      'Nhân viên': p.user_name,
      'Phòng ban': p.department_name,
      'Loại phiếu': LOAI_PHIEU_LABELS[p.loai_phieu] || p.loai_phieu,
      'Thời gian': `${p.tu_ngay} -> ${p.den_ngay}`,
      'Số lượng': `${p.so_luong} ${p.don_vi}`,
      'Lý do': p.ly_do,
      'Ý kiến duyệt': p.y_kien_duyet || '—',
      'Trạng thái': TRANG_THAI_PHIEU_LABELS[p.trang_thai] || p.trang_thai,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QuanLyDuyetPhieu');
    XLSX.writeFile(wb, `Danh_sach_duyet_phieu_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
              placeholder="Tìm theo nhân viên, phòng ban..."
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

        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          <Download size={14} />
          Xuất Excel
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
              <th className="py-3 px-4">Nhân viên</th>
              <th className="py-3 px-4">Phòng ban</th>
              <th className="py-3 px-4">Mã phiếu</th>
              <th className="py-3 px-4">Loại phiếu</th>
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4 text-center">Số lượng</th>
              <th className="py-3 px-4">Lý do</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-center">Thao tác duyệt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-medium text-foreground">{row.user_name}</td>
                <td className="py-3 px-4 text-muted-foreground">{row.department_name}</td>
                <td className="py-3 px-4 font-mono font-medium text-foreground">{row.ma_phieu}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${LOAI_PHIEU_BADGE[row.loai_phieu] || ''}`}>
                    {LOAI_PHIEU_LABELS[row.loai_phieu] || row.loai_phieu}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {row.tu_ngay} → {row.den_ngay}
                </td>
                <td className="py-3 px-4 text-center font-mono font-medium text-foreground">
                  {row.so_luong} {row.don_vi}
                </td>
                <td className="py-3 px-4 max-w-xs truncate text-foreground" title={row.ly_do}>
                  {row.ly_do}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${TRANG_THAI_PHIEU_BADGE[row.trang_thai] || ''}`}>
                    {TRANG_THAI_PHIEU_LABELS[row.trang_thai] || row.trang_thai}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {row.trang_thai === 'cho_duyet' ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        size="sm"
                        disabled={approveMut.isPending}
                        onClick={() => handleApprove(row.id)}
                        className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Check size={13} className="mr-1" />
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={rejectMut.isPending}
                        onClick={() => setRejectingItem(row)}
                        className="h-7 px-2.5 text-[11px] text-rose-600 border-rose-300 hover:bg-rose-500/10"
                      >
                        <X size={13} className="mr-1" />
                        Từ chối
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">
                      {row.y_kien_duyet || 'Đã xử lý'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Từ chối phiếu hành chính</h3>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleConfirmReject} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Nhân viên: <strong className="text-foreground">{rejectingItem.user_name}</strong> ({rejectingItem.ma_phieu})
                </p>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Lý do từ chối <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Nhập lý do không phê duyệt phiếu..."
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setRejectingItem(null)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={rejectMut.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Xác nhận từ chối
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
