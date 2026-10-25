import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Các module con đã dựng lại, theo đường dẫn "<phân hệ>/<slug>".
 * Toàn bộ các module con của Hành chính và Nhân sự đã được triển khai đầy đủ.
 */
export const IMPLEMENTED_MODULES: Record<string, LazyExoticComponent<ComponentType>> = {
  // === NHÂN SỰ: Quản lý nhân viên ===
  'nhan-su/nhan-vien': lazy(() => import('./nhan-su/nhan-vien/NhanVienPage')),

  // === NHÂN SỰ: Tuyển dụng ===
  'nhan-su/de-xuat-tuyen-dung': lazy(() => import('./nhan-su/de-xuat/DeXuatPage')),
  'nhan-su/ho-so-ung-vien': lazy(() => import('./nhan-su/ung-vien/UngVienPage')),
  'nhan-su/lich-phong-van': lazy(() => import('./nhan-su/lich-phong-van/LichPhongVanPage')),
  'nhan-su/thu-gui-ung-vien': lazy(() => import('./nhan-su/thu-gui-ung-vien/ThuPage')),
  'nhan-su/hop-dong': lazy(() => import('./nhan-su/hop-dong/HopDongPage')),
  'nhan-su/danh-gia-thu-viec': lazy(() => import('./nhan-su/danh-gia-thu-viec/DanhGiaThuViecPage')),
  'nhan-su/bao-cao-tuyen-dung': lazy(() => import('./nhan-su/bao-cao/BaoCaoTuyenDungPage')),
  'nhan-su/thiet-lap-tuyen-dung': lazy(() => import('./nhan-su/thiet-lap/ThietLapTuyenDungPage')),

  // === NHÂN SỰ: Cuộc họp ===
  'nhan-su/phong-hop': lazy(() => import('./nhan-su/cuoc-hop/PhongHopPage')),
  'nhan-su/cuoc-hop': lazy(() => import('./nhan-su/cuoc-hop/CuocHopPage')),
  'nhan-su/bien-ban-hop': lazy(() => import('./nhan-su/cuoc-hop/BienBanHopPage')),
  'nhan-su/bao-cao-cuoc-hop': lazy(() => import('./nhan-su/cuoc-hop/BaoCaoCuocHopPage')),
  'nhan-su/thiet-lap-cuoc-hop': lazy(() => import('./nhan-su/cuoc-hop/ThietLapCuocHopPage')),

  // === NHÂN SỰ: Đào tạo ===
  'nhan-su/ke-hoach-dao-tao': lazy(() => import('./nhan-su/dao-tao/KeHoachDaoTaoPage')),
  'nhan-su/khoa-dao-tao': lazy(() => import('./nhan-su/dao-tao/KhoaDaoTaoPage')),
  'nhan-su/dang-ky-dao-tao': lazy(() => import('./nhan-su/dao-tao/DangKyDaoTaoPage')),
  'nhan-su/bao-cao-dao-tao': lazy(() => import('./nhan-su/dao-tao/BaoCaoDaoTaoPage')),
  'nhan-su/thiet-lap-dao-tao': lazy(() => import('./nhan-su/dao-tao/ThietLapDaoTaoPage')),

  // === HÀNH CHÍNH: Công lương ===
  'hanh-chinh/cham-cong': lazy(() => import('./hanh-chinh/cham-cong/ChamCongPage')),
  'hanh-chinh/tong-hop-cham-cong': lazy(() => import('./hanh-chinh/cong-luong/TongHopChamCongPage')),
  'hanh-chinh/phieu-hanh-chinh': lazy(() => import('./hanh-chinh/phieu-hanh-chinh/PhieuHanhChinhPage')),
  'hanh-chinh/cham-diem-kpi': lazy(() => import('./hanh-chinh/cong-luong/ChamDiemKpiPage')),
  'hanh-chinh/bang-luong': lazy(() => import('./hanh-chinh/bang-luong/BangLuongPage')),
  'hanh-chinh/diem-cong-tru': lazy(() => import('./hanh-chinh/cong-luong/DiemCongTruPage')),
  'hanh-chinh/thiet-lap-cong-luong': lazy(() => import('./hanh-chinh/cong-luong/ThietLapCongLuongPage')),
  'hanh-chinh/hom-thu-gop-y': lazy(() => import('./hanh-chinh/cong-luong/HomThuGopYPage')),

  // === HÀNH CHÍNH: Tài liệu ===
  'hanh-chinh/danh-sach-tai-lieu': lazy(() => import('./hanh-chinh/tai-lieu/TaiLieuPage')),
  'hanh-chinh/luu-tru-ho-so': lazy(() => import('./hanh-chinh/tai-lieu/LuuTruHoSoPage')),
  'hanh-chinh/thiet-lap-tai-lieu': lazy(() => import('./hanh-chinh/tai-lieu/ThietLapTaiLieuPage')),

  // === HÀNH CHÍNH: Công việc ===
  'hanh-chinh/du-an': lazy(() => import('./hanh-chinh/cong-viec/DuAnPage')),
  'hanh-chinh/cong-viec-cua-toi': lazy(() => import('./hanh-chinh/cong-viec/CongViecCuaToiPage')),
  'hanh-chinh/cong-viec-toi-quan-ly': lazy(() => import('./hanh-chinh/cong-viec/CongViecToiQuanLyPage')),
  'hanh-chinh/bao-cao': lazy(() => import('./hanh-chinh/cong-viec/BaoCaoCongViecPage')),
  'hanh-chinh/thiet-lap-cong-viec': lazy(() => import('./hanh-chinh/cong-viec/ThietLapCongViecPage')),

  // === HÀNH CHÍNH: Tài sản ===
  'hanh-chinh/danh-sach-tai-san': lazy(() => import('./hanh-chinh/tai-san/DanhSachTaiSanPage')),
  'hanh-chinh/cap-phat-thu-hoi': lazy(() => import('./hanh-chinh/tai-san/CapPhatThuHoiPage')),
  'hanh-chinh/bao-tri-sua-chua': lazy(() => import('./hanh-chinh/tai-san/BaoTriSuaChuaPage')),
  'hanh-chinh/kiem-ke-tai-san': lazy(() => import('./hanh-chinh/tai-san/KiemKeTaiSanPage')),
  'hanh-chinh/khau-hao-tai-san': lazy(() => import('./hanh-chinh/tai-san/KhauHaoTaiSanPage')),
  'hanh-chinh/noi-quan-ly': lazy(() => import('./hanh-chinh/tai-san/NoiQuanLyPage')),
  'hanh-chinh/thiet-lap-tai-san': lazy(() => import('./hanh-chinh/tai-san/ThietLapTaiSanPage')),

  // === HÀNH CHÍNH: Quản lý xe ===
  'hanh-chinh/danh-sach-xe': lazy(() => import('./hanh-chinh/quan-ly-xe/DanhSachXePage')),
  'hanh-chinh/su-dung-xe': lazy(() => import('./hanh-chinh/quan-ly-xe/SuDungXePage')),
  'hanh-chinh/lich-bao-duong': lazy(() => import('./hanh-chinh/quan-ly-xe/LichBaoDuongPage')),
  'hanh-chinh/phieu-xang-chi-phi-xe': lazy(() => import('./hanh-chinh/quan-ly-xe/PhieuXangChiPhiXePage')),
  'hanh-chinh/bao-cao-xe': lazy(() => import('./hanh-chinh/quan-ly-xe/BaoCaoXePage')),
  'hanh-chinh/quan-ly-lai-xe': lazy(() => import('./hanh-chinh/quan-ly-xe/QuanLyLaiXePage')),
  'hanh-chinh/thiet-lap-quan-ly-xe': lazy(() => import('./hanh-chinh/quan-ly-xe/ThietLapQuanLyXePage')),
};
