import { useMemo, useState } from 'react';
import { Calculator, Calendar, CheckCircle2, Download, Play, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

type Tab = 'bang_tinh' | 'danh_sach_ky';

interface AssetDepreciation {
  id: string;
  ma_ts: string;
  ten_ts: string;
  nhom_ts: string;
  nguyen_gia: number;
  thoi_gian_kh_thang: number;
  kh_luy_ke: number;
  kh_trong_ky: number;
  gia_tri_con_lai: number;
}

const INITIAL_DEPRECIATIONS: AssetDepreciation[] = [
  { id: '1', ma_ts: 'TS-IT-001', ten_ts: 'Laptop Dell Precision 5570', nhom_ts: 'Thiết bị CNTT', nguyen_gia: 45000000, thoi_gian_kh_thang: 36, kh_luy_ke: 9000000, kh_trong_ky: 1250000, gia_tri_con_lai: 34750000 },
  { id: '2', ma_ts: 'TS-IT-002', ten_ts: 'Màn hình Dell UltraSharp 27"', nhom_ts: 'Thiết bị CNTT', nguyen_gia: 14500000, thoi_gian_kh_thang: 36, kh_luy_ke: 2900000, kh_trong_ky: 402777, gia_tri_con_lai: 11197223 },
  { id: '3', ma_ts: 'TS-VP-003', ten_ts: 'Máy in Canon MF244dw', nhom_ts: 'Thiết bị văn phòng', nguyen_gia: 8500000, thoi_gian_kh_thang: 24, kh_luy_ke: 3400000, kh_trong_ky: 354166, gia_tri_con_lai: 4745834 },
  { id: '4', ma_ts: 'TS-NT-004', ten_ts: 'Bàn họp gỗ sồi tự nhiên VIP', nhom_ts: 'Nội thất & Bàn ghế', nguyen_gia: 35000000, thoi_gian_kh_thang: 60, kh_luy_ke: 7000000, kh_trong_ky: 583333, gia_tri_con_lai: 27416667 },
];

const INITIAL_PERIODS = [
  { id: '1', ky: 'Tháng 02/2025', tong_nguyen_gia: 103000000, tong_kh_ky: 2590276, tong_con_lai: 78109724, trang_thai: 'dang_mo' },
  { id: '2', ky: 'Tháng 01/2025', tong_nguyen_gia: 103000000, tong_kh_ky: 2590276, tong_con_lai: 80700000, trang_thai: 'da_chot' },
  { id: '3', ky: 'Tháng 12/2024', tong_nguyen_gia: 98500000, tong_kh_ky: 2450000, tong_con_lai: 83290276, trang_thai: 'da_chot' },
];

export default function KhauHaoTaiSanPage() {
  const [tab, setTab] = useState<Tab>('bang_tinh');
  const [selectedPeriod, setSelectedPeriod] = useState('2025-02');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return INITIAL_DEPRECIATIONS.filter((d) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return d.ten_ts.toLowerCase().includes(q) || d.ma_ts.toLowerCase().includes(q) || d.nhom_ts.toLowerCase().includes(q);
    });
  }, [searchTerm]);

  const handleExport = () => {
    const data = tab === 'bang_tinh' ? filtered : INITIAL_PERIODS;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab === 'bang_tinh' ? 'BangKhauHao' : 'CacKyKhauHao');
    XLSX.writeFile(wb, `Khau_hao_tai_san_${selectedPeriod}.xlsx`);
  };

  const handleCalculate = () => {
    toast.success('Đã tính toán xong bảng khấu hao tài sản kỳ này');
  };

  const tabList: TabItem<Tab>[] = [
    { id: 'bang_tinh', label: 'Bảng tính khấu hao kỳ này', icon: Calculator },
    { id: 'danh_sach_ky', label: 'Lịch sử các kỳ khấu hao', icon: Calendar },
  ];

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Header Tabs */}
        <div className="px-4 pt-3 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <Tabs tabs={tabList} activeTab={tab} onChange={setTab} />
          <div className="flex items-center gap-2 pb-2">
            <Select
              options={[
                { value: '2025-02', label: 'Kỳ tháng 02/2025' },
                { value: '2025-01', label: 'Kỳ tháng 01/2025' },
                { value: '2024-12', label: 'Kỳ tháng 12/2024' },
              ]}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              className="text-xs h-8 w-40"
            />
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            {tab === 'bang_tinh' && (
              <Button size="sm" onClick={handleCalculate} className="h-8 gap-1.5 text-xs bg-primary text-white">
                <Play size={14} /> Chạy tính khấu hao
              </Button>
            )}
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Calculator size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng nguyên giá</div>
              <div className="text-base font-bold text-foreground">{formatCurrency(103000000)}</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Calculator size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Khấu hao trong kỳ</div>
              <div className="text-base font-bold text-amber-600">{formatCurrency(2590276)}</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Calculator size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Lũy kế đã trích</div>
              <div className="text-base font-bold text-foreground">{formatCurrency(22300000)}</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Giá trị còn lại</div>
              <div className="text-base font-bold text-emerald-600">{formatCurrency(78109724)}</div>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-x-auto">
          {tab === 'bang_tinh' ? (
            <div>
              <div className="p-4 border-b border-border flex items-center justify-between gap-3 bg-muted/20">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm mã hoặc tên tài sản..."
                    className="pl-8 text-xs h-8"
                  />
                </div>
                <Button size="sm" variant="outline" onClick={() => toast.success('Đã chốt sổ kỳ khấu hao')} className="h-8 text-xs text-emerald-600">
                  <CheckCircle2 size={13} className="mr-1" /> Chốt sổ kỳ này
                </Button>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                    <th className="py-3 px-4">Mã TS</th>
                    <th className="py-3 px-4">Tên tài sản</th>
                    <th className="py-3 px-4">Nhóm tài sản</th>
                    <th className="py-3 px-4 text-center">Thời gian KH</th>
                    <th className="py-3 px-4 text-right">Nguyên giá</th>
                    <th className="py-3 px-4 text-right">KH lũy kế trước</th>
                    <th className="py-3 px-4 text-right">KH kỳ này</th>
                    <th className="py-3 px-4 text-right">Giá trị còn lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono font-medium text-primary">{d.ma_ts}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{d.ten_ts}</td>
                      <td className="py-3 px-4 text-muted-foreground">{d.nhom_ts}</td>
                      <td className="py-3 px-4 text-center">{d.thoi_gian_kh_thang} tháng</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(d.nguyen_gia)}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{formatCurrency(d.kh_luy_ke)}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">{formatCurrency(d.kh_trong_ky)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(d.gia_tri_con_lai)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                  <th className="py-3 px-4">Kỳ khấu hao</th>
                  <th className="py-3 px-4 text-right">Tổng nguyên giá</th>
                  <th className="py-3 px-4 text-right">Tổng trích trong kỳ</th>
                  <th className="py-3 px-4 text-right">Tổng giá trị còn lại</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {INITIAL_PERIODS.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium text-foreground">{p.ky}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(p.tong_nguyen_gia)}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600">{formatCurrency(p.tong_kh_ky)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(p.tong_con_lai)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${p.trang_thai === 'da_chot' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-blue-500/10 text-blue-600 border-blue-500/30'}`}>
                        {p.trang_thai === 'da_chot' ? 'Đã khóa sổ' : 'Đang mở'}
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
