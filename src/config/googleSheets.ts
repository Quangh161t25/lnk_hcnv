/**
 * Cấu hình liên kết Google Sheets cho hệ thống ERP LNK_HCNS (Vũ Gia)
 */
export const GOOGLE_SHEETS_CONFIG = {
  spreadsheetId: '19h9xv-5rd2MFF9PUh8LqKnayRr4NUPka64aB8D6jQQg',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/19h9xv-5rd2MFF9PUh8LqKnayRr4NUPka64aB8D6jQQg/edit',
  serviceAccountEmail: 'lnk-773@cty-lnk-161.iam.gserviceaccount.com',
  sheets: [
    '1. NhanSu_DanhSach',
    '2. CoCau_PhongBan',
    '3. DanhMuc_ChucDanh',
    '4. PhieuHanhChinh',
    '5. NhatKy_ChamCong',
    '6. BangLuong_ChiTiet',
    '7. HopDong_LaoDong',
    '8. TuyenDung_UngVien',
    '9. TaiLieu_CongVan',
    '10. QuanLy_TaiSan',
    '12. DaoTao_PhatTrien',
    '13. CuocHop_PhongHop',
    '14. DuAn_CongViec',
    '15. HomThu_GopY',
  ],
} as const;
