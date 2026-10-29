// /api/reports — Báo cáo phòng ban & cá nhân theo tuần / tháng (tab 22, 23). Luồng duyệt và phân quyền: xem _lib/workflow.js.
//
// GET                                    → { reports, me }
// POST { action: 'save', doc, items }    → tạo / sửa
// POST { action: 'submit' | 'delete', id }, { action: 'approve' | 'return', id, comment }
//
// Mỗi dòng chi tiết thuộc một phần:
//   A. Kết quả công việc (noi_dung = việc, ket_qua = kết quả, phan_tram, trong_so, nguon_id = đầu việc kế hoạch)
//   B. Vấn đề & biện pháp (noi_dung = vấn đề, ket_qua = biện pháp, da_xu_ly)
//   C. Kế hoạch kỳ tiếp theo (noi_dung = đầu việc, ket_qua = mục tiêu, phu_trach, han)
//   D. Đề xuất cải tiến (noi_dung = đề xuất, ket_qua = nội dung trình bày)
import { randomBytes } from 'node:crypto';
import { clip, workflowHandler } from './_lib/workflow.js';

const pct = (v) => Math.max(0, Math.min(100, Number(v) || 0));

/** % hoàn thành của báo cáo = trung bình phần A, có trọng số nếu đã nhập trọng số. */
export function completion(items) {
  const a = items.filter((i) => i.phan === 'A');
  if (!a.length) return 0;
  const w = a.reduce((s, i) => s + (Number(i.trong_so) || 0), 0);
  const v = w > 0 ? a.reduce((s, i) => s + pct(i.phan_tram) * (Number(i.trong_so) || 0), 0) / w : a.reduce((s, i) => s + pct(i.phan_tram), 0) / a.length;
  return Math.round(v);
}

export default workflowHandler({
  docs: 'reports',
  items: 'reportItems',
  itemKey: 'bao_cao_id',
  idPrefix: 'BC',
  module: 'bao-cao-ke-hoach/bao-cao',
  noun: 'báo cáo',
  periods: ['tuan', 'thang'],
  docFields: (input) => ({ tom_tat: clip(input.tom_tat, 3000), ke_hoach_id: clip(input.ke_hoach_id, 60) }),
  buildItems: (items, docId) => {
    const count = { A: 0, B: 0, C: 0, D: 0 };
    return items
      .filter((i) => ['A', 'B', 'C', 'D'].includes(i?.phan) && String(i?.noi_dung ?? '').trim())
      .map((i) => ({
        bao_cao_id: docId,
        phan: i.phan,
        stt: ++count[i.phan],
        noi_dung: clip(i.noi_dung, 500),
        ket_qua: clip(i.ket_qua, 1000),
        phan_tram: i.phan === 'A' ? pct(i.phan_tram) : null,
        trong_so: i.phan === 'A' ? pct(i.trong_so) : null,
        phu_trach: i.phan === 'C' ? clip(i.phu_trach, 30) : '',
        han: i.phan === 'C' ? clip(i.han, 10) : '',
        da_xu_ly: i.phan === 'B' ? !!i.da_xu_ly : false,
        ghi_chu: clip(i.ghi_chu, 500),
        nguon_id: i.phan === 'A' ? clip(i.nguon_id, 60) : '',
        id: i.id && String(i.id).startsWith(docId) ? i.id : `${docId}-${randomBytes(2).toString('hex')}`,
      }));
  },
  validateItems: (items) => (items.some((i) => i.phan === 'A') ? null : 'Báo cáo cần ít nhất một kết quả công việc ở phần A'),
  enrich: (_doc, items) => ({ phan_tram: completion(items) }),
});
