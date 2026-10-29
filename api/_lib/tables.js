// Ánh xạ bảng dữ liệu của ứng dụng ↔ tab trên Google Sheet.
// Mỗi cột: key (trường trong app), header (tiêu đề cột trên Sheet), kiểu chuyển đổi tùy chọn.
// Cột được tìm theo TIÊU ĐỀ nên người dùng có thể đổi thứ tự cột trên Sheet.

const num = { read: (v) => (v === '' || v == null ? null : Number(String(v).replace(/[^\d.-]/g, '')) || 0), write: (v) => (v == null ? '' : String(v)) };
const bool = { read: (v) => /^(có|co|true|x|1|yes)$/i.test(String(v).trim()), write: (v) => (v ? 'Có' : 'Không') };
const list = { read: (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean), write: (v) => (Array.isArray(v) ? v.join(', ') : '') };

const ROLE = {
  read: (v) => (/admin|quản trị/i.test(String(v)) ? 'admin' : 'member'),
  write: (v) => (v === 'admin' ? 'Quản trị viên (Admin)' : 'Nhân viên (Member)'),
};
const WORK_STATUS = {
  read: (v) => {
    const s = String(v || '').toLowerCase();
    return s.includes('thử') ? 'thu_viec' : s.includes('nghỉ') ? 'da_nghi_viec' : 'dang_lam_viec';
  },
  // Giữ đúng cách ghi đang dùng trên Sheet.
  write: (v) => (v === 'thu_viec' ? 'Đang thử việc' : v === 'da_nghi_viec' ? 'Đã nghỉ việc' : 'Chính thức'),
};

