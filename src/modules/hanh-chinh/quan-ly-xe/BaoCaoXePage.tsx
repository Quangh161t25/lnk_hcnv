import { useState } from 'react';
import { Calendar, Car, Download, Fuel, TrendingUp, Wrench } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/lib/format';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ec4899'];

const MOCK_VEHICLE_COST = [
  { name: 'Toyota Camry', cost: 6500000, km: 1250 },
  { name: 'Ford Everest', cost: 8200000, km: 1800 },
  { name: 'Ford Transit', cost: 14500000, km: 2400 },
  { name: 'Kia Carnival', cost: 5800000, km: 950 },
];

const MOCK_COST_BREAKDOWN = [
  { name: 'Nhiên liệu xăng/dầu', value: 18500000 },
  { name: 'Bảo dưỡng định kỳ & sửa', value: 12700000 },
  { name: 'Vé cầu đường BOT', value: 2800000 },
  { name: 'Rửa xe & gửi xe', value: 1000000 },
];

const MOCK_VEHICLE_SUMMARY = [
  { id: '1', bien_so: '30A-888.68', dong_xe: 'Toyota Camry 2.5Q', so_chuyen: 18, tong_km: 1250, phi_nhien_lieu: 3200000, phi_bao_duong: 3200000, tong_chi_phi: 6500000 },
  { id: '2', bien_so: '30E-666.99', dong_xe: 'Ford Everest 4x4', so_chuyen: 22, tong_km: 1800, phi_nhien_lieu: 4800000, phi_bao_duong: 2800000, tong_chi_phi: 8200000 },
  { id: '3', bien_so: '29B-123.45', dong_xe: 'Ford Transit 16 chỗ', so_chuyen: 15, tong_km: 2400, phi_nhien_lieu: 5000000, phi_bao_duong: 9500000, tong_chi_phi: 14500000 },
  { id: '4', bien_so: '30H-999.88', dong_xe: 'Kia Carnival 3.5G', so_chuyen: 12, tong_km: 950, phi_nhien_lieu: 5500000, phi_bao_duong: 0, tong_chi_phi: 5800000 },
];

export default function BaoCaoXePage() {
  const [selectedMonth, setSelectedMonth] = useState('2025-02');

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(MOCK_VEHICLE_SUMMARY);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoXe');
    XLSX.writeFile(wb, `Bao_cao_van_hanh_xe_${selectedMonth}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative overflow-y-auto gap-4 p-1">
      {/* Header toolbar */}
      <div className="flex items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-xs flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-foreground">Báo cáo Vận hành & Chi phí Đội xe</h3>
          <p className="text-xs text-muted-foreground">Thống kê số lượt chạy, quãng đường di chuyển và định mức tiêu hao nhiên liệu</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={[
              { value: '2025-02', label: 'Tháng 02/2025' },
              { value: '2025-01', label: 'Tháng 01/2025' },
              { value: '2024-12', label: 'Tháng 12/2024' },
            ]}
            value={selectedMonth}
            onChange={setSelectedMonth}
            className="text-xs h-8 w-36"
          />
          <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
            <Download size={14} /> Xuất Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Car size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tổng lượt công tác</div>
            <div className="text-lg font-bold text-foreground">67 chuyến</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tổng quãng đường</div>
            <div className="text-lg font-bold text-emerald-600">6,400 km</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
            <Fuel size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tiền nhiên liệu</div>
            <div className="text-lg font-bold text-foreground">{formatCurrency(18500000)}</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Wrench size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tổng chi phí vận hành</div>
            <div className="text-lg font-bold text-foreground">{formatCurrency(35000000)}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Tổng chi phí phát sinh theo xe (VNĐ)</h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_VEHICLE_COST} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}Tr`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Tổng chi phí']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="cost" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Fuel size={16} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Cơ cấu hạng mục chi phí xe</h4>
          </div>
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={MOCK_COST_BREAKDOWN} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name?.slice(0, 8)}: ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {MOCK_COST_BREAKDOWN.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Số tiền']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 text-xs text-muted-foreground flex-wrap mt-2">
            {MOCK_COST_BREAKDOWN.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h4 className="text-sm font-semibold text-foreground">Bảng tổng hợp quãng đường & chi phí theo từng xe</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Biển số</th>
                <th className="py-3 px-4">Dòng xe</th>
                <th className="py-3 px-4 text-center">Số chuyến đi</th>
                <th className="py-3 px-4 text-right">Tổng ODO (km)</th>
                <th className="py-3 px-4 text-right">Phí nhiên liệu</th>
                <th className="py-3 px-4 text-right">Phí bảo dưỡng/sửa</th>
                <th className="py-3 px-4 text-right">Tổng chi phí</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_VEHICLE_SUMMARY.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-bold text-primary">{row.bien_so}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{row.dong_xe}</td>
                  <td className="py-3 px-4 text-center font-bold">{row.so_chuyen}</td>
                  <td className="py-3 px-4 text-right font-mono">{row.tong_km.toLocaleString('vi-VN')} km</td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(row.phi_nhien_lieu)}</td>
                  <td className="py-3 px-4 text-right font-medium text-amber-600">{formatCurrency(row.phi_bao_duong)}</td>
                  <td className="py-3 px-4 text-right font-bold text-foreground">{formatCurrency(row.tong_chi_phi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
