// Trợ lý AI — bộ tra cứu số liệu thật trên Google Sheet.
//
// Mỗi câu hỏi được quy về một truy vấn có cấu trúc { loai, ma_nv, ten_nhan_vien, phong_ban, toan_cong_ty, thang, nam, ... }:
//   - parseQuestion(): tự nhận diện bằng từ khóa (chạy được không cần API AI nào);
//   - hoặc Gemini gọi hàm (api/ai.js) với cùng các tham số.
// runQuery() đọc tab tương ứng, áp quyền (Hệ thống › Phân quyền + chỉ dữ liệu của chính mình nếu không phải admin)
// rồi trả về câu trả lời dạng markdown kèm tên tab nguồn.
import { readMany, readValues } from './google.js';
import { loadRaw } from './store.js';
import { permChecker } from './permissions.js';

export const TABS = {
  phieu: '4. PhieuHanhChinh',
  chamCong: '5. NhatKy_ChamCong',
  luong: '6. BangLuong_ChiTiet',
  taiLieu: '9. TaiLieu_CongVan',
  nhanVien: '1. NhanSu_DanhSach',
  congTy: '16. ThongTin_CongTy',
};

// Module (Hệ thống › Phân quyền) cần quyền Xem để tra cứu từng loại dữ liệu.
const MODULES = {
  cham_cong: ['hanh-chinh/cham-cong', 'hanh-chinh/tong-hop-cham-cong'],
  luong: ['hanh-chinh/bang-luong'],
  phieu: ['hanh-chinh/phieu-hanh-chinh'],
  tai_lieu: ['hanh-chinh/danh-sach-tai-lieu'],
  nhan_vien: ['nhan-su/nhan-vien', 'he-thong/nhan-vien'],
};

const LOAI_TAI_LIEU = {
  'ltl-1': 'Công văn', 'ltl-2': 'Quyết định', 'ltl-3': 'Báo cáo', 'ltl-4': 'Hợp đồng',
  'ltl-5': 'Thông báo', 'ltl-6': 'Tờ trình', 'ltl-7': 'Biên bản', 'ltl-8': 'Báo cáo tài chính',
};
const PHONG_BAN_TAI_LIEU = {
  'dep-0': 'Ban Giám đốc', 'dep-1': 'Phòng Kỹ thuật', 'dep-2': 'Phòng Nhân sự', 'dep-3': 'Phòng Tài chính - Kế toán',
  'dep-4': 'Phòng Kinh doanh', 'dep-5': 'Phòng Kho', 'dep-6': 'Phòng Marketing', 'dep-7': 'Phòng Hành chính',
};

