import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLeaveQuota } from './data';

export function PhieuQuotaList() {
  const { data: quotas = [] } = useLeaveQuota();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm) return quotas;
    const q = searchTerm.toLowerCase();
    return quotas.filter(
      (i) => i.user_name.toLowerCase().includes(q) || i.department_name.toLowerCase().includes(q)
    );
  }, [quotas, searchTerm]);

  const handleExport = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map((q) => ({
      'Nhân viên': q.user_name,
      'Phòng ban': q.department_name,
      'Tổng ngày phép': q.tong_phep,
      'Đã sử dụng': q.da_dung,
      'Đang chờ duyệt': q.cho_duyet,
      'Ngày phép còn lại': q.con_lai,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DinhMucPhep');
    XLSX.writeFile(wb, `Dinh_muc_phep_nam_${new Date().getFullYear()}.xlsx`);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo nhân viên, phòng ban..."
            className="pl-8 text-xs h-8"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          <Download size={14} />
          Xuất Excel
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
              <th className="py-3 px-4">Nhân viên</th>
              <th className="py-3 px-4">Phòng ban</th>
              <th className="py-3 px-4 text-center">Tổng ngày phép</th>
              <th className="py-3 px-4 text-center">Đã sử dụng</th>
              <th className="py-3 px-4 text-center">Đang chờ duyệt</th>
              <th className="py-3 px-4 text-center font-bold text-foreground">Phép còn lại</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-medium text-foreground">{row.user_name}</td>
                <td className="py-3 px-4 text-muted-foreground">{row.department_name}</td>
                <td className="py-3 px-4 text-center font-mono font-medium text-foreground">{row.tong_phep}</td>
                <td className="py-3 px-4 text-center font-mono text-muted-foreground">{row.da_dung}</td>
                <td className="py-3 px-4 text-center font-mono text-amber-600">{row.cho_duyet}</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {row.con_lai}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
