import { useMemo, useState } from 'react';
import { Bell, Check, Download, Eye, Plus, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface ManagedTask {
  id: string;
  ma_cv: string;
  tieu_de: string;
  nguoi_thuc_hien: string;
  phong_ban: string;
  du_an: string;
  uu_tien: 'khan_cap' | 'cao' | 'trung_binh' | 'thap';
  han_chot: string;
  tien_do: number;
  trang_thai: 'can_lam' | 'dang_lam' | 'cho_duyet' | 'hoan_thanh';
}

const INITIAL_MANAGED: ManagedTask[] = [
  { id: '1', ma_cv: 'TSK-101', tieu_de: 'Hoàn thiện giao diện các module con Hành chính - Nhân sự', nguoi_thuc_hien: 'Nguyễn Văn An', phong_ban: 'Khối Công nghệ', du_an: 'Triển khai ERP Vũ Gia', uu_tien: 'cao', han_chot: '2025-02-28', tien_do: 80, trang_thai: 'dang_lam' },
  { id: '2', ma_cv: 'TSK-102', tieu_de: 'Lập báo cáo đối chiếu công nợ nhà cung cấp dịch vụ văn phòng', nguoi_thuc_hien: 'Trần Thị Mai', phong_ban: 'Khối Kế toán', du_an: 'Báo cáo tài chính định kỳ', uu_tien: 'trung_binh', han_chot: '2025-02-26', tien_do: 100, trang_thai: 'cho_duyet' },
  { id: '3', ma_cv: 'TSK-103', tieu_de: 'Chạy chiến dịch quảng bá tuyển dụng trên LinkedIn & TopCV', nguoi_thuc_hien: 'Lê Hoàng Nam', phong_ban: 'Khối Marketing', du_an: 'Chiến dịch tuyển dụng Q1', uu_tien: 'khan_cap', han_chot: '2025-02-25', tien_do: 60, trang_thai: 'dang_lam' },
  { id: '4', ma_cv: 'TSK-104', tieu_de: 'Tổ chức phỏng vấn chuyên môn 3 ứng viên React Developer', nguoi_thuc_hien: 'Phạm Thu Hương', phong_ban: 'Khối HCNS', du_an: 'Tuyển dụng Kỹ sư IT', uu_tien: 'cao', han_chot: '2025-02-24', tien_do: 100, trang_thai: 'hoan_thanh' },
];

const PRIORITY_BADGE = {
  khan_cap: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  cao: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  trung_binh: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  thap: 'bg-muted text-muted-foreground border-border',
};

const PRIORITY_LABEL = {
  khan_cap: 'Khẩn cấp',
  cao: 'Cao',
  trung_binh: 'Trung bình',
  thap: 'Thấp',
};

const STATUS_BADGE = {
  can_lam: 'bg-muted text-muted-foreground border-border',
  dang_lam: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  cho_duyet: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  hoan_thanh: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

const STATUS_LABEL = {
  can_lam: 'Cần làm',
  dang_lam: 'Đang thực hiện',
  cho_duyet: 'Chờ duyệt',
  hoan_thanh: 'Đã hoàn thành',
};

export default function CongViecToiQuanLyPage() {
  const [tasks, setTasks] = useState(INITIAL_MANAGED);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.trang_thai !== statusFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return t.tieu_de.toLowerCase().includes(q) || t.ma_cv.toLowerCase().includes(q) || t.nguoi_thuc_hien.toLowerCase().includes(q) || t.du_an.toLowerCase().includes(q);
    });
  }, [tasks, statusFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CongViecToiQuanLy');
    XLSX.writeFile(wb, `Cong_viec_toi_quan_ly_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleApprove = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, trang_thai: 'hoan_thanh', tien_do: 100 } : t)));
    toast.success('Đã phê duyệt nghiệm thu công việc');
  };

  const handleRemind = (name: string) => {
    toast.success(`Đã gửi thông báo nhắc nhở tiến độ tới ${name}`);
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/20">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tiêu đề, nhân sự, dự án..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'can_lam', label: 'Cần làm' },
                { value: 'dang_lam', label: 'Đang thực hiện' },
                { value: 'cho_duyet', label: 'Chờ duyệt nghiệm thu' },
                { value: 'hoan_thanh', label: 'Đã hoàn thành' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="text-xs h-8 w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => toast.info('Giao việc mới cho nhân sự')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Giao việc mới
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Tiêu đề công việc</th>
                <th className="py-3 px-4">Nhân sự thực hiện</th>
                <th className="py-3 px-4">Khối / Phòng ban</th>
                <th className="py-3 px-4">Dự án</th>
                <th className="py-3 px-4 text-center">Ưu tiên</th>
                <th className="py-3 px-4 text-center">Hạn chót</th>
                <th className="py-3 px-4 text-center">Tiến độ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{t.ma_cv}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{t.tieu_de}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{t.nguoi_thuc_hien}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.phong_ban}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.du_an}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${PRIORITY_BADGE[t.uu_tien]}`}>
                      {PRIORITY_LABEL[t.uu_tien]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground text-[11px]">
                    {formatDate(t.han_chot)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${t.tien_do}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-foreground">{t.tien_do}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[t.trang_thai]}`}>
                      {STATUS_LABEL[t.trang_thai]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {t.trang_thai === 'cho_duyet' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(t.id)}
                          className="h-7 text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        >
                          <Check size={12} /> Duyệt
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemind(t.nguoi_thuc_hien)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-600"
                        title="Nhắc nhở tiến độ"
                      >
                        <Bell size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info(`Xem tiến độ chi tiết của ${t.ma_cv}`)}
                        className="h-7 w-7 p-0"
                      >
                        <Eye size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
