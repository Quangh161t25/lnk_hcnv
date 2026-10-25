import { useMemo, useState } from 'react';
import { Download, MinusCircle, Plus, PlusCircle, Search, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

interface PointRecord {
  id: string;
  ma_nv: string;
  ho_ten: string;
  phong_ban: string;
  loai: 'cong' | 'tru';
  so_diem: number;
  so_tien?: number;
  ly_do: string;
  thang_ap_dung: string;
  nguoi_tao: string;
  ngay_tao: string;
}

const INITIAL_RECORDS: PointRecord[] = [
  { id: '1', ma_nv: 'NV001', ho_ten: 'Nguyễn Văn An', phong_ban: 'Phòng Công nghệ', loai: 'cong', so_diem: 5, so_tien: 500000, ly_do: 'Hỗ trợ khách hàng ngoài giờ xử lý sự cố server', thang_ap_dung: '2025-02', nguoi_tao: 'Trần Minh Quân', ngay_tao: '2025-02-18' },
  { id: '2', ma_nv: 'NV002', ho_ten: 'Trần Thị Mai', phong_ban: 'Phòng Kế toán', loai: 'cong', so_diem: 3, so_tien: 300000, ly_do: 'Hoàn thành báo cáo thuế quyết toán sớm hơn kế hoạch 3 ngày', thang_ap_dung: '2025-02', nguoi_tao: 'Vũ Thị Hồng', ngay_tao: '2025-02-20' },
  { id: '3', ma_nv: 'NV003', ho_ten: 'Lê Hoàng Nam', phong_ban: 'Phòng Marketing', loai: 'tru', so_diem: 2, so_tien: 200000, ly_do: 'Đi muộn không báo trước quá số lần quy định', thang_ap_dung: '2025-02', nguoi_tao: 'Phạm Thu Hương', ngay_tao: '2025-02-22' },
];

export default function DiemCongTruPage() {
  const [records, setRecords] = useState<PointRecord[]>(INITIAL_RECORDS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cong' | 'tru'>('all');
  const [monthFilter, setMonthFilter] = useState('2025-02');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New record form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'cong' | 'tru'>('cong');
  const [formPoints, setFormPoints] = useState('5');
  const [formReason, setFormReason] = useState('');

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (monthFilter && r.thang_ap_dung !== monthFilter) return false;
      if (typeFilter !== 'all' && r.loai !== typeFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return r.ho_ten.toLowerCase().includes(q) || r.ma_nv.toLowerCase().includes(q) || r.ly_do.toLowerCase().includes(q);
    });
  }, [records, monthFilter, typeFilter, searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DiemCongTru');
    XLSX.writeFile(wb, `Diem_cong_tru_${monthFilter}.xlsx`);
  };

  const handleCreate = () => {
    if (!formName.trim() || !formReason.trim()) {
      toast.error('Vui lòng điền đủ tên nhân viên và lý do');
      return;
    }
    const newRec: PointRecord = {
      id: String(Date.now()),
      ma_nv: `NV00${Math.floor(Math.random() * 90 + 10)}`,
      ho_ten: formName.trim(),
      phong_ban: 'Phòng ban công ty',
      loai: formType,
      so_diem: Number(formPoints) || 1,
      so_tien: (Number(formPoints) || 1) * 100000,
      ly_do: formReason.trim(),
      thang_ap_dung: monthFilter,
      nguoi_tao: 'Quản trị viên',
      ngay_tao: new Date().toISOString().slice(0, 10),
    };
    setRecords((prev) => [newRec, ...prev]);
    setIsModalOpen(false);
    setFormName('');
    setFormReason('');
    toast.success(`Đã thêm bản ghi điểm ${formType === 'cong' ? 'cộng' : 'trừ'} thành công`);
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast.success('Đã xóa bản ghi điểm');
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
                placeholder="Tìm tên, mã NV, lý do..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: '2025-02', label: 'Tháng 02/2025' },
                { value: '2025-01', label: 'Tháng 01/2025' },
                { value: '2024-12', label: 'Tháng 12/2024' },
              ]}
              value={monthFilter}
              onChange={setMonthFilter}
              className="text-xs h-8 w-36"
            />
            <Select
              options={[
                { value: 'all', label: 'Tất cả loại điểm' },
                { value: 'cong', label: 'Chỉ điểm cộng (+)' },
                { value: 'tru', label: 'Chỉ điểm trừ (-)' },
              ]}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val as 'all' | 'cong' | 'tru')}
              className="text-xs h-8 w-40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={() => setIsModalOpen(true)} className="h-8 gap-1.5 text-xs bg-primary text-white">
              <Plus size={14} /> Thêm ghi nhận
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã NV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4 text-center">Phân loại</th>
                <th className="py-3 px-4 text-center">Số điểm</th>
                <th className="py-3 px-4">Lý do ghi nhận</th>
                <th className="py-3 px-4">Người ghi nhận</th>
                <th className="py-3 px-4 text-center">Ngày tạo</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono font-medium text-primary">{r.ma_nv}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{r.ho_ten}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.phong_ban}</td>
                  <td className="py-3 px-4 text-center">
                    {r.loai === 'cong' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                        <PlusCircle size={12} /> Điểm cộng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 border border-rose-500/30">
                        <MinusCircle size={12} /> Điểm trừ
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-bold">
                    <span className={r.loai === 'cong' ? 'text-emerald-600' : 'text-rose-600'}>
                      {r.loai === 'cong' ? `+${r.so_diem}` : `-${r.so_diem}`} điểm
                    </span>
                  </td>
                  <td className="py-3 px-4 text-foreground max-w-xs">{r.ly_do}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.nguoi_tao}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(r.ngay_tao)}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600">
                      <Trash2 size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md p-5 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Ghi nhận điểm cộng / trừ</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">Họ tên nhân viên:</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="text-xs h-8 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Loại điểm:</label>
                <div className="flex gap-4 mt-1 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ptype"
                      checked={formType === 'cong'}
                      onChange={() => setFormType('cong')}
                    />
                    <span className="text-emerald-600 font-medium">Điểm cộng (+)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ptype"
                      checked={formType === 'tru'}
                      onChange={() => setFormType('tru')}
                    />
                    <span className="text-rose-600 font-medium">Điểm trừ (-)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Số điểm:</label>
                <Input
                  type="number"
                  value={formPoints}
                  onChange={(e) => setFormPoints(e.target.value)}
                  placeholder="5"
                  className="text-xs h-8 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Lý do ghi nhận:</label>
                <Input
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Lý do chi tiết..."
                  className="text-xs h-8 mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleCreate} className="bg-primary text-white">
                Ghi nhận
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
