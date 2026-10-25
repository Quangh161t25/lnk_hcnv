import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, Eye, FolderKanban, Plus, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface Project {
  id: string;
  ma_da: string;
  ten_da: string;
  quan_ly: string;
  phong_ban: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  tien_do: number;
  ngan_sach: number;
  trang_thai: 'ke_hoach' | 'dang_chay' | 'tam_dung' | 'hoan_thanh';
}

const INITIAL_PROJECTS: Project[] = [
  { id: '1', ma_da: 'DA-ERP-2025', ten_da: 'Triển khai Hệ thống ERP Quản trị Doanh nghiệp Vũ Gia', quan_ly: 'Trần Minh Quân', phong_ban: 'Khối Công nghệ', ngay_bat_dau: '2025-01-05', ngay_ket_thuc: '2025-06-30', tien_do: 65, ngan_sach: 500000000, trang_thai: 'dang_chay' },
  { id: '2', ma_da: 'DA-ISO-27001', ten_da: 'Nâng cấp tiêu chuẩn An toàn Thông tin ISO 27001', quan_ly: 'Hoàng Lan Anh', phong_ban: 'Khối HCNS & CNTT', ngay_bat_dau: '2025-02-01', ngay_ket_thuc: '2025-04-30', tien_do: 30, ngan_sach: 150000000, trang_thai: 'dang_chay' },
  { id: '3', ma_da: 'DA-MKT-Q1', ten_da: 'Chiến dịch Quảng bá Thương hiệu & Mở rộng Kênh đối tác', quan_ly: 'Lê Hoàng Nam', phong_ban: 'Khối Marketing', ngay_bat_dau: '2025-01-15', ngay_ket_thuc: '2025-03-31', tien_do: 85, ngan_sach: 120000000, trang_thai: 'dang_chay' },
  { id: '4', ma_da: 'DA-OFFICE-2024', ten_da: 'Cải tạo và Thiết kế Không gian Văn phòng Sáng tạo Tầng 4', quan_ly: 'Phạm Thu Hương', phong_ban: 'Khối HCNS', ngay_bat_dau: '2024-11-01', ngay_ket_thuc: '2024-12-25', tien_do: 100, ngan_sach: 250000000, trang_thai: 'hoan_thanh' },
];

const STATUS_BADGE = {
  ke_hoach: 'bg-muted text-muted-foreground border-border',
  dang_chay: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  tam_dung: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  hoan_thanh: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

const STATUS_LABEL = {
  ke_hoach: 'Lập kế hoạch',
  dang_chay: 'Đang triển khai',
  tam_dung: 'Tạm dừng',
  hoan_thanh: 'Đã hoàn thành',
};

export default function DuAnPage() {
  const [projects] = useState(INITIAL_PROJECTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.trang_thai !== statusFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return p.ten_da.toLowerCase().includes(q) || p.ma_da.toLowerCase().includes(q) || p.quan_ly.toLowerCase().includes(q);
    });
  }, [projects, statusFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DuAn');
    XLSX.writeFile(wb, `Danh_sach_du_an_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Quick summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <FolderKanban size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng số dự án</div>
              <div className="text-base font-bold text-foreground">{projects.length} dự án</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang triển khai</div>
              <div className="text-base font-bold text-foreground">
                {projects.filter((p) => p.trang_thai === 'dang_chay').length} dự án
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đã hoàn thành</div>
              <div className="text-base font-bold text-foreground">
                {projects.filter((p) => p.trang_thai === 'hoan_thanh').length} dự án
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
                placeholder="Tìm tên, mã dự án, quản lý..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'ke_hoach', label: 'Lập kế hoạch' },
                { value: 'dang_chay', label: 'Đang triển khai' },
                { value: 'tam_dung', label: 'Tạm dừng' },
                { value: 'hoan_thanh', label: 'Đã hoàn thành' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="text-xs h-8 w-40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Khởi tạo dự án mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Thêm dự án
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã dự án</th>
                <th className="py-3 px-4">Tên dự án</th>
                <th className="py-3 px-4">Chủ nhiệm (PM)</th>
                <th className="py-3 px-4">Khối phụ trách</th>
                <th className="py-3 px-4 text-center">Thời gian</th>
                <th className="py-3 px-4 text-center">Tiến độ</th>
                <th className="py-3 px-4 text-right">Ngân sách</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{p.ma_da}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{p.ten_da}</td>
                  <td className="py-3 px-4 text-foreground">{p.quan_ly}</td>
                  <td className="py-3 px-4 text-muted-foreground">{p.phong_ban}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground text-[11px]">
                    {formatDate(p.ngay_bat_dau)} - {formatDate(p.ngay_ket_thuc)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${p.tien_do}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-foreground">{p.tien_do}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-foreground">{formatCurrency(p.ngan_sach)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[p.trang_thai]}`}>
                      {STATUS_LABEL[p.trang_thai]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`Mở bảng Kanban và danh sách công việc của dự án ${p.ma_da}`)} className="h-7 w-7 p-0">
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
