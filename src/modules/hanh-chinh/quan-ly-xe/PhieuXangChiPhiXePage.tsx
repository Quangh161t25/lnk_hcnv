import { useMemo, useState } from 'react';
import { Download, Fuel, Plus, Receipt, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface FuelExpense {
  id: string;
  so_phieu: string;
  bien_so: string;
  lai_xe: string;
  loai_chi_phi: 'xang_dau' | 'bot_cau_duong' | 'rua_xe' | 'gui_xe';
  ngay_thanh_toan: string;
  so_lit?: number;
  so_tien: number;
  so_km_odo: number;
  cay_xang_dia_diem: string;
  trang_thai: 'cho_duyet' | 'da_chi';
}

const INITIAL_EXPENSES: FuelExpense[] = [
  { id: '1', so_phieu: 'PX-2025-01', bien_so: '30A-888.68', lai_xe: 'Nguyễn Văn Hùng', loai_chi_phi: 'xang_dau', ngay_thanh_toan: '2025-02-24', so_lit: 55, so_tien: 1265000, so_km_odo: 34500, cay_xang_dia_diem: 'Petrolimex Cầu Giấy', trang_thai: 'da_chi' },
  { id: '2', so_phieu: 'PX-2025-02', bien_so: '30E-666.99', lai_xe: 'Trần Đình Trọng', loai_chi_phi: 'bot_cau_duong', ngay_thanh_toan: '2025-02-24', so_tien: 420000, so_km_odo: 28000, cay_xang_dia_diem: 'Trạm thu phí Cao tốc Hà Nội - Hải Phòng (VETC)', trang_thai: 'da_chi' },
  { id: '3', so_phieu: 'PX-2025-03', bien_so: '29B-123.45', lai_xe: 'Lê Văn Tài', loai_chi_phi: 'xang_dau', ngay_thanh_toan: '2025-02-25', so_lit: 65, so_tien: 1365000, so_km_odo: 72000, cay_xang_dia_diem: 'Petrolimex Mỹ Đình', trang_thai: 'cho_duyet' },
  { id: '4', so_phieu: 'PX-2025-04', bien_so: '30H-999.88', lai_xe: 'Nguyễn Văn Hùng', loai_chi_phi: 'rua_xe', ngay_thanh_toan: '2025-02-25', so_tien: 150000, so_km_odo: 12000, cay_xang_dia_diem: 'Garage Car Spa Duy Tân', trang_thai: 'cho_duyet' },
];

const COST_TYPE_LABEL = {
  xang_dau: 'Nhiên liệu xăng/dầu',
  bot_cau_duong: 'Vé cầu đường (BOT)',
  rua_xe: 'Rửa xe & Chăm sóc',
  gui_xe: 'Vé gửi xe',
};

export default function PhieuXangChiPhiXePage() {
  const [expenses] = useState(INITIAL_EXPENSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (typeFilter !== 'all' && e.loai_chi_phi !== typeFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return e.so_phieu.toLowerCase().includes(q) || e.bien_so.toLowerCase().includes(q) || e.lai_xe.toLowerCase().includes(q) || e.cay_xang_dia_diem.toLowerCase().includes(q);
    });
  }, [expenses, typeFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ChiPhiXe');
    XLSX.writeFile(wb, `Chi_phi_xang_xe_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalAmount = useMemo(() => filtered.reduce((acc, cur) => acc + cur.so_tien, 0), [filtered]);

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
              <Fuel size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng chi phí nhiên liệu & đi lại</div>
              <div className="text-base font-bold text-foreground">{formatCurrency(totalAmount)}</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Receipt size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đã thanh toán hoàn ứng</div>
              <div className="text-base font-bold text-emerald-600">
                {formatCurrency(expenses.filter((e) => e.trang_thai === 'da_chi').reduce((acc, cur) => acc + cur.so_tien, 0))}
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Receipt size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Chờ kế toán phê duyệt</div>
              <div className="text-base font-bold text-amber-600">
                {formatCurrency(expenses.filter((e) => e.trang_thai === 'cho_duyet').reduce((acc, cur) => acc + cur.so_tien, 0))}
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
                placeholder="Tìm biển số, số phiếu, lái xe..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả loại chi phí' },
                { value: 'xang_dau', label: 'Xăng / Dầu' },
                { value: 'bot_cau_duong', label: 'Vé BOT cầu đường' },
                { value: 'rua_xe', label: 'Rửa xe' },
                { value: 'gui_xe', label: 'Vé gửi xe' },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              className="text-xs h-8 w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Thêm phiếu chi phí xăng xe mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Tạo phiếu chi
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Số phiếu</th>
                <th className="py-3 px-4">Biển số</th>
                <th className="py-3 px-4">Lái xe đề xuất</th>
                <th className="py-3 px-4">Loại chi phí</th>
                <th className="py-3 px-4 text-center">Ngày đổ / thanh toán</th>
                <th className="py-3 px-4 text-center">Số lít</th>
                <th className="py-3 px-4 text-right">Số ODO (km)</th>
                <th className="py-3 px-4">Địa điểm / Cây xăng</th>
                <th className="py-3 px-4 text-right">Tổng tiền</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{e.so_phieu}</td>
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{e.bien_so}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{e.lai_xe}</td>
                  <td className="py-3 px-4 text-muted-foreground">{COST_TYPE_LABEL[e.loai_chi_phi]}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(e.ngay_thanh_toan)}</td>
                  <td className="py-3 px-4 text-center">{e.so_lit ? `${e.so_lit} L` : '-'}</td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-muted-foreground">{e.so_km_odo.toLocaleString('vi-VN')} km</td>
                  <td className="py-3 px-4 text-foreground max-w-xs">{e.cay_xang_dia_diem}</td>
                  <td className="py-3 px-4 text-right font-bold text-foreground">{formatCurrency(e.so_tien)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${e.trang_thai === 'da_chi' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}>
                      {e.trang_thai === 'da_chi' ? 'Đã thanh toán' : 'Chờ duyệt chi'}
                    </span>
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
