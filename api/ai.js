// POST /api/ai   body { message, history?: [{ role: 'user' | 'model', content }] }  → { reply, engine, sources }
//
// Có biến môi trường GEMINI_API_KEY → hỏi Gemini; Gemini gọi các hàm tra cứu ở api/_lib/assistant.js để lấy số liệu.
// Không có khóa, Gemini lỗi hoặc hết lượt miễn phí → tự trả lời bằng bộ nhận diện từ khóa (cùng các hàm tra cứu đó).
// Số liệu luôn do server tính từ Google Sheet và đã lọc theo quyền của người hỏi.
import { readBody, readSession, route } from './_lib/google.js';
import { HELP, createContext, parseQuestion, runQuery } from './_lib/assistant.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_MESSAGE = 1000;
const MAX_HISTORY = 8;

const WHO = {
  ma_nv: { type: 'string', description: 'Mã nhân viên, vd. NV001. Bỏ trống nếu người hỏi hỏi về chính mình.' },
  ten_nhan_vien: { type: 'string', description: 'Họ tên nhân viên được hỏi (nếu không có mã).' },
  phong_ban: { type: 'string', description: 'Tên phòng ban / khối nếu hỏi theo phòng ban.' },
  toan_cong_ty: { type: 'boolean', description: 'true nếu hỏi cho toàn công ty.' },
  thang: { type: 'integer', description: 'Tháng 1-12. Bỏ trống để lấy kỳ gần nhất có dữ liệu.' },
  nam: { type: 'integer', description: 'Năm, vd. 2025.' },
};

const FUNCTIONS = [
  {
    name: 'tra_cuu_cham_cong',
    description: 'Ngày công, công thực tế/công chuẩn, giờ làm, OT, số lần đi muộn/về sớm, ngày nghỉ (tab chấm công + bảng lương).',
    parameters: { type: 'object', properties: { ...WHO, trong_tam: { type: 'string', enum: ['tong', 'di_muon', 've_som', 'ot', 'nghi'], description: 'Phần cần liệt kê chi tiết theo ngày.' } } },
  },
  { name: 'tra_cuu_luong', description: 'Bảng lương: lương cơ bản, phụ cấp, thưởng, khấu trừ, thực lĩnh, trạng thái chi trả.', parameters: { type: 'object', properties: WHO } },
  {
    name: 'tra_cuu_phieu',
    description: 'Phiếu hành chính: nghỉ phép, làm thêm giờ (OT), công tác, đi muộn về sớm và trạng thái duyệt.',
    parameters: {
      type: 'object',
      properties: {
        ...WHO,
        loai_phieu: { type: 'string', enum: ['Nghỉ phép', 'Làm thêm giờ', 'Công tác', 'Đi muộn về sớm'] },
        trang_thai: { type: 'string', enum: ['Chờ duyệt', 'Đã duyệt'] },
      },
    },
  },
  {
    name: 'tim_tai_lieu',
    description: 'Tìm công văn / văn bản / quyết định / thông báo theo từ khóa trong số hiệu và trích yếu (chưa có nội dung file).',
    parameters: { type: 'object', properties: { tu_khoa: { type: 'string', description: 'Từ khóa ngắn, vd. "nghỉ Tết", "nội quy", "TL-2025-009".' } }, required: ['tu_khoa'] },
  },
  {
    name: 'tra_cuu_nhan_vien',
    description: 'Danh bạ nhân sự: phòng ban, chức vụ, email, điện thoại; hoặc số nhân viên theo phòng ban.',
    parameters: {
      type: 'object',
      properties: {
        ma_nv: WHO.ma_nv,
        ten_nhan_vien: WHO.ten_nhan_vien,
        phong_ban: WHO.phong_ban,
        ban_than: { type: 'boolean', description: 'true nếu hỏi thông tin / thâm niên của chính người hỏi.' },
      },
    },
  },
  { name: 'tra_cuu_thong_tin_cong_ty', description: 'Thông tin pháp lý công ty: tên, mã số thuế, ngày thành lập, người đại diện, trụ sở, hotline, email, website, tài khoản ngân hàng.' },
];
const LOAI = {
  tra_cuu_cham_cong: 'cham_cong',
  tra_cuu_luong: 'luong',
  tra_cuu_phieu: 'phieu',
  tim_tai_lieu: 'tai_lieu',
  tra_cuu_nhan_vien: 'nhan_vien',
  tra_cuu_thong_tin_cong_ty: 'cong_ty',
};

