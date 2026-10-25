import { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Download, Eye, Plus, Search, Wrench } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface VehicleMaintenance {
  id: string;
  ma_lich: string;
  bien_so: string;
  dong_xe: string;
  hang_muc: string;
  ngay_du_kien: string;
  ngay_hoan_thanh?: string;
  moc_km: number;
  garage: string;
  chi_phi: number;
  trang_thai: 'sap_den_han' | 'dang_lam' | 'hoan_thanh';
}

const INITIAL_SCHEDULES: VehicleMaintenance[] = [
  { id: '1', ma_lich: 'LBD-2025-01', bien_so: '30A-888.68', dong_xe: 'Toyota Camry 2.5Q', hang_muc: 'Bảo dưỡng cấp 35.000 km (Thay dầu, lọc gió, đảo lốp)', ngay_du_kien: '2025-03-05', moc_km: 35000, garage: 'Toyota Mỹ Đình', chi_phi: 3200000, trang_thai: 'sap_den_han' },
  { id: '2', ma_lich: 'LBD-2025-02', bien_so: '30E-666.99', dong_xe: 'Ford Everest Titanium', hang_muc: 'Gia hạn Đăng kiểm & Bảo hiểm TNDS bắt buộc', ngay_du_kien: '2025-02-28', moc_km: 30000, garage: 'Trung tâm Đăng kiểm 29-03S', chi_phi: 2800000, trang_thai: 'sap_den_han' },
  { id: '3', ma_lich: 'LBD-2025-03', bien_so: '29B-123.45', dong_xe: 'Ford Transit 16 chỗ', hang_muc: 'Đại tu hệ thống phanh ABS và thay 2 lốp trước Bridgestone', ngay_du_kien: '2025-02-20', ngay_hoan_thanh: '2025-02-22', moc_km: 70000, garage: 'Ford Thăng Long', chi_phi: 9500000, trang_thai: 'hoan_thanh' },
];

const STATUS_BADGE = {
  sap_den_han: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  dang_lam: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  hoan_thanh: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

const STATUS_LABEL = {
  sap_den_han: 'Sắp đến hạn',
  dang_lam: 'Đang bảo dưỡng',
  hoan_thanh: 'Đã hoàn thành',
};

export default function LichBaoDuongPage() {
  const [schedules] = useState(INITIAL_SCHEDULES);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return s.bien_so.toLowerCase().includes(q) || s.dong_xe.toLowerCase().includes(q) || s.hang_muc.toLowerCase().includes(q) || s.garage.toLowerCase().includes(q);
    });
  }, [schedules, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LichBaoDuongXe');
    XLSX.writeFile(wb, `Lich_bao_duong_xe_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Xe sắp đến hạn bảo dưỡng / Đăng kiểm</div>
              <div className="text-base font-bold text-amber-600">
                {schedules.filter((s) => s.trang_thai === 'sap_den_han').length} xe
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Wrench size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang xử lý tại xưởng</div>
              <div className="text-base font-bold text-foreground">
                {schedules.filter((s) => s.trang_thai === 'dang_lam').length} xe
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đã bảo dưỡng xong</div>
              <div className="text-base font-bold text-foreground">
                {schedules.filter((s) => s.trang_thai === 'hoan_thanh').length} xe
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm biển số, dòng xe, gara..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Lên lịch bảo dưỡng xe mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Thêm lịch bảo dưỡng
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã lịch</th>
                <th className="py-3 px-4">Biển số</th>
                <th className="py-3 px-4">Dòng xe</th>
                <th className="py-3 px-4">Hạng mục bảo dưỡng / Đăng kiểm</th>
                <th className="py-3 px-4 text-center">Mốc ODO (km)</th>
                <th className="py-3 px-4 text-center">Hạn dự kiến</th>
                <th className="py-3 px-4">Gara / Đơn vị thực hiện</th>
                <th className="py-3 px-4 text-right">Chi phí</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{s.ma_lich}</td>
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{s.bien_so}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{s.dong_xe}</td>
                  <td className="py-3 px-4 text-foreground max-w-xs">{s.hang_muc}</td>
                  <td className="py-3 px-4 text-center font-mono font-medium">{s.moc_km.toLocaleString('vi-VN')} km</td>
                  <td className="py-3 px-4 text-center text-muted-foreground text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(s.ngay_du_kien)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{s.garage}</td>
                  <td className="py-3 px-4 text-right font-medium text-foreground">{formatCurrency(s.chi_phi)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[s.trang_thai]}`}>
                      {STATUS_LABEL[s.trang_thai]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`Xem chi tiết biên bản kiểm tra xe ${s.bien_so}`)} className="h-7 w-7 p-0">
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
