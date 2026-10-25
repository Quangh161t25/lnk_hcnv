import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import trangThaiSeed from '@/data/trangThaiUngVien.json';
import kenhSeed from '@/data/kenhTuyenDung.json';
import deXuatSeed from '@/data/deXuatTuyenDung.json';
import ungVienSeed from '@/data/ungVien.json';
import lichPhongVanSeed from '@/data/lichPhongVan.json';
import { createMockTable } from '@/lib/mockService';
import { useToastMutation } from '@/lib/mutations';
import { t } from '@/lib/i18n';
import { getPositions } from '@/modules/shared/orgData';

/* ---------- Kiểu dữ liệu ---------- */

export interface TrangThaiUngVien {
  id: string;
  ma: string;
  ten: string;
  thu_tu?: number;
  ghi_chu?: string;
  loai_ket_qua?: 'onboard' | 'nghi';
  trang_thai: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface KenhTuyenDung {
  id: string;
  ma: string;
  ten: string;
  thu_tu?: number;
  ghi_chu?: string;
  trang_thai: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface DeXuatTuyenDung {
  id: string;
  id_chuc_vu: string;
  ma_de_xuat: string;
  tieu_de: string | null;
  mo_ta: string;
  yeu_cau: string;
  link_tuyen: string | null;
  so_luong: number;
  so_luong_da_tuyen: number;
  han_nop: string | null;
  trang_thai: string;
  ghi_chu: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  ten_chuc_vu?: string;
  ten_phong_ban?: string;
}

export interface TaiLieuUngVien {
  id: string;
  ten_file: string;
  loai?: string;
  link?: string;
}

export interface UngVienInput {
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  dia_chi: string | null;
  ngay_sinh: string | null;
  ghi_chu_noi_bo: string | null;
  id_de_xuat_tuyen_dung: string;
  id_trang_thai_ung_vien: string;
  id_kenh_tuyen_dung: string | null;
  ngay_phong_van_gan_nhat: string | null;
  ket_qua_phan_hoi_gan_nhat: string | null;
  tai_lieu: TaiLieuUngVien[];
}

export interface UngVienRow extends UngVienInput {
  id: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

export interface UngVien extends UngVienRow {
  ten_trang_thai?: string;
  ten_kenh_tuyen_dung?: string;
  ma_de_xuat?: string;
  ten_chuc_vu?: string;
}

export const LPV_TRANG_THAI = ['Chờ', 'Đã diễn ra', 'Hoãn', 'Hủy'] as const;
export const LPV_DANH_GIA = ['Chưa đánh giá', 'Đạt', 'Không đạt'] as const;
export type LpvTrangThai = (typeof LPV_TRANG_THAI)[number];
export type LpvDanhGia = (typeof LPV_DANH_GIA)[number];

export interface LichPhongVanInput {
  id_ung_vien: string;
  so_vong: number;
  ngay: string;
  gio: string;
  hinh_thuc: 'online' | 'offline';
  dia_diem: string;
  trang_thai: LpvTrangThai;
  trang_thai_danh_gia?: LpvDanhGia | null;
  danh_gia_diem_so: string | null;
  danh_gia_nhan_xet: string | null;
  ket_qua: string | null;
  ghi_chu: string | null;
  danh_gia_chi_tiet?: string | null;
}

export interface LichPhongVan extends LichPhongVanInput {
  id: string;
  tg_tao: string;
  tg_cap_nhat: string;
  ten_ung_vien?: string;
  ma_de_xuat?: string;
}

/* ---------- Bảng dữ liệu mẫu ---------- */

export const trangThaiTable = createMockTable<TrangThaiUngVien>('trangThaiUngVien', trangThaiSeed as TrangThaiUngVien[], 500);
export const kenhTable = createMockTable<KenhTuyenDung>('kenhTuyenDung', kenhSeed as KenhTuyenDung[], 500);
const deXuatTable = createMockTable<DeXuatTuyenDung>('deXuatTuyenDung', deXuatSeed as DeXuatTuyenDung[], 600);
export const ungVienTable = createMockTable<UngVienRow>('ungVien', ungVienSeed as UngVienRow[], 500);
export const lichPhongVanTable = createMockTable<LichPhongVan>('lichPhongVan', lichPhongVanSeed as unknown as LichPhongVan[], 500);

/* ---------- Service ---------- */

export const getTrangThaiUngVien = () => trangThaiTable.getAll();
export const getKenhTuyenDung = () => kenhTable.getAll();

export const getDeXuatTuyenDung = async (): Promise<DeXuatTuyenDung[]> => joinDeXuat(await deXuatTable.getAll());

async function joinUngVien(rows: UngVienRow[]): Promise<UngVien[]> {
  const [statuses, sources, proposals] = await Promise.all([getTrangThaiUngVien(), getKenhTuyenDung(), getDeXuatTuyenDung()]);
  const statusName = new Map(statuses.map((s) => [s.id, s.ten]));
  const sourceName = new Map(sources.map((s) => [s.id, s.ten]));
  const proposal = new Map(proposals.map((p) => [p.id, p]));
  return rows.map((r) => {
    const dx = proposal.get(r.id_de_xuat_tuyen_dung);
    return {
      ...r,
      ten_trang_thai: statusName.get(r.id_trang_thai_ung_vien),
      ten_kenh_tuyen_dung: r.id_kenh_tuyen_dung ? sourceName.get(r.id_kenh_tuyen_dung) : undefined,
      ma_de_xuat: dx?.ma_de_xuat,
      ten_chuc_vu: dx?.ten_chuc_vu,
    };
  });
}

export const getUngVien = async () => joinUngVien(await ungVienTable.getAll());

function normalizeUngVien(e: UngVienInput): UngVienInput {
  return {
    ho_ten: e.ho_ten,
    email: e.email,
    so_dien_thoai: e.so_dien_thoai ?? '',
    dia_chi: e.dia_chi ?? null,
    ngay_sinh: e.ngay_sinh ?? null,
    ghi_chu_noi_bo: e.ghi_chu_noi_bo ?? null,
    id_de_xuat_tuyen_dung: e.id_de_xuat_tuyen_dung,
    id_trang_thai_ung_vien: e.id_trang_thai_ung_vien,
    id_kenh_tuyen_dung: e.id_kenh_tuyen_dung ?? null,
    ngay_phong_van_gan_nhat: e.ngay_phong_van_gan_nhat ?? null,
    ket_qua_phan_hoi_gan_nhat: e.ket_qua_phan_hoi_gan_nhat ?? null,
    tai_lieu: e.tai_lieu ?? [],
  };
}

async function createUngVien(input: UngVienInput) {
  const now = new Date().toISOString();
  const row = await ungVienTable.insert({ id: `uv-${Date.now()}`, ...normalizeUngVien(input), tg_tao: now, tg_cap_nhat: now });
  return (await joinUngVien([row]))[0];
}

async function updateUngVien(id: string, input: UngVienInput) {
  if (!(await ungVienTable.getById(id))) throw new Error(t('ungVien.service.notFound'));
  const row = await ungVienTable.update(id, { ...normalizeUngVien(input), tg_cap_nhat: new Date().toISOString() });
  return (await joinUngVien([row]))[0];
}

async function joinLichPhongVan(rows: LichPhongVan[]): Promise<LichPhongVan[]> {
  const candidates = await getUngVien();
  const byId = new Map(candidates.map((c) => [c.id, c]));
  return rows.map((r) => ({ ...r, ten_ung_vien: byId.get(r.id_ung_vien)?.ho_ten, ma_de_xuat: byId.get(r.id_ung_vien)?.ma_de_xuat }));
}

export const getLichPhongVan = async () => joinLichPhongVan(await lichPhongVanTable.getAll());

function normalizeLich(e: LichPhongVanInput): LichPhongVanInput {
  return {
    id_ung_vien: e.id_ung_vien,
    so_vong: Number(e.so_vong),
    ngay: e.ngay,
    gio: e.gio,
    hinh_thuc: e.hinh_thuc,
    dia_diem: e.dia_diem,
    trang_thai: e.trang_thai,
    trang_thai_danh_gia: e.trang_thai_danh_gia ?? null,
    danh_gia_diem_so: e.danh_gia_diem_so ?? null,
    danh_gia_nhan_xet: e.danh_gia_nhan_xet ?? null,
    ket_qua: e.ket_qua ?? null,
    ghi_chu: e.ghi_chu ?? null,
    danh_gia_chi_tiet: e.danh_gia_chi_tiet ?? null,
  };
}

async function createLichPhongVan(input: LichPhongVanInput) {
  const now = new Date().toISOString();
  const row = await lichPhongVanTable.insert({ id: `lpv-${Date.now()}`, ...normalizeLich(input), tg_tao: now, tg_cap_nhat: now });
  return (await joinLichPhongVan([row]))[0];
}

async function updateLichPhongVan(id: string, input: LichPhongVanInput) {
  if (!(await lichPhongVanTable.getById(id))) throw new Error(t('lichPhongVan.service.notFound'));
  const row = await lichPhongVanTable.update(id, { ...normalizeLich(input), tg_cap_nhat: new Date().toISOString() });
  return (await joinLichPhongVan([row]))[0];
}

/* ---------- Hook React Query ---------- */

const STALE = 5 * 60 * 1000;
const UNG_VIEN_KEY = ['ungVien'];
const LICH_KEY = ['lichPhongVan'];

export const useTrangThaiUngVien = () => useQuery({ queryKey: ['trangThaiUngVien'], queryFn: getTrangThaiUngVien, staleTime: STALE });
export const useKenhTuyenDung = () => useQuery({ queryKey: ['kenhTuyenDung'], queryFn: getKenhTuyenDung, staleTime: STALE });
export const useDeXuatTuyenDung = () => useQuery({ queryKey: ['deXuatTuyenDung'], queryFn: getDeXuatTuyenDung, staleTime: STALE });
export const useUngVien = () => useQuery({ queryKey: UNG_VIEN_KEY, queryFn: getUngVien, staleTime: STALE });
export const useLichPhongVan = () => useQuery({ queryKey: LICH_KEY, queryFn: getLichPhongVan, staleTime: STALE });

export function useCreateUngVien(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUngVien,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: UNG_VIEN_KEY });
      toast.success(t('ungVien.toast.createSuccess'));
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateUngVien(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UngVienInput }) => updateUngVien(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: UNG_VIEN_KEY });
      toast.success(t('ungVien.toast.updateSuccess'));
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteUngVien() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => ungVienTable.remove(ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: UNG_VIEN_KEY });
      toast.success(t('ungVien.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateLichPhongVan(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLichPhongVan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LICH_KEY });
      toast.success(t('lichPhongVan.toast.createSuccess'));
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLichPhongVan(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LichPhongVanInput }) => updateLichPhongVan(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LICH_KEY });
      toast.success(t('lichPhongVan.toast.updateSuccess'));
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLichPhongVan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => lichPhongVanTable.remove(ids),
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: LICH_KEY });
      toast.success(t('lichPhongVan.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Nhãn hiển thị cho đề xuất: "DX-2025-001 · Lập trình viên Senior". */
export function deXuatLabel(d: { ma_de_xuat?: string; ten_chuc_vu?: string }) {
  return `${d.ma_de_xuat ?? ''}${d.ten_chuc_vu ? ` · ${d.ten_chuc_vu}` : ''}`;
}

/* ---------- Đề xuất tuyển dụng: thêm/sửa/xóa, đổi trạng thái ---------- */

export const DX_TRANG_THAI = ['Nháp', 'Chờ duyệt', 'Đã duyệt', 'Từ chối'] as const;
export type DxTrangThai = (typeof DX_TRANG_THAI)[number];

export interface DeXuatInput {
  id_chuc_vu: string;
  ma_de_xuat: string;
  tieu_de: string | null;
  mo_ta: string;
  yeu_cau: string;
  link_tuyen: string;
  so_luong: number;
  so_luong_da_tuyen: number;
  han_nop: string | null;
  trang_thai: string;
}

/** Đề xuất kèm số ứng viên đã nhận việc / đã nghỉ (tính theo loại kết quả của trạng thái UV). */
export interface DeXuatWithCounts extends DeXuatTuyenDung {
  so_luong_onboard: number;
  so_luong_da_nghi: number;
  so_luong_con_lai: number;
}

const DE_XUAT_KEY = ['deXuatTuyenDung'];

async function joinDeXuat(rows: DeXuatTuyenDung[]) {
  const positions = await getPositions();
  const byId = new Map(positions.map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, ten_chuc_vu: byId.get(r.id_chuc_vu)?.ten_chuc_vu, ten_phong_ban: byId.get(r.id_chuc_vu)?.ten_phong_ban }));
}