export const TABLES = {
  employees: {
    tab: '1. NhanSu_DanhSach',
    idKey: 'ma_nv',
    columns: [
      { key: 'ma_nv', header: 'Mã NV' },
      { key: 'ho_ten', header: 'Họ và tên' },
      { key: 'email', header: 'Email' },
      { key: 'sdt', header: 'Số điện thoại' },
      { key: 'phong_ban', header: 'Phòng ban' },
      { key: 'chuc_vu', header: 'Chức vụ' },
      { key: 'vai_tro', header: 'Vai trò hệ thống', ...ROLE },
      { key: 'loai_hop_dong', header: 'Loại hợp đồng' },
      { key: 'ngay_vao_lam', header: 'Ngày vào làm' },
      { key: 'trang_thai', header: 'Trạng thái công tác', ...WORK_STATUS },
      // Cột mật khẩu: chỉ quản trị viên nhìn thấy; người khác không bao giờ nhận được giá trị này.
      { key: 'mat_khau', header: 'Mật khẩu', secret: true },
    ],
  },
  departments: {
    tab: '2. CoCau_PhongBan',
    idKey: 'id',
    columns: [
      { key: 'ma_phong_ban', header: 'Mã phòng ban' },
      { key: 'ten_phong_ban', header: 'Tên phòng ban / Khối chức năng' },
      { key: 'cap_do', header: 'Cấp độ', ...num },
      // "/dep-0/dep-0-1": phần cuối là id, phần trước là phòng ban cha.
      { key: 'duong_dan', header: 'Cấu trúc phân cấp' },
      { key: 'trang_thai', header: 'Trạng thái' },
      { key: 'thu_tu', header: 'Thứ tự sắp xếp', ...num },
      // Người duyệt kế hoạch/báo cáo của phòng này (và các nhóm con).
      { key: 'truong_phong', header: 'Trưởng phòng (Mã NV)' },
    ],
    afterRead(row) {
      const parts = String(row.duong_dan || '').split('/').filter(Boolean);
      row.id = parts[parts.length - 1] || row.ma_phong_ban;
      row.cha_id = parts.length > 1 ? parts[parts.length - 2] : null;
      return row;
    },
    beforeWrite(rows) {
      const byId = new Map(rows.map((r) => [r.id, r]));
      const path = (r, seen = new Set()) => {
        if (!r.cha_id || !byId.has(r.cha_id) || seen.has(r.id)) return `/${r.id}`;
        seen.add(r.id);
        return `${path(byId.get(r.cha_id), seen)}/${r.id}`;
      };
      return rows.map((r) => ({ ...r, duong_dan: path(r) }));
    },
  },
  positions: {
    tab: '3. DanhMuc_ChucDanh',
    idKey: 'id',
    columns: [
      { key: 'ma_chuc_vu', header: 'Mã vị trí' },
      { key: 'ten_chuc_vu', header: 'Tên chức danh / Vị trí công tác' },
      { key: 'phong_ban_id', header: 'Mã phòng ban trực thuộc', ref: { table: 'departments', code: 'ma_phong_ban', name: 'ten_phong_ban', nameKey: 'ten_phong_ban' } },
      { key: 'mo_ta', header: 'Mô tả trách nhiệm công việc' },
      { key: 'trang_thai', header: 'Trạng thái' },
      { key: 'cap_bac_id', header: 'Mã cấp bậc', ref: { table: 'jobLevels', code: 'ma_cap_bac', name: 'ten_cap_bac', nameKey: 'ten_cap_bac' } },
      { key: 'thu_tu', header: 'Thứ tự', ...num },
      { key: 'id', header: 'ID hệ thống' },
    ],
  },
  jobLevels: {
    tab: '17. DanhMuc_CapBac',
    idKey: 'id',
    columns: [
      { key: 'ma_cap_bac', header: 'Mã cấp bậc' },
      { key: 'ten_cap_bac', header: 'Tên cấp bậc' },
      { key: 'thu_tu', header: 'Thứ tự', ...num },
      { key: 'luong_co_ban', header: 'Lương cơ bản (VNĐ)', ...num },
      { key: 'mo_ta', header: 'Mô tả' },
      { key: 'trang_thai', header: 'Trạng thái' },
      { key: 'id', header: 'ID hệ thống' },
      { key: 'tg_cap_nhat', header: 'Cập nhật lúc' },
    ],
  },
  branches: {
    tab: '18. DanhMuc_ChiNhanh',
    idKey: 'id',
    columns: [
      { key: 'ma_chi_nhanh', header: 'Mã chi nhánh' },
      { key: 'ten_chi_nhanh', header: 'Tên chi nhánh / Văn phòng' },
      { key: 'loai_chi_nhanh', header: 'Loại' },
      { key: 'dia_chi', header: 'Địa chỉ' },
      { key: 'nguoi_phu_trach', header: 'Người phụ trách' },
      { key: 'so_dien_thoai', header: 'Số điện thoại' },
      { key: 'trang_thai', header: 'Trạng thái' },
      { key: 'id', header: 'ID hệ thống' },
    ],
  },
  roles: {
    tab: '19. PhanQuyen_VaiTro',
    idKey: 'id',
    columns: [
      { key: 'id', header: 'Mã vai trò' },
      { key: 'name', header: 'Tên vai trò' },
      { key: 'description', header: 'Mô tả' },
      { key: 'isSystem', header: 'Vai trò hệ thống (Có/Không)', ...bool },
      { key: 'permissions', header: 'Danh sách quyền (mã quyền, cách nhau dấu phẩy)', ...list },
    ],
  },
};

/* ---------- Thiết lập hạn nộp Kế hoạch / Báo cáo (đọc: mọi người đã đăng nhập; ghi: quản trị viên) ---------- */

TABLES.deadlines = {
  tab: '24. BCKH_HanNop',
  idKey: 'id',
  columns: [
    { key: 'id', header: 'Mã' },
    { key: 'ten', header: 'Áp dụng cho' },
    // Hạn nộp = (ngày đầu kỳ hoặc ngày cuối kỳ) + số ngày lệch, lúc "Giờ".
    { key: 'moc', header: 'Mốc (Đầu kỳ/Cuối kỳ)', read: (v) => (/đầu|dau/i.test(String(v)) ? 'dau_ky' : 'cuoi_ky'), write: (v) => (v === 'dau_ky' ? 'Đầu kỳ' : 'Cuối kỳ') },
    { key: 'lech_ngay', header: 'Lệch ngày (âm = trước mốc)', ...num },
    { key: 'gio', header: 'Giờ (HH:mm)' },
    { key: 'bat_buoc_ca_nhan', header: 'Bắt buộc nhân viên (Có/Không)', ...bool },
    { key: 'bat_buoc_phong_ban', header: 'Bắt buộc phòng ban (Có/Không)', ...bool },
    { key: 'ghi_chu', header: 'Ghi chú' },
  ],
};

