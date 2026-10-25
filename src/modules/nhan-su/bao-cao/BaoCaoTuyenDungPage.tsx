import { useState } from 'react';
import { CheckCircle2, Clock, Download, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const MOCK_CHANNEL_DATA = [
  { name: 'VietnamWorks', count: 45 },
  { name: 'TopCV', count: 68 },
  { name: 'LinkedIn', count: 32 },
  { name: 'Facebook', count: 24 },
  { name: 'Giới thiệu nội bộ', count: 18 },
];

const MOCK_STAGE_DATA = [
  { stage: 'Tiếp nhận hồ sơ', count: 187 },
  { stage: 'Sơ tuyển qua CV', count: 96 },
  { stage: 'Phỏng vấn vòng 1', count: 54 },
  { stage: 'Phỏng vấn vòng 2', count: 28 },
  { stage: 'Gửi Offer', count: 16 },
  { stage: 'Đã Onboard', count: 14 },
];

const MOCK_SUMMARY = [
  { id: '1', de_xuat: 'DX-2025-01: Senior Frontend Dev', chi_tieu: 2, nop_cv: 42, phong_van: 12, offer: 3, onboard: 2, ty_le: '100%' },
  { id: '2', de_xuat: 'DX-2025-02: Kế toán tổng hợp', chi_tieu: 1, nop_cv: 28, phong_van: 6, offer: 1, onboard: 1, ty_le: '100%' },
  { id: '3', de_xuat: 'DX-2025-03: Trưởng nhóm Marketing', chi_tieu: 1, nop_cv: 35, phong_van: 8, offer: 1, onboard: 1, ty_le: '100%' },
  { id: '4', de_xuat: 'DX-2025-04: Nhân viên Kinh doanh B2B', chi_tieu: 5, nop_cv: 56, phong_van: 18, offer: 4, onboard: 3, ty_le: '60%' },
];

export default function BaoCaoTuyenDungPage() {
  const [selectedYear, setSelectedYear] = useState('2025');

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(MOCK_SUMMARY);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoTuyenDung');
    XLSX.writeFile(wb, `Bao_cao_tuyen_dung_${selectedYear}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative overflow-y-auto gap-4 p-1">
      {/* Filter header */}
      <div className="flex items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-xs flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-foreground">Báo cáo & Phân tích hiệu quả tuyển dụng</h3>
          <p className="text-xs text-muted-foreground">Theo dõi phễu tuyển dụng, kênh ứng viên và tỷ lệ onboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={[
              { value: '2025', label: 'Năm 2025' },
              { value: '2024', label: 'Năm 2024' },
            ]}
            value={selectedYear}
            onChange={setSelectedYear}
            className="text-xs h-8 w-32"
          />
          <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
            <Download size={14} />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* KPI metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Users size={14} /> Tổng hồ sơ tiếp nhận
          </span>
          <p className="text-2xl font-bold font-mono text-foreground mt-2">187</p>
          <span className="text-[11px] text-emerald-600">↑ 18% so với cùng kỳ</span>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-xs">
          <span className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <Clock size={14} /> Đã phỏng vấn
          </span>
          <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-2">54</p>
          <span className="text-[11px] text-blue-600/80">Tỷ lệ qua vòng CV: 28.8%</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Đã tiếp nhận (Onboard)
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">14</p>
          <span className="text-[11px] text-emerald-600/80">Chỉ tiêu đề xuất: 16 (87.5%)</span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-xs">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <TrendingUp size={14} /> Thời gian tuyển TB
          </span>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">18.5 ngày</p>
          <span className="text-[11px] text-amber-600/80">Nhanh hơn mục tiêu 3.5 ngày</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Phễu tuyển dụng */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col">
          <h4 className="text-sm font-semibold text-foreground mb-1">Phễu chuyển đổi tuyển dụng</h4>
          <p className="text-xs text-muted-foreground mb-4">Số lượng ứng viên qua từng vòng đánh giá</p>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_STAGE_DATA} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v: number) => [`${v} ứng viên`, 'Số lượng']} />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]}>
                  {MOCK_STAGE_DATA.map((_, i) => (
                    <Cell key={`bar-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Nguồn kênh */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col">
          <h4 className="text-sm font-semibold text-foreground mb-1">Ứng viên theo kênh tuyển dụng</h4>
          <p className="text-xs text-muted-foreground mb-4">Tỷ trọng hồ sơ tiếp nhận theo nguồn</p>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_CHANNEL_DATA}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {MOCK_CHANNEL_DATA.map((_, i) => (
                    <Cell key={`pie-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} ứng viên`, 'Số hồ sơ']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Progress per vacancy */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h4 className="text-sm font-semibold text-foreground">Tiến độ theo đợt đề xuất tuyển dụng</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Đề xuất tuyển dụng</th>
                <th className="py-3 px-4 text-center">Chỉ tiêu</th>
                <th className="py-3 px-4 text-center">Nộp CV</th>
                <th className="py-3 px-4 text-center">Phỏng vấn</th>
                <th className="py-3 px-4 text-center">Offer</th>
                <th className="py-3 px-4 text-center">Onboard</th>
                <th className="py-3 px-4 text-center">Tỷ lệ hoàn thành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {MOCK_SUMMARY.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium text-foreground">{row.de_xuat}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.chi_tieu}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.nop_cv}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.phong_van}</td>
                  <td className="py-3 px-4 text-center font-mono">{row.offer}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">{row.onboard}</td>
                  <td className="py-3 px-4 text-center font-bold text-primary">{row.ty_le}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
