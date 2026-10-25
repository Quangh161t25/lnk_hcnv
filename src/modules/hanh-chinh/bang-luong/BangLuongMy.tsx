import { useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/lib/format';
import { t } from '@/lib/i18n';
import { PAYROLL_STATUS_BADGE, PAYROLL_STATUS_LABELS, useCompanyPayslips } from './data';

export function BangLuongMy() {
  const { data: list = [] } = useCompanyPayslips();
  const [selectedPeriod, setSelectedPeriod] = useState('2025-02');
  const printRef = useRef<HTMLDivElement>(null);

  const periodOptions = [
    { value: '2025-02', label: 'Kỳ lương tháng 02/2025' },
    { value: '2025-01', label: 'Kỳ lương tháng 01/2025' },
    { value: '2024-12', label: 'Kỳ lương tháng 12/2024' },
  ];

  // My record demo (u-1)
  const payslip = list.find((p) => p.user_id === 'u-1' && p.period === selectedPeriod) || list[0];

  const handlePrint = () => {
    window.print();
  };

  if (!payslip) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground text-sm">
        {t('bangLuong.my.empty')}
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto">
      {/* Period Selector & Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-card p-4 rounded-xl border border-border shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Kỳ lương:</span>
          <div className="w-56">
            <Select
              options={periodOptions}
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              className="text-xs h-8 font-medium"
            />
          </div>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${PAYROLL_STATUS_BADGE[payslip.trang_thai] || ''}`}>
            {PAYROLL_STATUS_LABELS[payslip.trang_thai] || payslip.trang_thai}
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handlePrint}
          className="h-8 gap-1.5 text-xs font-medium"
        >
          <Printer size={14} />
          In phiếu lương
        </Button>
      </div>

      {/* Payslip Document */}
      <div
        ref={printRef}
        className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8 space-y-6 max-w-4xl mx-auto w-full print:border-none print:shadow-none print:p-0"
      >
        {/* Header */}
        <div className="border-b border-border pb-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground uppercase tracking-wide">
              PHIẾU LƯƠNG NHÂN VIÊN
            </h2>
            <p className="text-xs font-medium text-primary">Kỳ chi trả: Tháng {payslip.period}</p>
            <p className="text-xs text-muted-foreground">Công ty Cổ phần Công nghệ Vũ Gia</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center sm:text-right min-w-[200px]">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              LƯƠNG THỰC LĨNH
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(payslip.thuc_linh)}
            </p>
          </div>
        </div>

        {/* Employee & Bank Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20 border border-border text-xs">
          <div>
            <span className="text-muted-foreground">Họ và tên:</span>
            <p className="font-semibold text-foreground mt-0.5">{payslip.user_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Mã nhân viên:</span>
            <p className="font-mono font-medium text-foreground mt-0.5">{payslip.user_code}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Phòng ban:</span>
            <p className="font-medium text-foreground mt-0.5">{payslip.department_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Chức danh:</span>
            <p className="font-medium text-foreground mt-0.5">{payslip.position_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Công chuẩn / Thực tế:</span>
            <p className="font-mono font-medium text-foreground mt-0.5">
              {payslip.ngay_cong_thuc_te} / {payslip.ngay_cong_chuan} ngày
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Lương cơ bản:</span>
            <p className="font-mono font-medium text-foreground mt-0.5">
              {formatCurrency(payslip.luong_co_ban)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Số tài khoản:</span>
            <p className="font-mono font-medium text-foreground mt-0.5">{payslip.bank_account}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Ngân hàng:</span>
            <p className="font-medium text-foreground mt-0.5">{payslip.bank_name}</p>
          </div>
        </div>

        {/* Income vs Deduction Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột 1: Thu nhập */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border font-semibold text-xs text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>I. Các khoản thu nhập</span>
              <span className="text-emerald-600 font-mono">{formatCurrency(payslip.tong_thu_nhap)}</span>
            </div>
            <div className="divide-y divide-border/60 text-xs">
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-foreground">Lương theo ngày công thực tế:</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(payslip.luong_theo_cong)}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-foreground">Phụ cấp ăn trưa:</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(payslip.phu_cap_an_trua)}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-foreground">Phụ cấp xăng xe, đi lại:</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(payslip.phu_cap_xang_xe)}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-foreground">Phụ cấp trách nhiệm / khác:</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(payslip.phu_cap_khac)}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between bg-primary/5">
                <span className="font-semibold text-primary">Thưởng hiệu quả / KPI:</span>
                <span className="font-mono font-bold text-primary">{formatCurrency(payslip.thuong_kpi)}</span>
              </div>
            </div>
          </div>

          {/* Cột 2: Khấu trừ */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border font-semibold text-xs text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>II. Các khoản khấu trừ</span>
              <span className="text-rose-600 font-mono">-{formatCurrency(payslip.tong_khau_tru)}</span>
            </div>
            <div className="divide-y divide-border/60 text-xs">
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-foreground">Bảo hiểm xã hội (BHXH 8%):</span>
                <span className="font-mono text-muted-foreground">{formatCurrency(payslip.bhxh)}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-foreground">Bảo hiểm y tế (BHYT 1.5%):</span>
                <span className="font-mono text-muted-foreground">{formatCurrency(payslip.bhyt)}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-foreground">Bảo hiểm thất nghiệp (BHTN 1%):</span>
                <span className="font-mono text-muted-foreground">{formatCurrency(payslip.bhtn)}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-foreground">Thuế thu nhập cá nhân (TNCN):</span>
                <span className="font-mono text-muted-foreground">{formatCurrency(payslip.thue_tncn)}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between bg-rose-500/5">
                <span className="font-semibold text-rose-600">Tổng khấu trừ:</span>
                <span className="font-mono font-bold text-rose-600">-{formatCurrency(payslip.tong_khau_tru)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Note & Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <p className="italic">
            Mọi thắc mắc về bảng lương vui lòng liên hệ phòng Hành chính Nhân sự trong vòng 03 ngày làm việc kể từ ngày nhận phiếu.
          </p>
          <p className="font-mono font-medium">LNK ERP System</p>
        </div>
      </div>
    </div>
  );
}
