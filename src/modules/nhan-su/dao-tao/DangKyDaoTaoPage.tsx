import { useMemo, useState } from 'react';
import { Check, Download, Plus, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface Registration {
  id: string;
  user_name: string;
  department_name: string;
  ten_khoa: string;
  ngay_dang_ky: string;
  trang_thai_duyet: 'cho_duyet' | 'da_duyet' | 'tu_choi';
  ket_qua: 'dang_hoc' | 'dat' | 'chua_dat' | 'chua_thi';
  diem_so?: string;
}

const INITIAL_REGISTRATIONS: Registration[] = [
  { id: '1', user_name: 'Nguyễn Văn An', department_name: 'Phòng Công nghệ', ten_khoa: 'Kiến trúc React & Clean Code trong Enterprise', ngay_dang_ky: '2025-02-15', trang_thai_duyet: 'da_duyet', ket_qua: 'dang_hoc' },
  { id: '2', user_name: 'Lê Hoàng Nam', department_name: 'Phòng Marketing', ten_khoa: 'Kỹ năng Phỏng vấn & Đánh giá năng lực ứng viên', ngay_dang_ky: '2025-02-18', trang_thai_duyet: 'cho_duyet', ket_qua: 'chua_thi' },
  { id: '3', user_name: 'Đặng Quốc Huy', department_name: 'Phòng Kinh doanh', ten_khoa: 'An toàn bảo mật thông tin & ISO 27001 cho Doanh nghiệp', ngay_dang_ky: '2025-02-10', trang_thai_duyet: 'da_duyet', ket_qua: 'dat', diem_so: '95/100' },
];

export default function DangKyDaoTaoPage() {
  const [registrations, setRegistrations] = useState<Registration[]>(INITIAL_REGISTRATIONS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return r.user_name.toLowerCase().includes(q) || r.department_name.toLowerCase().includes(q) || r.ten_khoa.toLowerCase().includes(q);
    });
  }, [registrations, searchTerm]);

  const handleApprove = (id: string) => {
    setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, trang_thai_duyet: 'da_duyet', ket_qua: 'dang_hoc' } : r)));
    toast.success('Đã duyệt đăng ký học cho nhân viên');
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DangKyDaoTao');
    XLSX.writeFile(wb, `Danh_sach_dang_ky_dao_tao_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học viên, khóa học..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Đăng ký khóa học mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Đăng ký khóa học
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Học viên</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Khóa đào tạo đăng ký</th>
                <th className="py-3 px-4">Ngày đăng ký</th>
                <th className="py-3 px-4">Trạng thái duyệt</th>
                <th className="py-3 px-4">Kết quả học tập</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-semibold text-foreground text-sm">{row.user_name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{row.department_name}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{row.ten_khoa}</td>
                  <td className="py-3 px-4 text-muted-foreground">{formatDate(row.ngay_dang_ky)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      row.trang_thai_duyet === 'da_duyet' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    }`}>
                      {row.trang_thai_duyet === 'da_duyet' ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {row.ket_qua === 'dat' ? (
                      <span className="font-semibold text-emerald-600">Đạt ({row.diem_so})</span>
                    ) : row.ket_qua === 'dang_hoc' ? (
                      <span className="text-blue-600 font-medium">Đang tham gia</span>
                    ) : (
                      <span className="text-muted-foreground">Chưa có kết quả</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.trang_thai_duyet === 'cho_duyet' ? (
                      <Button size="sm" onClick={() => handleApprove(row.id)} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Check size={13} className="mr-1" /> Duyệt
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
      </div>
    </div>
  );
}
