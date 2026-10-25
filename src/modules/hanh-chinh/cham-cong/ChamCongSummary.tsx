import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAttendanceSummary } from './data';

export function ChamCongSummary() {
  const { data: summaries = [] } = useAttendanceSummary();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2025-02');

  const monthOptions = [
    { value: '2025-02', label: 'Tháng 02/2025' },
    { value: '2025-01', label: 'Tháng 01/2025' },
    { value: '2024-12', label: 'Tháng 12/2024' },
  ];

  const filteredData = useMemo(() => {
    return summaries.filter((s) => {
      if (selectedMonth && s.month !== selectedMonth) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return s.user_name.toLowerCase().includes(q) || s.department_name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [summaries, selectedMonth, searchTerm]);

  const handleExport = () => {
    if (filteredData.length === 0) return;
    const rows = filteredData.map((s) => ({
      'Kỳ': s.month,
      'Nhân viên': s.user_name,
      'Phòng ban': s.department_name,
      'Công chuẩn': s.cong_chuan,
      'Công thực tế': s.cong_thuc_te,
      'Nghỉ phép': s.nghi_phep,
      'Nghỉ không lương': s.nghi_khong_luong,
      'Đi muộn (lần)': s.di_muon,
      'Về sớm (lần)': s.ve_som,
      'Giờ OT': s.gio_ot,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TongHopCong');
    XLSX.writeFile(wb, `Tong_hop_cham_cong_${selectedMonth}.xlsx`);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
        <div className="flex items-center gap-3 flex-1 flex-wrap min-w-[280px]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo nhân viên, phòng ban..."
              className="pl-8 text-xs h-8"
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={monthOptions}
              value={selectedMonth}
              onChange={setSelectedMonth}
              className="text-xs h-8 font-medium"
            />
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          <Download size={14} />
          Xuất tổng hợp
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
              <th className="py-3 px-4">Nhân viên</th>
              <th className="py-3 px-4">Phòng ban</th>
              <th className="py-3 px-4 text-center">Công chuẩn</th>
              <th className="py-3 px-4 text-center">Công thực tế</th>
              <th className="py-3 px-4 text-center">Nghỉ phép</th>
              <th className="py-3 px-4 text-center">Nghỉ KL</th>
              <th className="py-3 px-4 text-center">Đi muộn</th>
              <th className="py-3 px-4 text-center">Về sớm</th>
              <th className="py-3 px-4 text-center">Tăng ca (OT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-medium text-foreground">{row.user_name}</td>
                <td className="py-3 px-4 text-muted-foreground">{row.department_name}</td>
                <td className="py-3 px-4 font-mono text-center text-muted-foreground">{row.cong_chuan}</td>
                <td className="py-3 px-4 font-mono text-center font-bold text-emerald-600 dark:text-emerald-400">
                  {row.cong_thuc_te}
                </td>
                <td className="py-3 px-4 font-mono text-center text-blue-600 dark:text-blue-400">{row.nghi_phep}</td>
                <td className="py-3 px-4 font-mono text-center text-muted-foreground">{row.nghi_khong_luong}</td>
                <td className="py-3 px-4 font-mono text-center text-amber-600">{row.di_muon}</td>
                <td className="py-3 px-4 font-mono text-center text-orange-600">{row.ve_som}</td>
                <td className="py-3 px-4 font-mono text-center font-medium text-foreground">
                  {row.gio_ot > 0 ? `+${row.gio_ot}h` : '0h'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
