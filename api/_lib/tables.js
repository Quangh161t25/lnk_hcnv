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
