import { useMemo, useState } from 'react';
import { CalendarCheck, Check, Download, Eye, MapPin, Plus, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface TripRegistration {
  id: string;
  so_phieu: string;
  nguoi_dat: string;
  phong_ban: string;
  xe_dieu: string;
  lai_xe: string;
  lo_trinh: string;
  gio_di: string;
  ngay_di: string;
  so_nguoi: number;
  muc_dich: string;
  trang_thai: 'cho_duyet' | 'da_dieu_xe' | 'dang_chay' | 'hoan_thanh';
}

const INITIAL_TRIPS: TripRegistration[] = [
  { id: '1', so_phieu: 'DX-2025-001', nguoi_dat: 'Trần Minh Quân', phong_ban: 'Khối Công nghệ', xe_dieu: 'Toyota Camry (30A-888.68)', lai_xe: 'Nguyễn Văn Hùng', lo_trinh: 'Trụ sở 5F -> Khu Công nghệ cao Hòa Lạc', ngay_di: '2025-02-25', gio_di: '08:30', so_nguoi: 3, muc_dich: 'Làm việc với đối tác Cloud Data Center', trang_thai: 'da_dieu_xe' },
  { id: '2', so_phieu: 'DX-2025-002', nguoi_dat: 'Lê Hoàng Nam', phong_ban: 'Khối Marketing', xe_dieu: 'Ford Everest (30E-666.99)', lai_xe: 'Trần Đình Trọng', lo_trinh: 'Hà Nội -> Bắc Ninh -> Hải Phòng', ngay_di: '2025-02-26', gio_di: '07:00', so_nguoi: 5, muc_dich: 'Khảo sát địa điểm tổ chức hội nghị khách hàng', trang_thai: 'dang_chay' },
  { id: '3', so_phieu: 'DX-2025-003', nguoi_dat: 'Phạm Thu Hương', phong_ban: 'Khối HCNS', xe_dieu: 'Chưa điều xe', lai_xe: 'Chờ phân công', lo_trinh: 'Trụ sở 5F -> Sân bay Nội Bài', ngay_di: '2025-02-27', gio_di: '14:00', so_nguoi: 2, muc_dich: 'Đón chuyên gia đào tạo từ TP. HCM', trang_thai: 'cho_duyet' },
];

const STATUS_BADGE = {
  cho_duyet: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  da_dieu_xe: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  dang_chay: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  hoan_thanh: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

const STATUS_LABEL = {
  cho_duyet: 'Chờ duyệt',
  da_dieu_xe: 'Đã điều xe',
  dang_chay: 'Đang di chuyển',
  hoan_thanh: 'Đã hoàn thành',
};

export default function SuDungXePage() {
  const [trips, setTrips] = useState(INITIAL_TRIPS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return trips.filter((t) => {
      if (statusFilter !== 'all' && t.trang_thai !== statusFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return t.so_phieu.toLowerCase().includes(q) || t.nguoi_dat.toLowerCase().includes(q) || t.lo_trinh.toLowerCase().includes(q) || t.xe_dieu.toLowerCase().includes(q);
    });
  }, [trips, statusFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DangKySuDungXe');
    XLSX.writeFile(wb, `Su_dung_xe_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleApprove = (id: string) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              trang_thai: 'da_dieu_xe',
              xe_dieu: 'Kia Carnival (30H-999.88)',
              lai_xe: 'Nguyễn Văn Hùng',
            }
          : t
      )
    );
    toast.success('Đã duyệt phiếu và điều xe phục vụ công tác');
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CalendarCheck size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng lượt đặt xe</div>
              <div className="text-base font-bold text-foreground">{trips.length} chuyến</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <CalendarCheck size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Chờ phê duyệt</div>
              <div className="text-base font-bold text-foreground">
                {trips.filter((t) => t.trang_thai === 'cho_duyet').length} đơn
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang trên đường</div>
              <div className="text-base font-bold text-foreground">
                {trips.filter((t) => t.trang_thai === 'dang_chay').length} chuyến
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
                placeholder="Tìm số phiếu, người đặt, lộ trình..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'cho_duyet', label: 'Chờ duyệt' },
                { value: 'da_dieu_xe', label: 'Đã điều xe' },
                { value: 'dang_chay', label: 'Đang di chuyển' },
                { value: 'hoan_thanh', label: 'Đã hoàn thành' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="text-xs h-8 w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Đăng ký sử dụng xe mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Đăng ký xe công tác
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Số phiếu</th>
                <th className="py-3 px-4">Người đặt</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Lộ trình di chuyển</th>
                <th className="py-3 px-4 text-center">Thời gian xuất phát</th>
                <th className="py-3 px-4">Xe phân công</th>
                <th className="py-3 px-4">Lái xe</th>
                <th className="py-3 px-4 text-center">Số người</th>
                <th className="py-3 px-4">Mục đích công tác</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{t.so_phieu}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{t.nguoi_dat}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.phong_ban}</td>
                  <td className="py-3 px-4 font-medium text-foreground max-w-xs">{t.lo_trinh}</td>
                  <td className="py-3 px-4 text-center font-mono text-[11px] text-muted-foreground">
                    {t.gio_di} - {formatDate(t.ngay_di)}
                  </td>
                  <td className="py-3 px-4 font-medium text-primary">{t.xe_dieu}</td>
                  <td className="py-3 px-4 text-foreground">{t.lai_xe}</td>
                  <td className="py-3 px-4 text-center font-bold">{t.so_nguoi}</td>
                  <td className="py-3 px-4 text-muted-foreground text-[11px] max-w-xs">{t.muc_dich}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[t.trang_thai]}`}>
                      {STATUS_LABEL[t.trang_thai]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {t.trang_thai === 'cho_duyet' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(t.id)}
                          className="h-7 text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        >
                          <Check size={12} /> Điều xe
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => toast.info(`Xem chi tiết hành trình phiếu ${t.so_phieu}`)} className="h-7 w-7 p-0">
                        <Eye size={13} />
                      </Button>
                    </div>
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