/* ---------- Kế hoạch (đọc/ghi qua /api/plans, có phân quyền theo từng dòng) ---------- */

export const PLAN_TABLES = {
  plans: {
    tab: '20. KeHoach_DanhSach',
    idKey: 'id',
    columns: [
      { key: 'id', header: 'Mã kế hoạch' },
      { key: 'tieu_de', header: 'Tiêu đề' },
      { key: 'loai', header: 'Loại', read: (v) => (/phòng|phong/i.test(String(v)) ? 'phong_ban' : 'ca_nhan'), write: (v) => (v === 'phong_ban' ? 'Phòng ban' : 'Cá nhân') },
      {
        key: 'loai_ky',
        header: 'Kỳ',
        read: (v) => (/quý|quy/i.test(String(v)) ? 'quy' : /tháng|thang/i.test(String(v)) ? 'thang' : 'tuan'),
        write: (v) => (v === 'quy' ? 'Quý' : v === 'thang' ? 'Tháng' : 'Tuần'),
      },
      { key: 'nam', header: 'Năm', ...num },
      { key: 'so_ky', header: 'Số kỳ (tuần/tháng/quý)', ...num },
      { key: 'tu_ngay', header: 'Từ ngày' },
      { key: 'den_ngay', header: 'Đến ngày' },
      { key: 'phong_ban_id', header: 'Mã phòng ban', ref: { table: 'departments', code: 'ma_phong_ban', name: 'ten_phong_ban', nameKey: 'ten_phong_ban' } },
      { key: 'nguoi_lap', header: 'Người lập (Mã NV)' },
      { key: 'ten_nguoi_lap', header: 'Họ tên người lập' },
      { key: 'muc_tieu', header: 'Mục tiêu chung' },
      { key: 'trang_thai', header: 'Trạng thái' },
      { key: 'nguoi_duyet', header: 'Người duyệt (Mã NV)' },
      { key: 'y_kien_duyet', header: 'Ý kiến duyệt' },
      { key: 'tg_gui', header: 'Gửi lúc' },
      { key: 'tg_duyet', header: 'Duyệt lúc' },
      { key: 'tg_tao', header: 'Tạo lúc' },
      { key: 'tg_cap_nhat', header: 'Cập nhật lúc' },
    ],
  },
  planItems: {
    tab: '21. KeHoach_ChiTiet',
    idKey: 'id',
    columns: [
      { key: 'ke_hoach_id', header: 'Mã kế hoạch' },
      { key: 'stt', header: 'STT', ...num },
      { key: 'ten_viec', header: 'Tên đầu việc' },
      { key: 'muc_tieu', header: 'Mục tiêu / Chỉ số' },
      { key: 'phu_trach', header: 'Người phụ trách (Mã NV)' },
      { key: 'han', header: 'Thời hạn' },
      { key: 'uu_tien', header: 'Ưu tiên' },
      { key: 'trong_so', header: 'Trọng số (%)', ...num },
      { key: 'ghi_chu', header: 'Ghi chú' },
      { key: 'id', header: 'Mã đầu việc' },
      { key: 'nguon_id', header: 'Nhận từ đầu việc (Mã)' },
    ],
  },
};

/* ---------- Phân quyền theo nhân viên × module (đọc/ghi qua /api/permissions) ---------- */

PLAN_TABLES.permissions = {
  tab: '25. PhanQuyen_NhanVien',
  idKey: 'id',
  columns: [
    // "*" = mặc định cho mọi nhân viên chưa được cấu hình riêng.
    { key: 'ma_nv', header: 'Mã NV (* = mặc định)' },
    { key: 'ho_ten', header: 'Họ tên' },
    { key: 'module', header: 'Mã module' },
    { key: 'ten_module', header: 'Tên module' },
    { key: 'xem', header: 'Xem', ...bool },
    { key: 'them', header: 'Thêm', ...bool },
    { key: 'sua', header: 'Sửa', ...bool },
    { key: 'xoa', header: 'Xóa', ...bool },
  ],
  afterRead(row) {
    row.id = `${String(row.ma_nv).toLowerCase()}|${row.module}`;
    return row;
  },
};

