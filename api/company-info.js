// Vercel Serverless Function: đọc / ghi "Thông tin công ty" vào Google Sheet.
// Khóa service account CHỈ nằm ở biến môi trường phía server (không bao giờ gửi xuống trình duyệt):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SPREADSHEET_ID
// Tab dữ liệu: "16. ThongTin_CongTy" (tự tạo nếu chưa có), dạng 3 cột: Khóa | Trường | Giá trị.
import { createSign } from 'node:crypto';

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

const b64url = (input) => Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

let cached = null;
async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt > now + 60) return cached.token;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Vercel lưu xuống dòng của private key dưới dạng "\n".
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !key) throw new Error('Thiếu biến môi trường GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY');
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({ iss: email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }),
  );
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const jwt = `${header}.${payload}.${signer.sign(key).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  if (!res.ok) throw new Error(`Không cấp được token Google (${res.status})`);
  const data = await res.json();
  cached = { token: data.access_token, expiresAt: now + (data.expires_in || 3600) };
  return cached.token;
}

async function sheets(path, init = {}) {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) throw new Error('Thiếu biến môi trường GOOGLE_SPREADSHEET_ID');
  const token = await getToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`Google Sheets lỗi ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function ensureSheet() {
  const meta = await sheets('?fields=sheets.properties.title');
  if (meta.sheets?.some((s) => s.properties.title === SHEET_TITLE)) return;
  await sheets(':batchUpdate', { method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title: SHEET_TITLE } } }] }) });
}

const range = (r) => encodeURIComponent(`'${SHEET_TITLE}'!${r}`);

async function readInfo() {
  await ensureSheet();
  const data = await sheets(`/values/${range('A2:C100')}`);
  const out = {};
  for (const [k, , v] of data.values || []) if (KEYS.has(k)) out[k] = v ?? '';
  return out;
}

async function writeInfo(info) {
  await ensureSheet();
  const values = [['Khóa', 'Trường', 'Giá trị'], ...FIELDS.map(([k, label]) => [k, label, String(info[k] ?? '')])];
  values.push(['_cap_nhat_luc', 'Cập nhật lúc', new Date().toISOString()]);
  await sheets(`/values/${range(`A1:C${values.length}`)}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values }) });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ data: await readInfo() });
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const info = {};
      for (const k of KEYS) info[k] = typeof body[k] === 'string' ? body[k].slice(0, 500) : '';
      if (!info.ten_cong_ty.trim()) return res.status(400).json({ error: 'Tên doanh nghiệp không được để trống' });
      await writeInfo(info);
      return res.status(200).json({ data: info });
    }
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
