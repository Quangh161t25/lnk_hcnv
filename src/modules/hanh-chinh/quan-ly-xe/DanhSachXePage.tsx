import { useMemo, useState } from 'react';
import { CalendarCheck, Car, CheckCircle2, Download, Eye, Plus, Search, Wrench } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';

interface Vehicle {
  id: string;
  bien_so: string;
  dong_xe: string;
  loai_xe: string;
  nam_sx: number;
  lai_xe: string;
  so_km_hien_tai: number;
  nhien_lieu: string;
  trang_thai: 'san_sang' | 'dang_di' | 'bao_duong' | 'tam_dung';
}

const INITIAL_VEHICLES: Vehicle[] = [
  { id: '1', bien_so: '30A-888.68', dong_xe: 'Toyota Camry 2.5Q', loai_xe: 'Sedan 5 chỗ', nam_sx: 2022, lai_xe: 'Nguyễn Văn Hùng', so_km_hien_tai: 34500, nhien_lieu: 'Xăng RON 95', trang_thai: 'san_sang' },
  { id: '2', bien_so: '30E-666.99', dong_xe: 'Ford Everest Titanium 4x4', loai_xe: 'SUV 7 chỗ', nam_sx: 2023, lai_xe: 'Trần Đình Trọng', so_km_hien_tai: 28000, nhien_lieu: 'Dầu Diesel', trang_thai: 'dang_di' },
  { id: '3', bien_so: '29B-123.45', dong_xe: 'Ford Transit Luxury', loai_xe: 'Minibus 16 chỗ', nam_sx: 2021, lai_xe: 'Lê Văn Tài', so_km_hien_tai: 72000, nhien_lieu: 'Dầu Diesel', trang_thai: 'bao_duong' },
  { id: '4', bien_so: '30H-999.88', dong_xe: 'Kia Carnival Royal 3.5G', loai_xe: 'MPV 7 chỗ VIP', nam_sx: 2024, lai_xe: 'Nguyễn Văn Hùng', so_km_hien_tai: 12000, nhien_lieu: 'Xăng RON 95', trang_thai: 'san_sang' },
];

const STATUS_BADGE = {
  san_sang: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  dang_di: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  bao_duong: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  tam_dung: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABEL = {
  san_sang: 'Sẵn sàng điều xe',
  dang_di: 'Đang di chuyển',
  bao_duong: 'Đang bảo dưỡng',
  tam_dung: 'Tạm dừng hoạt động',
};

export default function DanhSachXePage() {
  const [vehicles] = useState(INITIAL_VEHICLES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (statusFilter !== 'all' && v.trang_thai !== statusFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return v.bien_so.toLowerCase().includes(q) || v.dong_xe.toLowerCase().includes(q) || v.lai_xe.toLowerCase().includes(q);
    });
  }, [vehicles, statusFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachXe');
    XLSX.writeFile(wb, `Danh_sach_xe_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Car size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng phương tiện</div>
              <div className="text-base font-bold text-foreground">{vehicles.length} xe</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Sẵn sàng phục vụ</div>
              <div className="text-base font-bold text-foreground">
                {vehicles.filter((v) => v.trang_thai === 'san_sang').length} xe
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarCheck size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang đi công tác</div>
              <div className="text-base font-bold text-foreground">
                {vehicles.filter((v) => v.trang_thai === 'dang_di').length} xe
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Wrench size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang bảo trì/bảo dưỡng</div>
              <div className="text-base font-bold text-foreground">
                {vehicles.filter((v) => v.trang_thai === 'bao_duong').length} xe
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
                placeholder="Tìm biển số xe, dòng xe, lái xe..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'san_sang', label: 'Sẵn sàng điều xe' },
                { value: 'dang_di', label: 'Đang di chuyển' },
                { value: 'bao_duong', label: 'Đang bảo dưỡng' },
                { value: 'tam_dung', label: 'Tạm dừng hoạt động' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="text-xs h-8 w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Khai báo thông tin xe mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Thêm xe mới
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Biển số</th>
                <th className="py-3 px-4">Dòng xe & Model</th>
                <th className="py-3 px-4">Loại xe</th>
                <th className="py-3 px-4 text-center">Năm SX</th>
                <th className="py-3 px-4">Lái xe chính</th>
                <th className="py-3 px-4 text-right">Số ODO (km)</th>
                <th className="py-3 px-4">Nhiên liệu</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-bold text-primary">{v.bien_so}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{v.dong_xe}</td>
                  <td className="py-3 px-4 text-muted-foreground">{v.loai_xe}</td>
                  <td className="py-3 px-4 text-center">{v.nam_sx}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{v.lai_xe}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">{v.so_km_hien_tai.toLocaleString('vi-VN')} km</td>
                  <td className="py-3 px-4 text-muted-foreground text-[11px]">{v.nhien_lieu}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[v.trang_thai]}`}>
                      {STATUS_LABEL[v.trang_thai]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`Lịch sử hành trình và chi phí của xe ${v.bien_so}`)} className="h-7 w-7 p-0">
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
