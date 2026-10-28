// POST /api/login   body { account, password }  → { token, employee }
// Mật khẩu được so sánh tại server với cột "Mật khẩu" của tab 1. NhanSu_DanhSach; không bao giờ trả mật khẩu về.
import { loadRaw } from './_lib/store.js';
import { readBody, route, signSession } from './_lib/google.js';

export default route(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { account, password } = readBody(req);
  const q = String(account || '').trim().toLowerCase();
  if (!q || !password) return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu' });

  const rows = await loadRaw('employees');
  const emp = rows.find((r) => r.email.toLowerCase() === q || r.ma_nv.toLowerCase() === q);
  // Cùng một thông báo cho cả hai trường hợp để không lộ tài khoản nào tồn tại.
  if (!emp || String(password) !== (emp.mat_khau || '123456')) {
    return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
  }
  if (emp.trang_thai === 'da_nghi_viec') return res.status(403).json({ error: 'Tài khoản đã ngừng hoạt động' });

  const { mat_khau: _secret, ...employee } = emp;
  const token = signSession({ sub: emp.ma_nv, role: emp.vai_tro, name: emp.ho_ten });
  return res.status(200).json({ token, employee });
});
