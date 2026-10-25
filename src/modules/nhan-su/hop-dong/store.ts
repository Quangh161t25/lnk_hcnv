import { createListStore, type ColumnInput } from '@/stores/createListStore';
import { t } from '@/lib/i18n';

export interface HopDongFilters {
  id_ung_vien: string[];
  loai_hop_dong: string[];
  trang_thai: string[];
}

const INITIAL_FILTERS: HopDongFilters = {
  id_ung_vien: [],
  loai_hop_dong: [],
  trang_thai: [],
};

const INITIAL_COLUMNS: ColumnInput[] = [
  { id: 'ung_vien', label: t('hopDong.table.ungVien'), visible: true, minWidth: 150, maxWidth: 260 },
  { id: 'so_hop_dong', label: t('hopDong.table.soHopDong'), visible: true, minWidth: 130 },
  { id: 'loai_hop_dong', label: t('hopDong.table.loaiHopDong'), visible: true, minWidth: 120 },
  { id: 'ngay_bat_dau', label: t('hopDong.table.ngayBatDau'), visible: true, minWidth: 110 },
  { id: 'ngay_ket_thuc', label: t('hopDong.table.ngayKetThuc'), visible: true, minWidth: 110 },
  { id: 'ngay_vao_lam', label: t('hopDong.table.ngayVaoLam'), visible: true, minWidth: 110 },
  { id: 'trang_thai', label: t('hopDong.table.trangThai'), visible: true, minWidth: 120 },
  { id: 'muc_luong', label: t('hopDong.table.mucLuong'), visible: true, minWidth: 140 },
  { id: 'tg_tao', label: t('hopDong.table.ngayTao'), visible: true, minWidth: 110 },
  { id: 'tg_cap_nhat', label: t('hopDong.table.ngayCapNhat'), visible: false, minWidth: 110 },
  { id: 'actions', label: t('common.actions'), visible: true, minWidth: 120 },
];

export const useHopDongStore = createListStore<HopDongFilters>(INITIAL_FILTERS, INITIAL_COLUMNS);
