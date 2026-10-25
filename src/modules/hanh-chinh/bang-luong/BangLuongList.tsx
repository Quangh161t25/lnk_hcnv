import { useMemo, useState } from 'react';
import { Check, CreditCard, Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/lib/format';
import {
  PAYROLL_STATUS_BADGE,
  PAYROLL_STATUS_LABELS,
  useApprovePayroll,
  useCompanyPayslips,
} from './data';

export function BangLuongList() {
  const { data: list = [] } = useCompanyPayslips();
  const approveMut = useApprovePayroll();

  const [selectedPeriod, setSelectedPeriod] = useState('2025-02');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const periodOptions = [
    { value: '2025-02', label: 'Kỳ lương tháng 02/2025' },
    { value: '2025-01', label: 'Kỳ lương tháng 01/2025' },
    { value: '2024-12', label: 'Kỳ lương tháng 12/2024' },
  ];

  const deptOptions = useMemo(() => {
    const set = new Set(list.map((l) => l.department_name));
    return [
      { value: '', label: 'Tất cả phòng ban' },
      ...Array.from(set).map((d) => ({ value: d, label: d })),
    ];
  }, [list]);

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    ...Object.entries(PAYROLL_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const filtered = useMemo(() => {
    return list.filter((p) => {
      if (selectedPeriod && p.period !== selectedPeriod) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          p.user_name.toLowerCase().includes(q) ||
          p.user_code.toLowerCase().includes(q) ||
          p.department_name.toLowerCase().includes(q) ||
          p.position_name.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedDept && p.department_name !== selectedDept) return false;
      if (selectedStatus && p.trang_thai !== selectedStatus) return false;
      return true;
    });
  }, [list, selectedPeriod, searchTerm, selectedDept, selectedStatus]);

  const handleExport = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map((p) => ({
      'Kỳ': p.period,
      'Mã NV': p.user_code,
      'Họ và tên': p.user_name,
      'Phòng ban': p.department_name,
      'Chức vụ': p.position_name,
      'Lương cơ bản': p.luong_co_ban,
      'Công thực tế': p.ngay_cong_thuc_te,
      'Tổng thu nhập': p.tong_thu_nhap,
      'Tổng khấu trừ': p.tong_khau_tru,
      'Thực lĩnh': p.thuc_linh,
      'Số tài khoản': p.bank_account,
      'Ngân hàng': p.bank_name,
      'Trạng thái': PAYROLL_STATUS_LABELS[p.trang_thai] || p.trang_thai,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BangLuong');
    XLSX.writeFile(wb, `Bang_luong_toan_cong_ty_${selectedPeriod}.xlsx`);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
        <div className="flex items-center gap-3 flex-1 flex-wrap min-w-[280px]">
          <div className="w-full sm:w-48">
            <Select
              options={periodOptions}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              className="text-xs h-8 font-medium"
            />
          </div>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, mã NV..."
              className="pl-8 text-xs h-8"
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={deptOptions}
              value={selectedDept}
              onChange={setSelectedDept}
              className="text-xs h-8"
            />
          </div>
          <div className="w-full sm:w-40">
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
          Xuất bảng lương
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
              <th className="py-3 px-4">Mã NV</th>
              <th className="py-3 px-4">Nhân viên</th>
              <th className="py-3 px-4">Phòng ban</th>
              <th className="py-3 px-4">Chức vụ</th>
              <th className="py-3 px-4 text-right">Lương cơ bản</th>
              <th className="py-3 px-4 text-center">Công</th>
              <th className="py-3 px-4 text-right">Tổng thu nhập</th>
              <th className="py-3 px-4 text-right">Khấu trừ</th>
              <th className="py-3 px-4 text-right font-bold text-foreground">Thực lĩnh</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-mono font-medium text-foreground">{row.user_code}</td>
                <td className="py-3 px-4 font-medium text-foreground">{row.user_name}</td>
                <td className="py-3 px-4 text-muted-foreground">{row.department_name}</td>
                <td className="py-3 px-4 text-muted-foreground">{row.position_name}</td>
                <td className="py-3 px-4 font-mono text-right text-muted-foreground">
                  {formatCurrency(row.luong_co_ban)}
                </td>
                <td className="py-3 px-4 font-mono text-center font-medium text-foreground">
                  {row.ngay_cong_thuc_te}
                </td>
                <td className="py-3 px-4 font-mono text-right text-foreground">
                  {formatCurrency(row.tong_thu_nhap)}
                </td>
                <td className="py-3 px-4 font-mono text-right text-rose-600">
                  -{formatCurrency(row.tong_khau_tru)}
                </td>
                <td className="py-3 px-4 font-mono text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(row.thuc_linh)}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${PAYROLL_STATUS_BADGE[row.trang_thai] || ''}`}>
                    {PAYROLL_STATUS_LABELS[row.trang_thai] || row.trang_thai}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {row.trang_thai === 'cho_duyet' ? (
                    <Button
                      size="sm"
                      onClick={() => approveMut.mutate({ id: row.id, status: 'da_duyet' })}
                      className="h-7 px-2 text-[11px] bg-primary hover:bg-primary/90 text-white"
                    >
                      <Check size={13} className="mr-1" />
                      Duyệt
                    </Button>
                  ) : row.trang_thai === 'da_duyet' ? (
                    <Button
                      size="sm"
                      onClick={() => approveMut.mutate({ id: row.id, status: 'da_thanh_toan' })}
                      className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CreditCard size={13} className="mr-1" />
                      Chi trả
                    </Button>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-medium">Đã thanh toán</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
