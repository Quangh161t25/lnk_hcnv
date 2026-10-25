import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Download, Eye, Plus, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface InventoryRound {
  id: string;
  ma_dot: string;
  ten_dot: string;
  pham_vi: string;
  truong_ban: string;
  tu_ngay: string;
  den_ngay: string;
  tong_ts: number;
  khop: number;
  lech: number;
  trang_thai: 'chuan_bi' | 'dang_kiem' | 'da_chot';
}

const INITIAL_ROUNDS: InventoryRound[] = [
  { id: '1', ma_dot: 'KK-2024-Q4', ten_dot: 'Kiểm kê tài sản cố định toàn diện cuối năm 2024', pham_vi: 'Toàn bộ Trụ sở 5F Hà Nội & Kho B1', truong_ban: 'Hoàng Lan Anh (Trưởng phòng HCNS)', tu_ngay: '2024-12-20', den_ngay: '2024-12-28', tong_ts: 185, khop: 182, lech: 3, trang_thai: 'da_chot' },
  { id: '2', ma_dot: 'KK-2025-Q1-IT', ten_dot: 'Kiểm kê định kỳ thiết bị CNTT & Laptop Tầng 4', pham_vi: 'Khối Công nghệ & Sản phẩm (Tầng 4)', truong_ban: 'Trần Minh Quân', tu_ngay: '2025-02-20', den_ngay: '2025-02-28', tong_ts: 64, khop: 60, lech: 4, trang_thai: 'dang_kiem' },
];

const STATUS_BADGE = {
  chuan_bi: 'bg-muted text-muted-foreground border-border',
  dang_kiem: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  da_chot: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

const STATUS_LABEL = {
  chuan_bi: 'Chuẩn bị',
  dang_kiem: 'Đang kiểm kê',
  da_chot: 'Đã hoàn tất & Chốt sổ',
};

export default function KiemKeTaiSanPage() {
  const [rounds] = useState(INITIAL_ROUNDS);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return rounds.filter((r) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return r.ten_dot.toLowerCase().includes(q) || r.ma_dot.toLowerCase().includes(q) || r.pham_vi.toLowerCase().includes(q) || r.truong_ban.toLowerCase().includes(q);
    });
  }, [rounds, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KiemKeTaiSan');
    XLSX.writeFile(wb, `Kiem_ke_tai_san_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
              <ClipboardCheck size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng đợt kiểm kê</div>
              <div className="text-base font-bold text-foreground">{rounds.length} đợt</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <ClipboardCheck size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang kiểm tra</div>
              <div className="text-base font-bold text-foreground">
                {rounds.filter((r) => r.trang_thai === 'dang_kiem').length} đợt
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đã chốt kết quả</div>
              <div className="text-base font-bold text-foreground">
                {rounds.filter((r) => r.trang_thai === 'da_chot').length} đợt
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
              placeholder="Tìm tên đợt, mã đợt, phạm vi..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Khởi tạo đợt kiểm kê tài sản mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Tạo đợt kiểm kê
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã đợt</th>
                <th className="py-3 px-4">Tên đợt kiểm kê</th>
                <th className="py-3 px-4">Phạm vi áp dụng</th>
                <th className="py-3 px-4">Trưởng ban</th>
                <th className="py-3 px-4 text-center">Thời gian</th>
                <th className="py-3 px-4 text-center">Tổng TS</th>
                <th className="py-3 px-4 text-center">Khớp sổ</th>
                <th className="py-3 px-4 text-center">Lệch / Hỏng</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{r.ma_dot}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{r.ten_dot}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.pham_vi}</td>
                  <td className="py-3 px-4 text-foreground">{r.truong_ban}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground text-[11px]">
                    {formatDate(r.tu_ngay)} - {formatDate(r.den_ngay)}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-foreground">{r.tong_ts}</td>
                  <td className="py-3 px-4 text-center font-medium text-emerald-600">{r.khop}</td>
                  <td className="py-3 px-4 text-center font-medium text-rose-600">{r.lech}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[r.trang_thai]}`}>
                      {STATUS_LABEL[r.trang_thai]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`Mở bảng đối soát chi tiết đợt ${r.ma_dot}`)} className="h-7 w-7 p-0">
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
