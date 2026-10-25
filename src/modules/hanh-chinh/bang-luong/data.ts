import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createMockTable } from '@/lib/mockService';
import { t } from '@/lib/i18n';

export interface Payslip {
  id: string;
  user_id: string;
  user_name: string;
  user_code: string;
  department_name: string;
  position_name: string;
  bank_account: string;
  bank_name: string;
  period: string; // "2025-02"
  luong_co_ban: number;
  ngay_cong_chuan: number;
  ngay_cong_thuc_te: number;
  luong_theo_cong: number;
  phu_cap_an_trua: number;
  phu_cap_xang_xe: number;
  phu_cap_khac: number;
  thuong_kpi: number;
  tong_thu_nhap: number;
  bhxh: number;
  bhyt: number;
  bhtn: number;
  thue_tncn: number;
  tong_khau_tru: number;
  thuc_linh: number;
  trang_thai: 'cho_duyet' | 'da_duyet' | 'da_thanh_toan';
}

const INITIAL_PAYSLIPS: Payslip[] = [
  {
    id: 'ps-1',
    user_id: 'u-1',
    user_name: 'Nguyễn Văn Quản Trị',
    user_code: 'NV-001',
    department_name: 'Ban Giám Đốc',
    position_name: 'Tổng Giám Đốc',
    bank_account: '1903456789001',
    bank_name: 'Techcombank',
    period: '2025-02',
    luong_co_ban: 45000000,
    ngay_cong_chuan: 22,
    ngay_cong_thuc_te: 22,
    luong_theo_cong: 45000000,
    phu_cap_an_trua: 1000000,
    phu_cap_xang_xe: 3000000,
    phu_cap_khac: 2000000,
    thuong_kpi: 10000000,
    tong_thu_nhap: 61000000,
    bhxh: 3600000,
    bhyt: 675000,
    bhtn: 450000,
    thue_tncn: 5200000,
    tong_khau_tru: 9925000,
    thuc_linh: 51075000,
    trang_thai: 'da_thanh_toan',
  },
  {
    id: 'ps-2',
    user_id: 'u-2',
    user_name: 'Trần Minh Quân',
    user_code: 'NV-002',
    department_name: 'Phòng Công nghệ',
    position_name: 'Trưởng phòng Công nghệ',
    bank_account: '0011004321987',
    bank_name: 'Vietcombank',
    period: '2025-02',
    luong_co_ban: 32000000,
    ngay_cong_chuan: 22,
    ngay_cong_thuc_te: 22,
    luong_theo_cong: 32000000,
    phu_cap_an_trua: 1000000,
    phu_cap_xang_xe: 1500000,
    phu_cap_khac: 1000000,
    thuong_kpi: 6000000,
    tong_thu_nhap: 41500000,
    bhxh: 2560000,
    bhyt: 480000,
    bhtn: 320000,
    thue_tncn: 2800000,
    tong_khau_tru: 6160000,
    thuc_linh: 35340000,
    trang_thai: 'da_thanh_toan',
  },
  {
    id: 'ps-3',
    user_id: 'u-3',
    user_name: 'Lê Hoàng Nam',
    user_code: 'NV-003',
    department_name: 'Phòng Marketing',
    position_name: 'Trưởng nhóm Marketing',
    bank_account: '102874659201',
    bank_name: 'MB Bank',
    period: '2025-02',
    luong_co_ban: 22000000,
    ngay_cong_chuan: 22,
    ngay_cong_thuc_te: 21,
    luong_theo_cong: 21000000,
    phu_cap_an_trua: 950000,
    phu_cap_xang_xe: 1000000,
    phu_cap_khac: 500000,
    thuong_kpi: 4000000,
    tong_thu_nhap: 27450000,
    bhxh: 1760000,
    bhyt: 330000,
    bhtn: 220000,
    thue_tncn: 1100000,
    tong_khau_tru: 3410000,
    thuc_linh: 24040000,
    trang_thai: 'da_duyet',
  },
  {
    id: 'ps-4',
    user_id: 'u-4',
    user_name: 'Vũ Thị Hồng',
    user_code: 'NV-004',
    department_name: 'Phòng Tài chính Kế toán',
    position_name: 'Kế toán trưởng',
    bank_account: '0341000982341',
    bank_name: 'BIDV',
    period: '2025-02',
    luong_co_ban: 25000000,
    ngay_cong_chuan: 22,
    ngay_cong_thuc_te: 22,
    luong_theo_cong: 25000000,
    phu_cap_an_trua: 1000000,
    phu_cap_xang_xe: 1000000,
    phu_cap_khac: 1000000,
    thuong_kpi: 5000000,
    tong_thu_nhap: 33000000,
    bhxh: 2000000,
    bhyt: 375000,
    bhtn: 250000,
    thue_tncn: 1800000,
    tong_khau_tru: 4425000,
    thuc_linh: 28575000,
    trang_thai: 'da_thanh_toan',
  },
  {
    id: 'ps-5',
    user_id: 'u-5',
    user_name: 'Đặng Quốc Huy',
    user_code: 'NV-005',
    department_name: 'Phòng Kinh doanh',
    position_name: 'Chuyên viên Kinh doanh',
    bank_account: '1903344556601',
    bank_name: 'Techcombank',
    period: '2025-02',
    luong_co_ban: 15000000,
    ngay_cong_chuan: 22,
    ngay_cong_thuc_te: 21.5,
    luong_theo_cong: 14659090,
    phu_cap_an_trua: 980000,
    phu_cap_xang_xe: 1500000,
    phu_cap_khac: 500000,
    thuong_kpi: 8500000,
    tong_thu_nhap: 26139090,
    bhxh: 1200000,
    bhyt: 225000,
    bhtn: 150000,
    thue_tncn: 950000,
    tong_khau_tru: 2525000,
    thuc_linh: 23614090,
    trang_thai: 'da_duyet',
  },
  {
    id: 'ps-6',
    user_id: 'u-6',
    user_name: 'Hoàng Lan Anh',
    user_code: 'NV-006',
    department_name: 'Phòng Hành chính Nhân sự',
    position_name: 'Trưởng phòng HCNS',
    bank_account: '2221000456789',
    bank_name: 'VPBank',
    period: '2025-02',
    luong_co_ban: 24000000,
    ngay_cong_chuan: 22,
    ngay_cong_thuc_te: 20,
    luong_theo_cong: 21818181,
    phu_cap_an_trua: 900000,
    phu_cap_xang_xe: 1000000,
    phu_cap_khac: 500000,
    thuong_kpi: 3500000,
    tong_thu_nhap: 27718181,
    bhxh: 1920000,
    bhyt: 360000,
    bhtn: 240000,
    thue_tncn: 1150000,
    tong_khau_tru: 3670000,
    thuc_linh: 24048181,
    trang_thai: 'cho_duyet',
  },
  {
    id: 'ps-7',
    user_id: 'u-7',
    user_name: 'Nguyễn Văn An',
    user_code: 'NV-007',
    department_name: 'Phòng Công nghệ',
    position_name: 'Frontend Developer',
    bank_account: '0021008889991',
    bank_name: 'Vietcombank',
    period: '2025-02',
    luong_co_ban: 15000000,
    ngay_cong_chuan: 22,
    ngay_cong_thuc_te: 22,
    luong_theo_cong: 15000000,
    phu_cap_an_trua: 1000000,
    phu_cap_xang_xe: 800000,
    phu_cap_khac: 500000,
    thuong_kpi: 2500000,
    tong_thu_nhap: 19800000,
    bhxh: 1200000,
    bhyt: 225000,
    bhtn: 150000,
    thue_tncn: 450000,
    tong_khau_tru: 2025000,
    thuc_linh: 17775000,
    trang_thai: 'da_duyet',
  },
];

const payslipTable = createMockTable<Payslip>('company-payslips', INITIAL_PAYSLIPS, 250);

export const PAYROLL_STATUS_LABELS: Record<string, string> = {
  cho_duyet: 'Chờ duyệt',
  da_duyet: 'Đã duyệt',
  da_thanh_toan: 'Đã thanh toán',
};

export const PAYROLL_STATUS_BADGE: Record<string, string> = {
  cho_duyet: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  da_duyet: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  da_thanh_toan: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
};

export function useCompanyPayslips() {
  return useQuery({
    queryKey: ['company-payslips'],
    queryFn: () => payslipTable.getAll(),
  });
}

export function useApprovePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'da_duyet' | 'da_thanh_toan' }) => {
      return payslipTable.update(id, { trang_thai: status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-payslips'] });
      toast.success('Cập nhật trạng thái bảng lương thành công');
    },
    onError: () => toast.error(t('common.error')),
  });
}
