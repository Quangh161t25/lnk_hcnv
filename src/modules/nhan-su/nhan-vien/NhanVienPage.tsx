import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Edit3,
  Hash,
  Lock,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Drawer } from '@/components/ui/Drawer';
import { FormFooter, FormGrid, FormSection } from '@/components/ui/Sections';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';
import { useEmployeeStore, type Employee } from '@/stores/employees';
import { pullEmployees, pushEmployees } from '@/services/employeesSheet';
import type { DataSource } from '@/lib/sheetTable';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { useConfirm } from '@/stores/confirm';
import { toast } from 'sonner';

const STATUS_BADGE = {
  dang_lam_viec: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  thu_viec: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  da_nghi_viec: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABEL = {
  dang_lam_viec: 'Chính thức',
  thu_viec: 'Thử việc',
  da_nghi_viec: 'Đã nghỉ việc',
};

const DEPARTMENTS = [
  'Ban Giám Đốc',
  'Khối Công nghệ',
  'Khối Kế toán',
  'Khối Marketing',
  'Khối HCNS',
];

export default function NhanVienPage() {
  const { employees, addEmployee, deleteEmployee, updateEmployee } = useEmployeeStore();
  const { user: currentUser } = useAuthStore();
  const confirm = useConfirm();

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDept, setFormDept] = useState('Khối Công nghệ');
  const [formPosition, setFormPosition] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'member'>('member');
  const [formContract, setFormContract] = useState<'Chính thức' | 'Thử việc' | 'Thời vụ'>('Chính thức');
  const [formStatus, setFormStatus] = useState<'dang_lam_viec' | 'thu_viec' | 'da_nghi_viec'>('dang_lam_viec');
  const [formStartDate, setFormStartDate] = useState('');
  const [formPassword, setFormPassword] = useState('123456');

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      if (deptFilter !== 'all' && emp.phong_ban !== deptFilter) return false;
      if (statusFilter !== 'all' && emp.trang_thai !== statusFilter) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        emp.ho_ten.toLowerCase().includes(q) ||
        emp.ma_nv.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.sdt.toLowerCase().includes(q) ||
        emp.chuc_vu.toLowerCase().includes(q)
      );
    });
  }, [employees, deptFilter, statusFilter, searchTerm]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [source, setSource] = useState<DataSource | undefined>();

  // Mở trang: lấy danh sách mới nhất từ tab "1. NhanSu_DanhSach".
  useEffect(() => {
    pullEmployees()
      .then(setSource)
      .catch((e: Error) => {
        setSource('local');
        toast.error(`Không tải được danh sách từ Google Sheet: ${e.message}`);
      });
  }, []);

  const handleSyncSheet = async () => {
    setIsSyncing(true);
    try {
      const s = await pullEmployees();
      setSource(s);
      if (s === 'sheet') toast.success('Đã tải lại danh sách nhân sự từ Google Sheet');
      else toast.warning('Chưa kết nối được Google Sheet, đang dùng dữ liệu trên trình duyệt');
    } catch (e) {
      toast.error(`Không thể đồng bộ với Google Sheet: ${e instanceof Error ? e.message : e}`);
    } finally {
      setIsSyncing(false);
    }
  };

  /** Ghi danh sách hiện tại lên Sheet sau mỗi lần thêm/sửa/xóa; lỗi thì tải lại bản thật từ Sheet. */
  const saveToSheet = () => {
    if (source !== 'sheet') return;
    setIsSaving(true);
    pushEmployees(useEmployeeStore.getState().employees)
      .catch((e: Error) => {
        toast.error(`Chưa lưu được lên Google Sheet: ${e.message}`);
        pullEmployees().catch(() => undefined);
      })
      .finally(() => setIsSaving(false));
  };

  const handleExport = () => {
    const dataToExport = filtered.map((e) => ({
      'Mã nhân viên': e.ma_nv,
      'Họ và tên': e.ho_ten,
      'Phòng ban': e.phong_ban,
      'Chức vụ': e.chuc_vu,
      'Email': e.email,
      'Số điện thoại': e.sdt,
      'Loại hợp đồng': e.loai_hop_dong,
      'Ngày vào làm': e.ngay_vao_lam,
      'Trạng thái': STATUS_LABEL[e.trang_thai] || e.trang_thai,
      'Vai trò': e.vai_tro === 'admin' ? 'Quản trị viên' : 'Nhân viên',
      'Mật khẩu': e.mat_khau || '123456',
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'NhanSu');
    XLSX.writeFile(wb, `Danh_sach_nhan_su_VuGia_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Đã xuất danh sách nhân sự ra file Excel');
  };

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormCode(`NV00${employees.length + 1}`);
    setFormEmail('');
    setFormPhone('');
    setFormDept('Khối Công nghệ');
    setFormPosition('');
    setFormRole('member');
    setFormContract('Chính thức');
    setFormStatus('dang_lam_viec');
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormPassword('123456');
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.ho_ten);
    setFormCode(emp.ma_nv);
    setFormEmail(emp.email);
    setFormPhone(emp.sdt);
    setFormDept(emp.phong_ban);
    setFormPosition(emp.chuc_vu);
    setFormRole(emp.vai_tro);
    setFormContract(emp.loai_hop_dong);
    setFormStatus(emp.trang_thai);
    setFormStartDate(emp.ngay_vao_lam || new Date().toISOString().slice(0, 10));
    setFormPassword(emp.mat_khau || '123456');
    setIsDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      toast.error('Vui lòng nhập họ tên và mã nhân viên');
      return;
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        ho_ten: formName.trim(),
        ma_nv: formCode.trim(),
        email: formEmail.trim() || `${formCode.toLowerCase()}@vugia.vn`,
        sdt: formPhone.trim(),
        phong_ban: formDept,
        chuc_vu: formPosition.trim() || 'Nhân viên',
        vai_tro: formRole,
        loai_hop_dong: formContract,
        trang_thai: formStatus,
        ngay_vao_lam: formStartDate,
        mat_khau: formPassword.trim() || '123456',
      });
      saveToSheet();
      toast.success(`Đã cập nhật hồ sơ nhân viên ${formName.trim()}`);
    } else {
      addEmployee({
        ho_ten: formName.trim(),
        ma_nv: formCode.trim(),
        email: formEmail.trim() || `${formCode.toLowerCase()}@vugia.vn`,
        sdt: formPhone.trim() || '0900 000 000',
        phong_ban: formDept,
        chuc_vu: formPosition.trim() || 'Nhân viên',
        vai_tro: formRole,
        loai_hop_dong: formContract,
        ngay_vao_lam: formStartDate || new Date().toISOString().slice(0, 10),
        trang_thai: formStatus,
        mat_khau: formPassword.trim() || '123456',
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formName.trim())}&background=random`,
      });
      saveToSheet();
      toast.success(`Đã thêm nhân viên ${formName.trim()} vào hệ thống`);
    }

    setIsDrawerOpen(false);
  };

  const handleDelete = (emp: Employee) => {
    confirm({
      title: 'Xóa hồ sơ nhân sự',
      message: (
        <div className="space-y-2 text-left py-1">
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa nhân viên <strong className="text-foreground">{emp.ho_ten}</strong> (Mã NV:{' '}
            <span className="font-mono font-bold text-primary">{emp.ma_nv}</span>) khỏi hệ thống?
          </p>
          <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900 leading-relaxed">
            Cảnh báo: Dữ liệu hồ sơ và thông tin đăng nhập của nhân viên này sẽ bị xóa vĩnh viễn khỏi danh bạ nội bộ.
          </div>
        </div>
      ),
      variant: 'danger',
      confirmText: 'Xóa nhân sự',
      cancelText: 'Hủy bỏ',
      onConfirm: () => {
        deleteEmployee(emp.id);
        saveToSheet();
        toast.success(`Đã xóa nhân viên ${emp.ho_ten} thành công`);
      },
    });
  };

  return (
    <div className="flex flex-col h-page relative">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-1.5">
        {/* KPI metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Tổng nhân sự</div>
              <div className="text-base font-bold text-foreground">{employees.length} người</div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Chính thức</div>
              <div className="text-base font-bold text-foreground">
                {employees.filter((e) => e.trang_thai === 'dang_lam_viec').length} người
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <UserCheck size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đang thử việc</div>
              <div className="text-base font-bold text-foreground">
                {employees.filter((e) => e.trang_thai === 'thu_viec').length} người
              </div>
            </div>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Đã nghỉ việc</div>
              <div className="text-base font-bold text-foreground">
                {employees.filter((e) => e.trang_thai === 'da_nghi_viec').length} người
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
                placeholder="Tìm tên, mã NV, email, chức vụ..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Tất cả phòng ban' },
                ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
              ]}
              value={deptFilter}
              onChange={setDeptFilter}
              className="text-xs h-8 w-44"
            />
            <Select
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'dang_lam_viec', label: 'Chính thức' },
                { value: 'thu_viec', label: 'Thử việc' },
                { value: 'da_nghi_viec', label: 'Đã nghỉ việc' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="text-xs h-8 w-36"
            />
          </div>

          <div className="flex items-center gap-2">
            <DataSourceBadge source={source} tab="1. NhanSu_DanhSach" isLoading={!source} isSaving={isSaving} />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncSheet}
              disabled={isSyncing}
              className="h-8 gap-1.5 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
              title="Đồng bộ lại tài khoản và mật khẩu mới nhất từ Google Sheet"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} /> Đồng bộ Sheet
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5 text-xs">
              <Download size={14} /> Xuất Excel
            </Button>
            <Button size="sm" onClick={handleOpenAdd} className="h-8 gap-1.5 text-xs bg-primary text-white shadow-sm">
              <Plus size={14} /> Thêm nhân viên
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[11px]">
                <th className="py-3 px-4">Mã NV</th>
                <th className="py-3 px-4">Họ và tên nhân sự</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Chức vụ</th>
                <th className="py-3 px-4">Email liên hệ</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4 text-center">Hợp đồng</th>
                <th className="py-3 px-4 text-center">Ngày vào làm</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Mật khẩu</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((emp) => {
                const isCurrent = currentUser?.id === emp.id || currentUser?.employee_code === emp.ma_nv;
                return (
                  <tr
                    key={emp.id}
                    onClick={() => handleOpenEdit(emp)}
                    className={`hover:bg-muted/40 cursor-pointer transition-colors ${isCurrent ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-primary">{emp.ma_nv}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={emp.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.ho_ten)}&background=random`}
                          alt={emp.ho_ten}
                          className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            {emp.ho_ten}
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded-full">
                                Bạn
                              </span>
                            )}
                          </div>
                          {emp.vai_tro === 'admin' && (
                            <span className="text-[10px] font-medium text-rose-600">Quản trị viên</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{emp.phong_ban}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{emp.chuc_vu}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{emp.email}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{emp.sdt}</td>
                    <td className="py-3 px-4 text-center">{emp.loai_hop_dong}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(emp.ngay_vao_lam)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE[emp.trang_thai]}`}>
                        {STATUS_LABEL[emp.trang_thai]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-muted text-[11px] text-foreground font-semibold">
                        {emp.mat_khau || '123456'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(emp)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit3 size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(emp)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                          title="Xóa hồ sơ nhân sự"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Drawer Căn Phải (Thêm & Chỉnh sửa nhân viên) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <Drawer
            title={editingEmployee ? `Chỉnh sửa nhân viên: ${editingEmployee.ho_ten}` : 'Thêm mới hồ sơ nhân sự'}
            subtitle={
              editingEmployee
                ? `Mã NV: ${editingEmployee.ma_nv} • ${editingEmployee.chuc_vu} (${editingEmployee.phong_ban})`
                : 'Nhập thông tin nhân sự, phòng ban, chức vụ và tài khoản phân quyền'
            }
            icon={<Users size={20} />}
            maxWidthClass="sm:w-[42rem] sm:min-w-[42rem] sm:max-w-[42rem]"
            onClose={() => setIsDrawerOpen(false)}
            footer={
              <FormFooter
                formId="employee-form"
                onCancel={() => setIsDrawerOpen(false)}
                isEdit={!!editingEmployee}
                saveLabel="Lưu thay đổi"
                createLabel="Thêm nhân viên"
              />
            }
          >
            <form id="employee-form" onSubmit={handleSave} className="space-y-4">
              {/* Section 1: Thông tin cá nhân */}
              <FormSection
                title="Thông tin cơ bản & Định danh"
                icon={<User size={15} className="text-primary" />}
              >
                <FormGrid cols={2}>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Mã nhân viên <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="NV001"
                      icon={<Hash size={14} />}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Họ và tên nhân sự <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Nguyễn Văn An"
                      icon={<User size={14} />}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Email liên hệ
                    </label>
                    <Input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="an.nguyen@vugia.vn"
                      icon={<Mail size={14} />}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Số điện thoại
                    </label>
                    <Input
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="0912 345 678"
                      icon={<Phone size={14} />}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Ngày vào làm
                    </label>
                    <Input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      icon={<Calendar size={14} />}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Trạng thái nhân sự
                    </label>
                    <Select
                      options={[
                        { value: 'dang_lam_viec', label: 'Chính thức (Đang làm việc)' },
                        { value: 'thu_viec', label: 'Thử việc' },
                        { value: 'da_nghi_viec', label: 'Đã nghỉ việc' },
                      ]}
                      value={formStatus}
                      onChange={(v) => setFormStatus(v as 'dang_lam_viec' | 'thu_viec' | 'da_nghi_viec')}
                    />
                  </div>
                </FormGrid>
              </FormSection>

              {/* Section 2: Vị trí, Phòng ban & Phân quyền */}
              <FormSection
                title="Vị trí công tác & Phân quyền tài khoản"
                icon={<Building2 size={15} className="text-primary" />}
              >
                <FormGrid cols={2}>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Phòng ban trực thuộc
                    </label>
                    <Select
                      options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                      value={formDept}
                      onChange={setFormDept}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Chức vụ / Vị trí đảm nhiệm
                    </label>
                    <Input
                      value={formPosition}
                      onChange={(e) => setFormPosition(e.target.value)}
                      placeholder="Ví dụ: Kỹ sư Fullstack, Kế toán..."
                      icon={<Briefcase size={14} />}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Loại hợp đồng lao động
                    </label>
                    <Select
                      options={[
                        { value: 'Chính thức', label: 'Hợp đồng lao động chính thức' },
                        { value: 'Thử việc', label: 'Hợp đồng thử việc' },
                        { value: 'Thời vụ', label: 'Hợp đồng thời vụ / Part-time' },
                      ]}
                      value={formContract}
                      onChange={(v) => setFormContract(v as 'Chính thức' | 'Thử việc' | 'Thời vụ')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Quyền hạn hệ thống
                    </label>
                    <Select
                      options={[
                        { value: 'member', label: 'Nhân viên (Thành viên thông thường)' },
                        { value: 'admin', label: 'Quản trị viên (Toàn quyền quản trị ERP)' },
                      ]}
                      value={formRole}
                      onChange={(v) => setFormRole(v as 'admin' | 'member')}
                    />
                  </div>
                </FormGrid>
              </FormSection>

              {/* Section 3: Tài khoản & Mật khẩu */}
              <FormSection
                title="Tài khoản & Mật khẩu đăng nhập"
                icon={<Lock size={15} className="text-primary" />}
              >
                <FormGrid cols={2}>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Mật khẩu tài khoản
                    </label>
                    <Input
                      type="text"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Mặc định: 123456"
                      icon={<Lock size={14} />}
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Nhân viên sử dụng Mã NV (<span className="font-mono font-semibold">{formCode || '...'}</span>) hoặc Email cùng mật khẩu này để đăng nhập vào hệ thống.
                    </p>
                  </div>
                </FormGrid>
              </FormSection>
            </form>
          </Drawer>
        )}
      </AnimatePresence>
    </div>
  );
}
