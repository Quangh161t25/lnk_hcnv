import { useMemo, useState } from 'react';
import { Download, Plus, Search, Users, Video } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface Course {
  id: string;
  ma_khoa: string;
  ten_khoa: string;
  giang_vien: string;
  thoi_luong: string;
  hinh_thuc: 'online' | 'offline';
  so_bai_hoc: number;
  da_dang_ky: number;
  trang_thai: 'mo_dang_ky' | 'dang_dien_ra' | 'ket_thuc';
}

const INITIAL_COURSES: Course[] = [
  { id: '1', ma_khoa: 'KDT-DEV-01', ten_khoa: 'Kiến trúc React & Clean Code trong Enterprise', giang_vien: 'Nguyễn Văn Quản Trị (Chuyên gia)', thoi_luong: '24 giờ (8 buổi)', hinh_thuc: 'offline', so_bai_hoc: 8, da_dang_ky: 18, trang_thai: 'dang_dien_ra' },
  { id: '2', ma_khoa: 'KDT-MGT-02', ten_khoa: 'Kỹ năng Phỏng vấn & Đánh giá năng lực ứng viên', giang_vien: 'Hoàng Lan Anh (Trưởng phòng HCNS)', thoi_luong: '8 giờ (2 buổi)', hinh_thuc: 'offline', so_bai_hoc: 4, da_dang_ky: 12, trang_thai: 'mo_dang_ky' },
  { id: '3', ma_khoa: 'KDT-SEC-03', ten_khoa: 'An toàn bảo mật thông tin & ISO 27001 cho Doanh nghiệp', giang_vien: 'E-learning Academy', thoi_luong: '12 giờ (Tự học)', hinh_thuc: 'online', so_bai_hoc: 12, da_dang_ky: 45, trang_thai: 'dang_dien_ra' },
];

const STATUS_BADGE = {
  mo_dang_ky: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  dang_dien_ra: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  ket_thuc: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABEL = {
  mo_dang_ky: 'Mở đăng ký',
  dang_dien_ra: 'Đang diễn ra',
  ket_thuc: 'Đã kết thúc',
};

export default function KhoaDaoTaoPage() {
  const [courses] = useState<Course[]>(INITIAL_COURSES);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return c.ten_khoa.toLowerCase().includes(q) || c.ma_khoa.toLowerCase().includes(q) || c.giang_vien.toLowerCase().includes(q);
    });
  }, [courses, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KhoaDaoTao');
    XLSX.writeFile(wb, `Danh_sach_khoa_dao_tao_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
              placeholder="Tìm theo tên khóa học, mã khóa..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Mở modal thêm khóa đào tạo')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Thêm khóa học
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã khóa</th>
                <th className="py-3 px-4">Tên khóa đào tạo</th>
                <th className="py-3 px-4">Giảng viên / Đối tác</th>
                <th className="py-3 px-4">Thời lượng</th>
                <th className="py-3 px-4">Hình thức</th>
                <th className="py-3 px-4 text-center">Số bài học</th>
                <th className="py-3 px-4 text-center">Học viên</th>
                <th className="py-3 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{row.ma_khoa}</td>
                  <td className="py-3 px-4 font-semibold text-foreground text-sm">{row.ten_khoa}</td>
                  <td className="py-3 px-4 text-foreground">{row.giang_vien}</td>
                  <td className="py-3 px-4 text-muted-foreground">{row.thoi_luong}</td>
                  <td className="py-3 px-4">
                    {row.hinh_thuc === 'online' ? (
                      <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                        <Video size={13} /> E-learning
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <Users size={13} /> Trực tiếp
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{row.so_bai_hoc}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-primary">{row.da_dang_ky}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[row.trang_thai]}`}>
                      {STATUS_LABEL[row.trang_thai]}
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
