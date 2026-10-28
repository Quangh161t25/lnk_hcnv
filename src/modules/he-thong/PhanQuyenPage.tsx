import { useState } from 'react';
import { Shield, Check, Lock, Save, Users, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

interface PermissionItem {
  id: string;
  name: string;
  description: string;
  category: string;
}

const PERMISSIONS: PermissionItem[] = [
  // Hành chính
  { id: 'hc_view', name: 'Xem thông tin Hành chính', description: 'Xem chấm công, tài liệu và danh mục tài sản', category: 'Phân hệ Hành chính' },
  { id: 'hc_create', name: 'Tạo phiếu & đề xuất', description: 'Lập phiếu xin nghỉ, công tác, đề xuất xe và cấp phát', category: 'Phân hệ Hành chính' },
  { id: 'hc_approve', name: 'Duyệt phiếu & Chấm công', description: 'Phê duyệt phiếu hành chính, duyệt bảng chấm công và KPI', category: 'Phân hệ Hành chính' },
  { id: 'hc_salary', name: 'Quản trị bảng lương', description: 'Chốt bảng lương tháng, xuất phiếu lương nhân viên', category: 'Phân hệ Hành chính' },

  // Nhân sự
  { id: 'ns_view', name: 'Xem hồ sơ nhân sự', description: 'Xem danh sách và thông tin liên hệ của nhân viên', category: 'Phân hệ Nhân sự' },
  { id: 'ns_manage', name: 'Quản lý nhân viên', description: 'Thêm mới, chỉnh sửa thông tin nhân sự và đồng bộ Google Sheet', category: 'Phân hệ Nhân sự' },
  { id: 'ns_recruitment', name: 'Quản lý tuyển dụng', description: 'Đăng đề xuất, quản lý ứng viên, xếp lịch phỏng vấn và gửi thư', category: 'Phân hệ Nhân sự' },
  { id: 'ns_contracts', name: 'Quản lý hợp đồng', description: 'Soạn thảo, ký duyệt và thanh lý hợp đồng lao động', category: 'Phân hệ Nhân sự' },

  // Hệ thống
  { id: 'sys_config', name: 'Cấu hình pháp nhân & chi nhánh', description: 'Chỉnh sửa thông tin công ty, chi nhánh, phòng ban, chức vụ', category: 'Quản trị Hệ thống' },
  { id: 'sys_roles', name: 'Phân quyền & Tài khoản', description: 'Thiết lập vai trò, cấp quyền truy cập và đổi mật khẩu', category: 'Quản trị Hệ thống' },
  { id: 'sys_backup', name: 'Sao lưu & Phục hồi', description: 'Xuất bản sao lưu toàn hệ thống và khôi phục dữ liệu', category: 'Quản trị Hệ thống' },

  // Trợ lý AI
  { id: 'ai_access', name: 'Sử dụng Trợ lý AI', description: 'Truy cập kênh chat AI và tra cứu nghiệp vụ thông minh', category: 'Trợ lý AI' },
];

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem?: boolean;
  permissions: string[];
}

const INITIAL_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Quản trị tối cao (Admin)',
    description: 'Toàn quyền truy cập và thiết lập mọi module trên hệ thống ERP Vũ Gia.',
    isSystem: true,
    permissions: PERMISSIONS.map((p) => p.id),
  },
  {
    id: 'hr_manager',
    name: 'Quản lý Hành chính - Nhân sự',
    description: 'Quản lý toàn diện nhân sự, tuyển dụng, hợp đồng, chấm công và tài sản.',
    permissions: ['hc_view', 'hc_create', 'hc_approve', 'hc_salary', 'ns_view', 'ns_manage', 'ns_recruitment', 'ns_contracts', 'ai_access'],
  },
  {
    id: 'dept_lead',
    name: 'Trưởng phòng / Quản lý bộ phận',
    description: 'Phê duyệt phiếu hành chính, đánh giá KPI và xem hồ sơ nhân sự cấp phòng.',
    permissions: ['hc_view', 'hc_create', 'hc_approve', 'ns_view', 'ai_access'],
  },
  {
    id: 'employee',
    name: 'Cán bộ nhân viên (Chuẩn)',
    description: 'Tự chấm công, tạo phiếu xin nghỉ, xem bảng lương cá nhân và tra cứu AI.',
    permissions: ['hc_view', 'hc_create', 'ns_view', 'ai_access'],
  },
];

