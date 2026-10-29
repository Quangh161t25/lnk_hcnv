import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RotateCcw,
  User,
  Send,
  Copy,
  Check,
  Building2,
  CalendarCheck,
  Receipt,
  Users,
  Banknote,
  FileText,
  Database,
} from 'lucide-react';
import { PageHeaderBar } from '@/components/data/PageHeaderBar';
import { Button } from '@/components/ui/Button';
import { MiniMarkdown } from '@/components/ui/MiniMarkdown';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/lib/format';
import { apiFetch } from '@/lib/api';

/** gemini: Gemini trả lời; rules: tự trả lời theo mẫu câu hỏi; offline: chưa có API (chạy cục bộ). */
type Engine = 'gemini' | 'rules' | 'offline';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  engine?: Engine;
  sources?: string[];
  notice?: string;
}

interface AiResponse {
  reply: string;
  engine: Engine;
  sources: string[];
  notice?: string;
}

const ENGINE_LABEL: Record<Engine, string> = {
  gemini: 'Gemini',
  rules: 'Tra cứu theo mẫu',
  offline: 'Bản cục bộ (chưa nối dữ liệu)',
};

const QUICK_PROMPTS = [
  {
    icon: CalendarCheck,
    label: 'Bảng công của tôi',
    prompt: 'Tháng 2/2025 tôi được bao nhiêu công, đi muộn mấy lần?',
  },
  {
    icon: Banknote,
    label: 'Lương của tôi',
    prompt: 'Lương tháng 2/2025 của tôi thực lĩnh bao nhiêu?',
  },
  {
    icon: Receipt,
    label: 'Phiếu của tôi',
    prompt: 'Phiếu hành chính của tôi đã duyệt chưa?',
  },
  {
    icon: FileText,
    label: 'Tìm công văn',
    prompt: 'Tìm công văn về nghỉ Tết',
  },
  {
    icon: Users,
    label: 'Nhân sự',
    prompt: 'Phòng ban nào đông nhân viên nhất?',
  },
  {
    icon: Building2,
    label: 'Thông tin công ty',
    prompt: 'Mã số thuế và địa chỉ trụ sở công ty?',
  },
];

