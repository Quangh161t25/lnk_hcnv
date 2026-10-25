import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createMockTable } from '@/lib/mockService';
import { t } from '@/lib/i18n';

export type TrangThaiDanhGia = 'cho_danh_gia' | 'dang_danh_gia' | 'hoan_thanh' | 'qua_han';
export type QuyetDinhThuViec = 'ky_chinh_thuc' | 'gia_han_thu_viec' | 'cham_dut';

export interface DanhGiaThuViec {
  id: string;
  id_hop_dong: string;
  id_ung_vien: string;
  ho_ten: string;
  vi_tri: string;
  ten_phong_ban: string;
  ten_quan_ly: string;
  ngay_bat_dau_thu_viec: string;
  ngay_ket_thuc_thu_viec: string;
  dot_thang: string; // e.g. "2025-04"
  dot_quy: string; // e.g. "Q2/2025"
  diem_chuyen_mon?: number;
  diem_thai_do?: number;
  diem_ky_luat?: number;
  diem_trung_binh?: number;
  xep_loai?: 'xuat_sac' | 'tot' | 'kha' | 'trung_binh' | 'kem';
  nhan_xet_quan_ly?: string | null;
  kho_khan_de_xuat?: string | null;
  nguyen_vong_lam_viec?: string | null;
  quyet_dinh?: QuyetDinhThuViec | null;
  trang_thai: TrangThaiDanhGia;
  tg_tao: string;
  tg_cap_nhat: string;
}

export type DanhGiaThuViecInput = Omit<DanhGiaThuViec, 'id' | 'tg_tao' | 'tg_cap_nhat'>;

const INITIAL_DANH_GIA: DanhGiaThuViec[] = [
  {
    id: 'dg-1',
    id_hop_dong: 'hd-1',
    id_ung_vien: 'uv-1',
    ho_ten: 'Nguyễn Văn An',
    vi_tri: 'Frontend Developer',
    ten_phong_ban: 'Phòng Công nghệ',
    ten_quan_ly: 'Trần Minh Quân',
    ngay_bat_dau_thu_viec: '2025-02-01',
    ngay_ket_thuc_thu_viec: '2025-04-01',
    dot_thang: '2025-04',
    dot_quy: 'Q2/2025',
    diem_chuyen_mon: 4.5,
    diem_thai_do: 5,
    diem_ky_luat: 4.8,
    diem_trung_binh: 4.77,
    xep_loai: 'xuat_sac',
    nhan_xet_quan_ly: 'Nắm bắt hệ thống nhanh, hoàn thành tốt các task sprint, hòa đồng với đội ngũ.',
    kho_khan_de_xuat: 'Cần thêm thời gian làm quen với quy trình CI/CD nội bộ.',
    nguyen_vong_lam_viec: 'Mong muốn được ký hợp đồng chính thức và tham gia dự án Core ERP.',
    quyet_dinh: 'ky_chinh_thuc',
    trang_thai: 'hoan_thanh',
    tg_tao: '2025-03-25T10:00:00Z',
    tg_cap_nhat: '2025-03-28T14:30:00Z',
  },
  {
    id: 'dg-2',
    id_hop_dong: 'hd-4',
    id_ung_vien: 'uv-3',
    ho_ten: 'Lê Hoàng Nam',
    vi_tri: 'Trưởng nhóm Marketing',
    ten_phong_ban: 'Phòng Marketing',
    ten_quan_ly: 'Nguyễn Văn Quản Trị',
    ngay_bat_dau_thu_viec: '2025-03-01',
    ngay_ket_thuc_thu_viec: '2025-05-01',
    dot_thang: '2025-05',
    dot_quy: 'Q2/2025',
    diem_chuyen_mon: 4,
    diem_thai_do: 4,
    diem_ky_luat: 4,
    diem_trung_binh: 4.0,
    xep_loai: 'tot',
    nhan_xet_quan_ly: 'Có kinh nghiệm lead chiến dịch, đang triển khai kế hoạch Q2.',
    kho_khan_de_xuat: 'Cần tăng thêm ngân sách chạy quảng cáo kênh Meta.',
    nguyen_vong_lam_viec: 'Gắn bó lâu dài và phát triển thương hiệu công ty.',
    quyet_dinh: null,
    trang_thai: 'dang_danh_gia',
    tg_tao: '2025-04-15T08:00:00Z',
    tg_cap_nhat: '2025-04-15T08:00:00Z',
  },
  {
    id: 'dg-3',
    id_hop_dong: 'hd-6',
    id_ung_vien: 'uv-2',
    ho_ten: 'Trần Thị Bích',
    vi_tri: 'Kế toán tổng hợp',
    ten_phong_ban: 'Phòng Tài chính Kế toán',
    ten_quan_ly: 'Vũ Thị Hồng',
    ngay_bat_dau_thu_viec: '2025-03-10',
    ngay_ket_thuc_thu_viec: '2025-05-10',
    dot_thang: '2025-05',
    dot_quy: 'Q2/2025',
    diem_chuyen_mon: undefined,
    diem_thai_do: undefined,
    diem_ky_luat: undefined,
    diem_trung_binh: undefined,
    xep_loai: undefined,
    nhan_xet_quan_ly: null,
    kho_khan_de_xuat: null,
    nguyen_vong_lam_viec: null,
    quyet_dinh: null,
    trang_thai: 'cho_danh_gia',
    tg_tao: '2025-04-01T09:00:00Z',
    tg_cap_nhat: '2025-04-01T09:00:00Z',
  },
];

