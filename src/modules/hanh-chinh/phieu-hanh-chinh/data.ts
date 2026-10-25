import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createMockTable } from '@/lib/mockService';
import { t } from '@/lib/i18n';

export type LoaiPhieu = 'nghi_phep' | 'lam_them' | 'di_muon_ve_som' | 'cong_tac' | 'doi_ca';
export type TrangThaiPhieu = 'cho_duyet' | 'da_duyet' | 'tu_choi' | 'da_huy';

export interface PhieuHanhChinh {
  id: string;
  ma_phieu: string;
  user_id: string;
  user_name: string;
  department_name: string;
  loai_phieu: LoaiPhieu;
  tu_ngay: string;
  den_ngay: string;
  so_luong: number;
  don_vi: 'ngày' | 'giờ';
  ly_do: string;
  nguoi_duyet: string;
  y_kien_duyet?: string | null;
  trang_thai: TrangThaiPhieu;
  tg_tao: string;
  tg_cap_nhat: string;
}

export type PhieuHanhChinhInput = Omit<PhieuHanhChinh, 'id' | 'ma_phieu' | 'trang_thai' | 'tg_tao' | 'tg_cap_nhat'>;

export interface LeaveQuota {
  id: string;
  user_id: string;
  user_name: string;
  department_name: string;
  tong_phep: number;
  da_dung: number;
  cho_duyet: number;
  con_lai: number;
}

const INITIAL_PHIEU: PhieuHanhChinh[] = [
  {
    id: 'ph-1',
    ma_phieu: 'ĐNP-2025-001',
    user_id: 'u-1',
    user_name: 'Nguyễn Văn Quản Trị',
    department_name: 'Ban Giám Đốc',
    loai_phieu: 'nghi_phep',
    tu_ngay: '2025-03-03',
    den_ngay: '2025-03-04',
    so_luong: 2,
    don_vi: 'ngày',
    ly_do: 'Giải quyết việc gia đình',
    nguoi_duyet: 'Hội đồng Quản trị',
    y_kien_duyet: 'Đồng ý',
    trang_thai: 'da_duyet',
    tg_tao: '2025-02-20T08:30:00Z',
    tg_cap_nhat: '2025-02-21T09:00:00Z',
  },
  {
    id: 'ph-2',
    ma_phieu: 'ĐOT-2025-002',
    user_id: 'u-2',
    user_name: 'Trần Minh Quân',
    department_name: 'Phòng Công nghệ',
    loai_phieu: 'lam_them',
    tu_ngay: '2025-02-25 18:00',
    den_ngay: '2025-02-25 21:00',
    so_luong: 3,
    don_vi: 'giờ',
    ly_do: 'Deploy phiên bản ERP v2.1',
    nguoi_duyet: 'Nguyễn Văn Quản Trị',
    y_kien_duyet: null,
    trang_thai: 'cho_duyet',
    tg_tao: '2025-02-24T14:00:00Z',
    tg_cap_nhat: '2025-02-24T14:00:00Z',
  },
  {
    id: 'ph-3',
    ma_phieu: 'ĐCT-2025-003',
    user_id: 'u-3',
    user_name: 'Lê Hoàng Nam',
    department_name: 'Phòng Marketing',
    loai_phieu: 'cong_tac',
    tu_ngay: '2025-03-10',
    den_ngay: '2025-03-12',
    so_luong: 3,
    don_vi: 'ngày',
    ly_do: 'Tham gia triển lãm TechExpo 2025 tại TP.HCM',
    nguoi_duyet: 'Nguyễn Văn Quản Trị',
    y_kien_duyet: null,
    trang_thai: 'cho_duyet',
    tg_tao: '2025-02-22T10:15:00Z',
    tg_cap_nhat: '2025-02-22T10:15:00Z',
  },
  {
    id: 'ph-4',
    ma_phieu: 'ĐMV-2025-004',
    user_id: 'u-5',
    user_name: 'Đặng Quốc Huy',
    department_name: 'Phòng Kinh doanh',
    loai_phieu: 'di_muon_ve_som',
    tu_ngay: '2025-02-26 08:00',
    den_ngay: '2025-02-26 09:30',
    so_luong: 1.5,
    don_vi: 'giờ',
    ly_do: 'Hỏng xe trên đường đi làm',
    nguoi_duyet: 'Nguyễn Văn Quản Trị',
    y_kien_duyet: 'Đã xác nhận',
    trang_thai: 'da_duyet',
    tg_tao: '2025-02-23T11:00:00Z',
    tg_cap_nhat: '2025-02-23T16:00:00Z',
  },
  {
    id: 'ph-5',
    ma_phieu: 'ĐNP-2025-005',
    user_id: 'u-7',
    user_name: 'Nguyễn Văn An',
    department_name: 'Phòng Công nghệ',
    loai_phieu: 'nghi_phep',
    tu_ngay: '2025-03-15',
    den_ngay: '2025-03-15',
    so_luong: 1,
    don_vi: 'ngày',
    ly_do: 'Khám sức khỏe định kỳ',
    nguoi_duyet: 'Trần Minh Quân',
    y_kien_duyet: null,
    trang_thai: 'cho_duyet',
    tg_tao: '2025-02-24T09:00:00Z',
    tg_cap_nhat: '2025-02-24T09:00:00Z',
  },
];

