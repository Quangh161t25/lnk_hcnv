import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, Eye, Plus, Search, Wrench } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface MaintenanceRecord {
  id: string;
  so_phieu: string;
  ma_ts: string;
  ten_ts: string;
  loai: 'bao_tri' | 'sua_chua';
  ngay_yeu_cau: string;
  ngay_hoan_thanh?: string;
  don_vi_thuc_hien: string;
  chi_phi: number;
  mo_ta_loi: string;
  trang_thai: 'cho_xu_ly' | 'dang_sua' | 'hoan_thanh';
}

const INITIAL_RECORDS: MaintenanceRecord[] = [
  { id: '1', so_phieu: 'BT-2025-001', ma_ts: 'TS-VP-003', ten_ts: 'Máy in Canon MF244dw', loai: 'sua_chua', ngay_yeu_cau: '2025-02-18', ngay_hoan_thanh: '2025-02-20', don_vi_thuc_hien: 'Công ty Thiết bị Máy văn phòng Á Châu', chi_phi: 650000, mo_ta_loi: 'Kẹt giấy liên tục và thay trống từ drum mực', trang_thai: 'hoan_thanh' },
  { id: '2', so_phieu: 'BT-2025-002', ma_ts: 'TS-IT-001', ten_ts: 'Laptop Dell Precision 5570', loai: 'bao_tri', ngay_yeu_cau: '2025-02-22', ngay_hoan_thanh: '2025-02-23', don_vi_thuc_hien: 'Bộ phận IT Nội bộ', chi_phi: 0, mo_ta_loi: 'Vệ sinh tản nhiệt, tra keo tản nhiệt và kiểm tra pin định kỳ', trang_thai: 'hoan_thanh' },
  { id: '3', so_phieu: 'BT-2025-003', ma_ts: 'TS-VP-008', ten_ts: 'Hệ thống Điều hòa Trung tâm Daikin Tầng 4', loai: 'bao_tri', ngay_yeu_cau: '2025-02-24', don_vi_thuc_hien: 'Trung tâm Bảo hành Daikin', chi_phi: 2500000, mo_ta_loi: 'Vệ sinh dàn lạnh, nạp gas bổ sung R410A', trang_thai: 'dang_sua' },
];

const STATUS_BADGE = {
  cho_xu_ly: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  dang_sua: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  hoan_thanh: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

const STATUS_LABEL = {
  cho_xu_ly: 'Chờ xử lý',
  dang_sua: 'Đang bảo dưỡng / sửa',
  hoan_thanh: 'Đã hoàn thành',
};

export default function BaoTriSuaChuaPage() {
  const [records] = useState(INITIAL_RECORDS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'bao_tri' | 'sua_chua'>('all');

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (typeFilter !== 'all' && r.loai !== typeFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return r.so_phieu.toLowerCase().includes(q) || r.ten_ts.toLowerCase().includes(q) || r.ma_ts.toLowerCase().includes(q) || r.don_vi_thuc_hien.toLowerCase().includes(q);
    });
  }, [records, typeFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BaoTriSuaChua');
    XLSX.writeFile(wb, `Bao_tri_sua_chua_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
              <Wrench size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng lượt bảo trì/sửa</div>
              <div className="text-base font-bold text-foreground">{records.length} lượt</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang xử lý</div>
              <div className="text-base font-bold text-foreground">
                {records.filter((r) => r.trang_thai === 'dang_sua').length} tài sản
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đã hoàn tất</div>
              <div className="text-base font-bold text-foreground">
                {records.filter((r) => r.trang_thai === 'hoan_thanh').length} tài sản
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm số phiếu, tài sản, đơn vị..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả phân loại' },
                { value: 'bao_tri', label: 'Bảo trì định kỳ' },
                { value: 'sua_chua', label: 'Sửa chữa hỏng hóc' },
              ]}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val as 'all' | 'bao_tri' | 'sua_chua')}
              className="text-xs h-8 w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Tạo phiếu yêu cầu bảo trì / sửa chữa mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Tạo phiếu bảo dưỡng
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Số phiếu</th>
                <th className="py-3 px-4 text-center">Phân loại</th>
                <th className="py-3 px-4">Mã TS</th>
                <th className="py-3 px-4">Tên tài sản</th>
                <th className="py-3 px-4">Đơn vị thực hiện</th>
                <th className="py-3 px-4">Mô tả hạng mục / lỗi</th>
                <th className="py-3 px-4 text-center">Ngày yêu cầu</th>
                <th className="py-3 px-4 text-center">Ngày xong</th>
                <th className="py-3 px-4 text-right">Chi phí</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{r.so_phieu}</td>
                  <td className="py-3 px-4 text-center">
                    {r.loai === 'bao_tri' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/30">
                        Bảo trì định kỳ
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-500/10 text-orange-600 border border-orange-500/30">
                        Sửa chữa
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{r.ma_ts}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{r.ten_ts}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.don_vi_thuc_hien}</td>
                  <td className="py-3 px-4 text-foreground max-w-xs">{r.mo_ta_loi}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(r.ngay_yeu_cau)}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(r.ngay_hoan_thanh)}</td>
                  <td className="py-3 px-4 text-right font-medium text-foreground">{formatCurrency(r.chi_phi)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[r.trang_thai]}`}>
                      {STATUS_LABEL[r.trang_thai]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`Xem hóa đơn & biên bản sửa chữa ${r.so_phieu}`)} className="h-7 w-7 p-0">
                      <Eye size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
