// Quyền Xem / Thêm / Sửa / Xóa của từng nhân viên trên từng module (tab "25. PhanQuyen_NhanVien").
//
// Quyền hiệu lực của (nhân viên, module) = dòng riêng của nhân viên đó, nếu không có thì dòng mặc định "*",
// nếu cũng không có thì toàn quyền (để module mới thêm vẫn dùng được cho tới khi quản trị viên giới hạn).
// Quản trị viên (vai trò admin) luôn toàn quyền.
import { loadRaw } from './store.js';

export const ACTIONS = ['xem', 'them', 'sua', 'xoa'];
export const FULL = { xem: true, them: true, sua: true, xoa: true };
export const ACTION_LABEL = { xem: 'xem', them: 'thêm', sua: 'sửa', xoa: 'xóa' };

export function effective(rows, maNv, module) {
  const me = String(maNv).toLowerCase();
  const own = rows.find((r) => String(r.ma_nv).toLowerCase() === me && r.module === module);
  const def = rows.find((r) => r.ma_nv === '*' && r.module === module);
  const src = own ?? def;
  return src ? { xem: !!src.xem, them: !!src.them, sua: !!src.sua, xoa: !!src.xoa } : { ...FULL };
}

/** Bộ kiểm tra quyền cho phiên đăng nhập: can(module | module[], action) — nhiều module thì chỉ cần một module có quyền. */
export async function permChecker(session) {
  if (session.role === 'admin') return () => true;
  const rows = await loadRaw('permissions');
  return (modules, action) => [].concat(modules).some((m) => effective(rows, session.sub, m)[action]);
}

/** Toàn bộ quyền hiệu lực của một nhân viên trên các module có trong bảng. */
export function effectiveMap(rows, maNv) {
  const modules = new Set(rows.map((r) => r.module));
  const out = {};
  for (const m of modules) out[m] = effective(rows, maNv, m);
  return out;
}
