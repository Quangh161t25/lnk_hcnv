import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Lock, LogIn, ShieldAlert, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth';
import { useEmployeeStore } from '@/stores/employees';
import { loginWithSheet } from '@/services/employeesSheet';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginAsEmployee } = useAuthStore();
  const employees = useEmployeeStore((s) => s.employees);

  const [accountInput, setAccountInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = accountInput.trim().toLowerCase();

    if (!query) {
      toast.error('Vui lòng nhập Email hoặc Mã nhân viên');
      return;
    }
    if (!password) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      // Mật khẩu được kiểm tra tại server với cột "Mật khẩu" trên Google Sheet;
      // trình duyệt không bao giờ nhận danh sách mật khẩu.
      const result = await loginWithSheet(query, password);
      if (result) {
        loginAsEmployee(result.employee, result.token);
        toast.success(`Đăng nhập thành công! Chào mừng ${result.employee.ho_ten}`);
        navigate('/');
        return;
      }

      // Không có API (chạy offline, vd. `vite dev`): kiểm tra theo dữ liệu mẫu trên trình duyệt.
      const matched = employees.find((emp) => emp.email.toLowerCase() === query || emp.ma_nv.toLowerCase() === query);
      if (!matched || password !== (matched.mat_khau || '123456')) {
        toast.error('Tài khoản hoặc mật khẩu không chính xác');
        return;
      }
      loginAsEmployee(matched);
      toast.success(`Đăng nhập (chế độ offline) thành công! Chào mừng ${matched.ho_ten}`);
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không đăng nhập được, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-primary/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo Vũ Gia ERP */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white shadow-xl shadow-primary/30 mb-3.5">
          <span className="font-black text-xl tracking-wider">VG</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-sans">
          VŨ GIA ERP
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Hệ thống Quản lý Hành chính & Nhân sự Doanh nghiệp
        </p>

        {/* Trạng thái liên kết Google Sheet */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
          <span>Tài khoản xác thực theo dữ liệu nhân sự trên Google Sheet</span>
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-7 px-5 shadow-2xl border border-border sm:rounded-2xl sm:px-9">
          <div className="mb-6 text-center">
            <h2 className="text-base font-bold text-foreground">Đăng nhập hệ thống</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Xác thực đúng mật khẩu nhân sự được lưu trên Google Sheet
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Email hoặc Mã nhân viên <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  value={accountInput}
                  onChange={(e) => setAccountInput(e.target.value)}
                  placeholder="VD: admin@vugia.vn hoặc VG001, NV001"
                  className="pl-9 text-xs h-10"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Mật khẩu đăng nhập <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (Theo cột Mật khẩu trên Google Sheet)"
                  className="pl-9 pr-10 text-xs h-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-primary hover:underline font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-white gap-2 text-xs font-bold shadow-md shadow-primary/25 mt-2"
            >
              {isLoading ? (
                <span>Đang kiểm tra mật khẩu từ Sheet...</span>
              ) : (
                <>
                  <LogIn size={15} /> Đăng nhập hệ thống
                </>
              )}
            </Button>
          </form>

          {/* Hướng dẫn kiểm tra mật khẩu */}
          <div className="mt-6 pt-4 border-t border-border/80 text-[11px] text-muted-foreground/90 space-y-1">
            <div className="font-semibold text-foreground/80 flex items-center justify-between">
              <span>📋 Mật khẩu trên Google Sheet (Cột K):</span>
              <a
                href="https://docs.google.com/spreadsheets/d/19h9xv-5rd2MFF9PUh8LqKnayRr4NUPka64aB8D6jQQg/edit#gid=0"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline text-[10px]"
              >
                Mở Sheet ↗
              </a>
            </div>
            <p>
              • Quản trị viên: <code className="font-mono text-primary font-bold">VG001</code> (Mật khẩu: <code className="font-mono font-semibold text-foreground">123456</code>)
            </p>
            <p>
              • Nhân viên: <code className="font-mono font-medium">NV001</code> đến <code className="font-mono font-medium">NV008</code> (Mật khẩu: <code className="font-mono font-semibold text-foreground">123456</code>)
            </p>
            <p className="text-[10px] text-muted-foreground italic">
              * Khi bạn thay đổi mật khẩu tại Cột K trên Google Sheet, hệ thống sẽ tự động cập nhật ngay khi đăng nhập.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Công ty Cổ phần Vũ Gia. Toàn quyền bảo lưu.
        </div>
      </div>

      {/* Modal Quên mật khẩu */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <h3 className="text-sm font-bold text-foreground">Quên hoặc Cần cấp lại mật khẩu</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mật khẩu của từng nhân viên được quản lý tại <strong>Cột K (Mật khẩu)</strong> trong Google Sheet <strong>`1. NhanSu_DanhSach`</strong>.
            </p>
            <div className="p-2.5 rounded-lg bg-muted text-[11px] text-foreground">
              Quản trị viên có thể trực tiếp sửa mật khẩu trên Google Sheet hoặc liên hệ bộ phận HCNS.
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setShowForgotModal(false)} className="h-8 text-xs">
                Đã hiểu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
