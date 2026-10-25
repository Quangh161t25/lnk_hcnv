import { t } from '@/lib/i18n';
import { createListStore } from '@/stores/createListStore';

export interface UngVienFilters {
  id_trang_thai_ung_vien: string[];
  id_de_xuat_tuyen_dung: string[];
  id_kenh_tuyen_dung: string[];
}

export const useUngVienList = createListStore<UngVienFilters>({ id_trang_thai_ung_vien: [], id_de_xuat_tuyen_dung: [], id_kenh_tuyen_dung: [] }, [
  { id: 'ho_ten', label: t('ungVien.store.hoTenCol'), visible: true, minWidth: 140, order: 0 },
  { id: 'email', label: t('ungVien.store.emailCol'), visible: true, minWidth: 160, maxWidth: 240, order: 1 },
  { id: 'so_dien_thoai', label: t('ungVien.store.soDienThoaiCol'), visible: true, minWidth: 110, order: 2 },
  { id: 'nam_sinh', label: t('ungVien.store.namSinhCol'), visible: true, minWidth: 90, order: 3 },
  { id: 'vi_tri_ung_tuyen', label: t('ungVien.store.viTriCol'), visible: true, minWidth: 140, maxWidth: 220, order: 4 },
  { id: 'trang_thai', label: t('ungVien.store.trangThaiCol'), visible: true, minWidth: 110, order: 5 },
  { id: 'nguon', label: t('ungVien.store.nguonCol'), visible: true, minWidth: 110, order: 6 },
  { id: 'ngay_phong_van_gan_nhat', label: t('ungVien.store.ngayPvCol'), visible: true, minWidth: 120, order: 7 },
  { id: 'ket_qua_phan_hoi_gan_nhat', label: t('ungVien.store.ketQuaPvCol'), visible: true, minWidth: 120, maxWidth: 200, order: 8 },
  { id: 'tg_tao', label: t('ungVien.store.createdCol'), visible: true, minWidth: 120, order: 9 },
]);
