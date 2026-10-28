import { useState, useMemo } from 'react';
import { Building2, Plus, Search, Download, Edit3, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { useConfirm } from '@/stores/confirm';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/stores/employees';
import { useSheetTable } from '@/lib/sheetTable';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import departmentsSeed from '@/data/departments.json';

interface Department {
  id: string;
  ma_phong_ban: string;
  ten_phong_ban: string;
  cha_id: string | null;
  cap_do: number;
  duong_dan?: string;
  trang_thai: string;
  thu_tu?: number;
  /** Mã NV trưởng phòng — người duyệt kế hoạch/báo cáo của phòng (và nhóm con). */
  truong_phong?: string;
  tg_tao?: string;
  tg_cap_nhat?: string;
}

export function PhongBanPage() {
  const confirm = useConfirm();
  const deptTable = useSheetTable<Department>('departments', departmentsSeed as Department[]);
  const { rows: departments, setRows: setDepartments } = deptTable;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    ma_phong_ban: '',
    ten_phong_ban: '',
    cap_do: 1,
    cha_id: '',
    trang_thai: 'Đang hoạt động',
    truong_phong: '',
  });
  const employees = useEmployeeStore((s) => s.employees);

  const filtered = useMemo(() => {
    return departments.filter((d) => {
      if (statusFilter !== 'all' && d.trang_thai !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        d.ma_phong_ban.toLowerCase().includes(q) ||
        d.ten_phong_ban.toLowerCase().includes(q)
      );
    });
  }, [departments, search, statusFilter]);

  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.trang_thai === 'Đang hoạt động').length;
    const level1 = departments.filter((d) => d.cap_do === 1).length;
    const level2 = departments.filter((d) => d.cap_do > 1).length;
    return { total, active, level1, level2 };
  }, [departments]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormData({
      ma_phong_ban: `PB-${Date.now().toString().slice(-4)}`,
      ten_phong_ban: '',
      cap_do: 1,
      cha_id: '',
      trang_thai: 'Đang hoạt động',
      truong_phong: '',
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      ma_phong_ban: dept.ma_phong_ban,
      ten_phong_ban: dept.ten_phong_ban,
      cap_do: dept.cap_do,
      cha_id: dept.cha_id || '',
      trang_thai: dept.trang_thai,
      truong_phong: dept.truong_phong ?? '',
    });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.ma_phong_ban.trim() || !formData.ten_phong_ban.trim()) {
      toast.error('Vui lòng điền mã và tên phòng ban');
      return;
    }

    if (editingDept) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editingDept.id
            ? {
                ...d,
                ...formData,
                cha_id: formData.cha_id || null,
                tg_cap_nhat: new Date().toISOString(),
              }
            : d
        )
      );
      toast.success('Cập nhật phòng ban thành công');
    } else {
      const newDept: Department = {
        id: `dep-${Date.now()}`,
        ma_phong_ban: formData.ma_phong_ban.trim(),
        ten_phong_ban: formData.ten_phong_ban.trim(),
        cap_do: Number(formData.cap_do),
        cha_id: formData.cha_id || null,
        trang_thai: formData.trang_thai,
        truong_phong: formData.truong_phong,
        tg_tao: new Date().toISOString(),
        tg_cap_nhat: new Date().toISOString(),
      };
      setDepartments((prev) => [newDept, ...prev]);
      toast.success('Thêm phòng ban mới thành công');
    }
    setDrawerOpen(false);
  };

  const handleDelete = (dept: Department) => {
    confirm({
      title: 'Xóa phòng ban',
      message: `Bạn có chắc chắn muốn xóa phòng ban "${dept.ten_phong_ban}" (${dept.ma_phong_ban})?`,
      confirmText: 'Xác nhận xóa',
      variant: 'danger',
      onConfirm: () => {
        setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
        toast.success('Đã xóa phòng ban');
      },
    });
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((d) => ({
        'Mã phòng ban': d.ma_phong_ban,
        'Tên phòng ban': d.ten_phong_ban,
        'Cấp độ': d.cap_do,
        'Trạng thái': d.trang_thai,
        'Thời gian cập nhật': d.tg_cap_nhat || d.tg_tao || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PhongBan');
    XLSX.writeFile(wb, `Danh_sach_phong_ban_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng phòng ban</span>
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Đang hoạt động</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Phòng ban cấp 1</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{stats.level1}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Bộ phận trực thuộc</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{stats.level2}</p>
        </div>
      </div>

      <div className="flex justify-end -mt-1 -mb-1">
        <DataSourceBadge source={deptTable.source} tab="2. CoCau_PhongBan" isLoading={deptTable.isLoading} isSaving={deptTable.isSaving} />
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
                placeholder="Tìm mã hoặc tên phòng ban..."
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
              <span>Thêm phòng ban</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/50 sticky top-0 border-b border-border text-xs uppercase tracking-wider text-muted-foreground z-10">
              <tr>
                <th className="py-3 px-4 font-semibold">Mã phòng ban</th>
                <th className="py-3 px-4 font-semibold">Tên phòng ban</th>
                <th className="py-3 px-4 font-semibold text-center">Cấp độ</th>
                <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy phòng ban nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((dept) => (
                  <tr key={dept.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-foreground">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-semibold">
                        {dept.ma_phong_ban}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-primary/70 shrink-0" />
                        <span>{dept.ten_phong_ban}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Cấp {dept.cap_do}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          dept.trang_thai === 'Đang hoạt động'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {dept.trang_thai}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(dept)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(dept)}
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

      {/* Right Drawer for Create / Edit */}
      {drawerOpen && (
        <Drawer
          onClose={() => setDrawerOpen(false)}
          title={editingDept ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
          subtitle="Quản lý cơ cấu đơn vị và phân cấp phòng ban trong hệ thống Vũ Gia."
        >
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Mã phòng ban <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.ma_phong_ban}
                onChange={(e) => setFormData({ ...formData, ma_phong_ban: e.target.value })}
                placeholder="VD: PB-HCNS"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Tên phòng ban <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.ten_phong_ban}
                onChange={(e) => setFormData({ ...formData, ten_phong_ban: e.target.value })}
                placeholder="VD: Phòng Hành chính - Nhân sự"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Cấp độ</label>
              <select
                value={formData.cap_do.toString()}
                onChange={(e) => setFormData({ ...formData, cap_do: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="1">Cấp 1 (Khối / Ban Giám đốc / Phòng lớn)</option>
                <option value="2">Cấp 2 (Tổ / Đội / Nhóm trực thuộc)</option>
                <option value="3">Cấp 3 (Tiểu ban chuyên trách)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Phòng ban cấp trên</label>
              <select
                value={formData.cha_id}
                onChange={(e) => setFormData({ ...formData, cha_id: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">(Không có - là cấp cao nhất)</option>
                {departments
                  .filter((d) => !editingDept || d.id !== editingDept.id)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.ten_phong_ban} ({d.ma_phong_ban})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Trưởng phòng (người duyệt kế hoạch / báo cáo)</label>
              <select
                value={formData.truong_phong}
                onChange={(e) => setFormData({ ...formData, truong_phong: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">(Chưa chỉ định)</option>
                {employees.map((e) => (
                  <option key={e.ma_nv} value={e.ma_nv}>
                    {e.ho_ten} ({e.ma_nv})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Trạng thái hoạt động</label>
              <select
                value={formData.trang_thai}
                onChange={(e) => setFormData({ ...formData, trang_thai: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Ngừng hoạt động">Ngừng hoạt động</option>
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave}>
                {editingDept ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}

export default PhongBanPage;
