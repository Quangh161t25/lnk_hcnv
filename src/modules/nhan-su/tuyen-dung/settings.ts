import { useQuery } from '@tanstack/react-query';
import mauPhanHoiSeed from '@/data/mauPhanHoi.json';
import quyTacSeed from '@/data/quyTacDanhGia.json';
import jobLevelSeed from '@/data/jobLevels.json';
import thuSeed from '@/data/thuGuiUngVien.json';
import { createMockTable, type MockTable } from '@/lib/mockService';
import { useToastMutation } from '@/lib/mutations';
import { t } from '@/lib/i18n';
import { getUngVien, kenhTable, trangThaiTable, type KenhTuyenDung, type TrangThaiUngVien } from './data';

/* ---------- Kiểu dữ liệu ---------- */

export interface MauPhanHoi {
  id: string;
  ma: string;
  ten_loai: string;
  tieu_de: string;
  noi_dung_mau: string;
  trang_thai: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface QuyTacDanhGia {
  id: string;
  ten: string;
  thang_diem_min: number;
  thang_diem_max: number;
  nguong_xuat_sac: number;
  nguong_tot: number;
  nguong_kha: number;
  nguong_trung_binh: number;
  ghi_chu: string | null;
  trang_thai: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface JobLevel {
  id: string;
  ma_cap_bac: string;
  ten_cap_bac: string;
  thu_tu?: number;
  luong_co_ban?: number;
  mo_ta?: string | null;
  trang_thai: string;
}

export type LoaiThu = 'tu-choi' | 'moi-nhan-viec';

export interface ThuGuiUngVienInput {
  id_ung_vien: string;
  loai_thu: LoaiThu;
  ghi_chu: string | null;
  ngay_vao_lam: string | null;
  bac_luong: string | null;
  muc_luong: string | null;
  co_che_khac: string | null;
  ghi_chu_khac: string | null;
}

export interface ThuGuiUngVien extends ThuGuiUngVienInput {
  id: string;
  tg_tao: string;
  tg_cap_nhat: string;
  ten_ung_vien?: string;
}

/* ---------- Bảng dữ liệu ---------- */

export const mauPhanHoiTable = createMockTable<MauPhanHoi>('mauPhanHoi', mauPhanHoiSeed as MauPhanHoi[], 500);
export const quyTacTable = createMockTable<QuyTacDanhGia>('quyTacDanhGiaTV', quyTacSeed as QuyTacDanhGia[], 500);
const jobLevelTable = createMockTable<JobLevel>('jobLevels', jobLevelSeed as JobLevel[], 400);
const thuTable = createMockTable<ThuGuiUngVien>('thuGuiUngVien', thuSeed as unknown as ThuGuiUngVien[], 400);

const STALE = 5 * 60 * 1000;
export const TRANG_THAI_KEY = ['trangThaiUngVien'];
export const KENH_KEY = ['kenhTuyenDung'];
export const MAU_KEY = ['mauPhanHoi'];
export const QUY_TAC_KEY = ['quyTacDanhGiaTV'];
const THU_KEY = ['thuGuiUngVien'];

export const getMauPhanHoi = () => mauPhanHoiTable.getAll();
export const useMauPhanHoi = () => useQuery({ queryKey: MAU_KEY, queryFn: getMauPhanHoi, staleTime: STALE });
export const useQuyTacDanhGia = () => useQuery({ queryKey: QUY_TAC_KEY, queryFn: () => quyTacTable.getAll(), staleTime: STALE });
export const useJobLevels = () => useQuery({ queryKey: ['job-levels'], queryFn: () => jobLevelTable.getAll(), staleTime: STALE });

/* ---------- CRUD danh mục dùng chung cho các tab Thiết lập ---------- */

type Row = { id: string; tg_tao: string; tg_cap_nhat: string; trang_thai: string };

/**
 * Bộ hook thêm/sửa/đổi trạng thái/xóa cho một danh mục.
 * `prefix` là khóa i18n của tab (vd. "thietLapTuyenDung.kenhTuyenDung").
 */
function catalogHooks<T extends Row, I>(table: MockTable<T>, key: string[], prefix: string, idPrefix: string) {
  return {
    useCreate: (onDone?: () => void) =>
      useToastMutation({
        mutationFn: (data: I) => {
          const now = new Date().toISOString();
          return table.insert({ id: `${idPrefix}-${Date.now()}`, ...data, tg_tao: now, tg_cap_nhat: now } as unknown as T);
        },
        invalidate: [key],
        success: t(`${prefix}.toast.createSuccess`),
        onDone,
      }),
    useUpdate: (onDone?: () => void) =>
      useToastMutation({
        mutationFn: async ({ id, data }: { id: string; data: I }) => {
          if (!(await table.getById(id))) throw new Error(t(`${prefix}.service.notFound`));
          return table.update(id, { ...data, tg_cap_nhat: new Date().toISOString() } as unknown as Partial<T>);
        },
        invalidate: [key],
        success: t(`${prefix}.toast.updateSuccess`),
        onDone,
      }),
    useStatusMany: () =>
      useToastMutation({
        mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
          const now = new Date().toISOString();
          for (const id of ids) await table.update(id, { trang_thai: status, tg_cap_nhat: now } as Partial<T>);
        },
        invalidate: [key],
        success: (v) => t(`${prefix}.toast.statusUpdate`, { count: v.ids.length }),
      }),
    useDelete: () =>
      useToastMutation({
        mutationFn: (ids: string[]) => table.remove(ids),
        invalidate: [key],
        success: (ids) => t(`${prefix}.toast.deleteSuccess`, { count: ids.length }),
      }),
  };
}

export type TrangThaiInput = Omit<TrangThaiUngVien, 'id' | 'tg_tao' | 'tg_cap_nhat'>;
export type KenhInput = Omit<KenhTuyenDung, 'id' | 'tg_tao' | 'tg_cap_nhat'>;
export type MauPhanHoiInput = Omit<MauPhanHoi, 'id' | 'tg_tao' | 'tg_cap_nhat'>;
export type QuyTacInput = Omit<QuyTacDanhGia, 'id' | 'tg_tao' | 'tg_cap_nhat'>;

export const trangThaiHooks = catalogHooks<TrangThaiUngVien, TrangThaiInput>(trangThaiTable, TRANG_THAI_KEY, 'thietLapTuyenDung.trangThaiUngVien', 'ttuv');
export const kenhHooks = catalogHooks<KenhTuyenDung, KenhInput>(kenhTable, KENH_KEY, 'thietLapTuyenDung.kenhTuyenDung', 'ktd');
export const mauPhanHoiHooks = catalogHooks<MauPhanHoi, MauPhanHoiInput>(mauPhanHoiTable, MAU_KEY, 'thietLapTuyenDung.mauPhanHoi', 'mph');
export const quyTacHooks = catalogHooks<QuyTacDanhGia, QuyTacInput>(quyTacTable, QUY_TAC_KEY, 'thietLapTuyenDung.quyTacDanhGiaTV', 'qtdg');

/** Xếp loại điểm trung bình theo quy tắc đang áp dụng. */
export function xepLoai(score: number | null | undefined, rule?: QuyTacDanhGia | null) {
  if (score == null || !rule) return null;
  if (score >= rule.nguong_xuat_sac) return 'xuat_sac';
  if (score >= rule.nguong_tot) return 'tot';
  if (score >= rule.nguong_kha) return 'kha';
  if (score >= rule.nguong_trung_binh) return 'trung_binh';
  return 'yeu';
}

/* ---------- Thư gửi ứng viên ---------- */

export const LOAI_THU: LoaiThu[] = ['tu-choi', 'moi-nhan-viec'];
export const LOAI_THU_TEMPLATE: Record<LoaiThu, string> = { 'tu-choi': 'TU_CHOI', 'moi-nhan-viec': 'MOI_NHAN_VIEC' };
export const isLoaiThu = (v: string | undefined): v is LoaiThu => v === 'tu-choi' || v === 'moi-nhan-viec';
export const loaiThuLabel = (v: string) => t(v === 'tu-choi' ? 'thuGuiUngVien.letterReject' : 'thuGuiUngVien.letterJobOffer');
export const loaiThuColor = (v: string) =>
  v === 'tu-choi' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';

async function joinThu(rows: ThuGuiUngVien[]) {
  const candidates = await getUngVien();
  const name = new Map(candidates.map((c) => [c.id, c.ho_ten]));
  return rows.map((r) => ({ ...r, ten_ung_vien: name.get(r.id_ung_vien) }));
}

export const getThuGuiUngVien = async () => joinThu(await thuTable.getAll());
export const getThuById = async (id: string) => {
  const row = await thuTable.getById(id);
  return row ? (await joinThu([row]))[0] : null;
};
export const useThuGuiUngVien = () => useQuery({ queryKey: THU_KEY, queryFn: getThuGuiUngVien, staleTime: 3 * 60 * 1000 });

export const useCreateThu = (onDone?: () => void) =>
  useToastMutation({
    mutationFn: async (e: ThuGuiUngVienInput) => {
      const now = new Date().toISOString();
      const row = await thuTable.insert({ id: `tguv-${Date.now()}`, ...e, tg_tao: now, tg_cap_nhat: now });
      return (await joinThu([row]))[0];
    },
    invalidate: [THU_KEY],
    success: t('thuGuiUngVien.toast.createSuccess'),
    onDone,
  });

export const useUpdateThu = (onDone?: () => void) =>
  useToastMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ThuGuiUngVienInput> }) => {
      if (!(await thuTable.getById(id))) throw new Error(t('thuGuiUngVien.service.notFound'));
      const row = await thuTable.update(id, { ...data, tg_cap_nhat: new Date().toISOString() });
      return (await joinThu([row]))[0];
    },
    invalidate: [THU_KEY],
    success: t('thuGuiUngVien.toast.updateSuccess'),
    onDone,
  });

export const useDeleteThu = () =>
  useToastMutation({
    mutationFn: (ids: string[]) => thuTable.remove(ids),
    invalidate: [THU_KEY],
    success: (ids) => t('thuGuiUngVien.toast.deleteSuccess', { count: ids.length }),
  });
