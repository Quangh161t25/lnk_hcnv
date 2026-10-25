import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import hopDongSeed from '@/data/hopDong.json';
import phieuThanhLySeed from '@/data/phieuThanhLy.json';
import ungVienSeed from '@/data/ungVien.json';
import { createMockTable } from '@/lib/mockService';
import { t } from '@/lib/i18n';

export type LoaiHopDong = 'thu-viec' | 'chinh-thuc' | 'hoc-viec' | 'thoi-vu' | 'part-time';
export type TrangThaiHopDong = 'hieu_luc' | 'het_han' | 'sap_het_han' | 'thanh_ly' | 'bi_huy';

export interface HopDong {
  id: string;
  id_ung_vien: string;
  loai_hop_dong: LoaiHopDong;
  so_hop_dong: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string | null;
  id_hop_dong_goc?: string | null;
  bac_luong?: string | null;
  muc_luong?: string | null;
  ngay_vao_lam?: string | null;
  co_che_khac?: string | null;
  ghi_chu?: string | null;
  ghi_chu_khac?: string | null;
  trang_thai: TrangThaiHopDong;
  tg_tao: string;
  tg_cap_nhat: string;
  // Joined fields
  ten_ung_vien?: string;
  email_ung_vien?: string;
  sdt_ung_vien?: string;
}

export type HopDongInput = Omit<HopDong, 'id' | 'tg_tao' | 'tg_cap_nhat' | 'ten_ung_vien' | 'email_ung_vien' | 'sdt_ung_vien'>;

export interface PhieuThanhLy {
  id: string;
  id_hop_dong: string;
  so_phieu: string;
  ngay_thanh_ly: string;
  ly_do: string;
  ghi_chu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}

export type PhieuThanhLyInput = Omit<PhieuThanhLy, 'id' | 'tg_tao' | 'tg_cap_nhat'>;

const hopDongTable = createMockTable<HopDong>('hop-dong', hopDongSeed as HopDong[], 300);
const phieuThanhLyTable = createMockTable<PhieuThanhLy>('phieu-thanh-ly', phieuThanhLySeed as PhieuThanhLy[], 300);

export const LOAI_HOP_DONG_LABELS: Record<string, string> = {
  'thu-viec': 'Thử việc',
  'chinh-thuc': 'Chính thức',
  'hoc-viec': 'Học việc',
  'thoi-vu': 'Thời vụ',
  'part-time': 'Bán thời gian',
};

export const TRANG_THAI_HOP_DONG_LABELS: Record<string, string> = {
  hieu_luc: 'Hiệu lực',
  het_han: 'Hết hạn',
  sap_het_han: 'Sắp hết hạn',
  thanh_ly: 'Đã thanh lý',
  bi_huy: 'Bị hủy',
};

export const LOAI_HOP_DONG_BADGE: Record<string, string> = {
  'thu-viec': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  'chinh-thuc': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  'hoc-viec': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  'thoi-vu': 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
  'part-time': 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
};

export const TRANG_THAI_HOP_DONG_BADGE: Record<string, string> = {
  hieu_luc: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  het_han: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
  sap_het_han: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  thanh_ly: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30',
  bi_huy: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
};

export function useHopDongList() {
  return useQuery({
    queryKey: ['hop-dong-list'],
    queryFn: async () => {
      const rows = await hopDongTable.getAll({ orderBy: 'tg_tao', ascending: false });
      const uvMap = new Map((ungVienSeed as any[]).map((u) => [u.id, u]));
      return rows.map((r) => {
        const uv = uvMap.get(r.id_ung_vien);
        return {
          ...r,
          ten_ung_vien: uv?.ho_ten ?? r.ten_ung_vien ?? '—',
          email_ung_vien: uv?.email ?? '',
          sdt_ung_vien: uv?.so_dien_thoai ?? '',
        };
      });
    },
  });
}

export function usePhieuThanhLyList() {
  return useQuery({
    queryKey: ['phieu-thanh-ly-list'],
    queryFn: () => phieuThanhLyTable.getAll(),
  });
}

export function useCreateHopDong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: HopDongInput) => {
      const now = new Date().toISOString();
      return hopDongTable.insert({
        ...data,
        id: `hd-${Date.now()}`,
        tg_tao: now,
        tg_cap_nhat: now,
      } as HopDong);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hop-dong-list'] });
      toast.success(t('hopDong.toast.createSuccess'));
    },
    onError: () => toast.error(t('common.error')),
  });
}

export function useUpdateHopDong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HopDongInput> }) => {
      const now = new Date().toISOString();
      return hopDongTable.update(id, { ...data, tg_cap_nhat: now } as Partial<HopDong>);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hop-dong-list'] });
      toast.success(t('hopDong.toast.updateSuccess'));
    },
    onError: () => toast.error(t('common.error')),
  });
}

export function useDeleteHopDong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await hopDongTable.remove(ids);
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['hop-dong-list'] });
      toast.success(t('hopDong.toast.deleteSuccess', { count: ids.length }));
    },
    onError: () => toast.error(t('common.error')),
  });
}

export function useCreatePhieuThanhLy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PhieuThanhLyInput) => {
      const now = new Date().toISOString();
      const phieu = await phieuThanhLyTable.insert({
        ...input,
        id: `ptl-${Date.now()}`,
        tg_tao: now,
        tg_cap_nhat: now,
      });
      await hopDongTable.update(input.id_hop_dong, {
        trang_thai: 'thanh_ly',
        tg_cap_nhat: now,
      } as Partial<HopDong>);
      return phieu;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hop-dong-list'] });
      qc.invalidateQueries({ queryKey: ['phieu-thanh-ly-list'] });
      toast.success(t('hopDong.phieuThanhLy.toast.createSuccess'));
    },
    onError: () => toast.error(t('common.error')),
  });
}