export function PhanQuyenPage() {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState('admin');

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const handleTogglePermission = (permId: string) => {
    if (selectedRole.isSystem) {
      toast.info('Vai trò Quản trị tối cao luôn giữ đầy đủ toàn bộ quyền hạn');
      return;
    }

    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRoleId) return r;
        const has = r.permissions.includes(permId);
        const updated = has
          ? r.permissions.filter((p) => p !== permId)
          : [...r.permissions, permId];
        return { ...r, permissions: updated };
      })
    );
  };

  const handleSave = () => {
    toast.success(`Đã lưu thiết lập phân quyền cho vai trò "${selectedRole.name}"`);
  };

  const categories = Array.from(new Set(PERMISSIONS.map((p) => p.category)));

  return (
    <div className="flex flex-col h-page relative space-y-4">
      {/* Top Banner */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-rose-500/10 via-primary/5 to-transparent p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20 shrink-0">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-foreground">
              Phân quyền & Vai trò truy cập (Role-based Access Control)
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Kiểm soát quyền xem, thêm, sửa, xóa và phê duyệt theo từng cấp bậc trong tổ chức Vũ Gia.
            </p>
          </div>
        </div>

        <Button size="sm" onClick={handleSave} className="gap-1.5 shadow-xs self-end md:self-auto">
          <Save size={15} />
          <span>Lưu ma trận phân quyền</span>
        </Button>
      </div>

      {/* Main Container: 2 Cột */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Cột trái: Danh sách vai trò */}
        <div className="md:col-span-4 rounded-xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-border bg-muted/40 font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              <span>Danh sách vai trò ({roles.length})</span>
            </span>
          </div>
          <div className="p-2 space-y-1 overflow-auto flex-1">
            {roles.map((r) => {
              const active = r.id === selectedRoleId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    active
                      ? 'bg-primary/10 border-primary/30 text-primary shadow-xs'
                      : 'hover:bg-muted/40 border-transparent text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{r.name}</span>
                    {r.isSystem && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Hệ thống
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                  <div className="mt-2 text-[11px] font-mono font-medium text-muted-foreground">
                    {r.permissions.length} / {PERMISSIONS.length} quyền được cấp
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cột phải: Ma trận quyền hạn chi tiết */}
        <div className="md:col-span-8 rounded-xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Quyền hạn cấp cho: <span className="text-primary">{selectedRole.name}</span>
              </span>
            </div>
            {selectedRole.isSystem && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Lock size={12} />
                Toàn quyền mặc định
              </span>
            )}
          </div>

          <div className="p-4 md:p-6 overflow-auto flex-1 space-y-6">
            {categories.map((cat) => {
              const items = PERMISSIONS.filter((p) => p.category === cat);
              return (
                <div key={cat} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1.5">
                    {cat}
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {items.map((perm) => {
                      const isGranted = selectedRole.permissions.includes(perm.id);
                      return (
                        <div
                          key={perm.id}
                          onClick={() => handleTogglePermission(perm.id)}
                          className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isGranted
                              ? 'bg-card border-primary/30 shadow-xs'
                              : 'bg-muted/20 border-border/60 hover:bg-muted/40'
                          }`}
                        >
                          <div className="space-y-0.5 pr-4">
                            <span className="text-sm font-medium text-foreground block">
                              {perm.name}
                            </span>
                            <span className="text-xs text-muted-foreground block">
                              {perm.description}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                              isGranted
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-input bg-card'
                            }`}
                          >
                            {isGranted && <Check size={14} strokeWidth={2.5} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhanQuyenPage;