const deXuatFields = (e: DeXuatInput) => ({
  id_chuc_vu: e.id_chuc_vu,
  ma_de_xuat: e.ma_de_xuat,
  tieu_de: e.tieu_de ?? null,
  mo_ta: e.mo_ta,
  yeu_cau: e.yeu_cau,
  link_tuyen: e.link_tuyen,
  so_luong: Number(e.so_luong),
  so_luong_da_tuyen: Number(e.so_luong_da_tuyen ?? 0),
  han_nop: e.han_nop ?? null,
  trang_thai: e.trang_thai,
});

async function createDeXuat(input: DeXuatInput) {
  const now = new Date().toISOString();
  const row = await deXuatTable.insert({ id: `dx-${Date.now()}`, ...deXuatFields(input), ghi_chu: null, tg_tao: now, tg_cap_nhat: now });
  return (await joinDeXuat([row]))[0];
}

async function updateDeXuat(id: string, input: DeXuatInput) {
  const old = await deXuatTable.getById(id);
  if (!old) throw new Error(t('deXuatTuyenDung.service.notFound'));
  const row = await deXuatTable.update(id, { ...deXuatFields(input), ghi_chu: old.ghi_chu ?? null, tg_cap_nhat: new Date().toISOString() });
  return (await joinDeXuat([row]))[0];
}

