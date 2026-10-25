import { useMemo, useState } from 'react';
import { Download, Plus, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

interface Plan {
  id: string;
  ten_ke_hoach: string;
  nam: string;
  doi_tuong: string;
  ngan_sach: number;
  so_khoa: number;
  so_hoc_vien: number;
  trang_thai: 'du_thao' | 'da_duyet' | 'dang_thuc_hien' | 'hoan_thanh';
}

const INITIAL_PLANS: Plan[] = [
  { id: '1', ten_ke_hoach: 'Kế hoạch đào tạo nâng cao năng lực Kỹ thuật 2025', nam: '2025', doi_tuong: 'Toàn bộ kỹ sư IT, QA, DevOps', ngan_sach: 120000000, so_khoa: 4, so_hoc_vien: 35, trang_thai: 'dang_thuc_hien' },
  { id: '2', ten_ke_hoach: 'Chương trình đào tạo Kỹ năng Quản lý cấp trung Q1/2025', nam: '2025', doi_tuong: 'Trưởng nhóm, Phó phòng, Trưởng phòng', ngan_sach: 80000000, so_khoa: 2, so_hoc_vien: 15, trang_thai: 'da_duyet' },
  { id: '3', ten_ke_hoach: 'Đào tạo Hội nhập văn hóa doanh nghiệp cho nhân sự mới', nam: '2025', doi_tuong: 'Nhân viên mới gia nhập', ngan_sach: 30000000, so_khoa: 6, so_hoc_vien: 40, trang_thai: 'dang_thuc_hien' },
];

const STATUS_BADGE = {
  du_thao: 'bg-muted text-muted-foreground border-border',
  da_duyet: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  dang_thuc_hien: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  hoan_thanh: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
};

const STATUS_LABEL = {
  du_thao: 'Dự thảo',
  da_duyet: 'Đã phê duyệt',
  dang_thuc_hien: 'Đang triển khai',
  hoan_thanh: 'Đã hoàn thành',
};

export default function KeHoachDaoTaoPage() {
  const [plans] = useState<Plan[]>(INITIAL_PLANS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return p.ten_ke_hoach.toLowerCase().includes(q) || p.doi_tuong.toLowerCase().includes(q);
    });
  }, [plans, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KeHoachDaoTao');
    XLSX.writeFile(wb, `Ke_hoach_dao_tao_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
              placeholder="Tìm theo tên kế hoạch, đối tượng..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Mở form lập kế hoạch đào tạo')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Lập kế hoạch mới
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Tên kế hoạch đào tạo</th>
                <th className="py-3 px-4 text-center">Năm</th>
                <th className="py-3 px-4">Đối tượng tham gia</th>
                <th className="py-3 px-4 text-right">Ngân sách dự kiến</th>
                <th className="py-3 px-4 text-center">Số khóa học</th>
                <th className="py-3 px-4 text-center">Dự kiến học viên</th>
                <th className="py-3 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-semibold text-foreground text-sm">{row.ten_ke_hoach}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.nam}</td>
                  <td className="py-3 px-4 text-muted-foreground">{row.doi_tuong}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-foreground">{formatCurrency(row.ngan_sach)}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.so_khoa}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-primary">{row.so_hoc_vien}</td>
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
