// /api/permissions — phân quyền Xem / Thêm / Sửa / Xóa theo nhân viên × module.
//
// GET  → { mine, isAdmin, rows? }   mine: quyền hiệu lực của người đang đăng nhập (module → {xem,them,sua,xoa});
//                                   rows: toàn bộ bảng (chỉ trả cho quản trị viên)
// PUT  { rows } → ghi đè cả bảng (chỉ quản trị viên)
import { loadRaw, saveTable } from './_lib/store.js';
import { readBody, readSession, route } from './_lib/google.js';
import { ACTIONS, effectiveMap } from './_lib/permissions.js';

export default route(async (req, res) => {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  const isAdmin = session.role === 'admin';

  if (req.method === 'GET') {
    const rows = await loadRaw('permissions');
    return res.status(200).json({ isAdmin, mine: isAdmin ? {} : effectiveMap(rows, session.sub), ...(isAdmin ? { rows } : {}) });
  }
  if (req.method === 'PUT') {
    if (!isAdmin) return res.status(403).json({ error: 'Chỉ quản trị viên mới được phân quyền' });
    const { rows } = readBody(req);
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    const seen = new Set();
    const clean = [];
    for (const r of rows.slice(0, 20000)) {
      const ma = String(r?.ma_nv ?? '').trim();
      const module = String(r?.module ?? '').trim();
      if (!ma || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(module)) continue;
      const id = `${ma.toLowerCase()}|${module}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const row = { id, ma_nv: ma, ho_ten: String(r.ho_ten ?? '').slice(0, 100), module, ten_module: String(r.ten_module ?? '').slice(0, 100) };
      for (const a of ACTIONS) row[a] = !!r[a];
      clean.push(row);
    }
    // Dòng mặc định lên đầu, rồi theo mã NV và module để dễ đọc trên Sheet.
    clean.sort((a, b) => (a.ma_nv === '*' ? -1 : b.ma_nv === '*' ? 1 : a.ma_nv.localeCompare(b.ma_nv)) || a.module.localeCompare(b.module));
    await saveTable('permissions', clean);
    const fresh = await loadRaw('permissions');
    return res.status(200).json({ isAdmin, mine: {}, rows: fresh });
  }
  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
});