async function changeDeXuatStatus(id: string, status: string, ghi_chu: string | null) {
  if (!(await deXuatTable.getById(id))) throw new Error(t('deXuatTuyenDung.service.notFound'));
  const row = await deXuatTable.update(id, { trang_thai: status, ghi_chu, tg_cap_nhat: new Date().toISOString() });
  return (await joinDeXuat([row]))[0];
}

export function useDeXuatWithCounts() {
  const proposals = useDeXuatTuyenDung();
  const candidates = useUngVien();
  const statuses = useTrangThaiUngVien();
  const data = useMemo<DeXuatWithCounts[]>(() => {
    const kind = new Map((statuses.data ?? []).map((s) => [s.id, s.loai_ket_qua ?? null]));
    return (proposals.data ?? []).map((d) => {
      let onboard = 0;
      let nghi = 0;
      (candidates.data ?? []).forEach((c) => {
        if (c.id_de_xuat_tuyen_dung !== d.id) return;
        const k = kind.get(c.id_trang_thai_ung_vien);
        if (k === 'onboard') onboard += 1;
        else if (k === 'nghi') nghi += 1;
      });
      return { ...d, so_luong_onboard: onboard, so_luong_da_nghi: nghi, so_luong_con_lai: Math.max(0, (d.so_luong ?? 0) - onboard) };
    });
  }, [proposals.data, candidates.data, statuses.data]);
  return { data, isLoading: proposals.isLoading || candidates.isLoading || statuses.isLoading, isError: proposals.isError };
}