const danhGiaTable = createMockTable<DanhGiaThuViec>('danh-gia-thu-viec', INITIAL_DANH_GIA, 300);

export const TRANG_THAI_DANH_GIA_LABELS: Record<string, string> = {
  cho_danh_gia: 'Chờ đánh giá',
  dang_danh_gia: 'Đang đánh giá',
  hoan_thanh: 'Đã hoàn thành',
  qua_han: 'Quá hạn',
};

export const TRANG_THAI_DANH_GIA_BADGE: Record<string, string> = {
  cho_danh_gia: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  dang_danh_gia: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  hoan_thanh: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  qua_han: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
};

export const QUYET_DINH_LABELS: Record<string, string> = {
  ky_chinh_thuc: 'Ký hợp đồng chính thức',
  gia_han_thu_viec: 'Gia hạn thử việc',
  cham_dut: 'Chấm dứt thử việc',
};

export const QUYET_DINH_BADGE: Record<string, string> = {
  ky_chinh_thuc: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  gia_han_thu_viec: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  cham_dut: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
};

export function useDanhGiaThuViecList() {
  return useQuery({
    queryKey: ['danh-gia-thu-viec-list'],
    queryFn: () => danhGiaTable.getAll({ orderBy: 'tg_tao', ascending: false }),
  });
}

export function useCreateDanhGia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: DanhGiaThuViecInput) => {
      const now = new Date().toISOString();
      return danhGiaTable.insert({
        ...data,
        id: `dg-${Date.now()}`,
        tg_tao: now,
        tg_cap_nhat: now,
      } as DanhGiaThuViec);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['danh-gia-thu-viec-list'] });
      toast.success(t('danhGiaThuViec.toast.createSuccess'));
    },
    onError: () => toast.error(t('common.error')),
  });
}

export function useUpdateDanhGia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DanhGiaThuViecInput> }) => {
      const now = new Date().toISOString();
      return danhGiaTable.update(id, { ...data, tg_cap_nhat: now } as Partial<DanhGiaThuViec>);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['danh-gia-thu-viec-list'] });
      toast.success(t('danhGiaThuViec.toast.updateSuccess'));
    },
    onError: () => toast.error(t('common.error')),
  });
}

export function useDeleteDanhGia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await danhGiaTable.remove(ids);
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['danh-gia-thu-viec-list'] });
      toast.success(t('danhGiaThuViec.toast.deleteSuccess', { count: ids.length }));
    },
    onError: () => toast.error(t('common.error')),
  });
}
