// POST /api/change-password  body { current, next }  (cần đăng nhập) — đổi mật khẩu của chính mình.
import { TABLES } from './_lib/tables.js';
import { loadRaw } from './_lib/store.js';
import { readBody, readSession, readValues, route, updateRange } from './_lib/google.js';

export default route(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  const { current, next } = readBody(req);
  if (!next || String(next).length < 6) return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });

  const rows = await loadRaw('employees');
  const emp = rows.find((r) => r.ma_nv.toLowerCase() === String(session.sub).toLowerCase());
  if (!emp) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
  if (String(current) !== (emp.mat_khau || '123456')) return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });

  // Chỉ sửa đúng ô mật khẩu của dòng nhân viên này.
  const { tab } = TABLES.employees;
  const values = await readValues(tab);
  const header = values[0] || [];
  const col = header.findIndex((h) => String(h).trim() === 'Mật khẩu');
  const idCol = header.findIndex((h) => String(h).trim() === 'Mã NV');
  const rowIdx = values.findIndex((r, i) => i > 0 && String(r[idCol] ?? '').toLowerCase() === emp.ma_nv.toLowerCase());
  if (col < 0 || rowIdx < 0) return res.status(500).json({ error: 'Không tìm thấy cột mật khẩu trên Sheet' });
  const letter = String.fromCharCode(65 + col);
  await updateRange(tab, `${letter}${rowIdx + 1}`, [[String(next)]]);
  return res.status(200).json({ ok: true });
});
