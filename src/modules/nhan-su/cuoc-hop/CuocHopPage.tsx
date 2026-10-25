import { useMemo, useState } from 'react';
import { Calendar, CalendarCheck, Download, Plus, Search, Users, Video } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

type Tab = 'danh_sach' | 'lich';

interface Meeting {
  id: string;
  tieu_de: string;
  phong_hop: string;
  chu_tri: string;
  ngay: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  so_nguoi: number;
  hinh_thuc: 'offline' | 'online';
  trang_thai: 'len_lich' | 'dang_dien_ra' | 'hoan_thanh' | 'da_huy';
}

const INITIAL_MEETINGS: Meeting[] = [
  { id: '1', tieu_de: 'Họp giao ban tuần BOD & Trưởng phòng', phong_hop: 'Phòng họp VIP (Hà Nội)', chu_tri: 'Nguyễn Văn Quản Trị', ngay: '2025-02-24', gio_bat_dau: '08:30', gio_ket_thuc: '10:00', so_nguoi: 12, hinh_thuc: 'offline', trang_thai: 'hoan_thanh' },
  { id: '2', tieu_de: 'Sprint Review & Demo ERP v2.1', phong_hop: 'Phòng họp Sáng tạo A', chu_tri: 'Trần Minh Quân', ngay: '2025-02-25', gio_bat_dau: '14:00', gio_ket_thuc: '16:00', so_nguoi: 8, hinh_thuc: 'offline', trang_thai: 'len_lich' },
  { id: '3', tieu_de: 'Đánh giá chiến dịch Marketing Q1', phong_hop: 'Google Meet', chu_tri: 'Lê Hoàng Nam', ngay: '2025-02-26', gio_bat_dau: '09:30', gio_ket_thuc: '11:00', so_nguoi: 6, hinh_thuc: 'online', trang_thai: 'len_lich' },
  { id: '4', tieu_de: 'Thảo luận ngân sách quý 2 cùng Kế toán', phong_hop: 'Phòng họp Sprint B', chu_tri: 'Vũ Thị Hồng', ngay: '2025-02-27', gio_bat_dau: '15:00', gio_ket_thuc: '16:30', so_nguoi: 5, hinh_thuc: 'offline', trang_thai: 'len_lich' },
];

const STATUS_BADGE = {
  len_lich: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  dang_dien_ra: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  hoan_thanh: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  da_huy: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
};

const STATUS_LABEL = {
  len_lich: 'Đã lên lịch',
  dang_dien_ra: 'Đang diễn ra',
  hoan_thanh: 'Đã hoàn thành',
  da_huy: 'Đã hủy',
};

export default function CuocHopPage() {
  const [tab, setTab] = useState<Tab>('danh_sach');
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [newMeeting, setNewMeeting] = useState({
    tieu_de: '',
    phong_hop: 'Phòng họp Sáng tạo A',
    chu_tri: 'Nguyễn Văn Quản Trị',
    ngay: new Date().toISOString().slice(0, 10),
    gio_bat_dau: '09:00',
    gio_ket_thuc: '10:30',
    so_nguoi: 8,
  });

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return m.tieu_de.toLowerCase().includes(q) || m.phong_hop.toLowerCase().includes(q) || m.chu_tri.toLowerCase().includes(q);
    });
  }, [meetings, searchTerm]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.tieu_de.trim()) return;
    setMeetings((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        tieu_de: newMeeting.tieu_de,
        phong_hop: newMeeting.phong_hop,
        chu_tri: newMeeting.chu_tri,
        ngay: newMeeting.ngay,
        gio_bat_dau: newMeeting.gio_bat_dau,
        gio_ket_thuc: newMeeting.gio_ket_thuc,
        so_nguoi: newMeeting.so_nguoi,
        hinh_thuc: 'offline',
        trang_thai: 'len_lich',
      },
    ]);
    setIsAdding(false);
    toast.success('Lên lịch cuộc họp thành công');
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CuocHop');
    XLSX.writeFile(wb, `Danh_sach_cuoc_hop_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const tabs: TabItem<Tab>[] = [
    { id: 'danh_sach', label: 'Danh sách cuộc họp', icon: CalendarCheck },
    { id: 'lich', label: 'Lịch biểu theo tuần', icon: Calendar },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="shrink-0 relative z-0">
        <Tabs<Tab> tabs={tabs} activeTab={tab} onChange={setTab} />
      </div>

      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-2">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo chủ đề, người chủ trì..."
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => setIsAdding(true)} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Tạo cuộc họp
            </Button>
          </div>
        </div>

        {/* Content */}
        {tab === 'danh_sach' ? (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                  <th className="py-3 px-4">Chủ đề cuộc họp</th>
                  <th className="py-3 px-4">Phòng họp</th>
                  <th className="py-3 px-4">Người chủ trì</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-center">Số người</th>
                  <th className="py-3 px-4">Hình thức</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-semibold text-foreground text-sm">{row.tieu_de}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.phong_hop}</td>
                    <td className="py-3 px-4 text-foreground">{row.chu_tri}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <span className="font-mono text-foreground">{row.gio_bat_dau} - {row.gio_ket_thuc}</span>
                      <span className="block text-[11px] text-muted-foreground">{formatDate(row.ngay)}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{row.so_nguoi}</td>
                    <td className="py-3 px-4">
                      {row.hinh_thuc === 'online' ? (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                          <Video size={13} /> Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-foreground font-medium">
                          <Users size={13} /> Trực tiếp
                        </span>
                      )}
                    </td>
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
        ) : (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Lịch họp trong tuần này</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {['Thứ Hai (24/02)', 'Thứ Ba (25/02)', 'Thứ Tư (26/02)', 'Thứ Năm (27/02)', 'Thứ Sáu (28/02)'].map((day, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-muted/20 p-3 min-h-[220px] space-y-2">
                  <div className="font-semibold text-xs text-foreground pb-2 border-b border-border">{day}</div>
                  {meetings.filter((_, i) => i === idx).map((m) => (
                    <div key={m.id} className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 text-xs space-y-1">
                      <p className="font-semibold text-primary line-clamp-2">{m.tieu_de}</p>
                      <p className="text-[11px] text-muted-foreground">{m.gio_bat_dau} - {m.gio_ket_thuc}</p>
                      <p className="text-[11px] text-foreground font-medium">{m.phong_hop}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-border bg-muted/40">
              <h3 className="text-sm font-semibold text-foreground">Lên lịch cuộc họp mới</h3>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Chủ đề cuộc họp *</label>
                <Input
                  required
                  value={newMeeting.tieu_de}
                  onChange={(e) => setNewMeeting((s) => ({ ...s, tieu_de: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Ngày họp</label>
                  <Input
                    type="date"
                    value={newMeeting.ngay}
                    onChange={(e) => setNewMeeting((s) => ({ ...s, ngay: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Phòng họp</label>
                  <Input
                    value={newMeeting.phong_hop}
                    onChange={(e) => setNewMeeting((s) => ({ ...s, phong_hop: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Giờ bắt đầu</label>
                  <Input
                    type="time"
                    value={newMeeting.gio_bat_dau}
                    onChange={(e) => setNewMeeting((s) => ({ ...s, gio_bat_dau: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Giờ kết thúc</label>
                  <Input
                    type="time"
                    value={newMeeting.gio_ket_thuc}
                    onChange={(e) => setNewMeeting((s) => ({ ...s, gio_ket_thuc: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-white">
                  Lên lịch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
