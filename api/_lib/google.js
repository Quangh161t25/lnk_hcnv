// Tiện ích dùng chung cho các API (thư mục _lib không được Vercel coi là route).
// Khóa service account chỉ đọc từ biến môi trường phía server.
import { createHmac, createHash, createSign, timingSafeEqual } from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

/* ---------- Google OAuth (service account JWT) ---------- */

let cached = null;
function privateKey() {
  return (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/\r/g, '');
}
async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt > now + 60) return cached.token;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = privateKey();
  if (!email || !key) throw new Error('Thiếu biến môi trường GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY');
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ iss: email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(key).toString('base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${payload}.${sig}` }),
  });
  if (!res.ok) throw new Error(`Không cấp được token Google (${res.status})`);
  const data = await res.json();
  cached = { token: data.access_token, expiresAt: now + (data.expires_in || 3600) };
  return cached.token;
}

export async function sheets(path, init = {}) {
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

const rangeOf = (title, r) => encodeURIComponent(`'${title}'!${r}`);

// Google giới hạn 60 lượt đọc/phút: nhớ các tab đã biết là tồn tại, và cache kết quả đọc vài giây
// (nhiều API gọi gần nhau như mở trang Chức vụ cần đọc cả tab phòng ban, cấp bậc).
const knownTabs = new Set();
const readCache = new Map();
const CACHE_MS = 5000;

/** Tạo tab nếu chưa có. Trả về true nếu vừa tạo mới. */
export async function ensureSheet(title) {
  if (knownTabs.has(title)) return false;
  const meta = await sheets('?fields=sheets.properties.title');
  for (const s of meta.sheets ?? []) knownTabs.add(s.properties.title);
  if (knownTabs.has(title)) return false;
  await sheets(':batchUpdate', { method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] }) });
  knownTabs.add(title);
  return true;
}

/** Đọc nhiều tab trong MỘT lượt gọi API. Trả về { [tên tab]: giá trị (kể cả dòng tiêu đề) }. */
export async function readMany(titles) {
  const out = {};
  const need = [];
  for (const t of titles) {
    const c = readCache.get(t);
    if (c && Date.now() - c.at < CACHE_MS) out[t] = c.values;
    else need.push(t);
  }
  if (need.length) {
    for (const t of need) await ensureSheet(t);
    const qs = need.map((t) => `ranges=${rangeOf(t, 'A1:Z5000')}`).join('&');
    const data = await sheets(`/values:batchGet?${qs}`);
    need.forEach((t, i) => {
      const values = data.valueRanges?.[i]?.values || [];
      readCache.set(t, { values, at: Date.now() });
      out[t] = values;
    });
  }
  return out;
}

/** Đọc toàn bộ giá trị (kể cả dòng tiêu đề) của một tab. */
export async function readValues(title) {
  return (await readMany([title]))[title];
}

/** Ghi đè toàn bộ tab bằng `values` (dòng đầu là tiêu đề), xóa phần thừa phía dưới. */
export async function replaceValues(title, values) {
  await ensureSheet(title);
  readCache.delete(title);
  await sheets(`/values/${rangeOf(title, 'A1:Z5000')}:clear`, { method: 'POST', body: '{}' });
  if (values.length) await sheets(`/values/${rangeOf(title, `A1:Z${values.length}`)}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values }) });
}

/** Ghi một ô / một dải nhỏ. */
export async function updateRange(title, a1, values) {
  readCache.delete(title);
  await sheets(`/values/${rangeOf(title, a1)}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values }) });
}

/* ---------- Phiên đăng nhập (token ký HMAC, không lưu trên server) ---------- */

const SESSION_DAYS = 7;
function secret() {
  // Có AUTH_SECRET thì dùng; không thì suy ra từ private key (đổi khóa = mọi phiên cũ hết hạn).
  return process.env.AUTH_SECRET || createHash('sha256').update(`session:${privateKey()}`).digest('hex');
}

export function signSession(user) {
  const payload = b64url(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400 }));
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function readSession(req) {
  const auth = req.headers?.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', secret()).update(payload).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() / 1000 ? data : null;
  } catch {
    return null;
  }
}

/* ---------- HTTP ---------- */

export function readBody(req) {
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return req.body || {};
}

/** Bọc handler: trả JSON, bắt lỗi, không cache. */
export const route = (fn) => async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await fn(req, res);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
};
