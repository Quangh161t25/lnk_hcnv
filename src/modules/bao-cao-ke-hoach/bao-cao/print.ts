import dayjs from 'dayjs';
import { periodLabel } from '../ke-hoach/data';
import { SECTIONS, type Report, type ReportItem } from './data';

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const fmt = (d?: string) => (d ? dayjs(d).format('DD/MM/YYYY') : '');

/** Cột in cho từng phần A–D. */
function sectionTable(phan: ReportItem['phan'], rows: ReportItem[], nameOf: (ma?: string) => string) {
  const head: Record<string, string[]> = {
    A: ['STT', 'Công việc', 'Kết quả / Chỉ số', '% HT', 'Trọng số'],
    B: ['STT', 'Vấn đề phát sinh', 'Biện pháp', 'Đã xử lý'],
    C: ['STT', 'Đầu việc', 'Mục tiêu', 'Phụ trách', 'Thời hạn'],
    D: ['STT', 'Đề xuất', 'Nội dung trình bày'],
  };
  const cells = (i: ReportItem, k: number): unknown[] =>
    phan === 'A'
      ? [k + 1, i.noi_dung, i.ket_qua, `${i.phan_tram ?? 0}%`, i.trong_so ? `${i.trong_so}%` : '']
      : phan === 'B'
        ? [k + 1, i.noi_dung, i.ket_qua, i.da_xu_ly ? 'Đã xử lý' : 'Chưa']
        : phan === 'C'
          ? [k + 1, i.noi_dung, i.ket_qua, nameOf(i.phu_trach), fmt(i.han)]
          : [k + 1, i.noi_dung, i.ket_qua];
  if (!rows.length) return '<p class="empty">Không có nội dung.</p>';
  return `<table><thead><tr>${head[phan].map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((i, k) => `<tr>${cells(i, k).map((c, j) => `<td${j === 0 ? ' class="c"' : ''}>${esc(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

/** Trang HTML khổ A4 của một báo cáo (dùng cho In và Xuất Word). */
export function reportHtml(r: Report, opts: { companyName: string; nameOf: (ma?: string) => string }) {
  const sections = SECTIONS.map((s) => `<h3>${esc(s.title)}</h3>${sectionTable(s.key, r.items.filter((i) => i.phan === s.key), opts.nameOf)}`).join('');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(r.tieu_de)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: 'Times New Roman', serif; font-size: 13pt; color: #111; }
  .top { display: flex; justify-content: space-between; font-size: 11pt; }
  .top b { text-transform: uppercase; }
  h1 { text-align: center; font-size: 16pt; margin: 18px 0 4px; text-transform: uppercase; }
  .sub { text-align: center; font-style: italic; margin-bottom: 14px; }
  .info td { padding: 2px 8px 2px 0; border: none; }
  h3 { font-size: 13pt; margin: 16px 0 6px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #555; padding: 4px 6px; vertical-align: top; font-size: 12pt; }
  th { background: #eee; }
  td.c { text-align: center; width: 36px; }
  .empty { font-style: italic; color: #666; margin: 0; }
  .sign { display: flex; justify-content: space-around; margin-top: 36px; text-align: center; }
  .sign div { width: 40%; }
  .sign .name { margin-top: 70px; font-weight: bold; }
</style></head><body>
<div class="top"><b>${esc(opts.companyName)}</b><span>Ngày in: ${dayjs().format('DD/MM/YYYY')}</span></div>
<h1>${esc(r.loai === 'phong_ban' ? 'Báo cáo công việc phòng ban' : 'Báo cáo công việc cá nhân')}</h1>
<div class="sub">${esc(periodLabel(r, true, r))}</div>
<table class="info"><tbody>
  <tr><td>Tiêu đề:</td><td><b>${esc(r.tieu_de)}</b></td></tr>
  <tr><td>Phòng ban:</td><td>${esc(r.ten_phong_ban)}</td></tr>
  <tr><td>Người lập:</td><td>${esc(r.ten_nguoi_lap || r.nguoi_lap)} (${esc(r.nguoi_lap)})</td></tr>
  <tr><td>Mức hoàn thành:</td><td><b>${r.phan_tram ?? 0}%</b></td></tr>
  <tr><td>Trạng thái:</td><td>${esc(r.trang_thai === 'Đã gửi' ? 'Chờ duyệt' : r.trang_thai)}${r.tg_duyet ? ` – ${fmt(r.tg_duyet)}` : ''}</td></tr>
</tbody></table>
${sections}
${r.tom_tat ? `<h3>Tóm tắt / nhận xét chung</h3><p>${esc(r.tom_tat).replace(/\n/g, '<br>')}</p>` : ''}
${r.y_kien_duyet ? `<h3>Ý kiến người duyệt</h3><p>${esc(r.y_kien_duyet)}</p>` : ''}
<div class="sign">
  <div><b>Người lập</b><br><i>(Ký, ghi rõ họ tên)</i><div class="name">${esc(r.ten_nguoi_lap || r.nguoi_lap)}</div></div>
  <div><b>Trưởng phòng / Người duyệt</b><br><i>(Ký, ghi rõ họ tên)</i><div class="name">${esc(r.nguoi_duyet ? opts.nameOf(r.nguoi_duyet) : '')}</div></div>
</div>
</body></html>`;
}

/** Mở cửa sổ in. */
export function printHtml(html: string) {
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    w.focus();
    w.print();
  };
  return true;
}

/** Tải về file Word (.doc dạng HTML — Word mở được trực tiếp). */
export function downloadWord(html: string, fileName: string) {
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName}.doc`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