/* ---------- Báo cáo (đọc/ghi qua /api/reports) ---------- */

const SECTION = { A: 'A. Kết quả công việc', B: 'B. Vấn đề & biện pháp', C: 'C. Kế hoạch kỳ tiếp theo', D: 'D. Đề xuất cải tiến' };
// Cột chung của tài liệu có luồng duyệt (dùng lại cho báo cáo).
const docColumns = (idHeader) => [
  { key: 'id', header: idHeader },
  ...PLAN_TABLES.plans.columns.filter((c) => !['id', 'muc_tieu'].includes(c.key) && !c.header.startsWith('Kỳ')),
];

PLAN_TABLES.reports = {
  tab: '22. BaoCao_DanhSach',
  idKey: 'id',
  columns: [
    ...docColumns('Mã báo cáo').slice(0, 3),
    { key: 'loai_ky', header: 'Kỳ', read: (v) => (/tháng|thang/i.test(String(v)) ? 'thang' : 'tuan'), write: (v) => (v === 'thang' ? 'Tháng' : 'Tuần') },
    ...docColumns('Mã báo cáo').slice(3, 10),
    { key: 'ke_hoach_id', header: 'Kế hoạch đối chiếu (Mã)' },
    { key: 'phan_tram', header: '% hoàn thành', ...num },
    { key: 'tom_tat', header: 'Tóm tắt / Nhận xét chung' },
    ...docColumns('Mã báo cáo').slice(10),
  ],
};

PLAN_TABLES.reportItems = {
  tab: '23. BaoCao_ChiTiet',
  idKey: 'id',
  columns: [
    { key: 'bao_cao_id', header: 'Mã báo cáo' },
    { key: 'phan', header: 'Phần', read: (v) => String(v).trim().charAt(0).toUpperCase() || 'A', write: (v) => SECTION[v] ?? v },
    { key: 'stt', header: 'STT', ...num },
    { key: 'noi_dung', header: 'Nội dung (việc / vấn đề / đầu việc / đề xuất)' },
    { key: 'ket_qua', header: 'Kết quả / Biện pháp / Mục tiêu / Trình bày' },
    { key: 'phan_tram', header: '% hoàn thành', ...num },
    { key: 'trong_so', header: 'Trọng số (%)', ...num },
    { key: 'phu_trach', header: 'Người phụ trách (Mã NV)' },
    { key: 'han', header: 'Thời hạn' },
    { key: 'da_xu_ly', header: 'Đã xử lý (Có/Không)', ...bool },
    { key: 'ghi_chu', header: 'Ghi chú' },
    { key: 'nguon_id', header: 'Từ đầu việc kế hoạch (Mã)' },
    { key: 'id', header: 'Mã dòng' },
  ],
};

/** Chuyển các dòng giá trị (dòng 0 là tiêu đề) thành mảng đối tượng. */
export function rowsToObjects(def, values) {
  const [header = [], ...data] = values;
  const index = def.columns.map((c, i) => {
    const at = header.findIndex((h) => String(h).trim() === c.header);
    return at >= 0 ? at : header.length === 0 ? i : -1;
  });
  return data
    .filter((r) => r.some((v) => String(v ?? '').trim() !== ''))
    .map((r) => {
      const obj = {};
      def.columns.forEach((c, i) => {
        const raw = index[i] >= 0 ? (r[index[i]] ?? '') : '';
        obj[c.key] = c.read ? c.read(raw) : String(raw);
      });
      return def.afterRead ? def.afterRead(obj) : obj;
    });
}

/** Chuyển mảng đối tượng thành dòng giá trị (kèm tiêu đề). */
export function objectsToRows(def, rows) {
  const prepared = def.beforeWrite ? def.beforeWrite(rows) : rows;
  return [def.columns.map((c) => c.header), ...prepared.map((r) => def.columns.map((c) => (c.write ? c.write(r[c.key]) : r[c.key] == null ? '' : String(r[c.key]))))];
}