const INITIAL_QUOTA: LeaveQuota[] = [
  { id: 'q-1', user_id: 'u-1', user_name: 'Nguyễn Văn Quản Trị', department_name: 'Ban Giám Đốc', tong_phep: 14, da_dung: 2, cho_duyet: 0, con_lai: 12 },
  { id: 'q-2', user_id: 'u-2', user_name: 'Trần Minh Quân', department_name: 'Phòng Công nghệ', tong_phep: 12, da_dung: 1, cho_duyet: 0, con_lai: 11 },
  { id: 'q-3', user_id: 'u-3', user_name: 'Lê Hoàng Nam', department_name: 'Phòng Marketing', tong_phep: 12, da_dung: 3, cho_duyet: 0, con_lai: 9 },
  { id: 'q-4', user_id: 'u-4', user_name: 'Vũ Thị Hồng', department_name: 'Phòng Tài chính Kế toán', tong_phep: 13, da_dung: 0, cho_duyet: 0, con_lai: 13 },
  { id: 'q-5', user_id: 'u-5', user_name: 'Đặng Quốc Huy', department_name: 'Phòng Kinh doanh', tong_phep: 12, da_dung: 1.5, cho_duyet: 0, con_lai: 10.5 },
  { id: 'q-6', user_id: 'u-6', user_name: 'Hoàng Lan Anh', department_name: 'Phòng Hành chính Nhân sự', tong_phep: 12, da_dung: 2, cho_duyet: 0, con_lai: 10 },
  { id: 'q-7', user_id: 'u-7', user_name: 'Nguyễn Văn An', department_name: 'Phòng Công nghệ', tong_phep: 12, da_dung: 0, cho_duyet: 1, con_lai: 11 },
];

const phieuTable = createMockTable<PhieuHanhChinh>('phieu-hanh-chinh', INITIAL_PHIEU, 250);
const quotaTable = createMockTable<LeaveQuota>('phieu-leave-quota', INITIAL_QUOTA, 250);

export const LOAI_PHIEU_LABELS: Record<string, string> = {
  nghi_phep: 'Nghỉ phép',
  lam_them: 'Làm thêm giờ (OT)',
  di_muon_ve_som: 'Đi muộn / Về sớm',
  cong_tac: 'Đi công tác',
  doi_ca: 'Đổi ca làm việc',
};

export const LOAI_PHIEU_BADGE: Record<string, string> = {
  nghi_phep: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  lam_them: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
  di_muon_ve_som: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  cong_tac: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  doi_ca: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
};

export const TRANG_THAI_PHIEU_LABELS: Record<string, string> = {
  cho_duyet: 'Chờ duyệt',
  da_duyet: 'Đã duyệt',
  tu_choi: 'Từ chối',
  da_huy: 'Đã hủy',
};

export const TRANG_THAI_PHIEU_BADGE: Record<string, string> = {
  cho_duyet: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  da_duyet: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  tu_choi: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
  da_huy: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30',
};

export function useAllPhieu() {
  return useQuery({
    queryKey: ['phieu-hanh-chinh-all'],
    queryFn: () => phieuTable.getAll({ orderBy: 'tg_tao', ascending: false }),
  });
}

export function useLeaveQuota() {
  return useQuery({
    queryKey: ['leave-quota'],
    queryFn: () => quotaTable.getAll(),
  });
}

export function useCreatePhieu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PhieuHanhChinhInput) => {
      const now = new Date().toISOString();
      const prefix =
        data.loai_phieu === 'nghi_phep'
          ? 'ĐNP'
          : data.loai_phieu === 'lam_them'
          ? 'ĐOT'
          : data.loai_phieu === 'cong_tac'
          ? 'ĐCT'
          : 'ĐMV';
      const ma_phieu = `${prefix}-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 900) + 100
      )}`;

      return phieuTable.insert({
        ...data,
        id: `ph-${Date.now()}`,
        ma_phieu,
        trang_thai: 'cho_duyet',
        tg_tao: now,
        tg_cap_nhat: now,
      } as PhieuHanhChinh);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phieu-hanh-chinh-all'] });
      toast.success('Gửi phiếu hành chính thành công');
    },
    onError: () => toast.error(t('common.error')),
  });
}

export function useApprovePhieu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      return phieuTable.update(id, {
        trang_thai: 'da_duyet',
        y_kien_duyet: note || 'Phê duyệt',
        tg_cap_nhat: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phieu-hanh-chinh-all'] });
      toast.success('Đã phê duyệt phiếu thành công');
    },
    onError: () => toast.error(t('common.error')),
  });
}

export function useRejectPhieu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      return phieuTable.update(id, {
        trang_thai: 'tu_choi',
        y_kien_duyet: note,
        tg_cap_nhat: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phieu-hanh-chinh-all'] });
      toast.success('Đã từ chối phiếu');
    },
    onError: () => toast.error(t('common.error')),
  });
}

export function useCancelPhieu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return phieuTable.update(id, {
        trang_thai: 'da_huy',
        tg_cap_nhat: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phieu-hanh-chinh-all'] });
      toast.success('Đã hủy phiếu');
    },
    onError: () => toast.error(t('common.error')),
  });
}
