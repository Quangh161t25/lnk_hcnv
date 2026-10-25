import { useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Clock, Download, Plus, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface Task {
  id: string;
  ma_cv: string;
  tieu_de: string;
  du_an: string;
  uu_tien: 'khan_cap' | 'cao' | 'trung_binh' | 'thap';
  han_chot: string;
  tien_do: number;
  trang_thai: 'can_lam' | 'dang_lam' | 'cho_duyet' | 'hoan_thanh';
}

const INITIAL_TASKS: Task[] = [
  { id: '1', ma_cv: 'TSK-101', tieu_de: 'Hoàn thiện giao diện các module con Hành chính - Nhân sự', du_an: 'Triển khai Hệ thống ERP Vũ Gia', uu_tien: 'cao', han_chot: '2025-02-28', tien_do: 80, trang_thai: 'dang_lam' },
  { id: '2', ma_cv: 'TSK-102', tieu_de: 'Soạn thảo quy trình bảo mật thông tin chuẩn ISO 27001', du_an: 'Nâng cấp chuẩn ISO 27001', uu_tien: 'trung_binh', han_chot: '2025-03-05', tien_do: 40, trang_thai: 'dang_lam' },
  { id: '3', ma_cv: 'TSK-103', tieu_de: 'Gửi báo cáo đánh giá thử việc nhân sự đợt 1 cho BOD', du_an: 'Công việc thường quy HCNS', uu_tien: 'khan_cap', han_chot: '2025-02-25', tien_do: 100, trang_thai: 'cho_duyet' },
  { id: '4', ma_cv: 'TSK-104', tieu_de: 'Cập nhật danh sách thiết bị bàn giao phòng họp Tầng 4', du_an: 'Cải tạo văn phòng Tầng 4', uu_tien: 'thap', han_chot: '2025-02-20', tien_do: 100, trang_thai: 'hoan_thanh' },
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

export default function CongViecCuaToiPage() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.trang_thai !== statusFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return t.tieu_de.toLowerCase().includes(q) || t.ma_cv.toLowerCase().includes(q) || t.du_an.toLowerCase().includes(q);
    });
  }, [tasks, statusFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CongViecCuaToi');
    XLSX.writeFile(wb, `Cong_viec_cua_toi_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleToggleDone = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              trang_thai: t.trang_thai === 'hoan_thanh' ? 'dang_lam' : 'hoan_thanh',
              tien_do: t.trang_thai === 'hoan_thanh' ? 80 : 100,
            }
          : t
      )
    );
    toast.success('Đã cập nhật trạng thái công việc');
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* Metric summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Việc cần xử lý</div>
              <div className="text-base font-bold text-foreground">
                {tasks.filter((t) => t.trang_thai !== 'hoan_thanh').length} việc
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Việc khẩn cấp</div>
              <div className="text-base font-bold text-foreground">
                {tasks.filter((t) => t.uu_tien === 'khan_cap' && t.trang_thai !== 'hoan_thanh').length} việc
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đã hoàn thành</div>
              <div className="text-base font-bold text-foreground">
                {tasks.filter((t) => t.trang_thai === 'hoan_thanh').length} việc
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
                placeholder="Tìm tiêu đề, mã công việc, dự án..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'can_lam', label: 'Cần làm' },
                { value: 'dang_lam', label: 'Đang thực hiện' },
                { value: 'cho_duyet', label: 'Chờ duyệt' },
                { value: 'hoan_thanh', label: 'Đã hoàn thành' },
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
            <Button size="sm" onClick={() => toast.info('Tạo công việc mới')} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Thêm công việc
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Tiêu đề công việc</th>
                <th className="py-3 px-4">Dự án</th>
                <th className="py-3 px-4 text-center">Ưu tiên</th>
                <th className="py-3 px-4 text-center">Hạn chót</th>
                <th className="py-3 px-4 text-center">Tiến độ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={t.trang_thai === 'hoan_thanh'}
                      onChange={() => handleToggleDone(t.id)}
                      className="rounded border-border text-primary cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-primary">{t.ma_cv}</td>
                  <td className="py-3 px-4 font-medium text-foreground">
                    <span className={t.trang_thai === 'hoan_thanh' ? 'line-through text-muted-foreground' : ''}>
                      {t.tieu_de}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{t.du_an}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${PRIORITY_BADGE[t.uu_tien]}`}>
                      {PRIORITY_LABEL[t.uu_tien]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(t.han_chot)}
                    </span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