/** Bỏ dấu, chữ thường — để so khớp tiếng Việt gõ có dấu hoặc không dấu. */
export const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const toNum = (v) => {
  const n = Number(String(v ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const hours = (v) => Number(String(v ?? '').replace(',', '.')) || 0;
const money = (v) => `${toNum(v).toLocaleString('vi-VN')} đ`;
const fmtNum = (n) => (Math.round(n * 100) / 100).toLocaleString('vi-VN');
const fmtDate = (s) => {
  const m = String(s ?? '').match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}${m[4]}` : String(s ?? '');
};
const cell = (v) => String(v ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
function table(head, rows) {
  if (!rows.length) return '';
  return [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n');
}

/** Đổi mảng dòng (dòng đầu là tiêu đề) thành object theo tên cột. */
function objects(values) {
  const [head = [], ...rows] = values ?? [];
  return rows
    .filter((r) => r.some((c) => String(c ?? '').trim()))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// ───────────────────────── Nhận diện câu hỏi (không cần AI) ─────────────────────────

const PATTERNS = {
  cong_ty: /\bcong ty\b.*\b(thanh lap|ma so thue|mst|dia chi|tru so|hotline|tong dai|email|website|dai dien|giam doc|tai khoan|ngan hang|linh vuc)\b|\b(ma so thue|tru so)\b/,
  tai_lieu: /\b(cong van|tai lieu|van ban|quyet dinh|to trinh|bien ban|so hieu)\b/,
  phieu: /\b(phieu|don xin|don nghi|de xuat|cho duyet|da duyet|bi tu choi|phe duyet|cong tac)\b/,
  luong: /\b(luong|thuc linh|thu nhap|thuong|khau tru|bhxh|bhyt|bhtn|thue tncn|phu cap)\b/,
  cham_cong: /\b(cong|cham cong|ngay cong|bang cong|di muon|di tre|muon|tre|ve som|ot|lam them|tang ca|gio lam|nghi phep|nghi|check ?in|check ?out|vang)\b/,
  nhan_vien: /\b(nhan vien|nhan su|phong ban|chuc vu|email|so dien thoai|sdt|bao nhieu nguoi|la ai|ngay vao lam|lien he|tham nien)\b/,
};

function detectFocus(q) {
  if (/\b(di muon|di tre|muon|tre)\b/.test(q)) return 'di_muon';
  if (/\bve som\b/.test(q)) return 've_som';
  if (/\b(ot|lam them|tang ca)\b/.test(q)) return 'ot';
  if (/\b(nghi|vang)\b/.test(q)) return 'nghi';
  return 'tong';
}

function detectPeriod(q, today = new Date()) {
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  if (/\bthang nay\b/.test(q)) return { thang: m, nam: y };
  if (/\bthang truoc\b/.test(q)) return m === 1 ? { thang: 12, nam: y - 1 } : { thang: m - 1, nam: y };
  let r = q.match(/\b(\d{4})[-/](\d{1,2})\b/);
  if (r) return { thang: +r[2], nam: +r[1] };
  r = q.match(/\bthang\s*(\d{1,2})(?:\s*(?:[/-]|nam)\s*(\d{4}))?/);
  if (r && +r[1] >= 1 && +r[1] <= 12) return { thang: +r[1], nam: r[2] ? +r[2] : undefined };
  if (/\bnam nay\b/.test(q)) return { nam: y };
  r = q.match(/\bnam\s*(\d{4})\b/);
  if (r) return { nam: +r[1] };
  return {};
}

/** Quy câu hỏi tiếng Việt về truy vấn có cấu trúc. employees: danh sách tab 1 (để nhận ra tên / phòng ban). */
export function parseQuestion(text, employees) {
  const q = norm(text);
  const out = { ...detectPeriod(q) };

  const code = text.match(/\b([A-Za-z]{2,3}\d{2,4})\b/);
  if (code && employees.some((e) => norm(e.ma_nv) === norm(code[1]))) out.ma_nv = code[1].toUpperCase();
  if (!out.ma_nv) {
    // Ưu tiên họ tên đầy đủ, sau đó tới tên + tên đệm (2 chữ cuối).
    const full = employees.find((e) => e.ho_ten && q.includes(norm(e.ho_ten)));
    const short = full ?? employees.find((e) => norm(e.ho_ten).split(' ').length > 2 && q.includes(norm(e.ho_ten).split(' ').slice(-2).join(' ')));
    if (short) out.ten_nhan_vien = short.ho_ten;
  }
  if (!out.ma_nv && !out.ten_nhan_vien) {
    const depts = [...new Set(employees.map((e) => e.phong_ban).filter(Boolean))];
    const hit = depts.find((d) => {
      const n = norm(d);
      const core = n.replace(/^(khoi|phong|ban|bo phan|nhom)\s+/, '');
      return q.includes(n) || (core.length > 2 && q.includes(core) && /\b(phong|khoi|ban|bo phan|nhom)\b/.test(q));
    });
    if (hit) out.phong_ban = hit;
    else if (/\b(toan cong ty|ca cong ty|tat ca|moi nguoi|toan bo|cac phong)\b/.test(q)) out.toan_cong_ty = true;
  }

  if (PATTERNS.cong_ty.test(q)) out.loai = 'cong_ty';
  else if (PATTERNS.tai_lieu.test(q)) {
    out.loai = 'tai_lieu';
    out.tu_khoa = q
      .replace(/\b(tim|tra cuu|cho toi|xem|danh sach|co|nao|khong|ve|cac|nhung|gi|cong van|tai lieu|van ban|lien quan|den|toi|minh|hay|giup|so hieu|di|dang)\b/g, ' ')
      .replace(/[?.,!]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } else if (PATTERNS.phieu.test(q)) {
    out.loai = 'phieu';
    if (/\bnghi phep\b|\bnghi\b/.test(q)) out.loai_phieu = 'Nghỉ phép';
    else if (/\b(ot|lam them)\b/.test(q)) out.loai_phieu = 'Làm thêm giờ';
    else if (/\bcong tac\b/.test(q)) out.loai_phieu = 'Công tác';
    else if (/\b(muon|ve som)\b/.test(q)) out.loai_phieu = 'Đi muộn về sớm';
    // "đã duyệt chưa?" là hỏi trạng thái → liệt kê tất cả, không lọc.
    const asking = /\bda duyet chua\b/.test(q);
    if (/\b(cho duyet|chua duyet)\b/.test(q) && !asking) out.trang_thai = 'Chờ duyệt';
    else if (/\bda duyet\b/.test(q) && !asking) out.trang_thai = 'Đã duyệt';
  } else if (PATTERNS.luong.test(q)) out.loai = 'luong';
  // "công ty", "công việc", "khối công nghệ"… không phải hỏi về ngày công.
  else if (PATTERNS.cham_cong.test(q.replace(/\bcong (ty|tac|viec|nghe|van)\b/g, ' '))) {
    out.loai = 'cham_cong';
    out.trong_tam = detectFocus(q);
  } else if (PATTERNS.nhan_vien.test(q) || out.ma_nv || out.ten_nhan_vien) {
    out.loai = 'nhan_vien';
    if (/\b(toi|minh)\b/.test(q)) out.ban_than = true;
  } else if (/\b(bao lau|tham nien|vao lam)\b/.test(q)) {
    out.loai = 'nhan_vien';
    out.ban_than = true;
  }
  else out.loai = 'khong_ro';
  return out;
}

// ───────────────────────── Thực thi truy vấn ─────────────────────────

/** Ngữ cảnh của người hỏi: quyền + danh sách nhân viên. Dùng lại cho nhiều truy vấn trong cùng một câu hỏi. */
export async function createContext(session) {
  const [employees, can] = await Promise.all([loadRaw('employees'), permChecker(session)]);
  const me = employees.find((e) => norm(e.ma_nv) === norm(session.sub));
  return { session, isAdmin: session.role === 'admin', can, employees: employees.map(({ mat_khau: _s, ...e }) => e), me };
}

/** Xác định nhóm nhân viên được hỏi, rồi giới hạn theo quyền. */
function resolveTargets(query, ctx) {
  const { employees, me, isAdmin } = ctx;
  let targets;
  let label;
  if (query.ma_nv) {
    targets = employees.filter((e) => norm(e.ma_nv) === norm(query.ma_nv));
    label = targets[0] ? `${targets[0].ho_ten} (${targets[0].ma_nv})` : query.ma_nv;
  } else if (query.ten_nhan_vien) {
    const n = norm(query.ten_nhan_vien);
    targets = employees.filter((e) => norm(e.ho_ten) === n);
    if (!targets.length) targets = employees.filter((e) => norm(e.ho_ten).includes(n));
    label = targets.length === 1 ? `${targets[0].ho_ten} (${targets[0].ma_nv})` : query.ten_nhan_vien;
  } else if (query.phong_ban) {
    const n = norm(query.phong_ban);
    targets = employees.filter((e) => norm(e.phong_ban).includes(n) || n.includes(norm(e.phong_ban)));
    label = targets[0]?.phong_ban ?? query.phong_ban;
  } else if (query.toan_cong_ty) {
    targets = employees;
    label = 'toàn công ty';
  } else {
    targets = me ? [me] : [];
    label = me ? `bạn (${me.ma_nv})` : 'bạn';
  }
  if (!targets.length) return { error: `Không tìm thấy nhân viên/phòng ban "${label}" trong danh sách nhân sự.` };
  // Không phải quản trị viên: chỉ dữ liệu của chính mình.
  if (!isAdmin && targets.some((e) => e.ma_nv !== me?.ma_nv)) {
    const self = targets.filter((e) => e.ma_nv === me?.ma_nv);
    if (!self.length) return { error: 'Bạn chỉ được tra cứu dữ liệu của chính mình. Quản trị viên mới xem được dữ liệu của người khác.' };
    targets = self;
    label = `bạn (${me.ma_nv}) — chỉ hiển thị dữ liệu của chính bạn`;
  }
  return { targets, label, codes: new Set(targets.map((e) => norm(e.ma_nv))) };
}

const ym = (date) => {
  const m = String(date ?? '').match(/^(\d{4})-(\d{2})/);
  return m ? { nam: +m[1], thang: +m[2] } : null;
};
function inPeriod(date, query) {
  const p = ym(date);
  if (!p) return false;
  if (query.nam && p.nam !== +query.nam) return false;
  if (query.thang && p.thang !== +query.thang) return false;
  return true;
}
const periodLabel = (q) => (q.thang ? `tháng ${q.thang}/${q.nam}` : q.nam ? `năm ${q.nam}` : 'mọi thời gian');

/** Không nói kỳ → lấy tháng gần nhất có dữ liệu (dữ liệu thường chưa cập nhật tới tháng hiện tại). */
function settlePeriod(query, dates) {
  if (query.thang && query.nam) return { ...query, latest: false };
  const sorted = dates.map(ym).filter(Boolean).sort((a, b) => b.nam - a.nam || b.thang - a.thang);
  if (query.thang) {
    const hit = sorted.find((p) => p.thang === +query.thang);
    return { ...query, nam: hit?.nam ?? new Date().getFullYear(), latest: false };
  }
  if (query.nam) return { ...query, latest: false };
  return sorted[0] ? { ...query, ...sorted[0], latest: true } : { ...query, latest: false };
}

function latestHint(dates) {
  const p = settlePeriod({}, dates);
  return p.thang ? ` Kỳ gần nhất có dữ liệu là **tháng ${p.thang}/${p.nam}** — bạn thử hỏi "tháng ${p.thang}/${p.nam}".` : '';
}

function denied(loai) {
  return { text: `Bạn chưa được cấp quyền **Xem** dữ liệu này (Hệ thống › Phân quyền: ${MODULES[loai].join(' / ')}).`, sources: [] };
}

function chamCong(query, ctx, values) {
  const scope = resolveTargets(query, ctx);
  if (scope.error) return { text: scope.error, sources: [] };
  const all = objects(values[TABS.chamCong]).filter((r) => scope.codes.has(norm(r['Mã NV'])));
  const q = settlePeriod(query, all.map((r) => r['Ngày làm việc']));
  const logs = all.filter((r) => inPeriod(r['Ngày làm việc'], q));
  const payroll = objects(values[TABS.luong]).filter((r) => scope.codes.has(norm(r['Mã NV'])) && inPeriod(`${r['Kỳ lương']}-01`, q));
  const head = `**Chấm công của ${scope.label} — ${periodLabel(q)}**${q.latest ? ' _(kỳ gần nhất có dữ liệu)_' : ''}`;
  if (!logs.length && !payroll.length) return { text: `${head}\n\nChưa có dữ liệu chấm công trong kỳ này.${latestHint(all.map((r) => r['Ngày làm việc']))}`, sources: [TABS.chamCong] };

  const status = (r) => norm(r['Trạng thái']);
  const isLate = (r) => /muon|tre/.test(status(r));
  const isEarly = (r) => /ve som/.test(status(r));
  const isLeave = (r) => /nghi|vang/.test(status(r));
  const worked = logs.filter((r) => hours(r['Số giờ làm']) > 0);
  const sumH = worked.reduce((s, r) => s + hours(r['Số giờ làm']), 0);
  const sumOt = logs.reduce((s, r) => s + hours(r['Giờ làm thêm (OT)']), 0);

  const lines = [head, ''];
  const congChuan = payroll.reduce((s, r) => s + toNum(r['Công chuẩn']), 0);
  const congThucTe = payroll.reduce((s, r) => s + hours(r['Công thực tế']), 0);
  if (payroll.length) lines.push(`- Công thực tế / công chuẩn (bảng lương): **${fmtNum(congThucTe)} / ${fmtNum(congChuan)}**`);
  lines.push(
    `- Ngày có chấm công: **${worked.length}** ngày · Tổng giờ làm: **${fmtNum(sumH)}** giờ`,
    `- Làm thêm (OT): **${fmtNum(sumOt)}** giờ`,
    `- Đi muộn: **${logs.filter(isLate).length}** lần · Về sớm: **${logs.filter(isEarly).length}** lần · Nghỉ: **${logs.filter(isLeave).length}** ngày`,
  );

  const focus = query.trong_tam ?? 'tong';
  const pick = { di_muon: isLate, ve_som: isEarly, nghi: isLeave, ot: (r) => hours(r['Giờ làm thêm (OT)']) > 0, tong: () => true }[focus] ?? (() => true);
  const detail = logs.filter(pick).sort((a, b) => String(a['Ngày làm việc']).localeCompare(String(b['Ngày làm việc'])));
  const multi = scope.targets.length > 1;
  if (multi && focus === 'tong') {
    const by = new Map();
    for (const r of logs) {
      const k = r['Mã NV'];
      const o = by.get(k) ?? { ten: r['Họ và tên nhân sự'], ngay: 0, gio: 0, ot: 0, muon: 0, nghi: 0 };
      if (hours(r['Số giờ làm']) > 0) o.ngay++;
      o.gio += hours(r['Số giờ làm']);
      o.ot += hours(r['Giờ làm thêm (OT)']);
      if (isLate(r)) o.muon++;
      if (isLeave(r)) o.nghi++;
      by.set(k, o);
    }
    lines.push('', table(['Mã NV', 'Họ tên', 'Ngày công', 'Giờ làm', 'OT', 'Đi muộn', 'Nghỉ'], [...by].map(([k, o]) => [k, o.ten, o.ngay, fmtNum(o.gio), fmtNum(o.ot), o.muon, o.nghi])));
  } else if (detail.length && detail.length <= 40) {
    lines.push(
      '',
      table(
        [...(multi ? ['Nhân viên'] : []), 'Ngày', 'Vào', 'Ra', 'Giờ làm', 'OT', 'Trạng thái'],
        detail.map((r) => [...(multi ? [r['Họ và tên nhân sự']] : []), fmtDate(r['Ngày làm việc']), r['Giờ vào (Check-in)'], r['Giờ ra (Check-out)'], r['Số giờ làm'], r['Giờ làm thêm (OT)'], r['Trạng thái']]),
      ),
    );
  }
  return { text: lines.join('\n'), sources: payroll.length ? [TABS.chamCong, TABS.luong] : [TABS.chamCong] };
}

function luong(query, ctx, values) {
  const scope = resolveTargets(query, ctx);
  if (scope.error) return { text: scope.error, sources: [] };
  const all = objects(values[TABS.luong]).filter((r) => scope.codes.has(norm(r['Mã NV'])));
  const q = settlePeriod(query, all.map((r) => `${r['Kỳ lương']}-01`));
  const rows = all.filter((r) => inPeriod(`${r['Kỳ lương']}-01`, q));
  const head = `**Bảng lương của ${scope.label} — ${periodLabel(q)}**${q.latest ? ' _(kỳ gần nhất có dữ liệu)_' : ''}`;
  if (!rows.length) return { text: `${head}\n\nChưa có bảng lương trong kỳ này.${latestHint(all.map((r) => `${r['Kỳ lương']}-01`))}`, sources: [TABS.luong] };
  if (rows.length === 1) {
    const r = rows[0];
    return {
      text: [
        head,
        '',
        `- Kỳ lương: **${r['Kỳ lương']}** · Chức vụ: ${r['Chức vụ']}`,
        `- Lương cơ bản: ${money(r['Lương cơ bản (VNĐ)'])} · Công: **${r['Công thực tế']} / ${r['Công chuẩn']}**`,
        `- Lương theo công: ${money(r['Lương theo công'])}`,
        `- Phụ cấp: ăn trưa ${money(r['Phụ cấp ăn trưa'])}, xăng xe ${money(r['Phụ cấp xăng xe'])}, khác ${money(r['Phụ cấp khác'])}`,
        `- Thưởng KPI: ${money(r['Thưởng KPI'])}`,
        `- Tổng thu nhập: **${money(r['Tổng thu nhập'])}**`,
        `- Khấu trừ (BHXH, BHYT, BHTN, thuế TNCN): ${money(r['Tổng khấu trừ'])}`,
        `- **Thực lĩnh: ${money(r['Thực lĩnh (VNĐ)'])}** · ${r['Trạng thái chi trả']}`,
      ].join('\n'),
      sources: [TABS.luong],
    };
  }
  const total = rows.reduce((s, r) => s + toNum(r['Thực lĩnh (VNĐ)']), 0);
  return {
    text: [
      head,
      '',
      table(
        ['Kỳ', 'Mã NV', 'Họ tên', 'Công', 'Tổng thu nhập', 'Thực lĩnh', 'Trạng thái'],
        rows.map((r) => [r['Kỳ lương'], r['Mã NV'], r['Họ và tên nhân sự'], `${r['Công thực tế']}/${r['Công chuẩn']}`, money(r['Tổng thu nhập']), money(r['Thực lĩnh (VNĐ)']), r['Trạng thái chi trả']]),
      ),
      '',
      `Tổng thực lĩnh: **${money(total)}** (${rows.length} phiếu lương)`,
    ].join('\n'),
    sources: [TABS.luong],
  };
}

function phieu(query, ctx, values) {
  const scope = resolveTargets(query, ctx);
  if (scope.error) return { text: scope.error, sources: [] };
  let rows = objects(values[TABS.phieu]).filter((r) => scope.codes.has(norm(r['Mã NV'])));
  if (query.loai_phieu) rows = rows.filter((r) => norm(r['Loại phiếu']).includes(norm(query.loai_phieu)));
  if (query.trang_thai) rows = rows.filter((r) => norm(r['Trạng thái']).includes(norm(query.trang_thai)));
  if (query.thang || query.nam) rows = rows.filter((r) => inPeriod(r['Từ ngày/giờ'], query));
  const what = [query.loai_phieu ? `phiếu ${query.loai_phieu.toLowerCase()}` : 'phiếu hành chính', query.trang_thai ? `"${query.trang_thai}"` : ''].filter(Boolean).join(' ');
  const head = `**${what[0].toUpperCase()}${what.slice(1)} của ${scope.label}${query.thang || query.nam ? ` — ${periodLabel(query)}` : ''}**`;
  if (!rows.length) return { text: `${head}\n\nKhông có phiếu nào phù hợp.`, sources: [TABS.phieu] };
  const byStatus = {};
  for (const r of rows) byStatus[r['Trạng thái']] = (byStatus[r['Trạng thái']] ?? 0) + 1;
  return {
    text: [
      head,
      '',
      `Tổng: **${rows.length}** phiếu — ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
      '',
      table(
        ['Mã phiếu', ...(scope.targets.length > 1 ? ['Nhân viên'] : []), 'Loại', 'Từ', 'Đến', 'Số lượng', 'Trạng thái'],
        rows.map((r) => [r['Mã phiếu'], ...(scope.targets.length > 1 ? [r['Họ và tên nhân sự']] : []), r['Loại phiếu'], fmtDate(r['Từ ngày/giờ']), fmtDate(r['Đến ngày/giờ']), `${r['Số lượng']} ${r['Đơn vị']}`, r['Trạng thái']]),
      ),
    ].join('\n'),
    sources: [TABS.phieu],
  };
}