function generateSmartReply(query: string, userName: string): string {
  const q = query.toLowerCase();

  if (q.includes('phòng ban') || q.includes('cơ cấu') || q.includes('sơ đồ') || q.includes('quy mô')) {
    return `Chào **${userName}**, dưới đây là cơ cấu tổ chức chính của **Công ty Cổ phần Tập đoàn Vũ Gia**:

1. **Ban Giám đốc**: Lãnh đạo điều hành chung toàn hệ thống.
2. **Phòng Hành chính - Nhân sự (HCNS)**: Phụ trách quản lý nhân sự, hồ sơ ứng viên, hợp đồng, chấm công, bảng lương và tài sản doanh nghiệp.
3. **Phòng Kế toán - Tài chính**: Quản trị tài chính, thu chi và kiểm toán nội bộ.
4. **Phòng Kinh doanh & Marketing**: Phát triển thị trường và chăm sóc đối tác khách hàng.
5. **Phòng Kỹ thuật & Công nghệ**: Vận hành hạ tầng công nghệ và bảo trì hệ thống.

👉 Bạn có thể vào phân hệ **Hệ thống > Phòng ban** hoặc **Hệ thống > Cấp bậc** để xem chi tiết danh sách vị trí và sơ đồ tổ chức.`;
  }

  if (q.includes('chấm công') || q.includes('giờ làm') || q.includes('đi làm') || q.includes('ca')) {
    return `Chào **${userName}**, quy định chấm công và giờ làm việc tiêu chuẩn tại **Vũ Gia ERP**:

- **Khung giờ làm việc chuẩn**:
  - Buổi sáng: \`08:00 - 12:00\`
  - Nghỉ trưa: \`12:00 - 13:30\`
  - Buổi chiều: \`13:30 - 17:30\`
- **Quy tắc ghi nhận**:
  - Check-in trước 08:00 và check-out sau 17:30.
  - Đi muộn/về sớm vượt quá 15 phút cần tạo phiếu giải trình hành chính.
- **Xem bảng công cá nhân**: Truy cập **Hành chính > Chấm công** để xem lịch sử điểm danh ngày và tổng hợp công tháng.`;
  }

  if (q.includes('nghỉ phép') || q.includes('phiếu hành chính') || q.includes('công tác') || q.includes('đơn xin')) {
    return `Chào **${userName}**, quy trình tạo phiếu hành chính và xin nghỉ phép:

1. **Bước 1**: Truy cập phân hệ **Hành chính > Phiếu hành chính**.
2. **Bước 2**: Nhấn nút **"+ Thêm phiếu mới"**.
3. **Bước 3**: Chọn loại phiếu phù hợp:
   - *Phiếu xin nghỉ phép* (Phép năm, nghỉ ốm, việc riêng)
   - *Phiếu đăng ký công tác*
   - *Phiếu đề xuất mua sắm / cấp phát thiết bị*
4. **Bước 4**: Điền thời gian, lý do chi tiết và chọn người phê duyệt (Trưởng bộ phận).
5. **Bước 5**: Nhấn **"Gửi phiếu"**. Trạng thái sẽ được cập nhật tự động khi cấp quản lý phê duyệt.`;
  }

  if (q.includes('lương') || q.includes('bảng lương') || q.includes('thu nhập') || q.includes('thưởng')) {
    return `Chào **${userName}**, thông tin về chính sách tiền lương và phiếu lương:

- **Kỳ tính lương**: Từ ngày 01 đến ngày cuối cùng của tháng.
- **Ngày chi trả lương**: Định kỳ ngày **05 hàng tháng** (nếu trùng ngày nghỉ sẽ chi trả vào ngày làm việc trước đó).
- **Cách tra cứu phiếu lương cá nhân**:
  - Vào **Hành chính > Bảng lương > Phiếu lương của tôi**.
  - Xem chi tiết: Lương cơ bản, phụ cấp, điểm cộng/trừ KPI, bảo hiểm và lương thực nhận (Net).`;
  }

  if (q.includes('công ty') || q.includes('vũ gia') || q.includes('mã số thuế') || q.includes('trụ sở') || q.includes('địa chỉ')) {
    return `Dưới đây là thông tin pháp nhân của **Công ty Cổ phần Tập đoàn Vũ Gia**:

- **Tên doanh nghiệp**: CÔNG TY CỔ PHẦN TẬP ĐOÀN VŨ GIA
- **Tên quốc tế**: VU GIA GROUP JOINT STOCK COMPANY
- **Mã số thuế**: \`0109876543\`
- **Đại diện pháp luật**: Ông Vũ Đức Gia - Tổng Giám đốc
- **Trụ sở chính**: Tầng 6, Tòa nhà Vũ Gia Tower, Số 168 Đường Cầu Giấy, Q. Cầu Giấy, TP. Hà Nội
- **Chi nhánh TP. HCM**: Tòa nhà Bitexco Office, Quận 1, TP. Hồ Chí Minh
- **Chi nhánh Đà Nẵng**: Số 48 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng
- **Hotline**: 0988.161.161 - **Email**: contact@vugia.vn`;
  }

  if (q.includes('google sheet') || q.includes('đồng bộ') || q.includes('sheet') || q.includes('dữ liệu')) {
    return `Hệ thống **Vũ Gia ERP** hiện đang được tích hợp trực tiếp 2 chiều với **Google Sheets**:

- **Trang tính liên kết**: \`19h9xv-5rd2MFF9PUh8LqKnayRr4NUPka64aB8D6jQQg\`
- **Tài khoản Service Account**: \`lnk-773@cty-lnk-161.iam.gserviceaccount.com\`
- **Dữ liệu đồng bộ**: Danh sách nhân viên, thông tin tài khoản, chức vụ, phòng ban và mật khẩu đăng nhập đều được đồng bộ hóa tức thì.
- **Thao tác**: Vào **Nhân sự > Nhân viên** để thực hiện Thêm / Sửa / Xóa hoặc nhấn "Đồng bộ Sheet" để cập nhật dữ liệu mới nhất.`;
  }

  // Default intelligent response
  return `Chào **${userName}**! Tôi đã ghi nhận câu hỏi của bạn: *" ${query} "*.

Để hỗ trợ bạn tốt nhất trên hệ thống **Vũ Gia ERP**, bạn có thể:
1. Tra cứu **Nhân sự & Nhân viên**: Quản lý danh sách nhân viên, hồ sơ ứng viên, hợp đồng lao động.
2. Quản lý **Hành chính**: Chấm công, tổng hợp công lương, phiếu hành chính, quản lý tài sản và xe công vụ.
3. Quản trị **Hệ thống**: Xem thông tin công ty, chi nhánh, quản lý phòng ban, chức vụ, cấp bậc và phân quyền truy cập.

Bạn có thể chọn một trong các câu hỏi gợi ý bên dưới hoặc hỏi cụ thể hơn về một nghiệp vụ cần thao tác nhé!`;
}