export const useCreateDeXuat = (onDone?: () => void) =>
  useToastMutation({ mutationFn: createDeXuat, invalidate: [DE_XUAT_KEY], success: t('deXuatTuyenDung.toast.createSuccess'), onDone });

export const useUpdateDeXuat = (onDone?: () => void) =>
  useToastMutation({
    mutationFn: ({ id, data }: { id: string; data: DeXuatInput }) => updateDeXuat(id, data),
    invalidate: [DE_XUAT_KEY],
    success: t('deXuatTuyenDung.toast.updateSuccess'),
    onDone,
  });

export const useChangeDeXuatStatusMany = () =>
  useToastMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const now = new Date().toISOString();
      for (const id of ids) await deXuatTable.update(id, { trang_thai: status, tg_cap_nhat: now });
    },
    invalidate: [DE_XUAT_KEY],
    success: (v) => t('deXuatTuyenDung.toast.statusUpdate', { count: v.ids.length }),
  });

export const useChangeDeXuatStatus = (onDone?: (row: DeXuatTuyenDung) => void) =>
  useToastMutation({
    mutationFn: ({ id, status, ghi_chu }: { id: string; status: string; ghi_chu: string | null }) => changeDeXuatStatus(id, status, ghi_chu),
    invalidate: [DE_XUAT_KEY],
    success: t('deXuatTuyenDung.toast.statusUpdate', { count: 1 }),
    onDone,
  });

export const useDeleteDeXuat = () =>
  useToastMutation({
    mutationFn: (ids: string[]) => deXuatTable.remove(ids),
    invalidate: [DE_XUAT_KEY],
    success: (ids) => t('deXuatTuyenDung.toast.deleteSuccess', { count: ids.length }),
  });
