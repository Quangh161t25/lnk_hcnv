import { useMemo, useState } from 'react';
import { Building2, Download, Eye, MapPin, Plus, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

interface AssetLocation {
  id: string;
  ma_noi: string;
  ten_noi: string;
  chi_nhanh: string;
  nguoi_quan_ly: string;
  so_tai_san: number;
  tong_gia_tri: number;
  mo_ta: string;
}

const INITIAL_LOCATIONS: AssetLocation[] = [
  { id: '1', ma_noi: 'LOC-HN-T4', ten_noi: 'Văn phòng Tầng 4 - Khối Kỹ thuật & Sản phẩm', chi_nhanh: 'Trụ sở Hà Nội', nguoi_quan_ly: 'Trần Minh Quân', so_tai_san: 48, tong_gia_tri: 420000000, mo_ta: 'Khu vực làm việc kỹ sư công nghệ, phòng họp sáng tạo A' },
  { id: '2', ma_noi: 'LOC-HN-T5', ten_noi: 'Văn phòng Tầng 5 - Khối BOD & HCNS, Kế toán', chi_nhanh: 'Trụ sở Hà Nội', nguoi_quan_ly: 'Hoàng Lan Anh', so_tai_san: 35, tong_gia_tri: 310000000, mo_ta: 'Phòng họp VIP, phòng giám đốc, quầy lễ tân' },
  { id: '3', ma_noi: 'LOC-HN-B1', ten_noi: 'Kho lưu trữ tài sản dự phòng Tầng hầm B1', chi_nhanh: 'Trụ sở Hà Nội', nguoi_quan_ly: 'Phạm Thu Hương', so_tai_san: 22, tong_gia_tri: 115000000, mo_ta: 'Kho thiết bị chưa cấp phát, linh kiện máy móc' },
  { id: '4', ma_noi: 'LOC-HCM-Q1', ten_noi: 'Chi nhánh Văn phòng đại diện TP. Hồ Chí Minh', chi_nhanh: 'Chi nhánh HCM', nguoi_quan_ly: 'Lê Hoàng Nam', so_tai_san: 16, tong_gia_tri: 140000000, mo_ta: 'Tòa nhà Bitexco Q1, khu vực kinh doanh phía Nam' },
];

export default function NoiQuanLyPage() {
  const [locations] = useState(INITIAL_LOCATIONS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return locations.filter((loc) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return loc.ten_noi.toLowerCase().includes(q) || loc.ma_noi.toLowerCase().includes(q) || loc.chi_nhanh.toLowerCase().includes(q);
    });
  }, [locations, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'NoiQuanLyTaiSan');
    XLSX.writeFile(wb, `Noi_quan_ly_tai_san_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng địa điểm lưu trữ</div>
              <div className="text-base font-bold text-foreground">{locations.length} điểm</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng tài sản quản lý</div>
              <div className="text-base font-bold text-foreground">
                {locations.reduce((acc, cur) => acc + cur.so_tai_san, 0)} tài sản
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng giá trị lưu trữ</div>
              <div className="text-base font-bold text-emerald-600">
                {formatCurrency(locations.reduce((acc, cur) => acc + cur.tong_gia_tri, 0))}
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
              placeholder="Tìm tên địa điểm, mã, chi nhánh..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Thêm nơi lưu trữ tài sản mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Thêm nơi quản lý
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã nơi lưu</th>
                <th className="py-3 px-4">Tên địa điểm / Khu vực lưu trữ</th>
                <th className="py-3 px-4">Chi nhánh</th>
                <th className="py-3 px-4">Người quản lý kho</th>
                <th className="py-3 px-4 text-center">Số lượng tài sản</th>
                <th className="py-3 px-4 text-right">Tổng giá trị</th>
                <th className="py-3 px-4">Mô tả chi tiết</th>
                <th className="py-3 px-4 text-right">Tài sản tại đây</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((loc) => (
                <tr key={loc.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{loc.ma_noi}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{loc.ten_noi}</td>
                  <td className="py-3 px-4 text-muted-foreground">{loc.chi_nhanh}</td>
                  <td className="py-3 px-4 text-foreground">{loc.nguoi_quan_ly}</td>
                  <td className="py-3 px-4 text-center font-bold text-foreground">{loc.so_tai_san}</td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-600">{formatCurrency(loc.tong_gia_tri)}</td>
                  <td className="py-3 px-4 text-muted-foreground text-[11px] max-w-xs">{loc.mo_ta}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`Xem toàn bộ tài sản tại ${loc.ten_noi}`)} className="h-7 w-7 p-0">
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
