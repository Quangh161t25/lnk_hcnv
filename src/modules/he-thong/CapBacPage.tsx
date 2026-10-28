import { useState, useMemo } from 'react';
import { ListOrdered, Plus, Search, Download, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { useConfirm } from '@/stores/confirm';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import jobLevelsSeed from '@/data/jobLevels.json';

interface JobLevel {
  id: string;
  ma_cap_bac: string;
  ten_cap_bac: string;
  thu_tu: number;
  luong_co_ban: number;
  mo_ta?: string;
  trang_thai: string;
  tg_cap_nhat?: string;
}

export function CapBacPage() {
  const confirm = useConfirm();
  const [jobLevels, setJobLevels] = useState<JobLevel[]>(() => jobLevelsSeed as JobLevel[]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLvl, setEditingLvl] = useState<JobLevel | null>(null);
  const [formData, setFormData] = useState({
    ma_cap_bac: '',
    ten_cap_bac: '',
    thu_tu: 1,
    luong_co_ban: 15000000,
    mo_ta: '',
    trang_thai: 'Đang hoạt động',
  });

  const filtered = useMemo(() => {
    return jobLevels.filter((lvl) => {
      if (statusFilter !== 'all' && lvl.trang_thai !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        lvl.ma_cap_bac.toLowerCase().includes(q) ||
        lvl.ten_cap_bac.toLowerCase().includes(q) ||
        (lvl.mo_ta && lvl.mo_ta.toLowerCase().includes(q))
      );
    });
  }, [jobLevels, search, statusFilter]);

  const stats = useMemo(() => {
    const total = jobLevels.length;
    const active = jobLevels.filter((l) => l.trang_thai === 'Đang hoạt động').length;
    const avgSalary =
      total > 0
        ? Math.round(jobLevels.reduce((acc, curr) => acc + (curr.luong_co_ban || 0), 0) / total)
        : 0;
    return { total, active, avgSalary };
  }, [jobLevels]);

  const handleOpenCreate = () => {
    setEditingLvl(null);
    setFormData({
      ma_cap_bac: `L_${(jobLevels.length + 1).toString().padStart(2, '0')}`,
      ten_cap_bac: '',
      thu_tu: jobLevels.length + 1,
      luong_co_ban: 15000000,
      mo_ta: '',
      trang_thai: 'Đang hoạt động',
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (lvl: JobLevel) => {
    setEditingLvl(lvl);
    setFormData({
      ma_cap_bac: lvl.ma_cap_bac,
      ten_cap_bac: lvl.ten_cap_bac,
      thu_tu: lvl.thu_tu,
      luong_co_ban: lvl.luong_co_ban,
      mo_ta: lvl.mo_ta || '',
      trang_thai: lvl.trang_thai,
    });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.ma_cap_bac.trim() || !formData.ten_cap_bac.trim()) {
      toast.error('Vui lòng điền mã và tên cấp bậc');
      return;
    }

    if (editingLvl) {
      setJobLevels((prev) =>
        prev.map((l) =>
          l.id === editingLvl.id
            ? {
                ...l,
                ...formData,
                tg_cap_nhat: new Date().toISOString(),
              }
            : l
        )
      );
      toast.success('Cập nhật cấp bậc thành công');
    } else {
      const newLvl: JobLevel = {
        id: `lvl-${Date.now()}`,
        ma_cap_bac: formData.ma_cap_bac.trim(),
        ten_cap_bac: formData.ten_cap_bac.trim(),
        thu_tu: Number(formData.thu_tu),
        luong_co_ban: Number(formData.luong_co_ban),
        mo_ta: formData.mo_ta,
        trang_thai: formData.trang_thai,
        tg_cap_nhat: new Date().toISOString(),
      };
      setJobLevels((prev) => [...prev, newLvl]);
      toast.success('Thêm cấp bậc mới thành công');
    }
    setDrawerOpen(false);
  };

  const handleDelete = (lvl: JobLevel) => {
    confirm({
      title: 'Xóa cấp bậc',
      message: `Bạn có chắc chắn muốn xóa cấp bậc "${lvl.ten_cap_bac}" (${lvl.ma_cap_bac})?`,
      confirmText: 'Xác nhận xóa',
      variant: 'danger',
      onConfirm: () => {
        setJobLevels((prev) => prev.filter((l) => l.id !== lvl.id));
        toast.success('Đã xóa cấp bậc');
      },
    });
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((l) => ({
        'Thứ tự': l.thu_tu,
        'Mã cấp bậc': l.ma_cap_bac,
        'Tên cấp bậc': l.ten_cap_bac,
        'Lương cơ bản': l.luong_co_ban,
        'Mô tả': l.mo_ta || '',
        'Trạng thái': l.trang_thai,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CapBac');
    XLSX.writeFile(wb, `Danh_sach_cap_bac_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng cấp bậc / Level</span>
            <ListOrdered className="w-4 h-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Đang áp dụng</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Lương cơ bản bình quân</span>
            <ListOrdered className="w-4 h-4 text-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(stats.avgSalary)}</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã hoặc tên cấp bậc..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-40"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Đang hoạt động">Đang hoạt động</option>
              <option value="Ngừng hoạt động">Ngừng hoạt động</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="h-9 gap-1.5 shadow-xs">
              <Download size={15} />
              <span className="hidden sm:inline">Xuất Excel</span>
            </Button>
            <Button size="sm" onClick={handleOpenCreate} className="h-9 gap-1.5 shadow-xs">
              <Plus size={15} />
              <span>Thêm cấp bậc</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/50 sticky top-0 border-b border-border text-xs uppercase tracking-wider text-muted-foreground z-10">
              <tr>
                <th className="py-3 px-4 font-semibold text-center w-16">Thứ tự</th>
                <th className="py-3 px-4 font-semibold">Mã cấp bậc</th>
                <th className="py-3 px-4 font-semibold">Tên cấp bậc</th>
                <th className="py-3 px-4 font-semibold text-right">Lương cơ bản</th>
                <th className="py-3 px-4 font-semibold">Mô tả</th>
                <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy cấp bậc nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((lvl) => (
                  <tr key={lvl.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                      #{lvl.thu_tu}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-foreground">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-semibold">
                        {lvl.ma_cap_bac}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {lvl.ten_cap_bac}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600 font-mono">
                      {formatCurrency(lvl.luong_co_ban)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs truncate">
                      {lvl.mo_ta || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          lvl.trang_thai === 'Đang hoạt động'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {lvl.trang_thai}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(lvl)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(lvl)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <Drawer
          onClose={() => setDrawerOpen(false)}
          title={editingLvl ? 'Chỉnh sửa cấp bậc' : 'Thêm cấp bậc mới'}
          subtitle="Quản lý hệ thống thang bảng lương, level và cấp độ nghề nghiệp tại Vũ Gia."
        >
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Mã cấp bậc <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.ma_cap_bac}
                  onChange={(e) => setFormData({ ...formData, ma_cap_bac: e.target.value })}
                  placeholder="VD: L_01"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Thứ tự ưu tiên <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.thu_tu}
                  onChange={(e) => setFormData({ ...formData, thu_tu: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Tên cấp bậc <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.ten_cap_bac}
                onChange={(e) => setFormData({ ...formData, ten_cap_bac: e.target.value })}
                placeholder="VD: Trưởng phòng"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Lương cơ bản định mức (VNĐ) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                step="500000"
                value={formData.luong_co_ban}
                onChange={(e) => setFormData({ ...formData, luong_co_ban: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Trạng thái</label>
              <select
                value={formData.trang_thai}
                onChange={(e) => setFormData({ ...formData, trang_thai: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Ngừng hoạt động">Ngừng hoạt động</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Mô tả tiêu chuẩn năng lực</label>
              <textarea
                value={formData.mo_ta}
                onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                rows={3}
                placeholder="Yêu cầu về kinh nghiệm, trách nhiệm cấp bậc..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave}>
                {editingLvl ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}

export default CapBacPage;
