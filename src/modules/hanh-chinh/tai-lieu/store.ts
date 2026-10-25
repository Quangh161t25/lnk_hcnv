import { useMemo } from 'react';
import { t } from '@/lib/i18n';
import { createListStore } from '@/stores/createListStore';
import type { TaiLieu } from './data';

export interface TaiLieuFilters {
  id_loai: string[];
  id_trang_thai: string;
  id_phong_ban: string;
  huong: string;
}

export const useTaiLieuList = createListStore<TaiLieuFilters>({ id_loai: [], id_trang_thai: '', id_phong_ban: '', huong: '' }, [
  { id: 'ma_so_trich_yeu', label: t('taiLieu.store.maSoTrichYeuCol'), visible: true, minWidth: 240, maxWidth: 380, order: 0 },
  { id: 'huong', label: t('taiLieu.store.huongCol'), visible: true, minWidth: 100, maxWidth: 120, order: 1 },
  { id: 'ten_loai', label: t('taiLieu.store.loaiCol'), visible: true, minWidth: 100, maxWidth: 140, order: 2 },
  { id: 'ten_nhom_tai_lieu', label: t('taiLieu.store.nhomCol'), visible: true, minWidth: 100, maxWidth: 140, order: 3 },
  { id: 'ten_trang_thai', label: t('taiLieu.store.trangThaiCol'), visible: true, minWidth: 100, maxWidth: 130, order: 4 },
  { id: 'ten_phong_ban', label: t('taiLieu.store.phongQuanLyCol'), visible: true, minWidth: 120, maxWidth: 160, order: 5 },
  { id: 'phan_quyen', label: t('taiLieu.store.phanQuyenCol'), visible: true, minWidth: 100, maxWidth: 120, order: 6 },
  { id: 'so_den', label: t('taiLieu.store.soDenCol'), visible: true, minWidth: 88, maxWidth: 110, order: 7 },
  { id: 'so_di', label: t('taiLieu.store.soDiCol'), visible: true, minWidth: 88, maxWidth: 110, order: 8 },
  { id: 'ngay_den', label: t('taiLieu.store.ngayDenCol'), visible: true, minWidth: 96, maxWidth: 116, order: 9 },
  { id: 'ngay_ky', label: t('taiLieu.store.ngayKyCol'), visible: true, minWidth: 96, maxWidth: 116, order: 10 },
  { id: 'tg_cap_nhat', label: t('taiLieu.store.updatedCol'), visible: false, minWidth: 130, maxWidth: 150, order: 11 },
]);

/** Đếm số lượng cho từng lựa chọn bộ lọc, có tính các bộ lọc còn lại (đếm chéo như bản gốc). */
export function useFacetCounts(items: TaiLieu[], f: TaiLieuFilters) {
  return useMemo(() => {
    const huong: Record<string, number> = {};
    const phongBan: Record<string, number> = {};
    const loai: Record<string, number> = {};
    const trangThai: Record<string, number> = {};
    const okHuong = (d: TaiLieu) => !f.huong || d.huong === f.huong;
    const okPhong = (d: TaiLieu) => !f.id_phong_ban || d.id_phong_ban === f.id_phong_ban;
    const okLoai = (d: TaiLieu) => f.id_loai.length === 0 || f.id_loai.includes(d.id_loai);
    const okTrang = (d: TaiLieu) => !f.id_trang_thai || d.id_trang_thai === f.id_trang_thai;
    for (const d of items) {
      const h = okHuong(d);
      const p = okPhong(d);
      const l = okLoai(d);
      const s = okTrang(d);
      if (p && l && s && d.huong) huong[d.huong] = (huong[d.huong] || 0) + 1;
      if (h && l && s && d.id_phong_ban) phongBan[d.id_phong_ban] = (phongBan[d.id_phong_ban] || 0) + 1;
      if (h && p && s && d.id_loai) loai[d.id_loai] = (loai[d.id_loai] || 0) + 1;
      if (h && p && l && d.id_trang_thai) trangThai[d.id_trang_thai] = (trangThai[d.id_trang_thai] || 0) + 1;
    }
    return { huong, phongBan, loai, trangThai };
  }, [items, f]);
}
