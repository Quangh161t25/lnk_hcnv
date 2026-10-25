import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Download, Eye, Plus, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface HandoverSlip {
  id: string;
  so_phieu: string;
  loai_phieu: 'cap_phat' | 'thu_hoi';
  ma_ts: string;
  ten_ts: string;
  nguoi_nhan: string;
  phong_ban: string;
  vi_tri_moi: string;
  ngay_thuc_hien: string;
  nguoi_lap_phieu: string;
  tinh_trang: string;
  trang_thai: 'hoan_thanh' | 'cho_xac_nhan';
}

const INITIAL_SLIPS: HandoverSlip[] = [
  { id: '1', so_phieu: 'CP-2025-001', loai_phieu: 'cap_phat', ma_ts: 'TS-IT-001', ten_ts: 'Laptop Dell Precision 5570', nguoi_nhan: 'Nguyễn Văn An', phong_ban: 'Phòng Công nghệ', vi_tri_moi: 'Tầng 4', ngay_thuc_hien: '2025-02-15', nguoi_lap_phieu: 'Hoàng Lan Anh', tinh_trang: 'Máy mới 100%, đầy đủ sạc và phụ kiện', trang_thai: 'hoan_thanh' },
  { id: '2', so_phieu: 'CP-2025-002', loai_phieu: 'cap_phat', ma_ts: 'TS-IT-002', ten_ts: 'Màn hình Dell UltraSharp 27"', nguoi_nhan: 'Nguyễn Văn An', phong_ban: 'Phòng Công nghệ', vi_tri_moi: 'Tầng 4', ngay_thuc_hien: '2025-02-15', nguoi_lap_phieu: 'Hoàng Lan Anh', tinh_trang: 'Mới 100%, nguyên hộp cáp Type-C', trang_thai: 'hoan_thanh' },
  { id: '3', so_phieu: 'TH-2025-001', loai_phieu: 'thu_hoi', ma_ts: 'TS-VP-012', ten_ts: 'Máy tính bảng iPad Air Gen 5', nguoi_nhan: 'Kho HCNS (Thu hồi)', phong_ban: 'Phòng Marketing', vi_tri_moi: 'Kho tài sản B1', ngay_thuc_hien: '2025-02-20', nguoi_lap_phieu: 'Phạm Thu Hương', tinh_trang: 'Máy dùng tốt, xước nhẹ viền máy', trang_thai: 'hoan_thanh' },
];

export default function CapPhatThuHoiPage() {
  const [slips] = useState(INITIAL_SLIPS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cap_phat' | 'thu_hoi'>('all');

  const filtered = useMemo(() => {
    return slips.filter((s) => {
      if (typeFilter !== 'all' && s.loai_phieu !== typeFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return s.so_phieu.toLowerCase().includes(q) || s.ten_ts.toLowerCase().includes(q) || s.nguoi_nhan.toLowerCase().includes(q);
    });
  }, [slips, typeFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CapPhatThuHoi');
    XLSX.writeFile(wb, `Cap_phat_thu_hoi_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm số phiếu, tài sản, người nhận..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả loại phiếu' },
                { value: 'cap_phat', label: 'Cấp phát tài sản' },
                { value: 'thu_hoi', label: 'Thu hồi tài sản' },
              ]}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val as 'all' | 'cap_phat' | 'thu_hoi')}
              className="text-xs h-8 w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Lập phiếu cấp phát / thu hồi mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Lập phiếu mới
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Số phiếu</th>
                <th className="py-3 px-4 text-center">Loại phiếu</th>
                <th className="py-3 px-4">Mã TS</th>
                <th className="py-3 px-4">Tên tài sản</th>
                <th className="py-3 px-4">Người nhận / bàn giao</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Vị trí mới</th>
                <th className="py-3 px-4 text-center">Ngày thực hiện</th>
                <th className="py-3 px-4">Tình trạng bàn giao</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{s.so_phieu}</td>
                  <td className="py-3 px-4 text-center">
                    {s.loai_phieu === 'cap_phat' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                        <ArrowDownLeft size={12} /> Cấp phát
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/30">
                        <ArrowUpRight size={12} /> Thu hồi
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{s.ma_ts}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{s.ten_ts}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{s.nguoi_nhan}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.phong_ban}</td>
                  <td className="py-3 px-4 text-foreground">{s.vi_tri_moi}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(s.ngay_thuc_hien)}</td>
                  <td className="py-3 px-4 text-muted-foreground text-[11px] max-w-xs">{s.tinh_trang}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                      Hoàn thành
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`Xem biên bản bàn giao phiếu ${s.so_phieu}`)} className="h-7 w-7 p-0">
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
