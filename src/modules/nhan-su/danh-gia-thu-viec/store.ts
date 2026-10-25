import { createListStore, type ColumnInput } from '@/stores/createListStore';
import { t } from '@/lib/i18n';

export interface DanhGiaFilters {
  trang_thai: string[];
  phong_ban: string[];
  dot_thang: string[];
}

const INITIAL_FILTERS: DanhGiaFilters = {
  trang_thai: [],
  phong_ban: [],
  dot_thang: [],
};

const INITIAL_COLUMNS: ColumnInput[] = [
  { id: 'ho_ten', label: t('danhGiaThuViec.table.hoTen'), visible: true, minWidth: 150, maxWidth: 260 },
  { id: 'vi_tri', label: t('danhGiaThuViec.table.viTri'), visible: true, minWidth: 140 },
  { id: 'ten_phong_ban', label: t('danhGiaThuViec.table.phongBan'), visible: true, minWidth: 140 },
  { id: 'ngay_bat_dau_thu_viec', label: t('danhGiaThuViec.table.ngayBatDau'), visible: true, minWidth: 110 },
  { id: 'ngay_ket_thuc_thu_viec', label: t('danhGiaThuViec.table.ngayKetThuc'), visible: true, minWidth: 110 },
  { id: 'ten_quan_ly', label: t('danhGiaThuViec.table.quanLyTrucTiep'), visible: true, minWidth: 130 },
  { id: 'trang_thai', label: t('danhGiaThuViec.table.trangThai'), visible: true, minWidth: 120 },
  { id: 'diem_trung_binh', label: 'Điểm TB', visible: true, minWidth: 90 },
  { id: 'quyet_dinh', label: 'Quyết định', visible: true, minWidth: 150 },
  { id: 'dot_thang', label: t('danhGiaThuViec.table.dotThang'), visible: false, minWidth: 100 },
  { id: 'actions', label: t('common.actions'), visible: true, minWidth: 110 },
];

export const useDanhGiaStore = createListStore<DanhGiaFilters>(INITIAL_FILTERS, INITIAL_COLUMNS);
