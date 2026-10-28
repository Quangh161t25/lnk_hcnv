import { useState, useMemo } from 'react';
import { MapPin, Plus, Search, Download, Edit3, Trash2, Building, Phone, UserCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { useConfirm } from '@/stores/confirm';
import { toast } from 'sonner';

interface Branch {
  id: string;
  ma_chi_nhanh: string;
  ten_chi_nhanh: string;
  dia_chi: string;
  nguoi_phu_trach: string;
  so_dien_thoai: string;
  loai_chi_nhanh: 'Trụ sở chính' | 'Chi nhánh' | 'Văn phòng đại diện';
  trang_thai: string;
}

const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'cn-1',
    ma_chi_nhanh: 'CN-HN-01',
    ten_chi_nhanh: 'Trụ sở chính Hà Nội (Vũ Gia Tower)',
    dia_chi: 'Tầng 6, Tòa nhà Vũ Gia Tower, Số 168 Cầu Giấy, Q. Cầu Giấy, Hà Nội',
    nguoi_phu_trach: 'Vũ Đức Gia (Tổng Giám đốc)',
    so_dien_thoai: '024.3999.8888',
    loai_chi_nhanh: 'Trụ sở chính',
    trang_thai: 'Đang hoạt động',
  },
  {
    id: 'cn-2',
    ma_chi_nhanh: 'CN-HCM-02',
    ten_chi_nhanh: 'Chi nhánh TP. Hồ Chí Minh',
    dia_chi: 'Tầng 12, Tòa nhà Bitexco Financial, Số 2 Hải Triều, Bến Nghé, Quận 1, TP. HCM',
    nguoi_phu_trach: 'Trần Thị Mai (Giám đốc CN Miền Nam)',
    so_dien_thoai: '028.3888.9999',
    loai_chi_nhanh: 'Chi nhánh',
    trang_thai: 'Đang hoạt động',
  },
  {
    id: 'cn-3',
    ma_chi_nhanh: 'CN-DN-03',
    ten_chi_nhanh: 'Chi nhánh Miền Trung - Đà Nẵng',
    dia_chi: 'Số 48 Bạch Đằng, P. Thạch Thang, Q. Hải Châu, TP. Đà Nẵng',
    nguoi_phu_trach: 'Nguyễn Văn An (Trưởng VP Đại diện)',
    so_dien_thoai: '0236.3777.888',
    loai_chi_nhanh: 'Văn phòng đại diện',
    trang_thai: 'Đang hoạt động',
  },
];

