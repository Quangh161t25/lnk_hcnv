import { useMemo, useState } from 'react';
import { Archive, Download, Eye, FolderPlus, Plus, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';

interface ArchiveFolder {
  id: string;
  ma_ho_so: string;
  ten_ho_so: string;
  loai: string;
  vi_tri_luu: string;
  nguoi_quan_ly: string;
  nam_luu: string;
  so_tai_lieu: number;
  ngay_tao: string;
  trang_thai: 'dang_luu' | 'ban_giao' | 'tieu_huy';
}

const INITIAL_ARCHIVES: ArchiveFolder[] = [
  { id: '1', ma_ho_so: 'HS-2024-NV', ten_ho_so: 'Hồ sơ nhân sự đã ký hợp đồng chính thức 2024', loai: 'Hồ sơ nhân sự', vi_tri_luu: 'Tủ A3 - Ngăn 2 (Phòng HCNS)', nguoi_quan_ly: 'Hoàng Lan Anh', nam_luu: '2024', so_tai_lieu: 45, ngay_tao: '2024-01-10', trang_thai: 'dang_luu' },
  { id: '2', ma_ho_so: 'HS-2024-HD-KH', ten_ho_so: 'Hợp đồng kinh tế đối tác khách hàng B2B 2024', loai: 'Hợp đồng thương mại', vi_tri_luu: 'Tủ B1 - Kệ 4 (Kho lưu trữ)', nguoi_quan_ly: 'Vũ Thị Hồng', nam_luu: '2024', so_tai_lieu: 68, ngay_tao: '2024-02-15', trang_thai: 'dang_luu' },
  { id: '3', ma_ho_so: 'HS-2023-THUE', ten_ho_so: 'Chứng từ sổ sách kế toán & Báo cáo quyết toán thuế 2023', loai: 'Chứng từ tài chính', vi_tri_luu: 'Tủ C2 - Ngăn 1 (Kho kế toán)', nguoi_quan_ly: 'Trần Thị Mai', nam_luu: '2023', so_tai_lieu: 120, ngay_tao: '2023-12-30', trang_thai: 'dang_luu' },
  { id: '4', ma_ho_so: 'HS-2020-TH', ten_ho_so: 'Hồ sơ thử việc ứng viên không trúng tuyển 2020', loai: 'Hồ sơ tuyển dụng', vi_tri_luu: 'Kho lưu kho lưu trữ cũ', nguoi_quan_ly: 'Phạm Thu Hương', nam_luu: '2020', so_tai_lieu: 85, ngay_tao: '2020-11-20', trang_thai: 'tieu_huy' },
];

const STATUS_BADGE = {
  dang_luu: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  ban_giao: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  tieu_huy: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABEL = {
  dang_luu: 'Đang lưu trữ',
  ban_giao: 'Đã bàn giao',
  tieu_huy: 'Đã tiêu hủy',
};

export default function LuuTruHoSoPage() {
  const [archives] = useState(INITIAL_ARCHIVES);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    return archives.filter((a) => {
      if (typeFilter !== 'all' && a.loai !== typeFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return a.ten_ho_so.toLowerCase().includes(q) || a.ma_ho_so.toLowerCase().includes(q) || a.vi_tri_luu.toLowerCase().includes(q);
    });
  }, [archives, typeFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LuuTruHoSo');
    XLSX.writeFile(wb, `Luu_tru_ho_so_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Quick summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
              <Archive size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng bộ hồ sơ</div>
              <div className="text-base font-bold text-foreground">{archives.length} bộ</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <FolderPlus size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang lưu giữ</div>
              <div className="text-base font-bold text-foreground">
                {archives.filter((a) => a.trang_thai === 'dang_luu').length} bộ
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
                placeholder="Tìm mã hồ sơ, tên, vị trí..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả loại hồ sơ' },
                { value: 'Hồ sơ nhân sự', label: 'Hồ sơ nhân sự' },
                { value: 'Hợp đồng thương mại', label: 'Hợp đồng thương mại' },
                { value: 'Chứng từ tài chính', label: 'Chứng từ tài chính' },
                { value: 'Hồ sơ tuyển dụng', label: 'Hồ sơ tuyển dụng' },
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
            <Button size="sm" onClick={() => toast.info('Thêm cặp hồ sơ lưu trữ mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Tạo hồ sơ lưu trữ
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã hồ sơ</th>
                <th className="py-3 px-4">Tên tập hồ sơ lưu trữ</th>
                <th className="py-3 px-4">Loại hồ sơ</th>
                <th className="py-3 px-4">Vị trí lưu trữ (Tủ/Kệ/Ngăn)</th>
                <th className="py-3 px-4 text-center">Năm lưu</th>
                <th className="py-3 px-4 text-center">Số văn bản</th>
                <th className="py-3 px-4">Người quản lý</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{a.ma_ho_so}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{a.ten_ho_so}</td>
                  <td className="py-3 px-4 text-muted-foreground">{a.loai}</td>
                  <td className="py-3 px-4 text-foreground">{a.vi_tri_luu}</td>
                  <td className="py-3 px-4 text-center">{a.nam_luu}</td>
                  <td className="py-3 px-4 text-center font-medium">{a.so_tai_lieu} tài liệu</td>
                  <td className="py-3 px-4 text-muted-foreground">{a.nguoi_quan_ly}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[a.trang_thai]}`}>
                      {STATUS_LABEL[a.trang_thai]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`Xem chi tiết tài liệu trong hồ sơ ${a.ma_ho_so}`)} className="h-7 w-7 p-0">
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