function taiLieu(query, _ctx, values) {
  const rows = objects(values[TABS.taiLieu]).map((r) => ({
    ...r,
    loai: LOAI_TAI_LIEU[r['Loại văn bản']] ?? r['Loại văn bản'],
    phong: PHONG_BAN_TAI_LIEU[r['Phòng ban chủ trì']] ?? r['Phòng ban chủ trì'],
  }));
  const words = norm(query.tu_khoa).split(' ').filter((w) => w.length > 1);
  const scored = rows
    .map((r) => {
      const hay = norm([r['Số hiệu văn bản'], r['Hướng công văn'], r.loai, r['Trích yếu nội dung'], r.phong, r['Ghi chú lưu trữ']].join(' '));
      return { r, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((x) => !words.length || x.score > 0)
    .sort((a, b) => b.score - a.score);
  const best = words.length ? scored.filter((x) => x.score === scored[0]?.score) : scored;
  const head = words.length ? `**Tài liệu / công văn khớp "${query.tu_khoa}"**` : '**Danh sách tài liệu / công văn**';
  if (!best.length) return { text: `${head}\n\nKhông tìm thấy tài liệu phù hợp. Thử từ khóa khác (vd. số hiệu, "nghỉ Tết", "nội quy").`, sources: [TABS.taiLieu] };
  const list = best.slice(0, 15);
  return {
    text: [
      head,
      '',
      table(['Số hiệu', 'Loại', 'Hướng', 'Trích yếu', 'Phòng chủ trì', 'Trạng thái'], list.map(({ r }) => [r['Số hiệu văn bản'], r.loai, r['Hướng công văn'], r['Trích yếu nội dung'], r.phong, r['Trạng thái xử lý']])),
      best.length > list.length ? `\n…và ${best.length - list.length} tài liệu khác.` : '',
      '\n_Hiện mới tra được số hiệu và trích yếu, chưa đọc được nội dung bên trong file._',
    ].join('\n'),
    sources: [TABS.taiLieu],
  };
}

function nhanVien(query, ctx) {
  const { employees } = ctx;
  const specific = query.ma_nv || query.ten_nhan_vien || (query.ban_than && ctx.me?.ma_nv);
  if (specific) {
    const n = norm(specific);
    const hits = employees.filter((e) => norm(e.ma_nv) === n || norm(e.ho_ten).includes(n));
    if (!hits.length) return { text: `Không tìm thấy nhân viên "${specific}".`, sources: [TABS.nhanVien] };
    if (hits.length === 1) {
      const e = hits[0];
      const start = new Date(e.ngay_vao_lam);
      const months = Number.isNaN(start.getTime()) ? null : Math.max(0, Math.floor((Date.now() - start.getTime()) / (30.44 * 86400000)));
      const tenure = months == null ? '' : ` — thâm niên **${Math.floor(months / 12)} năm ${months % 12} tháng**`;
      return {
        text: [
          `**${e.ho_ten} (${e.ma_nv})**`,
          '',
          `- Phòng ban: ${e.phong_ban || '—'} · Chức vụ: ${e.chuc_vu || '—'}`,
          `- Email: ${e.email || '—'} · Điện thoại: ${e.sdt || '—'}`,
          `- Ngày vào làm: ${fmtDate(e.ngay_vao_lam) || '—'}${tenure}`,
          `- Loại hợp đồng: ${e.loai_hop_dong || '—'}`,
        ].join('\n'),
        sources: [TABS.nhanVien],
      };
    }
    return {
      text: table(['Mã NV', 'Họ tên', 'Phòng ban', 'Chức vụ', 'Email', 'Điện thoại', 'Ngày vào làm'], hits.slice(0, 20).map((e) => [e.ma_nv, e.ho_ten, e.phong_ban, e.chuc_vu, e.email, e.sdt, fmtDate(e.ngay_vao_lam)])),
      sources: [TABS.nhanVien],
    };
  }
  const active = employees.filter((e) => e.trang_thai !== 'da_nghi_viec');
  if (query.phong_ban) {
    const n = norm(query.phong_ban);
    const hits = active.filter((e) => norm(e.phong_ban).includes(n));
    return {
      text: [`**${query.phong_ban}: ${hits.length} nhân viên đang làm việc**`, '', table(['Mã NV', 'Họ tên', 'Chức vụ', 'Email'], hits.map((e) => [e.ma_nv, e.ho_ten, e.chuc_vu, e.email]))].join('\n'),
      sources: [TABS.nhanVien],
    };
  }
  const by = {};
  for (const e of active) by[e.phong_ban || '(Chưa xếp phòng)'] = (by[e.phong_ban || '(Chưa xếp phòng)'] ?? 0) + 1;
  return {
    text: [`**Nhân sự đang làm việc: ${active.length} người**`, '', table(['Phòng ban', 'Số nhân viên'], Object.entries(by).sort((a, b) => b[1] - a[1]))].join('\n'),
    sources: [TABS.nhanVien],
  };
}

async function congTy() {
  const rows = (await readValues(TABS.congTy)).slice(1).filter((r) => r[0] && !String(r[0]).startsWith('_') && String(r[2] ?? '').trim());
  if (!rows.length) return { text: 'Chưa có thông tin công ty (Hệ thống › Thông tin công ty).', sources: [TABS.congTy] };
  return { text: ['**Thông tin công ty**', '', ...rows.map((r) => `- ${r[1]}: **${r[2]}**`)].join('\n'), sources: [TABS.congTy] };
}

export const HELP = [
  'Mình tra cứu được số liệu thật trên hệ thống. Bạn thử hỏi kiểu:',
  '- "Tháng 2/2025 tôi được bao nhiêu công?"',
  '- "Tháng này tôi đi muộn mấy lần?" · "Tổng giờ OT của tôi năm 2025"',
  '- "Lương tháng 2 của tôi thực lĩnh bao nhiêu?"',
  '- "Phiếu nghỉ phép của tôi đã duyệt chưa?"',
  '- "Tìm công văn về nghỉ Tết" · "Quyết định ban hành nội quy"',
  '- "Phòng ban nào đông nhân viên nhất?" · "Email của Trần Thị Mai"',
  '- "Mã số thuế công ty?" · "Địa chỉ trụ sở công ty"',
].join('\n');

const HANDLERS = { cham_cong: chamCong, luong, phieu, tai_lieu: taiLieu, nhan_vien: nhanVien };
const NEEDS = { cham_cong: [TABS.chamCong, TABS.luong], luong: [TABS.luong], phieu: [TABS.phieu], tai_lieu: [TABS.taiLieu], nhan_vien: [] };

/** Chạy một truy vấn có cấu trúc. Trả { text (markdown), sources: [tên tab] }. */
export async function runQuery(query, ctx) {
  const handler = HANDLERS[query.loai];
  if (query.loai === 'cong_ty') return congTy();
  if (!handler) return { text: HELP, sources: [] };
  if (!ctx.can(MODULES[query.loai], 'xem')) return denied(query.loai);
  const values = NEEDS[query.loai].length ? await readMany(NEEDS[query.loai]) : {};
  return handler(query, ctx, values);
}
