import { useMemo, useState } from 'react';
import { Award, CheckCircle2, Download, Eye, Plus, Search, UserCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface Driver {
  id: string;
  ma_lx: string;
  ho_ten: string;
  sdt: string;
  hang_gplx: string;
  han_gplx: string;
  xe_phu_trach: string;
  kinh_nghiem_nam: number;
  danh_gia_sao: number;
  trang_thai: 'san_sang' | 'dang_chay' | 'nghi_phep';
}

const INITIAL_DRIVERS: Driver[] = [
  { id: '1', ma_lx: 'LX-001', ho_ten: 'Nguyễn Văn Hùng', sdt: '0912 345 678', hang_gplx: 'Hạng E (Xe > 30 chỗ)', han_gplx: '2028-10-15', xe_phu_trach: 'Toyota Camry (30A-888.68)', kinh_nghiem_nam: 12, danh_gia_sao: 4.9, trang_thai: 'san_sang' },
  { id: '2', ma_lx: 'LX-002', ho_ten: 'Trần Đình Trọng', sdt: '0988 765 432', hang_gplx: 'Hạng D (Xe 10-30 chỗ)', han_gplx: '2027-05-20', xe_phu_trach: 'Ford Everest (30E-666.99)', kinh_nghiem_nam: 8, danh_gia_sao: 4.8, trang_thai: 'dang_chay' },
  { id: '3', ma_lx: 'LX-003', ho_ten: 'Lê Văn Tài', sdt: '0903 112 233', hang_gplx: 'Hạng E (Xe > 30 chỗ)', han_gplx: '2029-01-10', xe_phu_trach: 'Ford Transit (29B-123.45)', kinh_nghiem_nam: 15, danh_gia_sao: 5.0, trang_thai: 'san_sang' },
];

const STATUS_BADGE = {
  san_sang: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  dang_chay: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  nghi_phep: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABEL = {
  san_sang: 'Sẵn sàng nhận lệnh',
  dang_chay: 'Đang làm nhiệm vụ',
  nghi_phep: 'Đang nghỉ phép',
};

export default function QuanLyLaiXePage() {
  const [drivers] = useState(INITIAL_DRIVERS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return d.ho_ten.toLowerCase().includes(q) || d.ma_lx.toLowerCase().includes(q) || d.sdt.toLowerCase().includes(q) || d.xe_phu_trach.toLowerCase().includes(q);
    });
  }, [drivers, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QuanLyLaiXe');
    XLSX.writeFile(wb, `Danh_sach_lai_xe_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <UserCheck size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng đội ngũ lái xe</div>
              <div className="text-base font-bold text-foreground">{drivers.length} tài xế</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Sẵn sàng nhận cuốc</div>
              <div className="text-base font-bold text-foreground">
                {drivers.filter((d) => d.trang_thai === 'san_sang').length} tài xế
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đánh giá an toàn trung bình</div>
              <div className="text-base font-bold text-amber-600">4.9 / 5.0 ⭐</div>
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
              placeholder="Tìm tên lái xe, số ĐT, xe..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Tiếp nhận hồ sơ lái xe mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Thêm lái xe
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã LX</th>
                <th className="py-3 px-4">Họ và tên lái xe</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Hạng bằng lái (GPLX)</th>
                <th className="py-3 px-4 text-center">Hạn GPLX</th>
                <th className="py-3 px-4">Xe phụ trách chính</th>
                <th className="py-3 px-4 text-center">Kinh nghiệm</th>
                <th className="py-3 px-4 text-center">Đánh giá</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{d.ma_lx}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{d.ho_ten}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{d.sdt}</td>
                  <td className="py-3 px-4 text-foreground">{d.hang_gplx}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(d.han_gplx)}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{d.xe_phu_trach}</td>
                  <td className="py-3 px-4 text-center">{d.kinh_nghiem_nam} năm</td>
                  <td className="py-3 px-4 text-center font-bold text-amber-600">⭐ {d.danh_gia_sao}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[d.trang_thai]}`}>
                      {STATUS_LABEL[d.trang_thai]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`Xem hồ sơ nhân sự & giấy khám sức khỏe tài xế ${d.ho_ten}`)} className="h-7 w-7 p-0">
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
