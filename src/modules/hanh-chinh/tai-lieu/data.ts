import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import loaiSeed from '@/data/loaiTaiLieu.json';
import trangThaiSeed from '@/data/trangThaiTaiLieu.json';
import nhomSeed from '@/data/nhomTaiLieu.json';
import taiLieuSeed from '@/data/taiLieu.json';
import hoSoSeed from '@/data/hoSo.json';
import { createMockTable } from '@/lib/mockService';
import { t } from '@/lib/i18n';
import { currentUserId } from '@/stores/auth';
import { PHONG_BAN_MAP } from '@/modules/shared/orgData';

export const DEFAULT_STATUS_COLOR = '#6366f1';

export type Huong = 'noi_bo' | 'den' | 'di';
export const HUONG_OPTIONS: { value: Huong; labelKey: string }[] = [
  { value: 'noi_bo', labelKey: 'taiLieu.huongNoiBo' },
  { value: 'den', labelKey: 'taiLieu.huongDen' },
  { value: 'di', labelKey: 'taiLieu.huongDi' },
];
export const huongLabel = (v: string) => {
  const o = HUONG_OPTIONS.find((x) => x.value === v);
  return o ? t(o.labelKey) : v;
};
/** Màu nhãn "Hướng" (có biến thể tối). */
export const HUONG_BADGE: Record<Huong, string> = {
  noi_bo: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
  den: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  di: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
};

