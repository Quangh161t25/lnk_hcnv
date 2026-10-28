import { useState, useMemo } from 'react';
import { Briefcase, Plus, Search, Download, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { useConfirm } from '@/stores/confirm';
import { toast } from 'sonner';
import positionsSeed from '@/data/positions.json';
import departmentsSeed from '@/data/departments.json';

interface Position {
  id: string;
  ma_chuc_vu: string;
  ten_chuc_vu: string;
  phong_ban_id?: string;
  ten_phong_ban?: string;
  cap_bac_id?: string;
  ten_cap_bac?: string;
  mo_ta?: string | null;
  trang_thai: string;
  thu_tu?: number;
  tg_cap_nhat?: string;
}

export function ChucVuPage() {
  const confirm = useConfirm();
  const [positions, setPositions] = useState<Position[]>(() => positionsSeed as Position[]);
  const [departments] = useState(departmentsSeed);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [formData, setFormData] = useState({
    ma_chuc_vu: '',
    ten_chuc_vu: '',
    phong_ban_id: '',
    ten_cap_bac: 'Chuyên viên',
    trang_thai: 'Đang hoạt động',
    mo_ta: '',
  });

  const filtered = useMemo(() => {
    return positions.filter((p) => {
      if (statusFilter !== 'all' && p.trang_thai !== statusFilter) return false;
      if (deptFilter !== 'all' && p.phong_ban_id !== deptFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.ma_chuc_vu.toLowerCase().includes(q) ||
        p.ten_chuc_vu.toLowerCase().includes(q) ||
        (p.ten_phong_ban && p.ten_phong_ban.toLowerCase().includes(q))
      );
    });
  }, [positions, search, deptFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = positions.length;
    const active = positions.filter((p) => p.trang_thai === 'Đang hoạt động').length;
    return { total, active };
  }, [positions]);

  const handleOpenCreate = () => {
    setEditingPos(null);
    setFormData({
      ma_chuc_vu: `CV-${Date.now().toString().slice(-4)}`,
      ten_chuc_vu: '',
      phong_ban_id: departments[0]?.id || '',
      ten_cap_bac: 'Chuyên viên',
      trang_thai: 'Đang hoạt động',
      mo_ta: '',
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (pos: Position) => {
    setEditingPos(pos);
    setFormData({
      ma_chuc_vu: pos.ma_chuc_vu,
      ten_chuc_vu: pos.ten_chuc_vu,
      phong_ban_id: pos.phong_ban_id || '',
      ten_cap_bac: pos.ten_cap_bac || 'Chuyên viên',
      trang_thai: pos.trang_thai,
      mo_ta: pos.mo_ta || '',
    });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.ma_chuc_vu.trim() || !formData.ten_chuc_vu.trim()) {
      toast.error('Vui lòng điền mã và tên chức vụ');
      return;
    }

    const deptObj = departments.find((d) => d.id === formData.phong_ban_id);
    const ten_phong_ban = deptObj?.ten_phong_ban || '';

    if (editingPos) {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === editingPos.id
            ? {
                ...p,
                ...formData,
                ten_phong_ban,
                tg_cap_nhat: new Date().toISOString(),
              }
            : p
        )
      );
      toast.success('Cập nhật chức vụ thành công');
    } else {
      const newPos: Position = {
        id: `pos-${Date.now()}`,
        ma_chuc_vu: formData.ma_chuc_vu.trim(),
        ten_chuc_vu: formData.ten_chuc_vu.trim(),
        phong_ban_id: formData.phong_ban_id,
        ten_phong_ban,
        ten_cap_bac: formData.ten_cap_bac,
        trang_thai: formData.trang_thai,
        mo_ta: formData.mo_ta,
        tg_cap_nhat: new Date().toISOString(),
      };
      setPositions((prev) => [newPos, ...prev]);
      toast.success('Thêm chức vụ mới thành công');
    }
    setDrawerOpen(false);
  };

  const handleDelete = (pos: Position) => {
    confirm({
      title: 'Xóa chức vụ',
      message: `Bạn có chắc chắn muốn xóa chức vụ "${pos.ten_chuc_vu}" (${pos.ma_chuc_vu})?`,
      confirmText: 'Xác nhận xóa',
      variant: 'danger',
      onConfirm: () => {
        setPositions((prev) => prev.filter((p) => p.id !== pos.id));
        toast.success('Đã xóa chức vụ');
      },
    });
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((p) => ({
        'Mã chức vụ': p.ma_chuc_vu,
        'Tên chức vụ': p.ten_chuc_vu,
        'Phòng ban': p.ten_phong_ban || '',
        'Cấp bậc': p.ten_cap_bac || '',
        'Trạng thái': p.trang_thai,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ChucVu');
    XLSX.writeFile(wb, `Danh_sach_chuc_vu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng vị trí chức vụ</span>
            <Briefcase className="w-4 h-4 text-primary" />
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
            <span className="text-xs font-medium text-muted-foreground">Phòng ban có chức vụ</span>
            <Briefcase className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{departments.length}</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-xl flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã hoặc tên chức vụ..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-44"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.ten_phong_ban}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-36"
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
              <span>Thêm chức vụ</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/50 sticky top-0 border-b border-border text-xs uppercase tracking-wider text-muted-foreground z-10">
              <tr>
                <th className="py-3 px-4 font-semibold">Mã chức vụ</th>
                <th className="py-3 px-4 font-semibold">Tên chức vụ</th>
                <th className="py-3 px-4 font-semibold">Thuộc phòng ban</th>
                <th className="py-3 px-4 font-semibold">Cấp bậc</th>
                <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy chức vụ nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((pos) => (
                  <tr key={pos.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-foreground">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-semibold">
                        {pos.ma_chuc_vu}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-primary/70 shrink-0" />
                        <span>{pos.ten_chuc_vu}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {pos.ten_phong_ban || 'Toàn công ty'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {pos.ten_cap_bac || 'Chuyên viên'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          pos.trang_thai === 'Đang hoạt động'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {pos.trang_thai}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(pos)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pos)}
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
          title={editingPos ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'}
          subtitle="Quản lý danh sách các vị trí công tác và mô tả chức danh tại Vũ Gia."
        >
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Mã chức vụ <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.ma_chuc_vu}
                onChange={(e) => setFormData({ ...formData, ma_chuc_vu: e.target.value })}
                placeholder="VD: CV-TP-HCNS"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Tên chức vụ <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.ten_chuc_vu}
                onChange={(e) => setFormData({ ...formData, ten_chuc_vu: e.target.value })}
                placeholder="VD: Trưởng phòng Hành chính - Nhân sự"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Phòng ban</label>
              <select
                value={formData.phong_ban_id}
                onChange={(e) => setFormData({ ...formData, phong_ban_id: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.ten_phong_ban}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Cấp bậc tương ứng</label>
              <select
                value={formData.ten_cap_bac}
                onChange={(e) => setFormData({ ...formData, ten_cap_bac: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Giám đốc">Giám đốc</option>
                <option value="Phó giám đốc">Phó giám đốc</option>
                <option value="Trưởng phòng">Trưởng phòng</option>
                <option value="Phó phòng">Phó phòng</option>
                <option value="Trưởng nhóm">Trưởng nhóm</option>
                <option value="Chuyên viên">Chuyên viên</option>
                <option value="Nhân viên">Nhân viên</option>
                <option value="Thực tập sinh">Thực tập sinh</option>
              </select>
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
              <label className="text-sm font-medium text-foreground">Mô tả công việc tóm tắt</label>
              <textarea
                value={formData.mo_ta}
                onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                rows={3}
                placeholder="Tóm tắt trách nhiệm chính của vị trí..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave}>
                {editingPos ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}

export default ChucVuPage;
