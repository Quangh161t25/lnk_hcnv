// Luồng lập → gửi duyệt → duyệt / trả lại dùng chung cho Kế hoạch và Báo cáo, kèm phân quyền theo từng dòng.
//
// Quy tắc:
//  - Trưởng phòng = Mã NV ở cột "Trưởng phòng (Mã NV)" của tab 2; quản lý phòng đó và mọi nhóm con.
//  - Xem: admin xem tất cả; người khác xem bản của mình, bản thuộc phòng mình quản lý, bản có dòng giao cho mình,
//    và bản cấp PHÒNG BAN đã duyệt (cấu hình được).
//  - Sửa / gửi / xóa: người lập, khi còn Nháp hoặc bị Trả lại (admin xóa được mọi bản).
//  - Duyệt / trả lại: admin hoặc trưởng phòng quản lý phòng của bản — không tự duyệt bản của chính mình.
import { randomBytes } from 'node:crypto';
import { loadRaw, loadTable, saveTable } from './store.js';
import { readBody, readSession, route } from './google.js';

export const STATUS = { draft: 'Nháp', sent: 'Đã gửi', approved: 'Đã duyệt', returned: 'Trả lại' };
const EDITABLE = new Set([STATUS.draft, STATUS.returned]);
export const now = () => new Date().toISOString();
export const clip = (v, n = 1000) => String(v ?? '').slice(0, n);
export const newId = (prefix) => `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(3).toString('hex')}`;

/** Tập phòng ban mà `ma_nv` quản lý (phòng có tên mình ở cột Trưởng phòng + toàn bộ nhóm con). */
export function managedDepartments(departments, maNv) {
  const me = String(maNv).toLowerCase();
  const children = new Map();
  for (const d of departments) {
    if (!d.cha_id) continue;
    if (!children.has(d.cha_id)) children.set(d.cha_id, []);
    children.get(d.cha_id).push(d.id);
  }
  const out = new Set();
  const walk = (id) => {
    if (out.has(id)) return;
    out.add(id);
    for (const c of children.get(id) ?? []) walk(c);
  };
  for (const d of departments) {
    const heads = String(d.truong_phong || '').split(/[,;\s]+/).filter(Boolean).map((x) => x.toLowerCase());
    if (heads.includes(me)) walk(d.id);
  }
  return out;
}

/**
 * Tạo handler cho một loại tài liệu.
 * cfg: { docs, items, itemKey, idPrefix, noun, periods, assigneeKey, buildItems(items, docId, randomBytes), validateItems(items), enrich(doc, items) }
 */