export interface DanhMuc {
  id: string;
  ma: string;
  ten: string;
  mau?: string;
  ghi_chu?: string;
  trang_thai: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface TaiLieuInput {
  ma_so?: string | null;
  huong: Huong;
  id_loai: string;
  id_nhom_tai_lieu?: string;
  id_trang_thai: string;
  trich_yeu: string;
  so_den?: string;
  ngay_den?: string;
  noi_gui?: string;
  so_di?: string;
  ngay_ky?: string;
  noi_nhan?: string;
  id_phong_ban?: string;
  ghi_chu?: string;
}

export interface TaiLieuRow extends TaiLieuInput {
  id: string;
  id_chuc_vu_xem?: string[];
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface TaiLieu extends TaiLieuRow {
  ten_loai?: string;
  ma_loai?: string;
  ten_trang_thai?: string;
  mau_trang_thai?: string;
  ten_phong_ban?: string;
  ten_nhom_tai_lieu?: string;
}

export interface HoSo {
  id: string;
  id_tai_lieu: string;
  ma_ho_so: string;
  ten_ho_so: string;
  id_phong_ban?: string;
  thoi_han_luu_tru?: string;
  mo_ta?: string;
  trang_thai: string;
  id_chuc_vu_xem: string[];
  id_nhan_vien_xem: string[];
  tg_tao: string;
  tg_cap_nhat: string;
  ten_phong_ban?: string;
  ten_tai_lieu?: string;
}

const LOAI = loaiSeed as DanhMuc[];
const TRANG_THAI = trangThaiSeed as DanhMuc[];
const NHOM = nhomSeed as DanhMuc[];

const loaiTable = createMockTable<DanhMuc>('loaiTaiLieu', LOAI, 400);
const trangThaiTable = createMockTable<DanhMuc>('trangThaiTaiLieu', TRANG_THAI, 400);
const nhomTable = createMockTable<DanhMuc>('nhomTaiLieu', NHOM, 400);
const taiLieuTable = createMockTable<TaiLieuRow>('taiLieu', taiLieuSeed as TaiLieuRow[], 400);
const hoSoTable = createMockTable<HoSo>('hoSo', hoSoSeed as HoSo[], 400);

async function enrich(rows: TaiLieuRow[]): Promise<TaiLieu[]> {
  const [loai, trangThai, nhom] = await Promise.all([loaiTable.getAll(), trangThaiTable.getAll(), nhomTable.getAll()]);
  return rows.map((r) => {
    const l = loai.find((x) => x.id === r.id_loai);
    const s = trangThai.find((x) => x.id === r.id_trang_thai);
    const n = r.id_nhom_tai_lieu ? nhom.find((x) => x.id === r.id_nhom_tai_lieu) : undefined;
    return {
      ...r,
      ten_loai: l?.ten,
      ma_loai: l?.ma,
      ten_trang_thai: s?.ten,
      mau_trang_thai: s?.mau,
      ten_phong_ban: r.id_phong_ban ? PHONG_BAN_MAP[r.id_phong_ban] : undefined,
      ten_nhom_tai_lieu: n?.ten,
    };
  });
}

const getTaiLieu = async () => enrich(await taiLieuTable.getAll());

async function createTaiLieu(input: TaiLieuInput) {
  const now = new Date().toISOString();
  const row: TaiLieuRow = { id: `tl-${Date.now()}`, ...input, ma_so: input.ma_so?.trim() || undefined, tg_tao: now, tg_cap_nhat: now };
  await taiLieuTable.insert(row);
  return (await enrich([row]))[0];
}

async function updateTaiLieu(id: string, input: Partial<TaiLieuRow>) {
  if (!(await taiLieuTable.getById(id))) throw new Error(t('taiLieu.service.notFound'));
  const row = await taiLieuTable.update(id, { ...input, tg_cap_nhat: new Date().toISOString() });
  return (await enrich([row]))[0];
}

const getHoSoByTaiLieu = async (idTaiLieu: string) =>
  (await hoSoTable.getAll())
    .filter((h) => h.id_tai_lieu === idTaiLieu)
    .map((h) => ({ ...h, ten_phong_ban: h.id_phong_ban ? PHONG_BAN_MAP[h.id_phong_ban] : undefined }));

/* ---------- Ghim theo người dùng (localStorage, giống bản gốc) ---------- */

const PIN_PREFIX = 'tai-lieu-ghim-';
function readPins(userId: string): string[] {
  try {
    const raw = localStorage.getItem(PIN_PREFIX + userId);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
async function getPins() {
  return readPins(currentUserId());
}
async function togglePin(id: string) {
  const user = currentUserId();
  const pins = readPins(user);
  const next = pins.includes(id) ? pins.filter((x) => x !== id) : [...pins, id];
  localStorage.setItem(PIN_PREFIX + user, JSON.stringify(next));
  return { pinned: next.includes(id) };
}

/* ---------- Hook ---------- */

const KEY = ['taiLieu'];
const PIN_KEY = ['taiLieuGhim'];

export const useLoaiTaiLieu = () => useQuery({ queryKey: ['loaiTaiLieu'], queryFn: () => loaiTable.getAll(), staleTime: 5 * 60 * 1000 });
export const useTrangThaiTaiLieu = () => useQuery({ queryKey: ['trangThaiTaiLieu'], queryFn: () => trangThaiTable.getAll(), staleTime: 5 * 60 * 1000 });
export const useNhomTaiLieu = () => useQuery({ queryKey: ['nhomTaiLieu'], queryFn: () => nhomTable.getAll(), staleTime: 5 * 60 * 1000 });
export const useTaiLieu = () => useQuery({ queryKey: KEY, queryFn: getTaiLieu });
export const useHoSoByTaiLieu = (id?: string) =>
  useQuery({ queryKey: ['hoSo', 'byTaiLieu', id], queryFn: () => (id ? getHoSoByTaiLieu(id) : Promise.resolve([])), enabled: !!id });
export const useTaiLieuPins = () => useQuery({ queryKey: PIN_KEY, queryFn: getPins });

export function useCreateTaiLieu(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTaiLieu,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(t('taiLieu.toast.createSuccess'));
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTaiLieu(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaiLieuRow> }) => updateTaiLieu(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(t('taiLieu.toast.updateSuccess'));
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTaiLieu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => taiLieuTable.remove(ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(t('taiLieu.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTogglePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: togglePin,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: PIN_KEY });
      const previous = qc.getQueryData<string[]>(PIN_KEY);
      const cur = previous ?? [];
      qc.setQueryData(PIN_KEY, cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
      return { previous };
    },
    onError: (e: Error, _id, ctx) => {
      if (ctx?.previous != null) qc.setQueryData(PIN_KEY, ctx.previous);
      toast.error(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: PIN_KEY }),
  });
}

export function useSetPhanQuyen(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, id_chuc_vu_xem }: { id: string; id_chuc_vu_xem: string[] }) => updateTaiLieu(id, { id_chuc_vu_xem }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(t('taiLieu.toast.updateSuccess'));
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
