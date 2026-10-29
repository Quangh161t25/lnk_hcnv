// /api/plans — Kế hoạch phòng ban & cá nhân (tab 20, 21). Luồng duyệt và phân quyền: xem _lib/workflow.js.
//
// GET                                    → { plans, me }
// POST { action: 'save', plan, items }   → tạo / sửa
// POST { action: 'submit' | 'delete', id }, { action: 'approve' | 'return', id, comment }
import { randomBytes } from 'node:crypto';
import { clip, workflowHandler } from './_lib/workflow.js';

export default workflowHandler({
  docs: 'plans',
  items: 'planItems',
  itemKey: 'ke_hoach_id',
  idPrefix: 'KH',
  module: 'bao-cao-ke-hoach/ke-hoach',
  noun: 'kế hoạch',
  periods: ['tuan', 'thang', 'quy'],
  assigneeKey: 'phu_trach',
  // Kế hoạch phòng ban đã duyệt cho mọi người xem để nhận việc.
  shareApprovedDept: true,
  docFields: (input) => ({ muc_tieu: clip(input.muc_tieu, 2000) }),
  buildItems: (items, docId) =>
    items
      .filter((i) => String(i?.ten_viec ?? '').trim())
      .map((i, idx) => ({
        ke_hoach_id: docId,
        stt: idx + 1,
        ten_viec: clip(i.ten_viec, 300),
        muc_tieu: clip(i.muc_tieu, 500),
        phu_trach: clip(i.phu_trach, 30),
        han: clip(i.han, 10),
        uu_tien: ['Cao', 'Trung bình', 'Thấp'].includes(i.uu_tien) ? i.uu_tien : 'Trung bình',
        trong_so: Math.max(0, Math.min(100, Number(i.trong_so) || 0)),
        ghi_chu: clip(i.ghi_chu, 500),
        id: i.id && String(i.id).startsWith(docId) ? i.id : `${docId}-${randomBytes(2).toString('hex')}`,
        nguon_id: clip(i.nguon_id, 60),
      })),
  validateItems: (items) => (items.length ? null : 'Kế hoạch cần ít nhất một đầu việc'),
});