export function AiAssistantPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userName = user?.full_name || user?.email?.split('@')[0] || 'bạn';

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: `Xin chào **${userName}**! Tôi là **Trợ lý AI Vũ Gia**. Tôi tra cứu trực tiếp dữ liệu trên hệ thống: bảng công, giờ làm thêm, lương, phiếu hành chính, công văn, danh bạ nhân sự và thông tin công ty. Bạn cần tra cứu gì?`,
      timestamp: Date.now(),
    },
  ]);
  const [isPending, setIsPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsPending(true);

    // Server tra cứu Google Sheet (theo quyền của người hỏi); không có API (chạy cục bộ) thì dùng câu trả lời mẫu.
    let reply: Omit<Message, 'id' | 'role' | 'timestamp'>;
    try {
      const res = await apiFetch<AiResponse>('/api/ai', { method: 'POST', body: JSON.stringify({ message: text, history }) });
      reply = res
        ? { content: res.reply, engine: res.engine, sources: res.sources, notice: res.notice }
        : { content: generateSmartReply(text, userName), engine: 'offline' };
    } catch (err) {
      reply = { content: `Xin lỗi, chưa trả lời được: ${err instanceof Error ? err.message : 'lỗi không xác định'}. Bạn thử lại sau nhé.` };
    }
    setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'model', timestamp: Date.now(), ...reply }]);
    setIsPending(false);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        content: `Đã làm mới đoạn chat! Bạn có thể hỏi tôi bất kỳ thông tin nào về quy trình hành chính, nhân sự hoặc hệ thống Vũ Gia.`,
        timestamp: Date.now(),
      },
    ]);
    setInput('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-page min-h-0">
      <PageHeaderBar
        onBack={() => navigate('/')}
        leadingContent={
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-primary text-white shadow-md shadow-indigo-500/25">
              <Sparkles size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-semibold text-foreground truncate">
                  Trợ lý AI Vũ Gia
                </h2>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <span className="text-xs text-muted-foreground truncate">
                Tra cứu công, lương, phiếu, công văn từ dữ liệu hệ thống
              </span>
            </div>
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetChat}
            className="gap-1.5 border-border bg-card text-foreground hover:bg-muted shadow-sm"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Đoạn chat mới</span>
          </Button>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col pt-3 md:pt-4">
        <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-muted/20">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                      msg.role === 'model'
                        ? 'bg-gradient-to-tr from-indigo-600 to-primary text-white border-transparent'
                        : 'bg-foreground text-background border-foreground/80'
                    }`}
                  >
                    {msg.role === 'model' ? <Sparkles size={16} /> : <User size={16} />}
                  </div>

                  <div className={`flex flex-col max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`relative group px-4 py-3 md:px-5 md:py-3.5 text-sm leading-relaxed shadow-sm break-words min-w-0 max-w-full ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-xs whitespace-pre-wrap'
                          : 'bg-card text-foreground border border-border/80 rounded-2xl rounded-tl-xs'
                      }`}
                    >
                      {msg.role === 'model' ? <MiniMarkdown text={msg.content} /> : msg.content}
                      {msg.notice && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{msg.notice}</p>}

                      {msg.role === 'model' && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                          title="Sao chép phản hồi"
                        >
                          {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          <span>{copiedId === msg.id ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1.5 px-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{formatDateTime(new Date(msg.timestamp).toISOString())}</span>
                      {msg.engine && <span>· {ENGINE_LABEL[msg.engine]}</span>}
                      {msg.sources && msg.sources.length > 0 && (
                        <span className="inline-flex items-center gap-1" title="Nguồn dữ liệu (tab Google Sheet)">
                          <Database size={11} aria-hidden />
                          {msg.sources.join(', ')}
                        </span>
                      )}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 md:gap-4"
              >
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles size={16} />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-xs px-4 py-3 flex space-x-1.5 items-center shadow-sm">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* Quick suggestions */}
          <div className="border-t border-border/60 bg-card px-4 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0 uppercase tracking-wider">
              Gợi ý:
            </span>
            {QUICK_PROMPTS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPrompt(p.prompt)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/60 hover:bg-muted text-foreground border border-border/60 shrink-0 transition-colors"
                >
                  <Icon size={13} className="text-primary shrink-0" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom input form */}
          <div className="p-3 md:p-4 bg-card border-t border-border">
            <form
              onSubmit={handleSubmit}
              className="w-full flex items-end gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows={1}
                placeholder="Nhập câu hỏi hoặc yêu cầu trợ giúp... (Nhấn Enter để gửi)"
                className="w-full bg-transparent border-0 px-3 py-2 text-sm text-foreground focus:outline-none resize-none max-h-32 placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isPending}
                size="sm"
                className="h-9 w-9 p-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-sm"
              >
                <Send size={15} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiAssistantPage;
