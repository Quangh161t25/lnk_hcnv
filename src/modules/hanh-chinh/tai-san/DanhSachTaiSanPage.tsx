import { useMemo, useState } from 'react';
import { ArrowLeftRight, Building2, CheckCircle2, Download, Eye, Plus, Search, UserCheck, Wrench } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

type Tab = 'danh_sach' | 'cua_toi';

interface Asset {
  id: string;
  ma_ts: string;
  ten_ts: string;
  nhom_ts: string;
  vi_tri: string;
  nguoi_giu: string;
  nguyen_gia: number;
  gia_tri_con_lai: number;
  ngay_sd: string;
  trang_thai: 'dang_su_dung' | 'chua_su_dung' | 'dang_bao_tri' | 'hong_thanh_ly';
}

const INITIAL_ASSETS: Asset[] = [
  { id: '1', ma_ts: 'TS-IT-001', ten_ts: 'Laptop Dell Precision 5570 i7/32GB/1TB', nhom_ts: 'Thiết bị CNTT', vi_tri: 'Phòng Công nghệ (Tầng 4)', nguoi_giu: 'Nguyễn Văn An', nguyen_gia: 45000000, gia_tri_con_lai: 36000000, ngay_sd: '2024-03-01', trang_thai: 'dang_su_dung' },
  { id: '2', ma_ts: 'TS-IT-002', ten_ts: 'Màn hình Dell UltraSharp 27" U2723QE 4K', nhom_ts: 'Thiết bị CNTT', vi_tri: 'Phòng Công nghệ (Tầng 4)', nguoi_giu: 'Nguyễn Văn An', nguyen_gia: 14500000, gia_tri_con_lai: 11600000, ngay_sd: '2024-03-01', trang_thai: 'dang_su_dung' },
  { id: '3', ma_ts: 'TS-VP-003', ten_ts: 'Máy in Laser đa chức năng Canon MF244dw', nhom_ts: 'Thiết bị văn phòng', vi_tri: 'Khu vực In ấn Tầng 5', nguoi_giu: 'Hoàng Lan Anh', nguyen_gia: 8500000, gia_tri_con_lai: 5100000, ngay_sd: '2023-06-15', trang_thai: 'dang_su_dung' },
  { id: '4', ma_ts: 'TS-NT-004', ten_ts: 'Bàn họp gỗ sồi tự nhiên 12 ghế VIP', nhom_ts: 'Nội thất & Bàn ghế', vi_tri: 'Phòng họp VIP Tầng 5', nguoi_giu: 'HCNS Quản lý', nguyen_gia: 35000000, gia_tri_con_lai: 28000000, ngay_sd: '2023-01-10', trang_thai: 'dang_su_dung' },
  { id: '5', ma_ts: 'TS-IT-005', ten_ts: 'Máy chiếu Sony Laser 5000 Lumens', nhom_ts: 'Thiết bị CNTT', vi_tri: 'Kho tài sản B1', nguoi_giu: 'Chưa cấp phát', nguyen_gia: 28000000, gia_tri_con_lai: 22400000, ngay_sd: '2024-08-01', trang_thai: 'chua_su_dung' },
];

const STATUS_BADGE = {
  dang_su_dung: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  chua_su_dung: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  dang_bao_tri: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  hong_thanh_ly: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
};

const STATUS_LABEL = {
  dang_su_dung: 'Đang sử dụng',
  chua_su_dung: 'Trong kho (Sẵn sàng)',
  dang_bao_tri: 'Đang bảo trì',
  hong_thanh_ly: 'Chờ thanh lý',
};

export default function DanhSachTaiSanPage() {
  const [tab, setTab] = useState<Tab>('danh_sach');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');

  const filtered = useMemo(() => {
    return INITIAL_ASSETS.filter((a) => {
      if (tab === 'cua_toi' && a.nguoi_giu !== 'Nguyễn Văn An') return false;
      if (groupFilter !== 'all' && a.nhom_ts !== groupFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return a.ten_ts.toLowerCase().includes(q) || a.ma_ts.toLowerCase().includes(q) || a.nguoi_giu.toLowerCase().includes(q) || a.vi_tri.toLowerCase().includes(q);
    });
  }, [tab, groupFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TaiSan');
    XLSX.writeFile(wb, `Danh_muc_tai_san_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const tabList: TabItem<Tab>[] = [
    { id: 'danh_sach', label: 'Tất cả tài sản', icon: Building2 },
    { id: 'cua_toi', label: 'Tài sản tôi đang giữ', icon: UserCheck },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Header Tabs */}
        <div className="px-4 pt-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <Tabs tabs={tabList} activeTab={tab} onChange={setTab} />
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng tài sản</div>
              <div className="text-base font-bold text-foreground">{INITIAL_ASSETS.length} món</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang sử dụng</div>
              <div className="text-base font-bold text-foreground">
                {INITIAL_ASSETS.filter((a) => a.trang_thai === 'dang_su_dung').length} món
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Sẵn sàng cấp phát</div>
              <div className="text-base font-bold text-foreground">
                {INITIAL_ASSETS.filter((a) => a.trang_thai === 'chua_su_dung').length} món
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Wrench size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang bảo trì</div>
              <div className="text-base font-bold text-foreground">
                {INITIAL_ASSETS.filter((a) => a.trang_thai === 'dang_bao_tri').length} món
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
                placeholder="Tìm mã tài sản, tên, người giữ..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả nhóm tài sản' },
                { value: 'Thiết bị CNTT', label: 'Thiết bị CNTT' },
                { value: 'Thiết bị văn phòng', label: 'Thiết bị văn phòng' },
                { value: 'Nội thất & Bàn ghế', label: 'Nội thất & Bàn ghế' },
              ]}
              value={groupFilter}
              onChange={setGroupFilter}
              className="text-xs h-8 w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Khai báo tài sản mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Thêm tài sản
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã TS</th>
                <th className="py-3 px-4">Tên tài sản</th>
                <th className="py-3 px-4">Nhóm tài sản</th>
                <th className="py-3 px-4">Vị trí hiện tại</th>
                <th className="py-3 px-4">Người đang giữ</th>
                <th className="py-3 px-4 text-right">Nguyên giá</th>
                <th className="py-3 px-4 text-right">Giá trị còn lại</th>
                <th className="py-3 px-4 text-center">Ngày đưa vào SD</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{a.ma_ts}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{a.ten_ts}</td>
                  <td className="py-3 px-4 text-muted-foreground">{a.nhom_ts}</td>
                  <td className="py-3 px-4 text-foreground">{a.vi_tri}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{a.nguoi_giu}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(a.nguyen_gia)}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(a.gia_tri_con_lai)}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(a.ngay_sd)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[a.trang_thai]}`}>
                      {STATUS_LABEL[a.trang_thai]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`Lịch sử sử dụng và bảo trì của tài sản ${a.ma_ts}`)} className="h-7 w-7 p-0">
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