export function workflowHandler(cfg) {
  const { noun } = cfg;
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);

  async function context(session) {
    const [docs, items, departments] = await Promise.all([loadTable(cfg.docs), loadRaw(cfg.items), loadTable('departments')]);
    const isAdmin = session.role === 'admin';
    const managed = managedDepartments(departments, session.sub);
    const sub = String(session.sub).toLowerCase();
    const mine = (d) => String(d.nguoi_lap).toLowerCase() === sub;
    const canView = (d, its) =>
      isAdmin ||
      mine(d) ||
      managed.has(d.phong_ban_id) ||
      (cfg.shareApprovedDept && d.loai === 'phong_ban' && d.trang_thai === STATUS.approved) ||
      (cfg.assigneeKey ? its.some((i) => String(i[cfg.assigneeKey]).toLowerCase() === sub) : false);
    const canApprove = (d) => (isAdmin || managed.has(d.phong_ban_id)) && !mine(d);
    const canEdit = (d) => (mine(d) || isAdmin) && EDITABLE.has(d.trang_thai);
    return { docs, items, departments, isAdmin, managed, mine, canView, canApprove, canEdit };
  }

  function view(ctx, session) {
    const byDoc = new Map();
    for (const i of ctx.items) {
      if (!byDoc.has(i[cfg.itemKey])) byDoc.set(i[cfg.itemKey], []);
      byDoc.get(i[cfg.itemKey]).push(i);
    }
    const list = ctx.docs
      .map((d) => ({ ...d, items: byDoc.get(d.id) ?? [] }))
      .filter((d) => ctx.canView(d, d.items))
      .map((d) => ({ ...d, quyen: { sua: ctx.canEdit(d), duyet: ctx.canApprove(d) && d.trang_thai === STATUS.sent } }));
    return { [cfg.docs]: list, me: { ma_nv: session.sub, role: session.role, quan_ly: [...ctx.managed] } };
  }

  async function persist(ctx) {
    // Ghi chi tiết trước, danh sách sau: lỗi giữa chừng chỉ để lại dòng chi tiết thừa, không mất tài liệu.
    await saveTable(cfg.items, ctx.items);
    await saveTable(cfg.docs, ctx.docs);
  }

  return route(async (req, res) => {
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
    const ctx = await context(session);

    if (req.method === 'GET') return res.status(200).json(view(ctx, session));
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = readBody(req);
    const fail = (code, error) => res.status(code).json({ error });
    const find = (id) => ctx.docs.find((d) => d.id === id);

    if (body.action === 'save') {
      const input = body.doc ?? body.plan ?? {};
      const existing = input.id ? find(input.id) : null;
      if (input.id && !existing) return fail(404, `Không tìm thấy ${noun}`);
      if (existing && !ctx.canEdit(existing)) return fail(403, `Chỉ người lập được sửa, và chỉ khi ${noun} còn Nháp hoặc bị Trả lại`);

      const loai = input.loai === 'phong_ban' ? 'phong_ban' : 'ca_nhan';
      const phongBan = ctx.departments.find((d) => d.id === input.phong_ban_id);
      if (!phongBan) return fail(400, 'Vui lòng chọn phòng ban');
      if (loai === 'phong_ban' && !ctx.isAdmin && !ctx.managed.has(phongBan.id)) return fail(403, `Chỉ trưởng phòng mới lập được ${noun} cho phòng ban này`);
      if (!cfg.periods.includes(input.loai_ky)) return fail(400, `Kỳ ${noun} không hợp lệ`);
      if (!input.tu_ngay || !input.den_ngay) return fail(400, 'Thiếu thời gian của kỳ');

      const docId = existing?.id ?? newId(cfg.idPrefix);
      const items = cfg.buildItems(Array.isArray(body.items) ? body.items : [], docId);
      const itemError = cfg.validateItems(items);
      if (itemError) return fail(400, itemError);

      const emps = await loadRaw('employees');
      const owner = existing ? existing.nguoi_lap : session.sub;
      const doc = {
        ...(existing ?? {}),
        ...cfg.docFields(input),
        id: docId,
        tieu_de: clip(input.tieu_de, 200),
        loai,
        loai_ky: input.loai_ky,
        nam: Number(input.nam) || new Date().getFullYear(),
        so_ky: Number(input.so_ky) || 1,
        tu_ngay: clip(input.tu_ngay, 10),
        den_ngay: clip(input.den_ngay, 10),
        phong_ban_id: phongBan.id,
        nguoi_lap: owner,
        ten_nguoi_lap: emps.find((e) => e.ma_nv.toLowerCase() === String(owner).toLowerCase())?.ho_ten ?? '',
        trang_thai: existing?.trang_thai === STATUS.returned ? STATUS.returned : STATUS.draft,
        tg_tao: existing?.tg_tao ?? now(),
        tg_cap_nhat: now(),
      };
      Object.assign(doc, cfg.enrich?.(doc, items) ?? {});
      ctx.docs = existing ? ctx.docs.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...ctx.docs];
      ctx.items = [...ctx.items.filter((i) => i[cfg.itemKey] !== doc.id), ...items];
      await persist(ctx);
      return res.status(200).json({ id: doc.id, ...view(ctx, session) });
    }

    const doc = find(String(body.id ?? ''));
    if (!doc) return fail(404, `Không tìm thấy ${noun}`);

    if (body.action === 'submit') {
      if (!ctx.canEdit(doc)) return fail(403, `Chỉ người lập được gửi duyệt khi ${noun} còn Nháp hoặc bị Trả lại`);
      Object.assign(doc, { trang_thai: STATUS.sent, tg_gui: now(), tg_cap_nhat: now() });
    } else if (body.action === 'approve' || body.action === 'return') {
      if (doc.trang_thai !== STATUS.sent) return fail(400, `${Noun} chưa được gửi duyệt`);
      if (!ctx.canApprove(doc)) return fail(403, `Bạn không có quyền duyệt ${noun} này`);
      if (body.action === 'return' && !String(body.comment ?? '').trim()) return fail(400, 'Vui lòng nhập lý do trả lại');
      Object.assign(doc, {
        trang_thai: body.action === 'approve' ? STATUS.approved : STATUS.returned,
        nguoi_duyet: session.sub,
        y_kien_duyet: clip(body.comment, 1000),
        tg_duyet: now(),
        tg_cap_nhat: now(),
      });
    } else if (body.action === 'delete') {
      if (!ctx.isAdmin && !(ctx.mine(doc) && EDITABLE.has(doc.trang_thai))) return fail(403, `Chỉ xóa được ${noun} của mình khi còn Nháp hoặc bị Trả lại`);
      ctx.docs = ctx.docs.filter((d) => d.id !== doc.id);
      ctx.items = ctx.items.filter((i) => i[cfg.itemKey] !== doc.id);
    } else {
      return fail(400, 'Thao tác không hợp lệ');
    }
    await persist(ctx);
    return res.status(200).json(view(ctx, session));
  });
}
