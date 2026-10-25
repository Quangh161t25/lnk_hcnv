import { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Download, Eye, LogIn, LogOut, Search, Users, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { toast } from 'sonner';

type Tab = 'realtime' | 'bang_cong';

interface RealtimeItem {
  id: string;
  ma_nv: string;
  ho_ten: string;
  phong_ban: string;
  chuc_vu: string;
  check_in?: string;
  check_out?: string;
  trang_thai: 'co_mat' | 'chua_vao' | 'da_ve' | 'di_muon';
  thiet_bi: string;
}

const INITIAL_REALTIME: RealtimeItem[] = [
  { id: '1', ma_nv: 'NV001', ho_ten: 'Nguyễn Văn An', phong_ban: 'Phòng Công nghệ', chuc_vu: 'Lập trình viên', check_in: '08:15', check_out: '', trang_thai: 'co_mat', thiet_bi: 'Wi-Fi Văn phòng Tầng 4' },
  { id: '2', ma_nv: 'NV002', ho_ten: 'Trần Thị Mai', phong_ban: 'Phòng Kế toán', chuc_vu: 'Kế toán tổng hợp', check_in: '08:45', check_out: '', trang_thai: 'di_muon', thiet_bi: 'Wi-Fi Văn phòng Tầng 5' },
  { id: '3', ma_nv: 'NV003', ho_ten: 'Lê Hoàng Nam', phong_ban: 'Phòng Marketing', chuc_vu: 'Chuyên viên SEO', check_in: '', check_out: '', trang_thai: 'chua_vao', thiet_bi: '-' },
  { id: '4', ma_nv: 'NV004', ho_ten: 'Phạm Thu Hương', phong_ban: 'Phòng Hành chính - Nhân sự', chuc_vu: 'Chuyên viên Tuyển dụng', check_in: '08:00', check_out: '17:30', trang_thai: 'da_ve', thiet_bi: 'Wi-Fi Văn phòng Tầng 5' },
];

const INITIAL_TIMESHEET = [
  { id: '1', ma_nv: 'NV001', ho_ten: 'Nguyễn Văn An', phong_ban: 'Phòng Công nghệ', cong_chuan: 22, cong_thuc_te: 21.5, nghi_phep: 0.5, di_muon: 1, tang_ca_gio: 8, xep_loai: 'A' },
  { id: '2', ma_nv: 'NV002', ho_ten: 'Trần Thị Mai', phong_ban: 'Phòng Kế toán', cong_chuan: 22, cong_thuc_te: 22, nghi_phep: 0, di_muon: 2, tang_ca_gio: 4, xep_loai: 'A' },
  { id: '3', ma_nv: 'NV003', ho_ten: 'Lê Hoàng Nam', phong_ban: 'Phòng Marketing', cong_chuan: 22, cong_thuc_te: 20, nghi_phep: 2, di_muon: 0, tang_ca_gio: 0, xep_loai: 'B' },
  { id: '4', ma_nv: 'NV004', ho_ten: 'Phạm Thu Hương', phong_ban: 'Phòng Hành chính - Nhân sự', cong_chuan: 22, cong_thuc_te: 22, nghi_phep: 0, di_muon: 0, tang_ca_gio: 12, xep_loai: 'A+' },
];

const STATUS_BADGE = {
  co_mat: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  di_muon: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  da_ve: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  chua_vao: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABEL = {
  co_mat: 'Đang có mặt',
  di_muon: 'Đi muộn',
  da_ve: 'Đã check-out',
  chua_vao: 'Chưa chấm công',
};

export default function TongHopChamCongPage() {
  const [tab, setTab] = useState<Tab>('realtime');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  const filteredRealtime = useMemo(() => {
    return INITIAL_REALTIME.filter((item) => {
      if (selectedDept !== 'all' && item.phong_ban !== selectedDept) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return item.ho_ten.toLowerCase().includes(q) || item.ma_nv.toLowerCase().includes(q);
    });
  }, [searchTerm, selectedDept]);

  const filteredTimesheet = useMemo(() => {
    return INITIAL_TIMESHEET.filter((item) => {
      if (selectedDept !== 'all' && item.phong_ban !== selectedDept) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return item.ho_ten.toLowerCase().includes(q) || item.ma_nv.toLowerCase().includes(q);
    });
  }, [searchTerm, selectedDept]);

  const handleExport = () => {
    const data = tab === 'realtime' ? filteredRealtime : filteredTimesheet;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab === 'realtime' ? 'Realtime' : 'BangCong');
    XLSX.writeFile(wb, `Tong_hop_cham_cong_${tab}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const tabList: TabItem<Tab>[] = [
    { id: 'realtime', label: 'Theo dõi thời gian thực', icon: Clock },
    { id: 'bang_cong', label: 'Bảng công tổng hợp', icon: Calendar },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Header Tabs */}
        <div className="px-4 pt-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <Tabs tabs={tabList} activeTab={tab} onChange={setTab} />
          <div className="pb-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng nhân viên</div>
              <div className="text-base font-bold text-foreground">42 người</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang có mặt</div>
              <div className="text-base font-bold text-foreground">36 người</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đi muộn hôm nay</div>
              <div className="text-base font-bold text-foreground">3 người</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Chưa chấm công</div>
              <div className="text-base font-bold text-foreground">3 người</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã hoặc tên nhân viên..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả phòng ban' },
                { value: 'Phòng Công nghệ', label: 'Phòng Công nghệ' },
                { value: 'Phòng Kế toán', label: 'Phòng Kế toán' },
                { value: 'Phòng Marketing', label: 'Phòng Marketing' },
                { value: 'Phòng Hành chính - Nhân sự', label: 'Phòng HCNS' },
              ]}
              value={selectedDept}
              onChange={setSelectedDept}
              className="text-xs h-8 w-48"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-x-auto">
          {tab === 'realtime' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                  <th className="py-3 px-4">Mã NV</th>
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4 text-center">Giờ vào</th>
                  <th className="py-3 px-4 text-center">Giờ ra</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4">Thiết bị / Điểm check-in</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRealtime.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono font-medium text-primary">{row.ma_nv}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{row.ho_ten}</div>
                      <div className="text-[11px] text-muted-foreground">{row.chuc_vu}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{row.phong_ban}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      {row.check_in ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                          <LogIn size={13} /> {row.check_in}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {row.check_out ? (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                          <LogOut size={13} /> {row.check_out}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[row.trang_thai]}`}>
                        {STATUS_LABEL[row.trang_thai]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">{row.thiet_bi}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => toast.info(`Lịch sử chấm công của ${row.ho_ten}`)} className="h-7 w-7 p-0">
                        <Eye size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                  <th className="py-3 px-4">Mã NV</th>
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4 text-center">Công chuẩn</th>
                  <th className="py-3 px-4 text-center">Công thực tế</th>
                  <th className="py-3 px-4 text-center">Nghỉ phép</th>
                  <th className="py-3 px-4 text-center">Đi muộn (lần)</th>
                  <th className="py-3 px-4 text-center">Tăng ca (giờ)</th>
                  <th className="py-3 px-4 text-center">Xếp loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTimesheet.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono font-medium text-primary">{row.ma_nv}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{row.ho_ten}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.phong_ban}</td>
                    <td className="py-3 px-4 text-center font-medium">{row.cong_chuan}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{row.cong_thuc_te}</td>
                    <td className="py-3 px-4 text-center">{row.nghi_phep}</td>
                    <td className="py-3 px-4 text-center">{row.di_muon}</td>
                    <td className="py-3 px-4 text-center font-medium text-blue-600">{row.tang_ca_gio}h</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {row.xep_loai}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
