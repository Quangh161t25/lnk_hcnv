// GET  /api/table?name=departments  → { rows }      (cần đăng nhập)
// PUT  /api/table?name=departments  body { rows }   → ghi đè cả bảng (chỉ quản trị viên)
import { TABLES } from './_lib/tables.js';
import { loadTable, saveTable } from './_lib/store.js';
import { readBody, readSession, route } from './_lib/google.js';

export default route(async (req, res) => {
  const name = String(req.query?.name || '');
  const def = TABLES[name];
  if (!def) return res.status(404).json({ error: `Không có bảng "${name}"` });
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  const isAdmin = session.role === 'admin';

  if (req.method === 'GET') {
    return res.status(200).json({ rows: await loadTable(name, { includeSecrets: isAdmin }) });
  }
  if (req.method === 'PUT') {
    if (!isAdmin) return res.status(403).json({ error: 'Chỉ quản trị viên mới được thay đổi dữ liệu này' });
    const { rows } = readBody(req);
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    const ids = rows.map((r) => String(r?.[def.idKey] ?? '').trim().toLowerCase());
    if (ids.some((x) => !x)) return res.status(400).json({ error: 'Có dòng thiếu mã định danh' });
    if (new Set(ids).size !== ids.length) return res.status(400).json({ error: 'Có mã bị trùng, vui lòng kiểm tra lại' });
    await saveTable(name, rows.slice(0, 2000));
    return res.status(200).json({ rows: await loadTable(name, { includeSecrets: isAdmin }) });
  }
  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
});
