import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, Eye, MessageSquare, Plus, Search, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface Suggestion {
  id: string;
  ma_gop_y: string;
  tieu_de: string;
  noi_dung: string;
  danh_muc: string;
  nguoi_gui: string;
  an_danh: boolean;
  ngay_gui: string;
  trang_thai: 'cho_xu_ly' | 'dang_xu_ly' | 'da_phan_hoi';
  phan_hoi?: string;
  nguoi_phan_hoi?: string;
}

const INITIAL_SUGGESTIONS: Suggestion[] = [
  { id: '1', ma_gop_y: 'GY-2025-01', tieu_de: 'Đề xuất bổ sung thêm máy lọc nước nóng lạnh tại Pantry Tầng 4', noi_dung: 'Hiện tại khu vực tầng 4 có đông nhân sự kỹ thuật, nhu cầu sử dụng nước ấm vào mùa đông cao, máy hiện tại công suất nhỏ.', danh_muc: 'Cơ sở vật chất', nguoi_gui: 'Ẩn danh', an_danh: true, ngay_gui: '2025-02-15', trang_thai: 'da_phan_hoi', phan_hoi: 'Bộ phận HCNS đã tiếp nhận và đặt mua bổ sung máy lọc nước Karofi, dự kiến lắp đặt trước 28/02.', nguoi_phan_hoi: 'Hoàng Lan Anh (HCNS)' },
  { id: '2', ma_gop_y: 'GY-2025-02', tieu_de: 'Tổ chức thêm các giải bóng đá / cầu lông giao lưu nội bộ cuối tuần', noi_dung: 'Đề xuất công đoàn hoặc công ty tài trợ một phần chi phí thuê sân tập thể thao định kỳ cho anh em các phòng ban.', danh_muc: 'Văn hóa & Đời sống', nguoi_gui: 'Nguyễn Văn An', an_danh: false, ngay_gui: '2025-02-20', trang_thai: 'dang_xu_ly', phan_hoi: 'Ban chấp hành Công đoàn đang lên kế hoạch lập CLB thể thao và dự trù ngân sách quý 2.', nguoi_phan_hoi: 'Công đoàn 5F' },
  { id: '3', ma_gop_y: 'GY-2025-03', tieu_de: 'Góp ý về quy trình phê duyệt phiếu hành chính khi quản lý đi công tác', noi_dung: 'Khi trưởng phòng đi công tác nước ngoài, các đề xuất nghỉ phép gấp thường duyệt chậm. Nên có cơ chế ủy quyền duyệt tạm thời.', danh_muc: 'Quy trình & Chính sách', nguoi_gui: 'Ẩn danh', an_danh: true, ngay_gui: '2025-02-24', trang_thai: 'cho_xu_ly' },
];

