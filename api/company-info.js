// Vercel Serverless Function: đọc / ghi "Thông tin công ty" vào Google Sheet.
// Tab dữ liệu: "16. ThongTin_CongTy", dạng 3 cột: Khóa | Trường | Giá trị.
// GET: ai cũng đọc được (tên, địa chỉ công ty hiển thị trên giao diện). PUT: quản trị viên hoặc người có quyền Sửa module Thông tin công ty.
import { readBody, readSession, readValues, replaceValues, route } from './_lib/google.js';
import { permChecker } from './_lib/permissions.js';

const SHEET_TITLE = '16. ThongTin_CongTy';

// Thứ tự + nhãn hiển thị của từng trường trong sheet (khóa phải khớp với src/modules/he-thong/companyInfo.ts).
const FIELDS = [
  ['ten_cong_ty', 'Tên doanh nghiệp'],
  ['ten_quoc_te', 'Tên giao dịch quốc tế'],
  ['ten_viet_tat', 'Tên viết tắt'],
  ['ma_so_thue', 'Mã số thuế'],
  ['ngay_thanh_lap', 'Ngày thành lập (YYYY-MM-DD)'],
  ['nguoi_dai_dien', 'Người đại diện pháp luật'],
  ['chuc_vu_dai_dien', 'Chức vụ người đại diện'],
  ['linh_vuc', 'Lĩnh vực hoạt động chính'],
  ['dia_chi_tru_so', 'Địa chỉ trụ sở chính'],
  ['hotline', 'Hotline'],
  ['so_dien_thoai', 'Tổng đài'],
  ['email', 'Email'],
  ['website', 'Website'],
  ['so_tai_khoan', 'Số tài khoản'],
  ['ngan_hang', 'Ngân hàng & chi nhánh'],
  ['chu_tai_khoan', 'Tên chủ tài khoản'],
];
const KEYS = new Set(FIELDS.map(([k]) => k));

async function readInfo() {
  const out = {};
  for (const [k, , v] of (await readValues(SHEET_TITLE)).slice(1)) if (KEYS.has(k)) out[k] = v ?? '';
  return out;
}

async function writeInfo(info) {
  const values = [['Khóa', 'Trường', 'Giá trị'], ...FIELDS.map(([k, label]) => [k, label, String(info[k] ?? '')])];
  values.push(['_cap_nhat_luc', 'Cập nhật lúc', new Date().toISOString()]);
  await replaceValues(SHEET_TITLE, values);
}

export default route(async (req, res) => {
  if (req.method === 'GET') {
    return res.status(200).json({ data: await readInfo() });
  }
  if (req.method === 'PUT' || req.method === 'POST') {
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
    if (!(await permChecker(session))('he-thong/thong-tin-cong-ty', 'sua')) return res.status(403).json({ error: 'Bạn không có quyền sửa thông tin công ty' });
    const body = readBody(req);
    const info = {};
    for (const k of KEYS) info[k] = typeof body[k] === 'string' ? body[k].slice(0, 500) : '';
    if (!info.ten_cong_ty.trim()) return res.status(400).json({ error: 'Tên doanh nghiệp không được để trống' });
    await writeInfo(info);
    return res.status(200).json({ data: info });
  }
  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
});
