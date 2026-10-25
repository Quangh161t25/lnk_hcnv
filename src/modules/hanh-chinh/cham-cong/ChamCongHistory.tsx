import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/format';
import {
  ATTENDANCE_STATUS_BADGE,
  ATTENDANCE_STATUS_LABELS,
  useAttendanceLogs,
} from './data';

export function ChamCongHistory() {
  const { data: logs = [] } = useAttendanceLogs();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const deptOptions = useMemo(() => {
    const set = new Set(logs.map((l) => l.department_name));
    return [
      { value: '', label: 'Tất cả phòng ban' },
      ...Array.from(set).map((d) => ({ value: d, label: d })),
    ];
  }, [logs]);

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'dung_gio', label: 'Đúng giờ' },
    { value: 'di_muon', label: 'Đi muộn' },
    { value: 've_som', label: 'Về sớm' },
    { value: 'nghi_phep', label: 'Nghỉ phép' },
    { value: 'khong_phep', label: 'Nghỉ không phép' },
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          l.user_name.toLowerCase().includes(q) ||
          l.department_name.toLowerCase().includes(q) ||
          l.shift.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedDept && l.department_name !== selectedDept) return false;
      if (selectedStatus && l.status !== selectedStatus) return false;
      return true;
    });
  }, [logs, searchTerm, selectedDept, selectedStatus]);

  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    const rows = filteredLogs.map((l) => ({
      'Ngày': l.date,
      'Nhân viên': l.user_name,
      'Phòng ban': l.department_name,
      'Ca làm việc': l.shift,
      'Giờ vào': l.check_in || '—',
      'Giờ ra': l.check_out || '—',
      'Giờ làm việc': l.work_hours,
      'Tăng ca (OT)': l.ot_hours,
      'Trạng thái': ATTENDANCE_STATUS_LABELS[l.status] || l.status,
      'IP': l.ip_address || '—',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LichSuChamCong');
    XLSX.writeFile(wb, `Lich_su_cham_cong_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          <div className="w-full sm:w-48">
            <Select
              options={deptOptions}
              value={selectedDept}
              onChange={setSelectedDept}
              className="text-xs h-8"
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              className="text-xs h-8"
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
          Xuất Excel
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
              <th className="py-3 px-4">Ngày</th>
              <th className="py-3 px-4">Nhân viên</th>
              <th className="py-3 px-4">Phòng ban</th>
              <th className="py-3 px-4">Ca làm việc</th>
              <th className="py-3 px-4">Giờ vào</th>
              <th className="py-3 px-4">Giờ ra</th>
              <th className="py-3 px-4 text-right">Giờ làm</th>
              <th className="py-3 px-4 text-right">Tăng ca (OT)</th>
              <th className="py-3 px-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredLogs.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-mono text-muted-foreground">{formatDate(row.date)}</td>
                <td className="py-3 px-4 font-medium text-foreground">{row.user_name}</td>
                <td className="py-3 px-4 text-muted-foreground">{row.department_name}</td>
                <td className="py-3 px-4 text-muted-foreground">{row.shift}</td>
                <td className="py-3 px-4 font-mono font-medium text-foreground">{row.check_in || '—'}</td>
                <td className="py-3 px-4 font-mono text-muted-foreground">{row.check_out || '—'}</td>
                <td className="py-3 px-4 font-mono text-right font-medium text-foreground">{row.work_hours}h</td>
                <td className="py-3 px-4 font-mono text-right text-muted-foreground">{row.ot_hours > 0 ? `+${row.ot_hours}h` : '—'}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${ATTENDANCE_STATUS_BADGE[row.status] || ''}`}>
                    {ATTENDANCE_STATUS_LABELS[row.status] || row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