export function ChiNhanhPage() {
  const confirm = useConfirm();
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<Omit<Branch, 'id'>>({
    ma_chi_nhanh: '',
    ten_chi_nhanh: '',
    dia_chi: '',
    nguoi_phu_trach: '',
    so_dien_thoai: '',
    loai_chi_nhanh: 'Chi nhánh',
    trang_thai: 'Đang hoạt động',
  });

  const filtered = useMemo(() => {
    return branches.filter((b) => {
      if (statusFilter !== 'all' && b.trang_thai !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.ma_chi_nhanh.toLowerCase().includes(q) ||
        b.ten_chi_nhanh.toLowerCase().includes(q) ||
        b.dia_chi.toLowerCase().includes(q) ||
        b.nguoi_phu_trach.toLowerCase().includes(q)
      );
    });
  }, [branches, search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setFormData({
      ma_chi_nhanh: `CN-${Date.now().toString().slice(-4)}`,
      ten_chi_nhanh: '',
      dia_chi: '',
      nguoi_phu_trach: '',
      so_dien_thoai: '',
      loai_chi_nhanh: 'Chi nhánh',
      trang_thai: 'Đang hoạt động',
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      ma_chi_nhanh: branch.ma_chi_nhanh,
      ten_chi_nhanh: branch.ten_chi_nhanh,
      dia_chi: branch.dia_chi,
      nguoi_phu_trach: branch.nguoi_phu_trach,
      so_dien_thoai: branch.so_dien_thoai,
      loai_chi_nhanh: branch.loai_chi_nhanh,
      trang_thai: branch.trang_thai,
    });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.ma_chi_nhanh.trim() || !formData.ten_chi_nhanh.trim()) {
      toast.error('Vui lòng điền mã và tên chi nhánh');
      return;
    }

    if (editingBranch) {
      setBranches((prev) =>
        prev.map((b) => (b.id === editingBranch.id ? { ...b, ...formData } : b))
      );
      toast.success('Cập nhật thông tin chi nhánh thành công');
    } else {
      const newB: Branch = {
        id: `cn-${Date.now()}`,
        ...formData,
      };
      setBranches((prev) => [...prev, newB]);
      toast.success('Thêm chi nhánh mới thành công');
    }
    setDrawerOpen(false);
  };

  const handleDelete = (b: Branch) => {
    confirm({
      title: 'Xóa chi nhánh',
      message: `Bạn có chắc chắn muốn xóa chi nhánh "${b.ten_chi_nhanh}"?`,
      confirmText: 'Xác nhận xóa',
      variant: 'danger',
      onConfirm: () => {
        setBranches((prev) => prev.filter((item) => item.id !== b.id));
        toast.success('Đã xóa chi nhánh');
      },
    });
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((b) => ({
        'Mã chi nhánh': b.ma_chi_nhanh,
        'Tên chi nhánh': b.ten_chi_nhanh,
        'Loại': b.loai_chi_nhanh,
        'Địa chỉ': b.dia_chi,
        'Người phụ trách': b.nguoi_phu_trach,
        'Số điện thoại': b.so_dien_thoai,
        'Trạng thái': b.trang_thai,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ChiNhanh');
    XLSX.writeFile(wb, `Danh_sach_chi_nhanh_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col h-page relative space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng địa điểm / Chi nhánh</span>
            <Building className="w-4 h-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{branches.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Chi nhánh hoạt động</span>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {branches.filter((b) => b.trang_thai === 'Đang hoạt động').length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Phủ sóng khu vực</span>
            <Building className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">Bắc - Trung - Nam</p>
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
                placeholder="Tìm mã, tên, địa chỉ chi nhánh..."
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
              <span>Thêm chi nhánh</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/50 sticky top-0 border-b border-border text-xs uppercase tracking-wider text-muted-foreground z-10">
              <tr>
                <th className="py-3 px-4 font-semibold">Mã chi nhánh</th>
                <th className="py-3 px-4 font-semibold">Tên chi nhánh / Văn phòng</th>
                <th className="py-3 px-4 font-semibold">Địa chỉ</th>
                <th className="py-3 px-4 font-semibold">Người phụ trách</th>
                <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-foreground">
                    <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-semibold">
                      {b.ma_chi_nhanh}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-fuchsia-500 shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground">{b.ten_chi_nhanh}</span>
                        <div className="text-xs text-muted-foreground">{b.loai_chi_nhanh}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground max-w-sm">
                    {b.dia_chi}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <UserCheck size={14} className="text-primary/70 shrink-0" />
                      <span>{b.nguoi_phu_trach}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <Phone size={12} className="shrink-0" />
                      <span>{b.so_dien_thoai}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        b.trang_thai === 'Đang hoạt động'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {b.trang_thai}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(b)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(b)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <Drawer
          onClose={() => setDrawerOpen(false)}
          title={editingBranch ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
          subtitle="Quản lý mạng lưới chi nhánh, văn phòng đại diện và địa điểm làm việc của Vũ Gia."
        >
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Mã chi nhánh <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.ma_chi_nhanh}
                onChange={(e) => setFormData({ ...formData, ma_chi_nhanh: e.target.value })}
                placeholder="VD: CN-DN-03"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Tên chi nhánh / Văn phòng <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.ten_chi_nhanh}
                onChange={(e) => setFormData({ ...formData, ten_chi_nhanh: e.target.value })}
                placeholder="VD: Chi nhánh Đà Nẵng"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Loại hình cơ sở</label>
              <select
                value={formData.loai_chi_nhanh}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    loai_chi_nhanh: e.target.value as Branch['loai_chi_nhanh'],
                  })
                }
                className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Trụ sở chính">Trụ sở chính</option>
                <option value="Chi nhánh">Chi nhánh</option>
                <option value="Văn phòng đại diện">Văn phòng đại diện</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Địa chỉ chi tiết <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.dia_chi}
                onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Người phụ trách</label>
                <Input
                  value={formData.nguoi_phu_trach}
                  onChange={(e) => setFormData({ ...formData, nguoi_phu_trach: e.target.value })}
                  placeholder="Họ tên giám đốc CN"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Số điện thoại</label>
                <Input
                  value={formData.so_dien_thoai}
                  onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                  placeholder="024.xxxx / 09xx"
                />
              </div>
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
                {editingBranch ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}

export default ChiNhanhPage;
