import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Download, TrendingUp } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const COLORS = ['#10b981', '#2563eb', '#f59e0b', '#ef4444'];

const MOCK_DEPT_WORK = [
  { name: 'Khối Công nghệ', hoan_thanh: 45, dang_lam: 12, tre_han: 2 },
  { name: 'Khối Marketing', hoan_thanh: 28, dang_lam: 8, tre_han: 1 },
  { name: 'Khối Kế toán', hoan_thanh: 32, dang_lam: 4, tre_han: 0 },
  { name: 'Khối HCNS', hoan_thanh: 24, dang_lam: 6, tre_han: 1 },
];

const MOCK_STATUS_DIST = [
  { name: 'Đã hoàn thành', value: 129 },
  { name: 'Đang thực hiện', value: 30 },
  { name: 'Chờ duyệt', value: 14 },
  { name: 'Trễ hạn', value: 4 },
];

const MOCK_PROJECT_SUMMARY = [
  { id: '1', du_an: 'Triển khai ERP Vũ Gia', tong_viec: 58, da_xong: 46, dang_chay: 10, tre_han: 2, ty_le: '79.3%' },
  { id: '2', du_an: 'Nâng cấp ISO 27001', tong_viec: 34, da_xong: 22, dang_chay: 11, tre_han: 1, ty_le: '64.7%' },
  { id: '3', du_an: 'Chiến dịch MKT Q1', tong_viec: 42, da_xong: 38, dang_chay: 4, tre_han: 0, ty_le: '90.5%' },
  { id: '4', du_an: 'Cải tạo VP Tầng 4', tong_viec: 25, da_xong: 25, dang_chay: 0, tre_han: 0, ty_le: '100%' },
];

export default function BaoCaoCongViecPage() {
  const [selectedMonth, setSelectedMonth] = useState('2025-02');

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(MOCK_PROJECT_SUMMARY);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoCongViec');
    XLSX.writeFile(wb, `Bao_cao_cong_viec_${selectedMonth}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative overflow-y-auto gap-4 p-1">
      {/* Header toolbar */}
      <div className="flex items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-xs flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-foreground">Báo cáo & Phân tích hiệu suất công việc</h3>
          <p className="text-xs text-muted-foreground">Theo dõi tỷ lệ hoàn thành đúng hạn, khối lượng công việc và dự án theo phòng ban</p>
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

      {/* KPI metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tổng việc trong kỳ</div>
            <div className="text-lg font-bold text-foreground">177 việc</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Đã hoàn thành</div>
            <div className="text-lg font-bold text-foreground">129 việc</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tỷ lệ đúng hạn</div>
            <div className="text-lg font-bold text-emerald-600">96.9%</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Công việc quá hạn</div>
            <div className="text-lg font-bold text-rose-600">4 việc</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Tình hình hoàn thành công việc theo Khối</h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DEPT_WORK} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="hoan_thanh" name="Đã xong" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dang_lam" name="Đang làm" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tre_han" name="Trễ hạn" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Phân bổ trạng thái công việc</h4>
          </div>
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={MOCK_STATUS_DIST} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {MOCK_STATUS_DIST.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 text-xs text-muted-foreground flex-wrap mt-2">
            {MOCK_STATUS_DIST.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Project summary table */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h4 className="text-sm font-semibold text-foreground">Tiến độ chi tiết theo từng dự án</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Tên dự án</th>
                <th className="py-3 px-4 text-center">Tổng công việc</th>
                <th className="py-3 px-4 text-center">Đã hoàn thành</th>
                <th className="py-3 px-4 text-center">Đang chạy</th>
                <th className="py-3 px-4 text-center">Trễ hạn</th>
                <th className="py-3 px-4 text-center">Tỷ lệ hoàn thành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_PROJECT_SUMMARY.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium text-foreground">{row.du_an}</td>
                  <td className="py-3 px-4 text-center font-bold">{row.tong_viec}</td>
                  <td className="py-3 px-4 text-center font-medium text-emerald-600">{row.da_xong}</td>
                  <td className="py-3 px-4 text-center text-blue-600">{row.dang_chay}</td>
                  <td className="py-3 px-4 text-center text-rose-600">{row.tre_han}</td>
                  <td className="py-3 px-4 text-center font-bold text-foreground">{row.ty_le}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
