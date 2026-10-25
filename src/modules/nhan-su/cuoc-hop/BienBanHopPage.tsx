import { useMemo, useState } from 'react';
import { Download, Plus, Printer, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface Minute {
  id: string;
  so_bien_ban: string;
  cuoc_hop: string;
  ngay: string;
  thu_ky: string;
  chu_toa: string;
  ket_luan: string;
  trang_thai: 'ban_nhap' | 'da_ky_duyet';
}

const INITIAL_MINUTES: Minute[] = [
  { id: '1', so_bien_ban: 'BBH-2025-001', cuoc_hop: 'Họp giao ban tuần BOD & Trưởng phòng', ngay: '2025-02-24', thu_ky: 'Hoàng Lan Anh', chu_toa: 'Nguyễn Văn Quản Trị', ket_luan: 'Thống nhất kế hoạch ra mắt phân hệ ERP tuần 1 tháng 3. Phòng CNTT hoàn tất kiểm thử.', trang_thai: 'da_ky_duyet' },
  { id: '2', so_bien_ban: 'BBH-2025-002', cuoc_hop: 'Sprint Review & Demo ERP v2.1', ngay: '2025-02-25', thu_ky: 'Nguyễn Văn An', chu_toa: 'Trần Minh Quân', ket_luan: 'Chốt 12 module HCNS và 8 luồng phê duyệt đơn từ. Tiến hành demo cho khách hàng.', trang_thai: 'ban_nhap' },
];

export default function BienBanHopPage() {
  const [minutes] = useState<Minute[]>(INITIAL_MINUTES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMinute, setSelectedMinute] = useState<Minute | null>(null);

  const filtered = useMemo(() => {
    return minutes.filter((m) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return m.so_bien_ban.toLowerCase().includes(q) || m.cuoc_hop.toLowerCase().includes(q) || m.ket_luan.toLowerCase().includes(q);
    });
  }, [minutes, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BienBanHop');
    XLSX.writeFile(wb, `Danh_sach_bien_ban_hop_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
              placeholder="Tìm theo số biên bản, cuộc họp..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Chức năng lập biên bản từ cuộc họp')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Lập biên bản mới
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Số biên bản</th>
                <th className="py-3 px-4">Cuộc họp</th>
                <th className="py-3 px-4">Ngày họp</th>
                <th className="py-3 px-4">Chủ tọa</th>
                <th className="py-3 px-4">Thư ký</th>
                <th className="py-3 px-4">Nội dung kết luận</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">{row.so_bien_ban}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{row.cuoc_hop}</td>
                  <td className="py-3 px-4 text-muted-foreground">{formatDate(row.ngay)}</td>
                  <td className="py-3 px-4 text-foreground">{row.chu_toa}</td>
                  <td className="py-3 px-4 text-muted-foreground">{row.thu_ky}</td>
                  <td className="py-3 px-4 max-w-sm truncate text-foreground">{row.ket_luan}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${row.trang_thai === 'da_ky_duyet' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}>
                      {row.trang_thai === 'da_ky_duyet' ? 'Đã ký duyệt' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button size="sm" variant="outline" onClick={() => setSelectedMinute(row)} className="h-7 text-xs">
                      Xem chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMinute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Biên bản cuộc họp: {selectedMinute.so_bien_ban}</h3>
              <Button size="sm" variant="ghost" onClick={() => setSelectedMinute(null)}>Đóng</Button>
            </div>
            <div className="space-y-3 text-xs leading-relaxed">
              <p>Cuộc họp: <strong>{selectedMinute.cuoc_hop}</strong></p>
              <p>Ngày thực hiện: {formatDate(selectedMinute.ngay)} • Chủ tọa: {selectedMinute.chu_toa} • Thư ký: {selectedMinute.thu_ky}</p>
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <span className="font-semibold block mb-1">Kết luận & phân công nhiệm vụ:</span>
                <p className="text-foreground">{selectedMinute.ket_luan}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5 text-xs">
                <Printer size={14} /> In biên bản
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
