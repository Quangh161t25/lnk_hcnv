// GET  /api/table?name=departments  → { rows }      (cần đăng nhập; dữ liệu tra cứu dùng chung)
// PUT  /api/table?name=departments  body { rows }   → ghi đè cả bảng
//
// Ghi: quản trị viên toàn quyền. Nhân viên khác cần quyền trên module tương ứng (tab 25):
// dòng mới → Thêm, dòng thay đổi → Sửa, dòng bị bỏ → Xóa. Các cột nhạy cảm (vai trò, mật khẩu, trưởng phòng)
// chỉ quản trị viên được đổi; bảng vai trò chỉ quản trị viên được ghi.
import { TABLES } from './_lib/tables.js';
import { loadTable, saveTable } from './_lib/store.js';
import { readBody, readSession, route } from './_lib/google.js';
import { ACTION_LABEL, permChecker } from './_lib/permissions.js';

/** Bảng → module quản lý bảng đó (khóa "phân hệ/slug" như trên giao diện). null = chỉ quản trị viên. */
const TABLE_MODULES = {
  employees: ['he-thong/nhan-vien', 'nhan-su/nhan-vien'],
  departments: ['he-thong/phong-ban'],
  positions: ['he-thong/chuc-vu'],
  jobLevels: ['he-thong/cap-bac'],
  branches: ['he-thong/chi-nhanh'],
  deadlines: ['bao-cao-ke-hoach/thiet-lap'],
  roles: null,
};
/** Cột chỉ quản trị viên được thay đổi (đổi được là leo thang quyền). */
const ADMIN_ONLY_COLUMNS = { employees: ['vai_tro', 'mat_khau'], departments: ['truong_phong'] };

const key = (def, r) => String(r?.[def.idKey] ?? '').trim().toLowerCase();
// So các cột lưu trên Sheet + cha_id (phòng cấp trên được suy ra từ cột Cấu trúc phân cấp).
const same = (def, a, b) =>
  [...def.columns.filter((c) => !c.secret).map((c) => c.key), ...('cha_id' in a ? ['cha_id'] : [])].every((k) => JSON.stringify(a[k] ?? '') === JSON.stringify(b[k] ?? ''));

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
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rows } = readBody(req);
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  const ids = rows.map((r) => key(def, r));
  if (ids.some((x) => !x)) return res.status(400).json({ error: 'Có dòng thiếu mã định danh' });
  if (new Set(ids).size !== ids.length) return res.status(400).json({ error: 'Có mã bị trùng, vui lòng kiểm tra lại' });

  let toSave = rows.slice(0, 2000);
  if (!isAdmin) {
    const modules = TABLE_MODULES[name];
    if (!modules) return res.status(403).json({ error: 'Chỉ quản trị viên mới được thay đổi dữ liệu này' });
    const can = await permChecker(session);
    const current = await loadTable(name, { includeSecrets: true });
    const byId = new Map(current.map((r) => [key(def, r), r]));
    const added = toSave.filter((r) => !byId.has(key(def, r)));
    const changed = toSave.filter((r) => byId.has(key(def, r)) && !same(def, byId.get(key(def, r)), r));
    const removed = current.length - (toSave.length - added.length);
    const need = [...(added.length ? ['them'] : []), ...(changed.length ? ['sua'] : []), ...(removed > 0 ? ['xoa'] : [])];
    const missing = need.filter((a) => !can(modules, a));
    if (missing.length) return res.status(403).json({ error: `Bạn không có quyền ${missing.map((a) => ACTION_LABEL[a]).join(', ')} dữ liệu này` });

    // Giữ nguyên các cột nhạy cảm; dòng mới nhận giá trị an toàn.
    const locked = ADMIN_ONLY_COLUMNS[name] ?? [];
    toSave = toSave.map((r) => {
      const old = byId.get(key(def, r));
      const out = { ...r };
      for (const col of locked) out[col] = old ? old[col] : col === 'vai_tro' ? 'member' : col === 'mat_khau' ? '' : '';
      return out;
    });
  }

  await saveTable(name, toSave);
  return res.status(200).json({ rows: await loadTable(name, { includeSecrets: isAdmin }) });
});

