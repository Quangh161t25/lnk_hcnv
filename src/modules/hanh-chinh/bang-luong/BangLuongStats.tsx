import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/format';
import { useCompanyPayslips } from './data';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export function BangLuongStats() {
  const { data: list = [] } = useCompanyPayslips();

  // Metrics
  const totalGross = useMemo(() => list.reduce((sum, p) => sum + p.tong_thu_nhap, 0), [list]);
  const totalNet = useMemo(() => list.reduce((sum, p) => sum + p.thuc_linh, 0), [list]);
  const totalDeductions = useMemo(() => list.reduce((sum, p) => sum + p.tong_khau_tru, 0), [list]);
  const avgSalary = list.length > 0 ? Math.round(totalNet / list.length) : 0;

  // Chart 1: Department breakdown
  const deptData = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of list) {
      map.set(p.department_name, (map.get(p.department_name) ?? 0) + p.thuc_linh);
    }
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [list]);

  // Chart 2: Cost structure
  const structureData = useMemo(() => {
    let luongCong = 0;
    let phuCap = 0;
    let thuongKpi = 0;
    let baoHiemThue = 0;

    for (const p of list) {
      luongCong += p.luong_theo_cong;
      phuCap += p.phu_cap_an_trua + p.phu_cap_xang_xe + p.phu_cap_khac;
      thuongKpi += p.thuong_kpi;
      baoHiemThue += p.tong_khau_tru;
    }

    return [
      { name: 'Lương theo công', value: luongCong },
      { name: 'Phụ cấp các loại', value: phuCap },
      { name: 'Thưởng KPI', value: thuongKpi },
      { name: 'Bảo hiểm & Thuế', value: baoHiemThue },
    ];
  }, [list]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-y-auto p-1">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">Tổng quỹ lương (Gross)</span>
          <p className="text-2xl font-bold font-mono text-foreground mt-1.5">{formatCurrency(totalGross)}</p>
          <span className="text-[11px] text-muted-foreground">Kỳ tháng 02/2025</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Thực chi chuyển khoản (Net)</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            {formatCurrency(totalNet)}
          </p>
          <span className="text-[11px] text-emerald-600/80">Cho {list.length} nhân sự</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">Lương bình quân / người</span>
          <p className="text-2xl font-bold font-mono text-primary mt-1.5">{formatCurrency(avgSalary)}</p>
          <span className="text-[11px] text-muted-foreground">Thực lĩnh bình quân</span>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-xs">
          <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Tổng khấu trừ (BHXH + Thuế)</span>
          <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1.5">
            {formatCurrency(totalDeductions)}
          </p>
          <span className="text-[11px] text-rose-600/80">Nộp cơ quan nhà nước</span>
        </div>
      </div>

      {/* 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-[360px]">
        {/* Department bar chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col">
          <h4 className="text-sm font-semibold text-foreground mb-1">Quỹ lương theo phòng ban</h4>
          <p className="text-xs text-muted-foreground mb-4">Chi phí thực lĩnh phân bổ theo từng bộ phận</p>
          <div className="flex-1 min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: 20, bottom: 25 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000000)}M`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Quỹ lương']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {deptData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Structure pie chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col">
          <h4 className="text-sm font-semibold text-foreground mb-1">Cơ cấu cấu thành chi phí lương</h4>
          <p className="text-xs text-muted-foreground mb-4">Tỷ trọng giữa lương cơ bản, thưởng và phụ cấp</p>
          <div className="flex-1 min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={structureData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {structureData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Chi phí']} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
