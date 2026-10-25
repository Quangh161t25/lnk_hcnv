import { CalendarCheck, CheckCircle2, Clock, Download, TrendingUp } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const MOCK_ROOM_USAGE = [
  { name: 'Phòng VIP', hours: 38 },
  { name: 'Phòng Sáng tạo A', hours: 52 },
  { name: 'Phòng Sprint B', hours: 44 },
  { name: 'Phòng Training', hours: 26 },
];

const MOCK_DEPT_MEETINGS = [
  { name: 'Công nghệ', count: 18 },
  { name: 'Kinh doanh', count: 14 },
  { name: 'Marketing', count: 11 },
  { name: 'Tài chính', count: 8 },
  { name: 'HCNS', count: 9 },
];

export default function BaoCaoCuocHopPage() {
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(MOCK_ROOM_USAGE);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SuDungPhongHop');
    XLSX.writeFile(wb, `Bao_cao_cuoc_hop_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative overflow-y-auto gap-4 p-1">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-xs flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-foreground">Báo cáo & Thống kê quản lý cuộc họp</h3>
          <p className="text-xs text-muted-foreground">Phân tích hiệu suất họp, thời lượng và tần suất sử dụng phòng họp</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
          <Download size={14} /> Xuất Excel
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarCheck size={14} /> Tổng cuộc họp tổ chức
          </span>
          <p className="text-2xl font-bold font-mono text-foreground mt-2">60</p>
          <span className="text-[11px] text-muted-foreground">Trong tháng 02/2025</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Clock size={14} /> Tổng giờ họp
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">160h</p>
          <span className="text-[11px] text-emerald-600/80">Trung bình 1.2h / cuộc họp</span>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-xs">
          <span className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Tỷ lệ có biên bản
          </span>
          <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-2">95%</p>
          <span className="text-[11px] text-blue-600/80">57 / 60 cuộc họp đã ký</span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-xs">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <TrendingUp size={14} /> Tỷ lệ hoàn thành task
          </span>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">88.5%</p>
          <span className="text-[11px] text-amber-600/80">Các công việc giao sau họp</span>
        </div>
      </div>

      {/* 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col">
          <h4 className="text-sm font-semibold text-foreground mb-1">Thời lượng sử dụng phòng họp (Giờ)</h4>
          <p className="text-xs text-muted-foreground mb-4">Mức độ khai thác từng phòng họp trong công ty</p>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_ROOM_USAGE}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v} giờ`, 'Thời lượng']} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {MOCK_ROOM_USAGE.map((_, i) => (
                    <Cell key={`bar-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col">
          <h4 className="text-sm font-semibold text-foreground mb-1">Số lượng cuộc họp theo phòng ban</h4>
          <p className="text-xs text-muted-foreground mb-4">Phân bổ số buổi họp của các khối chức năng</p>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_DEPT_MEETINGS}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {MOCK_DEPT_MEETINGS.map((_, i) => (
                    <Cell key={`pie-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} cuộc họp`, 'Số lượng']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