function systemPrompt(ctx) {
  const me = ctx.me;
  return [
    'Bạn là Trợ lý AI nội bộ của hệ thống quản trị Hành chính - Nhân sự công ty Vũ Gia. Luôn trả lời bằng tiếng Việt, ngắn gọn, dùng markdown (in đậm, gạch đầu dòng, bảng).',
    `Hôm nay: ${new Date().toISOString().slice(0, 10)}. Người hỏi: ${me ? `${me.ho_ten} (mã ${me.ma_nv}, ${me.phong_ban || 'chưa rõ phòng'}, ${me.chuc_vu || ''})` : ctx.session.sub}. ${ctx.isAdmin ? 'Người hỏi là quản trị viên, được xem dữ liệu mọi người.' : 'Người hỏi chỉ được xem dữ liệu của chính mình.'}`,
    'Mọi số liệu (công, giờ, lương, phiếu, tài liệu, nhân sự) PHẢI lấy bằng cách gọi hàm; tuyệt đối không tự đoán hay bịa số. "Tôi/mình/của tôi" là người hỏi → không cần truyền ma_nv.',
    'Nếu hàm trả lời không có quyền hoặc không có dữ liệu thì nói lại đúng như vậy. Khi trả lời, nêu rõ kỳ (tháng/năm) của số liệu. Có thể giữ nguyên bảng mà hàm trả về.',
    'Câu hỏi về cách dùng phần mềm hoặc kiến thức chung về hành chính - nhân sự thì trả lời bình thường, không cần gọi hàm.',
  ].join('\n');
}

async function gemini(contents, ctx) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(ctx) }] },
      contents,
      tools: [{ functionDeclarations: FUNCTIONS }],
      generationConfig: { temperature: 0.2 },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${body.error?.message ?? ''}`.slice(0, 300));
  const content = body.candidates?.[0]?.content;
  if (!content?.parts?.length) throw new Error('Gemini không trả lời');
  return content;
}

async function askGemini(message, history, ctx) {
  const contents = [
    ...history.map((m) => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: message }] },
  ];
  // Gemini yêu cầu đoạn hội thoại bắt đầu bằng lượt của người dùng (bỏ lời chào của trợ lý).
  while (contents[0].role === 'model') contents.shift();
  const sources = new Set();
  for (let step = 0; step < 5; step++) {
    const content = await gemini(contents, ctx);
    const calls = content.parts.filter((p) => p.functionCall);
    if (!calls.length) {
      const text = content.parts.map((p) => p.text ?? '').join('').trim();
      if (!text) throw new Error('Gemini trả lời rỗng');
      return { reply: text, sources: [...sources] };
    }
    // Trả nguyên nội dung model (kể cả thoughtSignature) rồi kèm kết quả từng hàm.
    contents.push(content);
    const responses = [];
    for (const { functionCall: call } of calls) {
      const loai = LOAI[call.name];
      const result = loai ? await runQuery({ ...(call.args ?? {}), loai }, ctx) : { text: 'Hàm không tồn tại', sources: [] };
      result.sources.forEach((s) => sources.add(s));
      responses.push({ functionResponse: { name: call.name, response: { ket_qua: result.text } } });
    }
    contents.push({ role: 'user', parts: responses });
  }
  throw new Error('Gemini gọi hàm quá nhiều lần');
}

async function askRules(message, ctx) {
  const query = parseQuestion(message, ctx.employees);
  if (query.loai === 'khong_ro') return { reply: HELP, sources: [] };
  const result = await runQuery(query, ctx);
  return { reply: result.text, sources: result.sources };
}

export default route(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });

  const { message, history } = readBody(req);
  const text = String(message ?? '').trim().slice(0, MAX_MESSAGE);
  if (!text) return res.status(400).json({ error: 'Câu hỏi trống' });
  const past = (Array.isArray(history) ? history : [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role === 'model' ? 'model' : 'user', content: m.content.slice(0, 4000) }));

  const ctx = await createContext(session);
  if (process.env.GEMINI_API_KEY) {
    try {
      return res.status(200).json({ ...(await askGemini(text, past, ctx)), engine: 'gemini' });
    } catch (err) {
      console.error('[ai] Gemini lỗi, dùng bộ trả lời theo mẫu:', err.message);
      return res.status(200).json({ ...(await askRules(text, ctx)), engine: 'rules', notice: 'Gemini tạm thời không phản hồi (có thể hết lượt miễn phí) — đang trả lời theo mẫu.' });
    }
  }
  return res.status(200).json({ ...(await askRules(text, ctx)), engine: 'rules' });
});