const STATUS_BADGE = {
  cho_xu_ly: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  dang_xu_ly: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  da_phan_hoi: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

const STATUS_LABEL = {
  cho_xu_ly: 'Chờ xử lý',
  dang_xu_ly: 'Đang xử lý',
  da_phan_hoi: 'Đã phản hồi',
};

export default function HomThuGopYPage() {
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Suggestion | null>(null);

  // New feedback state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Cơ sở vật chất');
  const [newContent, setNewContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const filtered = useMemo(() => {
    return suggestions.filter((s) => {
      if (statusFilter !== 'all' && s.trang_thai !== statusFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return s.tieu_de.toLowerCase().includes(q) || s.ma_gop_y.toLowerCase().includes(q) || s.danh_muc.toLowerCase().includes(q);
    });
  }, [suggestions, statusFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HomThuGopY');
    XLSX.writeFile(wb, `Hom_thu_gop_y_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung góp ý');
      return;
    }
    const newSug: Suggestion = {
      id: String(Date.now()),
      ma_gop_y: `GY-2025-0${suggestions.length + 1}`,
      tieu_de: newTitle.trim(),
      noi_dung: newContent.trim(),
      danh_muc: newCategory,
      nguoi_gui: isAnonymous ? 'Ẩn danh' : 'Nguyễn Văn An',
      an_danh: isAnonymous,
      ngay_gui: new Date().toISOString().slice(0, 10),
      trang_thai: 'cho_xu_ly',
    };
    setSuggestions((prev) => [newSug, ...prev]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewContent('');
    toast.success('Cảm ơn bạn! Ý kiến đóng góp đã được gửi tới Ban lãnh đạo');
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Quick summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MessageSquare size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng góp ý nhận</div>
              <div className="text-base font-bold text-foreground">{suggestions.length} ý kiến</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Chờ xử lý</div>
              <div className="text-base font-bold text-foreground">
                {suggestions.filter((s) => s.trang_thai === 'cho_xu_ly').length} ý kiến
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Eye size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang xử lý</div>
              <div className="text-base font-bold text-foreground">
                {suggestions.filter((s) => s.trang_thai === 'dang_xu_ly').length} ý kiến
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đã phản hồi</div>
              <div className="text-base font-bold text-foreground">
                {suggestions.filter((s) => s.trang_thai === 'da_phan_hoi').length} ý kiến
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tiêu đề, mã góp ý, nội dung..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'cho_xu_ly', label: 'Chờ xử lý' },
                { value: 'dang_xu_ly', label: 'Đang xử lý' },
                { value: 'da_phan_hoi', label: 'Đã phản hồi' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="text-xs h-8 w-40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => setIsModalOpen(true)} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Gửi ý kiến mới
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Tiêu đề góp ý</th>
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4">Người gửi</th>
                <th className="py-3 px-4 text-center">Ngày gửi</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4">Phản hồi của HCNS / BOD</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{s.ma_gop_y}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-foreground">{s.tieu_de}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1">{s.noi_dung}</div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{s.danh_muc}</td>
                  <td className="py-3 px-4">
                    {s.an_danh ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-[11px]">
                        <ShieldCheck size={12} className="text-emerald-500" /> Ẩn danh
                      </span>
                    ) : (
                      <span className="text-foreground font-medium">{s.nguoi_gui}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(s.ngay_gui)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[s.trang_thai]}`}>
                      {STATUS_LABEL[s.trang_thai]}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    {s.phan_hoi ? (
                      <div>
                        <div className="text-[11px] text-foreground line-clamp-1">{s.phan_hoi}</div>
                        <div className="text-[10px] text-muted-foreground">Bởi: {s.nguoi_phan_hoi}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px] italic">Chưa có phản hồi</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDetail(s)} className="h-7 w-7 p-0">
                      <Eye size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View Detail */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="font-mono text-xs font-semibold text-primary">{selectedDetail.ma_gop_y}</span>
                <h3 className="text-base font-semibold text-foreground">{selectedDetail.tieu_de}</h3>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[selectedDetail.trang_thai]}`}>
                {STATUS_LABEL[selectedDetail.trang_thai]}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Danh mục: <strong className="text-foreground">{selectedDetail.danh_muc}</strong></span>
                <span>Ngày gửi: <strong className="text-foreground">{formatDate(selectedDetail.ngay_gui)}</strong></span>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <div className="font-semibold text-foreground mb-1">Nội dung ý kiến:</div>
                <div className="text-muted-foreground whitespace-pre-wrap">{selectedDetail.noi_dung}</div>
              </div>

              {selectedDetail.phan_hoi && (
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="font-semibold text-emerald-800 mb-1">Phản hồi từ Ban quản lý ({selectedDetail.nguoi_phan_hoi}):</div>
                  <div className="text-foreground whitespace-pre-wrap">{selectedDetail.phan_hoi}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedDetail(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Feedback */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md p-5 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Gửi ý kiến đóng góp & đề xuất</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">Tiêu đề ý kiến:</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Tiêu đề vắn tắt..."
                  className="text-xs h-8 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Phân loại danh mục:</label>
                <Select
                  options={[
                    { value: 'Cơ sở vật chất', label: 'Cơ sở vật chất & Tiện ích' },
                    { value: 'Văn hóa & Đời sống', label: 'Văn hóa & Hoạt động tập thể' },
                    { value: 'Quy trình & Chính sách', label: 'Quy trình & Chính sách nội bộ' },
                    { value: 'Môi trường làm việc', label: 'Môi trường làm việc & Đồng nghiệp' },
                  ]}
                  value={newCategory}
                  onChange={setNewCategory}
                  className="text-xs h-8 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Nội dung chi tiết:</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Mô tả cụ thể ý kiến hoặc đề xuất của bạn..."
                  className="w-full text-xs rounded-md border border-input bg-transparent px-3 py-2 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkAnon"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-border text-primary"
                />
                <label htmlFor="chkAnon" className="text-xs text-foreground cursor-pointer flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-500" /> Gửi dưới dạng ẩn danh (Bảo mật tuyệt đối danh tính)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleCreate} className="bg-primary text-white">
                Gửi góp ý
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
