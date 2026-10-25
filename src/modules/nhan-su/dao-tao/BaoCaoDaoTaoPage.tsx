import { useState } from 'react';
import { Award, BookOpen, Clock, Download, GraduationCap, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/lib/format';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const MOCK_DEPT_STATS = [
  { name: 'Khối Công nghệ', hours: 142, cost: 45000000, students: 38 },
  { name: 'Khối Kinh doanh', hours: 86, cost: 28000000, students: 25 },
  { name: 'Khối Marketing', hours: 54, cost: 18000000, students: 16 },
  { name: 'Khối HCNS', hours: 40, cost: 12000000, students: 12 },
  { name: 'Khối Tài chính', hours: 32, cost: 10000000, students: 9 },
];

const MOCK_RESULT_DATA = [
  { name: 'Đạt chứng chỉ', value: 85 },
  { name: 'Chưa đạt', value: 8 },
  { name: 'Đang theo học', value: 24 },
];

const MOCK_COURSES_SUMMARY = [
  { id: '1', ma_khoa: 'KDT-DEV-01', ten_khoa: 'Kiến trúc React & Clean Code', hoc_vien: 18, so_gio: 24, dat: 16, ty_le: '88.9%', chi_phi: 30000000 },
  { id: '2', ma_khoa: 'KDT-MGT-02', ten_khoa: 'Kỹ năng Phỏng vấn & Đánh giá năng lực', hoc_vien: 12, so_gio: 8, dat: 12, ty_le: '100%', chi_phi: 15000000 },
  { id: '3', ma_khoa: 'KDT-SEC-03', ten_khoa: 'An toàn bảo mật ISO 27001', hoc_vien: 45, so_gio: 12, dat: 42, ty_le: '93.3%', chi_phi: 25000000 },
];

export default function BaoCaoDaoTaoPage() {
  const [selectedYear, setSelectedYear] = useState('2025');

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(MOCK_COURSES_SUMMARY);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoDaoTao');
    XLSX.writeFile(wb, `Bao_cao_dao_tao_${selectedYear}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative overflow-y-auto gap-4 p-1">
      {/* Header toolbar */}
      <div className="flex items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-xs flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-foreground">Báo cáo & Hiệu quả đào tạo</h3>
          <p className="text-xs text-muted-foreground">Thống kê số giờ học, tỷ lệ hoàn thành chứng chỉ và ngân sách theo phòng ban</p>
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
            <Download size={14} /> Xuất Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tổng khóa học</div>
            <div className="text-lg font-bold text-foreground">12 khóa</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Lượt học viên</div>
            <div className="text-lg font-bold text-foreground">117 lượt</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tổng giờ đào tạo</div>
            <div className="text-lg font-bold text-foreground">354 giờ</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tỷ lệ đạt chứng chỉ</div>
            <div className="text-lg font-bold text-foreground">91.4%</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart - Giờ đào tạo theo khối */}
        <div className="lg:col-span-2 bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Số giờ đào tạo theo phòng ban (giờ)</h4>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DEPT_STATS} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val ?? 0} giờ`, 'Thời lượng']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart - Tỷ lệ kết quả */}
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Tỷ lệ kết quả đào tạo</h4>
          </div>
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={MOCK_RESULT_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {MOCK_RESULT_DATA.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 text-xs text-muted-foreground flex-wrap mt-2">
            {MOCK_RESULT_DATA.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h4 className="text-sm font-semibold text-foreground">Bảng tổng hợp chi phí & kết quả các khóa học</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã khóa</th>
                <th className="py-3 px-4">Tên khóa đào tạo</th>
                <th className="py-3 px-4 text-center">Số học viên</th>
                <th className="py-3 px-4 text-center">Thời lượng</th>
                <th className="py-3 px-4 text-center">Số đạt</th>
                <th className="py-3 px-4 text-center">Tỷ lệ đạt</th>
                <th className="py-3 px-4 text-right">Chi phí</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_COURSES_SUMMARY.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{row.ma_khoa}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{row.ten_khoa}</td>
                  <td className="py-3 px-4 text-center">{row.hoc_vien}</td>
                  <td className="py-3 px-4 text-center">{row.so_gio} giờ</td>
                  <td className="py-3 px-4 text-center font-medium text-emerald-600">{row.dat}</td>
                  <td className="py-3 px-4 text-center font-medium">{row.ty_le}</td>
                  <td className="py-3 px-4 text-right font-medium text-foreground">{formatCurrency(row.chi_phi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
